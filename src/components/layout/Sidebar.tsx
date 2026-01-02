'use client';

import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

const navItems = [
  { id: 'materials', label: '材料库', icon: FileText },
  { id: 'settings', label: '设置', icon: Settings },
] as const;

// extra: my applications list handled below

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar } = useAppStore();
  const { projects, selectedProjectId, selectProject, addProject, renameProject, deleteProject } = useAppStore();
  const { user } = useAuth();

  // load projects list from Supabase DB
  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          // clear projects on logout
          useAppStore.setState({ projects: [], currentProject: null, selectedProjectId: null });
          return;
        }
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.warn('Failed to load projects from DB:', error);
          return;
        }
        if (projectsData && Array.isArray(projectsData)) {
          // Replace the store projects with DB results (avoid duplicates)
          const normalized = projectsData.map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            name: p.name,
            department: p.department,
            batch: p.batch,
            status: p.status,
            createdAt: p.created_at ? new Date(p.created_at) : new Date(),
            updatedAt: p.updated_at ? new Date(p.updated_at) : new Date()
          }));
          useAppStore.setState({ projects: normalized });
        }
      } catch (e) {
        console.warn('Failed to load projects:', e);
      }
    })();
  }, [user]);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Logo区域 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">保研智囊</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* 我的申请 列表 */}
      <div className={`mt-4 px-3 ${sidebarOpen ? '' : 'flex flex-col items-center'}`}>
        {sidebarOpen ? (
          <>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">我的申请</div>
            <div className="space-y-1 w-full">
              {projects.length === 0 && <div className="text-xs text-slate-400">暂无申请</div>}
              {projects.map(p => (
                <div key={p.id} className={`flex items-center px-3 py-2 rounded-md group ${selectedProjectId === p.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}>
                  <button
                    onClick={async () => {
                      try {
                        // ask current page to save canvas before switching and wait result
                        const saved: any = await new Promise((resolve) => {
                          const ev = new CustomEvent('requestCanvasSave', { detail: { resolve } });
                          window.dispatchEvent(ev);
                          // safety timeout 2s => treat as failure
                          setTimeout(() => resolve({ ok: false, timeout: true }), 2000);
                        });
                        if (!saved || !saved.ok) {
                          // do not switch if save failed
                          alert('画布保存失败，无法切换项目。请重新登录或稍后重试。');
                          return;
                        }
                      } catch (e) {
                        console.warn('Canvas save before switch failed', e);
                        alert('画布保存时发生错误，无法切换项目。');
                        return;
                      }
                      // proceed to switch
                      selectProject(p.id);
                      setActiveTab('materials');
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm truncate">{p.name}</div>
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const uid = user?.id;
                        if (!uid) return alert('请先登录');

                        // Show project menu - default: 删除 (确定删除)，取消进入重命名
                        const action = confirm(`对项目"${p.name}"进行操作:\n确定 - 删除\n取消 - 重命名`);
                        if (action) {
                          // Delete
                          if (!confirm(`确定要删除项目"${p.name}"吗？\n这将同时删除画布内容。`)) {
                            return;
                          }
                          // Delete canvas first
                          const { error: canvasError } = await supabase
                            .from('project_canvases')
                            .delete()
                            .eq('project_id', p.id);

                          if (canvasError) throw canvasError;

                          // Delete project
                          const { error: projectError } = await supabase
                            .from('projects')
                            .delete()
                            .eq('id', p.id)
                            .eq('user_id', uid);

                          if (projectError) throw projectError;

                          deleteProject(p.id);
                        } else {
                          // Rename
                          const newName = prompt('请输入新项目名称:', p.name);
                          if (newName?.trim() && newName.trim() !== p.name) {
                            // check duplicate locally
                            if (projects.some(pr => pr.name?.toLowerCase() === newName.trim().toLowerCase())) {
                              alert('项目名已存在，请使用不同的名称。');
                              return;
                            }
                            // server-side duplicate check removed; rely on local check and DB constraint

                            const { error } = await supabase
                              .from('projects')
                              .update({ name: newName.trim() })
                              .eq('id', p.id)
                              .eq('user_id', uid);

                            if (error) throw error;
                            renameProject(p.id, newName.trim());
                          }
                        }
                      } catch (error: any) {
                        console.error('Project operation failed:', error);
                        alert('操作失败: ' + (error.message || String(error)));
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                    title="项目选项"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="pt-2">
                <button onClick={async () => {
                  const name = prompt('新建申请名称:');
                  if (!name?.trim()) return;
                  try {
                    const uid = user?.id;
                    if (!uid) {
                      alert('请先登录');
                      return;
                    }

                    // check duplicate locally
                    if (projects.some(pr => pr.name?.toLowerCase() === name.trim().toLowerCase())) {
                      alert('项目名已存在，请使用不同的名称。');
                      return;
                    }
                    // server-side duplicate check skipped (local check above + DB unique index will prevent duplicates)

                    // Insert project to DB
                    const { data: projectData, error: projectError } = await supabase
                      .from('projects')
                      .insert({
                        user_id: uid,
                        name: name.trim(),
                        department: '未知',
                        batch: 'formal_apply',
                        status: 'filling'
                      })
                      .select()
                      .single();

                    if (projectError) throw projectError;

                    // Insert empty canvas to DB
                    const { error: canvasError } = await supabase
                      .from('project_canvases')
                      .insert({
                        project_id: projectData.id,
                        canvas: []
                      });

                    if (canvasError) throw canvasError;

                    // Add full project object to store (include id from DB)
                    useAppStore.setState((state) => ({
                      projects: [
                        ...state.projects,
                        {
                          id: projectData.id,
                          userId: uid,
                          name: name.trim(),
                          department: '未知',
                          batch: 'formal_apply' as any,
                          status: 'filling' as any,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        }
                      ]
                    }));

                    // Select the newly created project
                    selectProject(projectData.id);
                    setActiveTab('materials');

                  } catch (e: any) {
                    console.error('Failed to create project:', e);
                    alert('创建项目失败: ' + (e.message || String(e)));
                  }
                }} className="w-full text-left px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100">+ 新建申请</button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* collapsed: show compact icons for projects */}
            {projects.length === 0 ? (
              <div className="text-xs text-slate-400">暂无</div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectProject(p.id);
                      setActiveTab('materials');
                    }}
                    title={p.name}
                    className={`w-10 h-10 flex items-center justify-center rounded-md ${selectedProjectId === p.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
                  >
                    <div className="text-sm leading-none">{p.name?.slice(0,2)}</div>
                  </button>
                ))}
                <button
                  onClick={async () => {
                    const name = prompt('新建申请名称:');
                    if (!name?.trim()) return;
                    try {
                      const uid = user?.id;
                      if (!uid) {
                        alert('请先登录');
                        return;
                      }
                      const { data: projectData, error: projectError } = await supabase
                        .from('projects')
                        .insert({
                          user_id: uid,
                          name: name.trim(),
                          department: '未知',
                          batch: 'formal_apply',
                          status: 'filling'
                        })
                        .select()
                        .single();
                      if (projectError) throw projectError;
                      useAppStore.setState((state) => ({
                        projects: [
                          ...state.projects,
                          {
                            id: projectData.id,
                            userId: uid,
                            name: name.trim(),
                            department: '未知',
                            batch: 'formal_apply' as any,
                            status: 'filling' as any,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          }
                        ]
                      }));
                      selectProject(projectData.id);
                      setActiveTab('materials');
                    } catch (e: any) {
                      console.error('Failed to create project:', e);
                      alert('创建项目失败: ' + (e.message || String(e)));
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  title="新建申请"
                >
                  +
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部信息 */}
      {sidebarOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            <p>版本 1.0.0</p>
            <p className="mt-1">© 2024 保研智囊</p>
          </div>
        </div>
      )}
    </aside>
  );
}
