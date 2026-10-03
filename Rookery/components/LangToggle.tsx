'use client';

interface LangToggleProps {
  lang: 'mr' | 'en';
  onChange: (lang: 'mr' | 'en') => void;
}

export default function LangToggle({ lang, onChange }: LangToggleProps) {
  return (
    <div
      role="group"
      aria-label="Language / भाषा"
      className="inline-flex rounded-full border border-[#E7E5E4] bg-[#F5F5F4] p-0.5"
    >
      <button
        id="lang-mr"
        type="button"
        onClick={() => onChange('mr')}
        aria-pressed={lang === 'mr'}
        className={`min-h-[36px] px-4 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${
          lang === 'mr'
            ? 'bg-white text-[#1C1917] shadow-sm'
            : 'text-[#57534E] hover:text-[#1C1917]'
        }`}
      >
        मराठी
      </button>
      <button
        id="lang-en"
        type="button"
        onClick={() => onChange('en')}
        aria-pressed={lang === 'en'}
        className={`min-h-[36px] px-4 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${
          lang === 'en'
            ? 'bg-white text-[#1C1917] shadow-sm'
            : 'text-[#57534E] hover:text-[#1C1917]'
        }`}
      >
        English
      </button>
    </div>
  );
}
