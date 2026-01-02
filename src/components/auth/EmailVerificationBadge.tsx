'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import EmailVerificationReminder from './EmailVerificationReminder';

export default function EmailVerificationBadge() {
  const { user, resendVerificationEmail } = useAuth();
  const [showReminder, setShowReminder] = useState(false);
  const [resending, setResending] = useState(false);

  if (!user) return null;

  const isVerified = !!user.email_confirmed_at;

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="h-4 w-4" />
        <span>邮箱已验证</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 text-amber-600 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>邮箱未验证</span>
        <button
          onClick={() => setShowReminder(true)}
          className="text-blue-600 hover:text-blue-800 text-xs underline"
        >
          验证邮箱
        </button>
      </div>

      {showReminder && (
        <EmailVerificationReminder
          email={user.email || ''}
          onClose={() => setShowReminder(false)}
        />
      )}
    </>
  );
}


