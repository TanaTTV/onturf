"use client";

// text toggles — active state is inverted (white bg / black text), no borders
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
    <div className="flex flex-wrap gap-x-1 gap-y-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`mono-meta min-h-[44px] px-3 transition-colors duration-150 ${
              active ? "bg-white text-black" : "text-muted hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
