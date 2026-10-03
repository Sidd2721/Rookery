import { Suspense } from 'react';
import ClerkPage from './ClerkPage';

export default async function Page({ params }: { params: Promise<{ office: string }> }) {
  const { office } = await params;
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen" aria-busy="true">
        <div className="h-9 bg-amber-50 border-b border-amber-200" />
        <div className="w-full max-w-2xl mx-auto px-4 py-6">
          <div className="h-8 w-40 bg-[#F5F5F4] rounded animate-pulse mb-6" />
          <div className="h-40 bg-[#F5F5F4] rounded-[12px] animate-pulse mb-4" />
        </div>
      </div>
    }>
      <ClerkPage officeId={office} />
    </Suspense>
  );
}
