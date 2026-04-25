import { APP_COPY } from "../../constants/app";

export function AppHeader(): JSX.Element {
  return (
    <header className="rounded-2xl bg-service-primary p-6 text-white shadow-panel">
      <h1 className="text-3xl font-bold tracking-tight">{APP_COPY.title}</h1>
      <p className="mt-2 max-w-2xl text-base text-emerald-50">{APP_COPY.subtitle}</p>
    </header>
  );
}
