"use client";

export default function ChipPicker({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`border px-3 py-1.5 text-sm lowercase transition-colors ${
              active
                ? "border-accent bg-accent text-black font-bold"
                : "border-border text-white hover:border-white"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
