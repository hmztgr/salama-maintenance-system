'use client';

import { Suspense } from 'react';
import { InvitationAcceptance } from '@/components/auth/InvitationAcceptance';

function InvitationContent() {
  return <InvitationAcceptance />;
}

export default function InvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <InvitationContent />
    </Suspense>
  );
}
