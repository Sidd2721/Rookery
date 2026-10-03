import { Suspense } from 'react';
import OfficeLanding from './OfficeLanding';

export default async function OfficePage({ params }: { params: Promise<{ office: string }> }) {
  const { office } = await params;
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <div className="h-9 bg-amber-50 border-b border-amber-200" />
        <div className="w-full max-w-md mx-auto px-4 py-6">
          <div className="h-8 w-24 bg-[#F5F5F4] rounded animate-pulse mb-8" />
          <div className="h-7 w-48 bg-[#F5F5F4] rounded animate-pulse mb-6" />
          <div className="h-12 bg-[#F5F5F4] rounded animate-pulse mb-6" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[72px] rounded-[12px] bg-[#F5F5F4] mb-3 animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <OfficeLanding officeId={office} />
    </Suspense>
  );
}
