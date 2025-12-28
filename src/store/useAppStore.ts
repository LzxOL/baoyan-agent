import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Material, Project, ProjectDetail, Notification, MergeTask, MaterialType } from '@/types';
import { mockMaterials, mockProjects, mockProjectDetail } from '@/data/mockData';

interface AppState {
  // 材料库
  materials: Material[];
  selectedMaterialId: string | null;
  
  // 项目管理
  projects: Project[];
  currentProject: ProjectDetail | null;
  selectedProjectId: string | null;
  
  // PDF合并任务
  mergeTasks: MergeTask[];
  currentMergeTask: MergeTask | null;
  
  // 通知
  notifications: Notification[];
  unreadCount: number;
  
  // UI状态
  sidebarOpen: boolean;
  activeTab: 'dashboard' | 'materials' | 'applications' | 'settings';
  isLoading: boolean;
  
  // 材料库操作
  addMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  selectMaterial: (id: string | null) => void;
  addMaterialVersion: (materialId: string, version: Material['versions'][0]) => void;
  setDefaultVersion: (materialId: string, versionId: string) => void;
  
  // 项目操作
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  renameProject: (id: string, newName: string) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  setCurrentProject: (project: ProjectDetail | null) => void;
  
  // 清单操作
  updateRequirement: (projectId: string, requirementId: string, updates: Partial<ProjectDetail['requirements'][0]>) => void;
  matchMaterial: (projectId: string, requirementId: string, materialId: string) => void;
  unmatchRequirement: (projectId: string, requirementId: string) => void;
  
  // PDF操作
  addMergeTask: (task: Omit<MergeTask, 'id' | 'createdAt'>) => void;
  updateMergeTask: (id: string, updates: Partial<MergeTask>) => void;
  setCurrentMergeTask: (task: MergeTask | null) => void;
  
  // 通知操作
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  
  // UI操作
  toggleSidebar: () => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setLoading: (loading: boolean) => void;
  
  // 初始化
  initialize: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      materials: [],
      selectedMaterialId: null,
      projects: [],
      currentProject: null,
      selectedProjectId: null,
      mergeTasks: [],
      currentMergeTask: null,
      notifications: [],
      unreadCount: 0,
      sidebarOpen: true,
      activeTab: 'materials',
      isLoading: false,

