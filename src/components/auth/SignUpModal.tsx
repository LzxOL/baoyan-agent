'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SignUpModalProps {
  open: boolean;
  onClose: () => void;
  onSignedUp?: () => void;
}

export default function SignUpModal({ open, onClose, onSignedUp }: SignUpModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signErr) {
        setError(signErr.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (userId) {
        // Try to upsert profile; may require session if email confirmation is on
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: fullName,
        });
      }

      // Try to sign in immediately (if confirmation not required)
      try {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) {
          // If email confirmation is required, inform user
          if (signInErr.message && signInErr.message.toLowerCase().includes('confirm')) {
            setError('已发送确认邮件，请先验证邮箱后登录。');
          } else {
            setError(signInErr.message);
          }
        } else {
          onSignedUp?.();
          onClose();
        }
      } catch (err) {
        // ignore
        onSignedUp?.();
        onClose();
      } finally {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || '注册失败');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">注册</h3>
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
          <div>
            <label className="text-sm text-slate-700">姓名（可选）</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input w-full mt-1"
            />
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="btn-ghost">取消</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


