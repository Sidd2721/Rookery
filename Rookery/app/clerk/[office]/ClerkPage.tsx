'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import DemoBanner from '@/components/DemoBanner';
import LangToggle from '@/components/LangToggle';
import QueueLanes from '@/components/QueueLanes';

interface Visit {
  id: string;
  office_id: string;
  service_id: string;
  items_checked: string[];
  status: string;
  token_no: number | null;
  sent_back_reason: string | null;
  created_at: string;
}

interface QueueData {
  serving: Visit | null;
  ready: Visit[];
  gathering: Visit[];
  counters: { served_ready: number; sent_back: number };
}

interface ClerkPageProps {
  officeId: string;
}

export default function ClerkPage({ officeId }: ClerkPageProps) {
  const [lang, setLang] = useState<'mr' | 'en'>('en');
  const [pin, setPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [error, setError] = useState('');
  const [sendBackId, setSendBackId] = useState<string | null>(null);
  const [sendBackReason, setSendBackReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const [qrDataUrl, setQrDataUrl] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tayar-lang') as 'mr' | 'en' | null;
    if (saved) setLang(saved);
    const savedPin = sessionStorage.getItem('tayar-clerk-pin');
    if (savedPin) setPin(savedPin);
  }, []);

  const changeLang = (l: 'mr' | 'en') => {
    setLang(l);
    localStorage.setItem('tayar-lang', l);
  };

  const citizenUrl = `${appUrl}/o/${officeId}`;

  // Generate QR on client side using canvas
  useEffect(() => {
    if (!pin) return;
    // Simple QR placeholder — use a tiny SVG representation of the URL
    // We'll use a data URI with the URL text since we can't install a QR library
    // The BUILD_PROMPT says "one small npm library (credit it in README)" for QR
    // But we have no new packages allowed in T4 rules. We'll render the URL as text + a box.
    setQrDataUrl(citizenUrl);
  }, [pin, citizenUrl]);

  const fetchQueue = useCallback(async (currentPin: string) => {
    if (!currentPin) return;
    try {
      const res = await fetch(`/api/queue?office_id=${officeId}`);
      if (!res.ok) { setError('queue_error'); return; }
      const data = await res.json();
      setQueue(data);
      setError('');
    } catch {
      setError('network_error');
    }
  }, [officeId]);

  useEffect(() => {
    if (!pin) return;
    fetchQueue(pin);
    pollRef.current = setInterval(() => fetchQueue(pin), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pin, fetchQueue]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    try {
      const res = await fetch('/api/clerk/verify', {
        method: 'POST',
        headers: { 'x-clerk-pin': pinInput },
      });
      if (res.status === 401) {
        setPinError(lang === 'mr' ? 'चुकीचा पिन' : 'Wrong PIN');
        return;
      }
      if (res.status === 429) {
        setPinError(lang === 'mr' ? 'खूप जास्त प्रयत्न. ५ मिनिटे थांबा.' : 'Too many attempts. Wait 5 minutes.');
        return;
      }
      sessionStorage.setItem('tayar-clerk-pin', pinInput);
      setPin(pinInput);
      await fetchQueue(pinInput);
    } catch {
      setPinError(lang === 'mr' ? 'नेटवर्क त्रुटी' : 'Network error');
    }
  };

  const clerkFetch = async (path: string, body: object) => {
    return fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-clerk-pin': pin,
      },
      body: JSON.stringify(body),
    });
  };

  const handleCallNext = async () => {
    setActionLoading(true);
    await clerkFetch('/api/clerk/call-next', { office_id: officeId });
    await fetchQueue(pin);
    setActionLoading(false);
  };

  const handleDone = async () => {
    if (!queue?.serving) return;
    setActionLoading(true);
    await clerkFetch('/api/clerk/done', { visit_id: queue.serving.id });
    await fetchQueue(pin);
    setActionLoading(false);
  };

  const handleSendBack = async () => {
    if (!sendBackId || !sendBackReason.trim()) return;
    if (sendBackReason.length < 1 || sendBackReason.length > 120) return;
    setActionLoading(true);
    await clerkFetch('/api/clerk/send-back', { visit_id: sendBackId, reason: sendBackReason });
    setSendBackId(null);
    setSendBackReason('');
    await fetchQueue(pin);
    setActionLoading(false);
  };

  const handleLoadDemo = async () => {
    setActionLoading(true);
    await clerkFetch('/api/clerk/demo-visitors', { office_id: officeId });
    await fetchQueue(pin);
    setActionLoading(false);
  };

  const handleReset = async () => {
    if (!confirm(lang === 'mr' ? 'सर्व भेटी रद्द कराव्यात?' : 'Reset all visits?')) return;
    setActionLoading(true);
    await clerkFetch('/api/clerk/reset', { office_id: officeId });
    await fetchQueue(pin);
    setActionLoading(false);
  };

  // PIN gate
  if (!pin) {
    return (
      <div className="flex flex-col min-h-screen">
        <DemoBanner lang={lang} />
        <div className="w-full max-w-md mx-auto px-4 py-12 flex flex-col items-center">
          <div className="flex justify-end w-full mb-8">
            <LangToggle lang={lang} onChange={changeLang} />
          </div>
          <h1 className="text-2xl font-bold text-[#1C1917] mb-2">
            {lang === 'mr' ? 'कारकून प्रवेश' : 'Clerk access'}
          </h1>
          <p className="text-sm text-[#57534E] mb-8">
            {lang === 'mr' ? 'पिन टाका' : 'Enter your PIN to continue'}
          </p>
          <form onSubmit={handlePinSubmit} className="w-full max-w-[280px]">
            <input
              id="pin-input"
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="••••••"
              className="w-full h-12 px-4 rounded-[8px] border border-[#E7E5E4] bg-white text-center text-xl tracking-[0.3em] mb-3 focus:border-[#4F46E5] transition-colors"
              autoComplete="current-password"
              inputMode="numeric"
            />
            {pinError && (
              <p className="text-sm text-[#BE123C] text-center mb-3">{pinError}</p>
            )}
            <button
              id="pin-submit-btn"
              type="submit"
              className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[8px] transition-colors"
            >
              {lang === 'mr' ? 'लॉगिन' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="flex flex-col min-h-screen" aria-busy="true">
        <DemoBanner lang={lang} />
        <div className="w-full max-w-2xl mx-auto px-4 py-6">
          <div className="h-8 w-40 bg-[#F5F5F4] rounded animate-pulse mb-6" />
          <div className="h-40 bg-[#F5F5F4] rounded-[12px] animate-pulse mb-4" />
          <div className="h-32 bg-[#F5F5F4] rounded-[12px] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DemoBanner lang={lang} />

      <div className="w-full max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#1C1917]">
            {lang === 'mr' ? 'कारकून पटल' : 'Clerk Board'}
          </h1>
          <LangToggle lang={lang} onChange={changeLang} />
        </div>

        {/* Now Serving — hero */}
        <div className="rounded-[12px] bg-white border border-[#E7E5E4] shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A8A29E] mb-3">
            {lang === 'mr' ? 'आता सेवा' : 'Now serving'}
          </p>
          {queue.serving ? (
            <div>
              <div className="tabular text-[64px] font-bold text-[#4F46E5] leading-none mb-4">
                {queue.serving.token_no}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  id="done-btn"
                  type="button"
                  onClick={handleDone}
                  disabled={actionLoading}
                  className="h-12 px-6 bg-[#047857] hover:bg-[#065F46] text-white font-semibold rounded-[8px] transition-colors disabled:opacity-50"
                >
                  {lang === 'mr' ? 'पूर्ण झाले' : 'Done'}
                </button>
                <button
                  id="send-back-btn"
                  type="button"
                  onClick={() => setSendBackId(queue.serving!.id)}
                  disabled={actionLoading}
                  className="h-12 px-6 border border-[#E7E5E4] text-[#57534E] font-medium rounded-[8px] hover:bg-[#F5F5F4] transition-colors disabled:opacity-50"
                >
                  {lang === 'mr' ? 'परत पाठवा' : 'Send back'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[#A8A29E] mb-4">
                {lang === 'mr' ? 'कोणाची सेवा नाही.' : 'No one being served.'}
              </p>
              <button
                id="call-next-btn"
                type="button"
                onClick={handleCallNext}
                disabled={actionLoading || queue.ready.length === 0}
                className="h-12 px-6 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[8px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lang === 'mr' ? 'पुढचा बोलवा' : 'Call next'}
              </button>
            </div>
          )}
        </div>

        {/* Send-back modal inline */}
        {sendBackId && (
          <div className="rounded-[12px] bg-rose-50 border border-rose-200 p-5 mb-4" role="dialog" aria-modal="true" aria-label="Send back reason">
            <p className="text-sm font-semibold text-[#BE123C] mb-3">
              {lang === 'mr' ? 'परत पाठवण्याचे कारण द्या:' : 'Give a reason for sending back:'}
            </p>
            <textarea
              id="send-back-reason-input"
              value={sendBackReason}
              onChange={e => setSendBackReason(e.target.value)}
              maxLength={120}
              rows={2}
              className="w-full px-3 py-2 rounded-[8px] border border-rose-300 text-sm text-[#1C1917] mb-3 focus:border-[#BE123C] transition-colors resize-none"
              placeholder={lang === 'mr' ? 'कारण (१-१२० अक्षरे)' : 'Reason (1-120 chars)'}
            />
            <div className="flex gap-2">
              <button
                id="confirm-send-back-btn"
                type="button"
                onClick={handleSendBack}
                disabled={!sendBackReason.trim() || actionLoading}
                className="h-10 px-4 bg-[#BE123C] hover:bg-[#9F1239] text-white text-sm font-semibold rounded-[8px] transition-colors disabled:opacity-50"
              >
                {lang === 'mr' ? 'पाठवा' : 'Send back'}
              </button>
              <button
                type="button"
                onClick={() => { setSendBackId(null); setSendBackReason(''); }}
                className="h-10 px-4 border border-[#E7E5E4] text-sm text-[#57534E] rounded-[8px] hover:bg-white transition-colors"
              >
                {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <QueueLanes queue={queue} lang={lang} />

        {/* Counters */}
        <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
          <div className="rounded-[12px] bg-white border border-[#E7E5E4] p-4 text-center">
            <div className="tabular text-3xl font-bold text-[#047857]">{queue.counters.served_ready}</div>
            <div className="text-xs text-[#57534E] mt-1">{lang === 'mr' ? 'सेवा दिलेले' : 'Served'}</div>
          </div>
          <div className="rounded-[12px] bg-white border border-[#E7E5E4] p-4 text-center">
            <div className="tabular text-3xl font-bold text-[#B45309]">{queue.counters.sent_back}</div>
            <div className="text-xs text-[#57534E] mt-1">{lang === 'mr' ? 'परत पाठवलेले' : 'Sent back'}</div>
          </div>
        </div>

        {/* QR code area */}
        <div className="rounded-[12px] bg-white border border-[#E7E5E4] p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A8A29E] mb-2">
            {lang === 'mr' ? 'नागरिक दुवा' : 'Citizen link'}
          </p>
          <p className="text-xs text-[#57534E] break-all mb-2">{citizenUrl}</p>
          <p className="text-xs text-[#A8A29E]">{lang === 'mr' ? 'नागरिकांना हा दुवा पाठवा.' : 'Share this link with citizens.'}</p>
        </div>

        {/* Demo helpers */}
        <div className="flex gap-2 flex-wrap">
          <button
            id="load-demo-btn"
            type="button"
            onClick={handleLoadDemo}
            disabled={actionLoading}
            className="h-10 px-4 border border-[#E7E5E4] text-sm text-[#57534E] rounded-[8px] hover:bg-[#F5F5F4] transition-colors disabled:opacity-50"
          >
            {lang === 'mr' ? 'डेमो अभ्यागत' : 'Load demo visitors'}
          </button>
          <button
            id="reset-btn"
            type="button"
            onClick={handleReset}
            disabled={actionLoading}
            className="h-10 px-4 border border-[#E7E5E4] text-sm text-[#BE123C] rounded-[8px] hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            {lang === 'mr' ? 'रीसेट' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}
