'use client';

import React, { useState, useEffect } from 'react';
import { Plus, School, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Application } from '@/types';
import ApplicationWorkspace from './ApplicationWorkspace';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    university: '',
    college: '',
    program: '',
    batch_type: '',
  });

  useEffect(() => {
    if (user) loadApplications();
  }, [user]);

  async function loadApplications() {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) setApplications(data);
    setLoading(false);
  }

  async function createApplication() {
    if (!formData.university) return;

    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: user!.id,
        ...formData,
        status: 'draft',
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      setApplications(prev => [data, ...prev]);
      setShowCreate(false);
      setFormData({ university: '', college: '', program: '', batch_type: '' });
    }
  }

  async function deleteApplication(id: string) {
    if (!confirm('确定删除此申请项目？')) return;

    await supabase.from('material_matches').delete().eq('requirement_item_id', id);
    await supabase.from('requirement_items').delete().eq('application_id', id);
    await supabase.from('applications').delete().eq('id', id);
    setApplications(prev => prev.filter(a => a.id !== id));
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      draft: { text: '草稿', color: 'bg-gray-100 text-gray-600' },
      in_progress: { text: '进行中', color: 'bg-yellow-100 text-yellow-700' },
      completed: { text: '已完成', color: 'bg-green-100 text-green-700' },
    };
    return labels[status] || labels.draft;
  };

  if (selectedApp) {
    return (
      <ApplicationWorkspace
        application={selectedApp}
        onBack={() => { setSelectedApp(null); loadApplications(); }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">申请项目</h1>
          <p className="text-gray-500 mt-1">管理您的保研申请</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          新建项目
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">暂无申请项目</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 text-indigo-600 hover:underline"
          >
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => {
            const status = getStatusLabel(app.status);
            return (
              <div
                key={app.id}
                className="bg-white rounded-xl border hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedApp(app)}>
                    <div className="flex items-center gap-3 mb-2">
                      <School className="w-6 h-6 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{app.university}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {app.college && <span>{app.college}</span>}
                      {app.program && <span>{app.program}</span>}
                      {app.batch_type && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {app.batch_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">新建申请项目</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标院校 *</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={e => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  placeholder="如：清华大学"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学院</label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={e => setFormData(prev => ({ ...prev, college: e.target.value }))}
                  placeholder="如：计算机科学与技术系"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
                <input
                  type="text"
                  value={formData.program}
                  onChange={e => setFormData(prev => ({ ...prev, program: e.target.value }))}
                  placeholder="如：计算机科学与技术"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">批次</label>
                <select
                  value={formData.batch_type}
                  onChange={e => setFormData(prev => ({ ...prev, batch_type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">选择批次</option>
                  <option value="夏令营">夏令营</option>
                  <option value="预推免">预推免</option>
                  <option value="九推">九推</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={createApplication}
                disabled={!formData.university}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
