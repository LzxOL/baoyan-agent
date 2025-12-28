'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Project, ProjectDetail, ProjectBatch, RequirementStatus } from '@/types';
import {
  Plus,
  Search,
  Calendar,
  Building2,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Upload,
  Download,
  X,
  GripVertical,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getMaterialTypeName } from '@/data/mockData';

type ModalType = 'create' | 'parse' | 'none';

const batchLabels: Record<ProjectBatch, string> = {
  summer_camp: '夏令营',
  pre_apply: '预推免',
  formal_apply: '正式推免',
};

const batchColors: Record<ProjectBatch, string> = {
  summer_camp: 'bg-amber-100 text-amber-700',
  pre_apply: 'bg-blue-100 text-blue-700',
  formal_apply: 'bg-purple-100 text-purple-700',
};

const statusConfig: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  preparation: { label: '准备中', class: 'badge-gray', icon: Clock },
  filling: { label: '填报中', class: 'badge-primary', icon: Edit3 },
  ready: { label: '已就绪', class: 'badge-success', icon: CheckCircle2 },
  submitted: { label: '已提交', class: 'badge-success', icon: CheckCircle2 },
  rejected: { label: '被拒绝', class: 'badge-danger', icon: AlertCircle },
};

export default function ProjectWorkspace() {
  const {
    projects,
    materials,
    currentProject,
    selectProject,
    setCurrentProject,
    addProject,
    deleteProject,
    updateProject,
    matchMaterial,
    unmatchRequirement,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState<ModalType>('none');
  const [selectedTab, setSelectedTab] = useState<'list' | 'detail'>('list');
  const [requirementText, setRequirementText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [filterBatch, setFilterBatch] = useState<ProjectBatch | 'all'>('all');

  // 新项目表单
  const [newProject, setNewProject] = useState({
    name: '',
    department: '',
    batch: 'summer_camp' as ProjectBatch,
    deadline: '',
    notes: '',
  });

  // 过滤项目
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = filterBatch === 'all' || project.batch === filterBatch;
    return matchesSearch && matchesBatch;
  });

  // 解析清单
  const parseRequirements = async () => {
    if (!requirementText.trim() || !currentProject) return;

    setIsParsing(true);

    // 模拟解析延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 模拟解析结果
    const lines = requirementText.split('\n').filter((line) => line.trim());
    const newRequirements = currentProject.requirements.map((req, index) => {
      // 尝试从文本中找到匹配
      const matchedLine = lines[index];
      if (matchedLine) {
        return {
          ...req,
          name: matchedLine.replace(/^\d+[\.\、\)]?\s*/, '').trim(),
        };
      }
      return req;
    });

    setCurrentProject({
      ...currentProject,
      requirements: newRequirements,
      rawRequirements: requirementText,
    });

    setIsParsing(false);
    setShowModal('none');
  };

  // 创建项目
  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;

    addProject({
      userId: 'user_1',
      name: newProject.name,
      department: newProject.department,
      batch: newProject.batch,
      status: 'preparation',
      deadline: newProject.deadline ? new Date(newProject.deadline) : undefined,
      notes: newProject.notes,
    });

    // 重置表单
    setNewProject({
      name: '',
      department: '',
      batch: 'summer_camp',
      deadline: '',
      notes: '',
    });
    setShowModal('none');
  };

  // 智能匹配材料
  const handleSmartMatch = () => {
    if (!currentProject) return;

    currentProject.requirements.forEach((req) => {
      // 简单的关键词匹配逻辑
      const keywords = req.name.toLowerCase();
      let bestMatch = materials.find((mat) => {
        const matKeywords = `${mat.name} ${mat.category}`.toLowerCase();
        return matKeywords.includes(keywords) || keywords.includes(matKeywords);
      });

      if (bestMatch && req.status === 'missing') {
        matchMaterial(currentProject.id, req.id, bestMatch.id);
      }
    });
  };

  // 生成PDF
  const handleGeneratePDF = () => {
    // 模拟PDF生成
    alert('PDF合成功能将在完整版本中实现');
  };

  // 获取匹配状态图标
  const getStatusIcon = (status: RequirementStatus) => {
    switch (status) {
      case 'matched':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'missing':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'optional':
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
      default:
        return null;
    }
  };

  // 渲染项目列表
  const renderProjectList = () => (
    <div className="space-y-4">
      {filteredProjects.length === 0 ? (
        <div className="card p-12">
          <div className="empty-state">
            <Building2 className="empty-state-icon" />
            <p className="empty-state-title">暂无报名项目</p>
            <p className="empty-state-description">
              创建您的第一个报名项目，开始整理材料清单
            </p>
            <button onClick={() => setShowModal('create')} className="btn-primary mt-4">
              <Plus className="w-4 h-4" />
              创建项目
            </button>
          </div>
        </div>
      ) : (
        filteredProjects.map((project) => {
          const status = statusConfig[project.status];
          const StatusIcon = status.icon;
          const matchRate = project.status !== 'preparation'
            ? Math.round(
                (project.requirements?.filter((r) => r.status === 'matched').length || 0) /
                  (project.requirements?.length || 1) * 100
              )
            : null;

          return (
            <div
              key={project.id}
              className="card-hover cursor-pointer"
              onClick={() => {
                selectProject(project.id);
                setSelectedTab('detail');
              }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {project.name}
                      </h3>
                      <span className={`badge ${batchLabels[project.batch] ? '' : ''}`}>
                        <span className={`badge ${batchColors[project.batch]}`}>
                          {batchLabels[project.batch]}
                        </span>
                      </span>
                      <span className={`badge ${status.class}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">{project.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {project.deadline && (
                        <p className="text-sm text-slate-500">
                          截止: {format(new Date(project.deadline), 'yyyy-MM-dd', { locale: zhCN })}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        更新于 {formatDistanceToNow(new Date(project.updatedAt), { locale: zhCN, addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* 进度条 */}
                {matchRate !== null && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-500">材料匹配进度</span>
                      <span className="font-medium text-slate-700">{matchRate}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${matchRate}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 要求数量 */}
                {project.requirements && (
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <FileText className="w-4 h-4" />
                      <span>共 {project.requirements.length} 项要求</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {project.requirements.filter((r) => r.status === 'matched').length} 项已匹配
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        {project.requirements.filter((r) => r.status === 'missing').length} 项缺失
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // 渲染项目详情
  const renderProjectDetail = () => {
    if (!currentProject) return null;

    const matchedCount = currentProject.requirements.filter((r) => r.status === 'matched').length;
    const missingCount = currentProject.requirements.filter((r) => r.status === 'missing').length;
    const optionalCount = currentProject.requirements.filter((r) => r.status === 'optional').length;

    return (
      <div className="h-full flex flex-col">
        {/* 顶部导航 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              setSelectedTab('list');
              selectProject(null);
            }}
            className="btn-ghost"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            返回列表
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{currentProject.name}</h1>
            <p className="text-slate-500">{currentProject.department}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal('parse')}
              className="btn-secondary"
            >
              <Sparkles className="w-4 h-4" />
              解析清单
            </button>
            <button
              onClick={handleSmartMatch}
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              智能匹配
            </button>
            <button onClick={handleGeneratePDF} className="btn-primary">
              <Download className="w-4 h-4" />
              生成PDF
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{currentProject.requirements.length}</p>
            <p className="text-sm text-slate-500">总要求数</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
            <p className="text-sm text-slate-500">已匹配</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{missingCount}</p>
            <p className="text-sm text-slate-500">待补充</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-slate-400">{optionalCount}</p>
            <p className="text-sm text-slate-500">可选材料</p>
          </div>
        </div>

        {/* 要求列表 */}
        <div className="card flex-1 overflow-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
            <h3 className="font-semibold text-slate-900">材料清单</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {matchedCount} 已匹配
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                {missingCount} 缺失
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {currentProject.requirements.map((req, index) => {
              const matchedMaterial = req.matchedMaterialId
                ? materials.find((m) => m.id === req.matchedMaterialId)
                : null;

              return (
                <div
                  key={req.id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${
                    req.status === 'missing' ? 'bg-red-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 拖拽手柄 */}
                    <div className="drag-handle mt-1">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* 序号 */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600 flex-shrink-0">
                      {index + 1}
                    </div>

                    {/* 状态图标 */}
                    <div className="mt-0.5">{getStatusIcon(req.status)}</div>

                    {/* 要求信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900">{req.name}</h4>
                        {!req.constraint.must && (
                          <span className="badge-gray text-xs">可选</span>
                        )}
                        {req.constraint.stamped && (
                          <span className="badge-warning text-xs">需盖章</span>
                        )}
                        {req.constraint.signed && (
                          <span className="badge-primary text-xs">需签字</span>
                        )}
                        {req.constraint.original && (
                          <span className="badge-danger text-xs">需原件</span>
                        )}
                      </div>
                      {req.description && (
                        <p className="text-sm text-slate-500 mt-0.5">{req.description}</p>
                      )}
                    </div>

                    {/* 匹配的材料 */}
                    <div className="w-64 flex-shrink-0">
                      {matchedMaterial ? (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <FileText className="w-4 h-4 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-700 truncate">
                              {matchedMaterial.name}
                            </p>
                            <p className="text-xs text-green-600">
                              v{matchedMaterial.versions.length}
                            </p>
                          </div>
                          <button
                            onClick={() => unmatchRequirement(currentProject.id, req.id)}
                            className="p-1 hover:bg-green-100 rounded"
                          >
                            <X className="w-3.5 h-3.5 text-green-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button className="btn-secondary flex-1 text-sm py-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            选择材料
                          </button>
                          {req.status !== 'optional' && (
                            <button className="btn-ghost text-sm py-1.5">
                              上传新文件
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {selectedTab === 'list' ? (
        <>
          {/* 页面标题 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">报名项目</h1>
              <p className="text-slate-500 mt-1">管理您的夏令营和预推免报名</p>
            </div>
            <button onClick={() => setShowModal('create')} className="btn-primary">
              <Plus className="w-4 h-4" />
              创建项目
            </button>
          </div>

          {/* 工具栏 */}
          <div className="card p-3 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* 搜索 */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索项目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 pr-8 py-2 w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>

              {/* 批次筛选 */}
              <div className="relative">
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value as ProjectBatch | 'all')}
                  className="input py-2 pr-8 appearance-none cursor-pointer"
                >
                  <option value="all">全部批次</option>
                  <option value="summer_camp">夏令营</option>
                  <option value="pre_apply">预推免</option>
                  <option value="formal_apply">正式推免</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 项目列表 */}
          {renderProjectList()}
        </>
      ) : (
        renderProjectDetail()
      )}

      {/* 创建项目模态框 */}
      {showModal === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">创建报名项目</h2>
              <button
                onClick={() => setShowModal('none')}
                className="p-1.5 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">院校名称 *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="input"
                  placeholder="如：清华大学"
                />
              </div>

              <div>
                <label className="label">院系名称</label>
                <input
                  type="text"
                  value={newProject.department}
                  onChange={(e) => setNewProject({ ...newProject, department: e.target.value })}
                  className="input"
                  placeholder="如：计算机科学与技术系"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">批次类型</label>
                  <select
                    value={newProject.batch}
                    onChange={(e) =>
                      setNewProject({ ...newProject, batch: e.target.value as ProjectBatch })
                    }
                    className="input"
                  >
                    <option value="summer_camp">夏令营</option>
                    <option value="pre_apply">预推免</option>
                    <option value="formal_apply">正式推免</option>
                  </select>
                </div>
                <div>
                  <label className="label">截止日期</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">备注</label>
                <textarea
                  value={newProject.notes}
                  onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                  className="textarea"
                  placeholder="添加备注信息..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowModal('none')} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleCreateProject}
                className="btn-primary"
                disabled={!newProject.name.trim()}
              >
                <Plus className="w-4 h-4" />
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 解析清单模态框 */}
      {showModal === 'parse' && currentProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">解析材料清单</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  粘贴招生简章中的材料要求，我们将自动提取并生成清单
                </p>
              </div>
              <button
                onClick={() => setShowModal('none')}
                className="p-1.5 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div>
                <label className="label">招生简章内容</label>
                <textarea
                  value={requirementText}
                  onChange={(e) => setRequirementText(e.target.value)}
                  className="textarea"
                  placeholder="请粘贴招生简章中的材料要求列表..."
                  rows={12}
                />
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 mb-2">提示</h4>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• 支持直接粘贴网页或文档中的材料清单</li>
                  <li>• 系统会自动识别序号和材料名称</li>
                  <li>• 解析完成后可手动调整条目顺序和内容</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowModal('none')} className="btn-secondary">
                取消
              </button>
              <button
                onClick={parseRequirements}
                className="btn-primary"
                disabled={!requirementText.trim() || isParsing}
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    开始解析
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
