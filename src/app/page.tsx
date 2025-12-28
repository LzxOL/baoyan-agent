'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/dashboard/Dashboard';
import MaterialsPage from '@/components/materials/MaterialsPage';
import ApplicationsPage from '@/components/applications/ApplicationsPage';
import Settings from '@/components/settings/Settings';

export default function Home() {
  const { user, loading } = useAuth();
  const { activeTab, initialize, sidebarOpen } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
      setIsInitialized(true);
    }
  }, [isInitialized, initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Do not force-login on first visit — keep login/register in header controls.

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'materials':
        return <MaterialsPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'settings':
        return <Settings />;
    default:
        return <MaterialsPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* 顶部导航 */}
        <Header />

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
