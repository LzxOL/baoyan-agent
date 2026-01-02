'use client';

import { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailVerificationReminderProps {
  email: string;
  onClose: () => void;
  onVerified?: () => void;
}

export default function EmailVerificationReminder({
  email,
  onClose,
  onVerified
}: EmailVerificationReminderProps) {
  const { resendVerificationEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await resendVerificationEmail(email);
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err: any) {
      setError(err.message || '重发失败，请稍后重试');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            邮箱验证
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>

          <p className="text-sm text-gray-600 mb-2">
            我们已向 <strong className="text-gray-900">{email}</strong> 发送了验证邮件
          </p>

          <p className="text-xs text-gray-500 mb-4">
            请点击邮件中的链接完成邮箱验证。如果没有收到邮件，请检查垃圾邮件文件夹。
          </p>

          {resent && (
            <div className="flex items-center justify-center gap-2 text-green-600 text-sm mb-4">
              <CheckCircle className="h-4 w-4" />
              验证邮件已重新发送
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm mb-4">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="flex-1 btn-ghost flex items-center justify-center gap-2"
          >
            {resending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                重新发送
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="flex-1 btn-primary"
          >
            我知道了
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          验证完成后，您可以正常登录并使用所有功能。
        </div>
      </div>
    </div>
  );
}


