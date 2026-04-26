from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import Any


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import get_settings


def _load_dotenv() -> None:
    try:
        from dotenv import load_dotenv
    except ModuleNotFoundError:
        return

    load_dotenv(BACKEND_DIR / ".env")


def _require_runtime_imports() -> tuple[Any, Any, Any, Any, Any]:
    try:
        import fitz
        import vertexai
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from supabase import create_client
        from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "Install backend/requirements.txt before running ingestion. "
            f"Missing package: {exc.name}"
        ) from exc

    return fitz, vertexai, RecursiveCharacterTextSplitter, create_client, (
        TextEmbeddingInput,
        TextEmbeddingModel,
    )


def _extract_pdf_text(pdf_path: Path, fitz: Any) -> str:
    with fitz.open(pdf_path) as document:
        return "\n".join(page.get_text() for page in document)


def _batched(items: list[str], size: int) -> list[list[str]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def ingest_pdf(args: argparse.Namespace) -> None:
    _load_dotenv()
    fitz, vertexai, splitter_cls, create_client, embedding_classes = _require_runtime_imports()
    text_embedding_input, text_embedding_model = embedding_classes
    settings = get_settings()

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
    if not settings.resolved_vertex_project_id:
        raise RuntimeError("VERTEX_PROJECT_ID or GCP_PROJECT_ID is required.")

    pdf_path = Path(args.pdf).expanduser().resolve()
    if not pdf_path.exists():
        raise RuntimeError(f"PDF does not exist: {pdf_path}")

    print(f"Extracting text from {pdf_path}")
    full_text = _extract_pdf_text(pdf_path, fitz)
    print(f"Extracted {len(full_text)} characters.")

    splitter = splitter_cls(
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    chunks = [chunk.strip() for chunk in splitter.split_text(full_text) if chunk.strip()]
    print(f"Created {len(chunks)} chunks.")

    vertexai.init(
        project=settings.resolved_vertex_project_id,
        location=settings.resolved_vertex_location,
    )
    model = text_embedding_model.from_pretrained(settings.rag_embedding_model)
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    for batch_number, batch in enumerate(_batched(chunks, args.batch_size), start=1):
        inputs = [
            text_embedding_input(chunk, task_type="RETRIEVAL_DOCUMENT")
            for chunk in batch
        ]
        embeddings = model.get_embeddings(inputs)
        rows = [
            {
                "content": batch[index],
                "embedding": list(embedding.values),
                "source": args.source or pdf_path.name,
            }
            for index, embedding in enumerate(embeddings)
        ]
        supabase.table("benefit_guides").insert(rows).execute()
        print(f"Inserted batch {batch_number} ({len(rows)} chunks).")
        if args.sleep_seconds:
            time.sleep(args.sleep_seconds)

    print("Ingestion complete.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest a PhilHealth guide PDF into pgvector.")
    parser.add_argument("--pdf", required=True, help="Path to the PDF to ingest.")
    parser.add_argument("--source", default="", help="Source label stored with each chunk.")
    parser.add_argument("--chunk-size", type=int, default=500)
    parser.add_argument("--chunk-overlap", type=int, default=50)
    parser.add_argument("--batch-size", type=int, default=10)
    parser.add_argument("--sleep-seconds", type=float, default=1.0)
    return parser.parse_args()


if __name__ == "__main__":
    ingest_pdf(parse_args())
