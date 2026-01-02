'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSignedIn?: () => void;
}

export default function SignInModal({ open, onClose, onSignedIn }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState<boolean>(false);

  // load remembered email if present
  useState(() => {
    try {
      const saved = localStorage.getItem('rememberEmail');
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch (e) {}
  });

  if (!open) return null;

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // use AuthContext signIn to ensure context state updates
      await signIn(email, password);

      // persist email if user requested
      try {
        if (remember) localStorage.setItem('rememberEmail', email);
        else localStorage.removeItem('rememberEmail');
      } catch (e) {}

      setLoading(false);
      onSignedIn?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || '登录失败');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">登录</h3>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-slate-700">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full mt-1"
              required
            />
          </div>
          <div className="flex items-center justify-between gap-2 mt-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4" />
              <span>记住邮箱</span>
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">取消</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


