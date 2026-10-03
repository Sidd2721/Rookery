'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DemoBanner from '@/components/DemoBanner';
import LangToggle from '@/components/LangToggle';

interface Item {
  id: string;
  label_mr: string;
  label_en: string;
  how_mr: string;
  how_en: string;
}

interface Service {
  id: string;
  office_id: string;
  name_mr: string;
  name_en: string;
  duration_min: number;
  checklist: Item[];
}

interface OfficeLandingProps {
  officeId: string;
}

export default function OfficeLanding({ officeId }: OfficeLandingProps) {
  const router = useRouter();
  const [lang, setLang] = useState<'mr' | 'en'>('en');
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState(false);
  const [needle, setNeedle] = useState('');
  const [confirmed, setConfirmed] = useState<Service | null>(null);
  const [showAll, setShowAll] = useState(true);
  const [noMatch, setNoMatch] = useState(false);
  const [finding, setFinding] = useState(false);
  const [creating, setCreating] = useState(false);

  // Persist lang
  useEffect(() => {
    const saved = localStorage.getItem('tayar-lang') as 'mr' | 'en' | null;
    if (saved) setLang(saved);
  }, []);

  const changeLang = (l: 'mr' | 'en') => {
    setLang(l);
    localStorage.setItem('tayar-lang', l);
  };

  // Load services
  useEffect(() => {
    fetch(`/api/services?office_id=${officeId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setServices(data);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [officeId]);

  const sn = (s: Service) => lang === 'mr' ? s.name_mr : s.name_en;

  const handleFind = async () => {
    const trimmed = needle.trim();
    if (!trimmed) { setShowAll(true); setConfirmed(null); setNoMatch(false); return; }

    setFinding(true);
    setConfirmed(null);
    setShowAll(false);
    setNoMatch(false);

    try {
      const res = await fetch('/api/map-need', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ office_id: officeId, text: trimmed }),
      });
      const data = await res.json();
      if (data.service_id && services) {
        const found = services.find(s => s.id === data.service_id);
        if (found) {
          setConfirmed(found);
        } else {
          setNoMatch(true);
          setShowAll(true);
        }
      } else {
        setNoMatch(true);
        setShowAll(true);
      }
    } catch {
      setShowAll(true);
    } finally {
      setFinding(false);
    }
  };

  const handleChoose = useCallback(async (service: Service) => {
    setCreating(true);
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ office_id: officeId, service_id: service.id }),
      });
      const data = await res.json();
      if (data.visit_id) {
        router.push(`/o/${officeId}/checklist/${data.visit_id}`);
      }
    } catch {
      setCreating(false);
    }
  }, [officeId, router]);

  const displayedServices = services || [];

  return (
    <div className="flex flex-col min-h-screen">
      <DemoBanner lang={lang} />

      <div className="flex-1 w-full max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#1C1917]">Tayar</h1>
          <LangToggle lang={lang} onChange={changeLang} />
        </div>

        {/* Hero: The Question */}
        <section aria-labelledby="hero-heading">
          <h2 id="hero-heading" className="text-2xl font-bold text-[#1C1917] mb-6">
            {lang === 'mr' ? 'तुम्हाला काय हवे आहे?' : 'What do you need?'}
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
              id="need-input"
              type="text"
              value={needle}
              onChange={e => setNeedle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFind()}
              placeholder={lang === 'mr' ? 'उदा. उत्पन्नाचा दाखला' : 'e.g. income certificate'}
              className="flex-1 h-12 px-4 rounded-[8px] border border-[#E7E5E4] bg-white text-[#1C1917] placeholder-[#A8A29E] text-base focus:border-[#4F46E5] focus:ring-0 transition-colors"
              autoComplete="off"
              autoCapitalize="none"
            />
            <button
              id="find-btn"
              type="button"
              onClick={handleFind}
              disabled={finding}
              className="h-12 px-5 bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white font-semibold rounded-[8px] transition-colors duration-150 min-w-[80px] disabled:opacity-70"
            >
              {finding ? '...' : (lang === 'mr' ? 'शोधा' : 'Find')}
            </button>
          </div>

          {/* Confirm card */}
          {confirmed && (
            <div
              className="mb-4 rounded-[12px] bg-indigo-50 border border-indigo-200 p-4 transition-all duration-200"
              role="status"
            >
              <p className="text-sm font-medium text-[#4F46E5] mb-3">
                {lang === 'mr'
                  ? `आम्हाला समजले: ${sn(confirmed)} — हे बरोबर आहे का?`
                  : `We understood: ${sn(confirmed)} — is this right?`}
              </p>
              <div className="flex gap-2">
                <button
                  id="confirm-yes-btn"
                  type="button"
                  onClick={() => handleChoose(confirmed)}
                  disabled={creating}
                  className="h-10 px-5 bg-[#4F46E5] text-white text-sm font-semibold rounded-[8px] hover:bg-[#4338CA] transition-colors disabled:opacity-50"
                >
                  {lang === 'mr' ? 'होय' : 'Yes'}
                </button>
                <button
                  id="confirm-no-btn"
                  type="button"
                  onClick={() => { setConfirmed(null); setShowAll(true); }}
                  className="h-10 px-5 border border-[#E7E5E4] text-sm text-[#57534E] font-medium rounded-[8px] hover:bg-[#F5F5F4] transition-colors"
                >
                  {lang === 'mr' ? 'नाही, सर्व दाखवा' : 'No, show all'}
                </button>
              </div>
            </div>
          )}

          {/* No match message */}
          {noMatch && (
            <div className="mb-4 rounded-[12px] bg-amber-50 border border-amber-200 p-4 transition-all duration-200" role="status">
              <p className="text-sm font-medium text-amber-800">
                {lang === 'mr'
                  ? 'आम्हाला तंतोतंत जुळणारी सेवा आढळली नाही. कृपया खालील यादीतून निवडा.'
                  : 'We couldn\'t find an exact match. Please choose from the list below.'}
              </p>
            </div>
          )}
        </section>

        {/* Service list */}
        <section aria-labelledby="services-heading">
          {services === null ? (
            <div aria-busy="true" aria-label="Loading services">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[72px] rounded-[12px] bg-[#F5F5F4] mb-3 animate-pulse" />
              ))}
            </div>
          ) : error || displayedServices.length === 0 ? (
            <p className="text-[#57534E] text-center py-8">
              {lang === 'mr' ? 'सेवा आढळल्या नाहीत.' : 'No services found.'}
            </p>
          ) : (!confirmed || showAll) ? (
            <>
              <h3 id="services-heading" className="text-xs font-semibold uppercase tracking-widest text-[#A8A29E] mb-3">
                {lang === 'mr' ? 'सेवा निवडा' : 'Select a service'}
              </h3>
              <ul className="flex flex-col gap-3" role="list">
                {displayedServices.map(service => (
                  <li key={service.id}>
                    <button
                      id={`service-${service.id}`}
                      type="button"
                      onClick={() => handleChoose(service)}
                      disabled={creating}
                      className="w-full flex items-center justify-between px-4 py-4 rounded-[12px] bg-white border border-[#E7E5E4] hover:border-[#4F46E5] hover:shadow-sm transition-all duration-150 text-left min-h-[72px] group disabled:opacity-50"
                    >
                      <span className="text-base font-medium text-[#1C1917] group-hover:text-[#4F46E5] transition-colors">
                        {sn(service)}
                      </span>
                      <span className="text-sm text-[#A8A29E] tabular ml-4 flex-shrink-0">
                        ≈ {service.duration_min} {lang === 'mr' ? 'मि.' : 'min'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
