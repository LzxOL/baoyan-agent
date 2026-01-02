'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  Bell,
  Search,
  User,
  X,
  Check,
  Clock,
  AlertTriangle,
  FileCheck,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SignUpModal from '@/components/auth/SignUpModal';
import SignInModal from '@/components/auth/SignInModal';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'deadline':
      return <Clock className="w-4 h-4 text-amber-500" />;
    case 'match':
      return <FileCheck className="w-4 h-4 text-green-500" />;
    case 'missing':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'update':
      return <Info className="w-4 h-4 text-blue-500" />;
    default:
      return <Info className="w-4 h-4 text-slate-500" />;
  }
};

export default function Header() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useAppStore();

  const { user: authUser, signOut: authSignOut } = useAuth();
  const [user, setUser] = useState<any | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    // ensure profile row exists when authUser changes (use context user)
    const ensureProfile = async (u: any) => {
      if (!u) return;
      try {
        await supabase.from('profiles').upsert({
          id: u.id,
          full_name: (u.user_metadata as any)?.full_name ?? null,
          avatar_url: (u.user_metadata as any)?.avatar_url ?? null,
        });
      } catch (err) {
        console.error('Failed to upsert profile on init:', err);
      }
    };

    if (mounted) {
      // set local display user from auth context if available
      if (authUser) {
        setUser(authUser);
        ensureProfile(authUser);
      } else {
        // fall back to supabase getUser for legacy sessions
        supabase.auth.getUser().then(async ({ data }) => {
          if (!mounted) return;
          const u = data.user ?? null;
          setUser(u);
          if (u) await ensureProfile(u);
        });
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await ensureProfile(u);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [authUser]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭通知面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* 搜索框 */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索材料、项目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 pr-4 py-2 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-4 ml-4">
        {/* 通知 */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* 通知面板 */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 animate-fade-in">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-medium text-slate-900">通知</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    全部已读
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">暂无通知</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-primary-50/50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                locale: zhCN,
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 用户区域 */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          {!user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSignUp(true)}
                className="text-sm text-primary-600 hover:underline"
              >
                注册
              </button>
              <button
                onClick={() => setShowSignIn(true)}
                className="btn-ghost"
              >
                登录
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">已登录</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    // prefer context signOut to keep auth state in sync
                    if (authSignOut) await authSignOut();
                    else await supabase.auth.signOut();
                  } catch (e) {
                    try { await supabase.auth.signOut(); } catch {}
                  }
                  try { router.refresh(); } catch (e) {}
                  try { window.dispatchEvent(new CustomEvent('auth-changed')); } catch (e) {}
                }}
                className="ml-2 text-sm text-slate-600 hover:underline"
              >
                退出
              </button>
            </div>
          )}
        </div>
        <SignUpModal
          open={showSignUp}
          onClose={() => setShowSignUp(false)}
          onSignedUp={async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user ?? null);
          }}
        />
        <SignInModal
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          onSignedIn={async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user ?? null);
          }}
        />
      </div>
    </header>
  );
}
