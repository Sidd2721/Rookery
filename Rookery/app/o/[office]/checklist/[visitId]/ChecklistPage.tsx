'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DemoBanner from '@/components/DemoBanner';
import LangToggle from '@/components/LangToggle';
import ChecklistItem from '@/components/ChecklistItem';

interface Item {
  id: string;
  label_mr: string;
  label_en: string;
  how_mr: string;
  how_en: string;
}

interface Service {
  id: string;
  name_mr: string;
  name_en: string;
  duration_min: number;
  checklist: Item[];
}

interface Visit {
  id: string;
  office_id: string;
  service_id: string;
  items_checked: string[];
  status: string;
  token_no: number | null;
}

interface ChecklistPageProps {
  officeId: string;
  visitId: string;
}

export default function ChecklistPage({ officeId, visitId }: ChecklistPageProps) {
  const router = useRouter();
  const [lang, setLang] = useState<'mr' | 'en'>('en');
  const [visit, setVisit] = useState<Visit | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tayar-lang') as 'mr' | 'en' | null;
    if (saved) setLang(saved);
  }, []);

  const changeLang = (l: 'mr' | 'en') => {
    setLang(l);
    localStorage.setItem('tayar-lang', l);
  };

  // Load visit and service
  useEffect(() => {
    const load = async () => {
      try {
        const [vRes, sRes] = await Promise.all([
          fetch(`/api/visits/${visitId}`),
          fetch(`/api/services?office_id=${officeId}`),
        ]);
        const vData = await vRes.json();
        const sData = await sRes.json();

        if (vData.id) {
          setVisit(vData);
          setChecked(new Set(vData.items_checked));
        } else {
          setError(true);
        }

        if (Array.isArray(sData)) {
          const svc = sData.find((s: Service) => s.id === vData.service_id);
          if (svc) setService(svc);
        }
      } catch {
        setError(true);
      }
    };
    load();
  }, [visitId, officeId]);

  // Debounced PATCH
  const patchChecked = useCallback((newChecked: Set<string>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/visits/${visitId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items_checked: Array.from(newChecked) }),
        });
      } catch {}
    }, 400);
  }, [visitId]);

  const handleToggle = (id: string, isChecked: boolean) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (isChecked) next.add(id);
      else next.delete(id);
      patchChecked(next);
      return next;
    });
  };

  const handleGetToken = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/visits/${visitId}/ready`, { method: 'POST' });
      if (res.ok) {
        router.push(`/o/${officeId}/ticket/${visitId}`);
      } else {
        setSubmitting(false);
      }
    } catch {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="h-9 bg-amber-50 border-b border-amber-200" />
        <div className="w-full max-w-md mx-auto px-4 py-6 text-center">
          <p className="text-[#57534E]">
            {lang === 'mr' ? 'भेट आढळली नाही.' : 'Visit not found.'}
          </p>
        </div>
      </div>
    );
  }

  if (!service || !visit) {
    // Skeleton on first load
    return (
      <div className="flex flex-col min-h-screen" aria-busy="true">
        <div className="h-9 bg-amber-50 border-b border-amber-200 animate-pulse" />
        <div className="w-full max-w-md mx-auto px-4 py-6">
          <div className="h-6 w-40 bg-[#F5F5F4] rounded animate-pulse mb-2" />
          <div className="h-2 bg-[#F5F5F4] rounded animate-pulse mb-6" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[72px] rounded-[8px] bg-[#F5F5F4] mb-3 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const total = service.checklist.length;
  const doneCount = service.checklist.filter(item => checked.has(item.id)).length;
  const allDone = doneCount === total;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  const label = (item: Item) => lang === 'mr' ? item.label_mr : item.label_en;
  const how = (item: Item) => lang === 'mr' ? item.how_mr : item.how_en;
  const serviceName = lang === 'mr' ? service.name_mr : service.name_en;

  return (
    <div className="flex flex-col min-h-screen">
      <DemoBanner lang={lang} />

      <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-[#57534E] hover:text-[#1C1917] transition-colors min-h-[44px] flex items-center"
            aria-label="Go back"
          >
            ← {lang === 'mr' ? 'मागे' : 'Back'}
          </button>
          <LangToggle lang={lang} onChange={changeLang} />
        </div>

        {/* Hero: The Progress */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1C1917] mb-2">{serviceName}</h1>
          <div className="flex items-center gap-3">
            {/* Indigo progress bar */}
            <div
              className="flex-1 h-1.5 rounded-full bg-[#E7E5E4] overflow-hidden"
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${doneCount} of ${total} ready`}
            >
              <div
                className="h-full bg-[#4F46E5] rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-[#57534E] tabular flex-shrink-0">
              {doneCount} {lang === 'mr' ? 'पैकी' : 'of'} {total}
            </span>
          </div>
        </div>

        {/* Checklist */}
        <ul className="flex flex-col gap-2 flex-1 mb-6" role="list">
          {service.checklist.map(item => (
            <ChecklistItem
              key={item.id}
              id={item.id}
              label={label(item)}
              how={how(item)}
              checked={checked.has(item.id)}
              onToggle={handleToggle}
            />
          ))}
        </ul>

        {/* Get token */}
        <button
          id="get-token-btn"
          type="button"
          onClick={handleGetToken}
          disabled={!allDone || submitting}
          className={`w-full h-14 text-base font-semibold rounded-[8px] transition-all duration-200 ${
            allDone && !submitting
              ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm'
              : 'bg-[#E7E5E4] text-[#A8A29E] cursor-not-allowed'
          }`}
          aria-disabled={!allDone || submitting}
        >
          {submitting
            ? (lang === 'mr' ? 'प्रक्रिया होत आहे...' : 'Getting token...')
            : (lang === 'mr' ? 'टोकन मिळवा' : 'Get token')}
        </button>

        {!allDone && (
          <p className="text-center text-sm text-[#A8A29E] mt-3">
            {lang === 'mr'
              ? `सर्व ${total} कागदपत्रे तयार असणे आवश्यक आहे`
              : `All ${total} papers must be ticked`}
          </p>
        )}
      </div>
    </div>
  );
}
