import { Suspense } from 'react';
import { PasswordReset } from '@/components/auth/PasswordReset';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>}>
      <PasswordReset />
    </Suspense>
  );
}
