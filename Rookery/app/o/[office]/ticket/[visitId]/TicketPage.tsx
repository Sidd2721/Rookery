'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DemoBanner from '@/components/DemoBanner';
import LangToggle from '@/components/LangToggle';

// Inline clock SVG
const ClockIcon = () => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="7" cy="7" r="6" stroke="#A8A29E" strokeWidth="1.5" />
    <path d="M7 4V7L9 9" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const STATUS_LABELS: Record<string, { en: string; mr: string; color: string; dot: string }> = {
  ready:     { en: 'Ready',       mr: 'तयार',           color: 'text-[#047857]', dot: 'bg-[#047857]' },
  gathering: { en: 'Gathering',   mr: 'कागदपत्रे गोळा', color: 'text-[#B45309]', dot: 'bg-[#B45309]' },
  serving:   { en: 'Now serving', mr: 'आता सेवा',       color: 'text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
  done:      { en: 'Done',        mr: 'पूर्ण',           color: 'text-[#A8A29E]', dot: 'bg-[#A8A29E]' },
  sent_back: { en: 'Sent back',   mr: 'परत पाठवले',     color: 'text-[#BE123C]', dot: 'bg-[#BE123C]' },
};

interface VisitData {
  id: string;
  office_id: string;
  service_id: string;
  status: string;
  token_no: number | null;
  sent_back_reason: string | null;
  wait_min: number | null;
  ahead: number;
}

interface TicketPageProps {
  officeId: string;
  visitId: string;
}

export default function TicketPage({ officeId, visitId }: TicketPageProps) {
  const router = useRouter();
  const [lang, setLang] = useState<'mr' | 'en'>('en');
  const [visit, setVisit] = useState<VisitData | null>(null);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem('tayar-lang') as 'mr' | 'en' | null;
    if (saved) setLang(saved);
  }, []);

  const changeLang = (l: 'mr' | 'en') => {
    setLang(l);
    localStorage.setItem('tayar-lang', l);
  };

  const fetchVisit = useCallback(async () => {
    try {
      const res = await fetch(`/api/visits/${visitId}`);
      if (!res.ok) { if (isFirst.current) setError(true); return; }
      const data: VisitData = await res.json();
      setOffline(false);
      setVisit(prev => {
        if (prev) setPrevStatus(prev.status);
        return data;
      });
      isFirst.current = false;
    } catch {
      if (isFirst.current) setError(true);
      else setOffline(true); // poll failure — show reconnecting banner
    }
  }, [visitId]);

  useEffect(() => {
    fetchVisit();
    pollRef.current = setInterval(fetchVisit, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchVisit]);

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

  if (!visit) {
    return (
      <div className="flex flex-col min-h-screen" aria-busy="true">
        <div className="h-9 bg-amber-50 border-b border-amber-200 animate-pulse" />
        <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">
          <div className="mt-12 w-full rounded-[12px] bg-[#F5F5F4] h-56 animate-pulse" />
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[visit.status] || STATUS_LABELS['gathering'];
  const isServing = visit.status === 'serving';
  const isSentBack = visit.status === 'sent_back';
  const justBecameServing = isServing && prevStatus === 'ready';

  return (
    <div className="flex flex-col min-h-screen">
      <DemoBanner lang={lang} />

      {/* Offline reconnecting banner */}
      {offline && (
        <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-center" role="status">
          <p className="text-xs text-amber-800 font-medium">
            {lang === 'mr' ? 'कनेक्शन तुटले — पुन्हा प्रयत्न होत आहे…' : 'Connection lost — retrying…'}
          </p>
        </div>
      )}

      <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-[#1C1917]">Tayar</h1>
          <LangToggle lang={lang} onChange={changeLang} />
        </div>

        {/* Hero: THE NUMBER */}
        <div
          className={`w-full rounded-[12px] bg-white shadow-md border border-[#E7E5E4] px-6 py-8 mb-6 flex flex-col items-center transition-all duration-200 ease-out ${
            justBecameServing ? 'animate-pulse-once' : ''
          }`}
          role="region"
          aria-label={lang === 'mr' ? 'तुमचा टोकन' : 'Your token'}
        >
          {/* Small uppercase label */}
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A8A29E] mb-2">
            {lang === 'mr' ? 'तुमचा टोकन' : 'Your token'}
          </p>

          {/* The number — 72-80px */}
          <div
            className="tabular text-[80px] font-bold leading-none text-[#1C1917] my-2 transition-all duration-200"
            aria-live="polite"
            aria-atomic="true"
          >
            {visit.token_no ?? '—'}
          </div>

          {/* Status chip */}
          <div
            className="flex items-center gap-1.5 mt-4 mb-4"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${statusInfo.dot} ${isServing ? 'animate-pulse' : ''}`}
            />
            <span className={`text-sm font-semibold ${statusInfo.color}`}>
              {lang === 'mr' ? statusInfo.mr : statusInfo.en}
            </span>
          </div>

          {/* Wait / ahead */}
          {visit.token_no && !isSentBack && visit.status !== 'done' && (
            <div className="flex items-center gap-1 text-sm text-[#57534E]">
              <ClockIcon />
              <span className="tabular">
                {visit.wait_min !== null && visit.wait_min > 0
                  ? (lang === 'mr'
                    ? `सुमारे ${visit.wait_min} मि. · ${visit.ahead} पुढे`
                    : `about ${visit.wait_min} min · ${visit.ahead} ahead`)
                  : (isServing
                    ? (lang === 'mr' ? 'तुमची पाळी आली!' : "It's your turn!")
                    : (lang === 'mr' ? 'लवकरच' : 'Coming up soon'))}
              </span>
            </div>
          )}
        </div>

        {/* Sent-back card */}
        {isSentBack && visit.sent_back_reason && (
          <div className="w-full rounded-[12px] bg-rose-50 border border-rose-200 px-5 py-4 mb-6" role="alert">
            <p className="text-sm font-semibold text-[#BE123C] mb-1">
              {lang === 'mr' ? 'परत पाठवण्याचे कारण:' : 'Reason for being sent back:'}
            </p>
            <p className="text-sm text-[#1C1917]">{visit.sent_back_reason}</p>
          </div>
        )}

        {/* Start again */}
        {isSentBack && (
          <button
            id="start-again-btn"
            type="button"
            onClick={() => router.push(`/o/${officeId}`)}
            className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[8px] transition-colors"
          >
            {lang === 'mr' ? 'पुन्हा सुरू करा' : 'Start again'}
          </button>
        )}

        <p className="text-xs text-center text-[#A8A29E] mt-auto pt-6">
          {lang === 'mr' ? 'हे पान दर ४ सेकंदांनी अद्ययावत होते.' : 'This page updates every 4 seconds.'}
        </p>
      </div>
    </div>
  );
}
