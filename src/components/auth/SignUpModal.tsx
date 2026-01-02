 'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SignUpModalProps {
  open: boolean;
  onClose: () => void;
  onSignedUp?: () => void;
}

export default function SignUpModal({ open, onClose, onSignedUp }: SignUpModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const sendCode = async () => {
    setError(null);
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || '发送失败');
      // 发送成功，用户在输入框填写验证码
    } catch (e: any) {
      setError(e?.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError(null);
    if (!code) {
      setError('请输入验证码');
      return false;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || '验证失败');
      return true;
    } catch (e: any) {
      setError(e?.message || '验证码错误');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async () => {
    setError(null);
    if (!username) {
      setError('请输入用户名');
      return;
    }
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    const ok = await verifyCode();
    if (!ok) return;

    setLoading(true);
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: username },
        },
      });
      if (signErr) throw signErr;
      onSignedUp?.();
      // reset and close
      setUsername('');
      setEmail('');
      setCode('');
      setPassword('');
      onClose();
    } catch (e: any) {
      setError(e?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const closeAndReset = () => {
    setUsername('');
    setEmail('');
    setCode('');
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <>
          <h3 className="text-lg font-semibold mb-4">用户注册</h3>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-700">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full mt-1"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="text-sm text-slate-700">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full mt-1"
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div>
              <label className="text-sm text-slate-700">验证码</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input flex-1"
                  placeholder="请输入验证码"
                />
                <button
                  type="button"
                  onClick={sendCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? '发送中...' : '获取'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-700">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full mt-1"
                placeholder="请输入密码"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button type="button" onClick={closeAndReset} className="btn-ghost">取消</button>
              <button type="button" onClick={submitForm} className="btn-primary" disabled={loading}>
                {loading ? '注册中...' : '提交'}
              </button>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}


