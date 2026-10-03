'use client';

interface Visit {
  id: string;
  service_id: string;
  items_checked: string[];
  token_no: number | null;
}

interface QueueData {
  serving: Visit | null;
  ready: Visit[];
  gathering: Visit[];
  counters: { served_ready: number; sent_back: number };
}

interface QueueLanesProps {
  queue: QueueData;
  lang: 'mr' | 'en';
}

export default function QueueLanes({ queue, lang }: QueueLanesProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Ready lane */}
      <div className="rounded-[12px] bg-white border border-[#E7E5E4] p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#047857]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A8A29E]">
            {lang === 'mr' ? 'तयार' : 'Ready'}
          </p>
          <span className="tabular text-xs font-bold text-[#047857] ml-auto">{queue.ready.length}</span>
        </div>
        {queue.ready.length === 0 ? (
          <p className="text-sm text-[#A8A29E]">
            {lang === 'mr' ? 'कोणी नाही' : 'None yet'}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {queue.ready.map(v => (
              <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-[#F5F5F4] last:border-0">
                <span className="tabular text-sm font-semibold text-[#1C1917]">#{v.token_no}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gathering lane */}
      <div className="rounded-[12px] bg-white border border-[#E7E5E4] p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#B45309]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A8A29E]">
            {lang === 'mr' ? 'गोळा करत' : 'Gathering'}
          </p>
          <span className="tabular text-xs font-bold text-[#B45309] ml-auto">{queue.gathering.length}</span>
        </div>
        {queue.gathering.length === 0 ? (
          <p className="text-sm text-[#A8A29E]">
            {lang === 'mr' ? 'कोणी नाही' : 'None'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {queue.gathering.map(v => {
              const pct = v.items_checked.length > 0 ? Math.round((v.items_checked.length / 4) * 100) : 0;
              return (
                <div key={v.id} className="py-1.5 border-b border-[#F5F5F4] last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#57534E] truncate max-w-[100px]">{v.service_id}</span>
                    <span className="tabular text-xs text-[#A8A29E]">{v.items_checked.length} ✓</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#E7E5E4] overflow-hidden">
                    <div
                      className="h-full bg-[#B45309] rounded-full transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
