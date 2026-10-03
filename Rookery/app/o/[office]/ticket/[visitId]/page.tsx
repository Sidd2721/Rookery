import { Suspense } from 'react';
import TicketPage from './TicketPage';

export default async function Page({ params }: { params: Promise<{ office: string; visitId: string }> }) {
  const { office, visitId } = await params;
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen" aria-busy="true">
        <div className="h-9 bg-amber-50 border-b border-amber-200" />
        <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">
          <div className="mt-12 w-full rounded-[12px] bg-[#F5F5F4] h-56 animate-pulse" />
        </div>
      </div>
    }>
      <TicketPage officeId={office} visitId={visitId} />
    </Suspense>
  );
}
