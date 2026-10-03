'use client';

import { useEffect, useRef } from 'react';

interface DemoBannerProps {
  lang: 'mr' | 'en';
}

export default function DemoBanner({ lang }: DemoBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center"
    >
      <p className="text-xs text-amber-700 font-medium">
        {lang === 'mr'
          ? 'डेमो माहिती — कार्यालयाशी आवश्यकता सत्यापित करा.'
          : 'Demo data — verify requirements with your office.'}
      </p>
    </div>
  );
}
