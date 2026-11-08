'use client';

// A simple Yes / No switch.
export default function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-line bg-charcoal px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-white/50">{hint}</span>}
      </span>
      <span className="flex items-center gap-2">
        <span className={`text-xs font-semibold ${checked ? 'text-green-400' : 'text-white/40'}`}>
          {checked ? 'Yes' : 'No'}
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-brand' : 'bg-white/20'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              checked ? 'left-[1.375rem]' : 'left-0.5'
            }`}
          />
        </span>
      </span>
    </label>
  );
}
