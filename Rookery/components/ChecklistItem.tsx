'use client';

interface ChecklistItemProps {
  id: string;
  label: string;
  how: string;
  checked: boolean;
  onToggle: (id: string, checked: boolean) => void;
}

// Inline SVG check icon
const CheckIcon = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.75 9L7.5 12.75L14.25 6"
      stroke="#059669"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Inline SVG info icon
const InfoIcon = () => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="7" cy="7" r="6" stroke="#A8A29E" strokeWidth="1.5" />
    <path d="M7 6.5V10" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="7" cy="4.5" r="0.75" fill="#A8A29E" />
  </svg>
);

export default function ChecklistItem({ id, label, how, checked, onToggle }: ChecklistItemProps) {
  return (
    <li
      className={`rounded-[8px] border transition-all duration-200 ease-out ${
        checked
          ? 'bg-[#ECFDF5] border-emerald-200'
          : 'bg-white border-[#E7E5E4]'
      }`}
    >
      <label
        htmlFor={`item-${id}`}
        className="flex items-start gap-3 px-4 py-3 cursor-pointer min-h-[48px]"
      >
        {/* Custom checkbox */}
        <span
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
            checked
              ? 'bg-white border-emerald-500'
              : 'bg-white border-[#D6D3D1]'
          }`}
          aria-hidden="true"
        >
          {checked && <CheckIcon />}
        </span>
        <input
          type="checkbox"
          id={`item-${id}`}
          checked={checked}
          onChange={(e) => onToggle(id, e.target.checked)}
          className="sr-only"
          aria-label={label}
        />

        <div className="flex-1 min-w-0">
          <span className={`text-base font-medium block transition-colors duration-200 ${checked ? 'text-emerald-800' : 'text-[#1C1917]'}`}>
            {label}
          </span>
          {/* How hint fades out when ticked */}
          <span
            className={`flex items-center gap-1 mt-1 text-sm text-[#57534E] transition-all duration-200 ease-out ${
              checked ? 'opacity-0 h-0 mt-0 overflow-hidden' : 'opacity-100'
            }`}
            aria-hidden={checked}
          >
            <InfoIcon />
            {how}
          </span>
        </div>
      </label>
    </li>
  );
}
