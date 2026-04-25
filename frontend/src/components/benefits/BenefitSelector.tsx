import type { BenefitProfile } from "../../types/benefits";

type BenefitSelectorProps = {
  value: BenefitProfile;
  disabled: boolean;
  onChange: (next: BenefitProfile) => void;
};

type BenefitKey = keyof BenefitProfile;

type Option = {
  key: BenefitKey;
  label: string;
};

const OPTIONS: readonly Option[] = [
  { key: "hasYakap", label: "PhilHealth / YAKAP" },
  { key: "hasPhilHealth", label: "PhilHealth" },
  { key: "isSenior", label: "Senior Citizen" },
  { key: "isPwd", label: "PWD" },
  { key: "is4ps", label: "4Ps" },
  { key: "hasPhilcare", label: "PhilCare" },
  { key: "noBenefits", label: "Wala / Hindi sure" }
];

function resetBenefits(): BenefitProfile {
  return {
    hasYakap: false,
    hasPhilHealth: false,
    isSenior: false,
    isPwd: false,
    is4ps: false,
    hasPhilcare: false,
    noBenefits: false
  };
}

export function BenefitSelector({ value, disabled, onChange }: BenefitSelectorProps): JSX.Element {
  const toggleValue = (key: BenefitKey): void => {
    const checked = !value[key];

    if (key === "noBenefits") {
      const next = resetBenefits();
      next.noBenefits = checked;
      onChange(next);
      return;
    }

    const next: BenefitProfile = {
      ...value,
      [key]: checked,
      noBenefits: false
    };

    onChange(next);
  };

  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
      <legend className="px-1 text-sm font-semibold text-slate-800">Benefit status</legend>
      <p className="mb-3 text-xs text-slate-600">Piliin kung anong benefit ang pwede mong gamitin.</p>
      <div className="space-y-2">
        {OPTIONS.map((option) => (
          <label key={option.key} className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-service-primary focus:ring-service-accent"
              checked={value[option.key]}
              onChange={() => toggleValue(option.key)}
              disabled={disabled}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
