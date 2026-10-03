import { Suspense } from 'react';
import ChecklistPage from './ChecklistPage';

export default async function Page({ params }: { params: Promise<{ office: string; visitId: string }> }) {
  const { office, visitId } = await params;
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen" aria-busy="true">
        <div className="h-9 bg-amber-50 border-b border-amber-200" />
        <div className="w-full max-w-md mx-auto px-4 py-6">
          <div className="h-6 w-40 bg-[#F5F5F4] rounded animate-pulse mb-2" />
          <div className="h-2 bg-[#F5F5F4] rounded animate-pulse mb-6" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[72px] rounded-[8px] bg-[#F5F5F4] mb-3 animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <ChecklistPage officeId={office} visitId={visitId} />
    </Suspense>
  );
}