      // 材料库操作
      addMaterial: (material) => {
        const newMaterial: Material = {
          ...material,
          id: `mat_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          materials: [...state.materials, newMaterial],
        }));
      },

      updateMaterial: (id, updates) => {
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
          ),
        }));
      },

      deleteMaterial: (id) => {
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
          selectedMaterialId: state.selectedMaterialId === id ? null : state.selectedMaterialId,
        }));
      },

      selectMaterial: (id) => {
        set({ selectedMaterialId: id });
      },

      addMaterialVersion: (materialId, version) => {
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === materialId
              ? {
                  ...m,
                  versions: [...m.versions, version],
                  currentVersionId: version.isDefault ? version.id : m.currentVersionId,
                  updatedAt: new Date(),
                }
              : m
          ),
        }));
      },

      setDefaultVersion: (materialId, versionId) => {
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === materialId
              ? {
                  ...m,
                  currentVersionId: versionId,
                  versions: m.versions.map((v) => ({
                    ...v,
                    isDefault: v.id === versionId,
                  })),
                  updatedAt: new Date(),
                }
              : m
          ),
        }));
      },

      // 项目操作
      addProject: (project) => {
        const newProject: Project = {
          ...project,
          id: `proj_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
        }));
        // 添加默认通知
        get().addNotification({
          type: 'update',
          title: '新建项目成功',
          message: `已创建「${project.name}」项目，请添加材料清单。`,
          read: false,
        });
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates }
              : state.currentProject,
        }));
      },

      renameProject: (id, newName) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, name: newName } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
        }));
      },

      selectProject: (id) => {
        set({ selectedProjectId: id });
        if (id) {
          const project = get().projects.find((p) => p.id === id);
          if (project) {
            // 加载项目详情
            get().setCurrentProject(mockProjectDetail(project));
          }
        } else {
          get().setCurrentProject(null);
        }
      },

      setCurrentProject: (project) => {
        set({ currentProject: project });
      },

      // 清单操作
      updateRequirement: (projectId, requirementId, updates) => {
        set((state) => ({
          currentProject:
            state.currentProject?.id === projectId
              ? {
                  ...state.currentProject,
                  requirements: state.currentProject.requirements.map((r) =>
                    r.id === requirementId ? { ...r, ...updates } : r
                  ),
                }
              : state.currentProject,
        }));
      },

      matchMaterial: (projectId, requirementId, materialId) => {
        const material = get().materials.find((m) => m.id === materialId);
        set((state) => ({
          currentProject:
            state.currentProject?.id === projectId
              ? {
                  ...state.currentProject,
                  requirements: state.currentProject.requirements.map((r) =>
                    r.id === requirementId
                      ? {
                          ...r,
                          status: 'matched' as const,
                          matchedMaterialId: materialId,
                          matchedVersionId: material?.currentVersionId,
                          matchedAt: new Date(),
                          candidates: [],
                        }
                      : r
                  ),
                }
              : state.currentProject,
        }));
        // 添加匹配成功通知
        get().addNotification({
          type: 'match',
          title: '材料匹配成功',
          message: `已为「${state.currentProject?.requirements.find(r => r.id === requirementId)?.name}」匹配材料。`,
          read: false,
        });
      },

      unmatchRequirement: (projectId, requirementId) => {
        set((state) => ({
          currentProject:
            state.currentProject?.id === projectId
              ? {
                  ...state.currentProject,
                  requirements: state.currentProject.requirements.map((r) =>
                    r.id === requirementId
                      ? {
                          ...r,
                          status: 'missing' as const,
                          matchedMaterialId: undefined,
                          matchedVersionId: undefined,
                          matchedAt: undefined,
                        }
                      : r
                  ),
                }
              : state.currentProject,
        }));
      },

      // PDF操作
      addMergeTask: (task) => {
        const newTask: MergeTask = {
          ...task,
          id: `merge_${Date.now()}`,
          createdAt: new Date(),
        };
        set((state) => ({
          mergeTasks: [...state.mergeTasks, newTask],
          currentMergeTask: newTask,
        }));
      },

      updateMergeTask: (id, updates) => {
        set((state) => ({
          mergeTasks: state.mergeTasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          currentMergeTask:
            state.currentMergeTask?.id === id
              ? { ...state.currentMergeTask, ...updates }
              : state.currentMergeTask,
        }));
      },

      setCurrentMergeTask: (task) => {
        set({ currentMergeTask: task });
      },

      // 通知操作
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}`,
          createdAt: new Date(),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      // UI操作
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // 初始化
      initialize: () => {
        // 加载模拟数据（项目默认不预置）
        const materials = mockMaterials();
        const projects: Project[] = [];
        
        set({
          materials,
          projects,
          // 添加一些初始通知
          notifications: [
          {
            id: 'notif_1',
            type: 'deadline',
            title: '截止提醒',
            message: '夏令营报名截止日期将近，请尽快准备材料。',
            read: false,
            createdAt: new Date(Date.now() - 3600000),
          },
            {
              id: 'notif_2',
              type: 'system',
              title: '欢迎使用',
              message: '欢迎使用保研智囊平台！建议您先上传常用材料到材料库。',
              read: true,
              createdAt: new Date(Date.now() - 86400000),
            },
          ],
          unreadCount: 1,
        });
      },
    }),
    {
      name: 'baoyan-agent-storage',
      partialize: (state) => ({
        materials: state.materials,
        projects: state.projects,
        notifications: state.notifications,
      }),
    }
  )
);
