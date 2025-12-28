'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Material, MaterialType } from '@/types';
import {
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  FileText,
  Image,
  File,
  Trash2,
  Edit3,
  Download,
  Eye,
  Tag,
  X,
  Check,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getMaterialTypeName, getMaterialTypeColor } from '@/data/mockData';

type ViewMode = 'grid' | 'list';
type SortBy = 'updated' | 'name' | 'type' | 'created';

const materialTypes: { value: MaterialType | 'all'; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'transcript', label: '成绩单' },
  { value: 'english', label: '英语成绩' },
  { value: 'id_card', label: '身份证明' },
  { value: 'competition', label: '竞赛证书' },
  { value: 'paper', label: '论文' },
  { value: 'patent', label: '专利' },
  { value: 'recommendation', label: '推荐信' },
  { value: 'personal_statement', label: '个人陈述' },
  { value: 'resume', label: '简历' },
  { value: 'other', label: '其他' },
];

export default function MaterialLibrary() {
  const {
    materials,
    addMaterial,
    deleteMaterial,
    selectMaterial,
    selectedMaterialId,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MaterialType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [newTag, setNewTag] = useState('');

  // 过滤和排序材料
  const filteredMaterials = materials
    .filter((mat) => {
      const displayName = (mat.name || mat.title || mat.filename || '').toString();
      const matchesSearch =
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mat.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || ((mat.type || mat.file_type) === filterType);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt ?? b.updated_at ?? 0).getTime() - new Date(a.updatedAt ?? a.updated_at ?? 0).getTime();
        case 'name':
          return (a.name || a.title || a.filename).toString().localeCompare((b.name || b.title || b.filename).toString(), 'zh-CN');
        case 'type':
          return (a.type || a.file_type || '').toString().localeCompare((b.type || b.file_type || '').toString(), 'zh-CN');
        case 'created':
          return new Date(b.createdAt ?? b.created_at ?? 0).getTime() - new Date(a.createdAt ?? a.created_at ?? 0).getTime();
        default:
          return 0;
      }
    });

  // 处理材料选择
  const handleMaterialClick = useCallback((material: Material) => {
    setSelectedMaterial(material);
    selectMaterial(material.id);
    setShowDetailPanel(true);
  }, [selectMaterial]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 获取文件类型图标
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      return <Image className="w-6 h-6 text-slate-400" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    return <File className="w-6 h-6 text-slate-400" />;
  };

  // 模拟上传功能
  const handleUpload = () => {
    // 模拟上传（使用 any 绕过严格类型检查以便 UI 演示）
    const newMaterial: any = {
      userId: 'user_1',
      name: '新上传材料.pdf',
      title: '新上传材料.pdf',
      filename: '新上传材料.pdf',
      file_type: 'other',
      type: 'other',
      category: '未分类',
      currentVersionId: `v_${Date.now()}`,
      versions: [
        {
          id: `v_${Date.now()}`,
          version: 1,
          fileName: '新上传材料.pdf',
          fileSize: 1024000,
          uploadedAt: new Date(),
          isDefault: true,
          tags: ['新上传'],
        },
      ],
      tags: ['新上传'],
      metadata: {},
      version: 1,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addMaterial(newMaterial);
    setShowUploadModal(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">材料库</h1>
          <p className="text-slate-500 mt-1">
            共 {materials.length} 种材料，{materials.reduce((sum, m) => sum + (m.versions?.length ?? m.version ?? 0), 0)} 个版本
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary"
        >
          <Upload className="w-4 h-4" />
          上传材料
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
              placeholder="搜索材料..."
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

          {/* 类型筛选 */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as MaterialType | 'all')}
              className="input py-2 pr-8 appearance-none cursor-pointer"
            >
              {materialTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* 排序 */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="input py-2 pr-8 appearance-none cursor-pointer"
            >
              <option value="updated">最近更新</option>
              <option value="name">材料名称</option>
              <option value="type">材料类型</option>
              <option value="created">创建时间</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* 视图切换 */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 材料列表 */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* 主列表区域 */}
        <div className={`flex-1 overflow-auto ${showDetailPanel ? 'hidden lg:block' : ''}`}>
          {filteredMaterials.length === 0 ? (
            <div className="card p-12">
              <div className="empty-state">
                <Upload className="empty-state-icon" />
                <p className="empty-state-title">暂无材料</p>
                <p className="empty-state-description">
                  {searchQuery || filterType !== 'all'
                    ? '试试调整搜索条件或筛选器'
                    : '上传您的第一份材料，开始构建个人材料库'}
                </p>
                <button onClick={() => setShowUploadModal(true)} className="btn-primary mt-4">
                  <Upload className="w-4 h-4" />
                  上传材料
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMaterials.map((material) => {
                const currentVersion = (material.versions || []).find(
                  (v) => v.id === material.currentVersionId
                );
                const typeColor = getMaterialTypeColor((material.type || material.file_type) as MaterialType);

                return (
                  <div
                    key={material.id}
                    onClick={() => handleMaterialClick(material)}
                    className={`card-hover cursor-pointer overflow-hidden ${
                      selectedMaterialId === material.id ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    {/* 预览区域 */}
                    <div
                      className="h-32 flex items-center justify-center"
                      style={{ backgroundColor: `${typeColor}10` }}
                    >
                      {getFileIcon(currentVersion?.fileName || '')}
                    </div>

                    {/* 信息区域 */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 truncate">
                            {material.name || material.title || material.filename}
                          </h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {getMaterialTypeName((material.type || material.file_type) as MaterialType)}
                          </p>
                        </div>
                        <span
                          className="badge"
                          style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                        >
                          v{material.versions?.length ?? material.version ?? 0}
                        </span>
                      </div>

                      {/* 标签 */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(currentVersion?.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="badge-gray text-xs">
                            {tag}
                          </span>
                        ))}
                        {currentVersion && ((currentVersion.tags?.length) ?? 0) > 3 && (
                          <span className="badge-gray text-xs">
                            +{(currentVersion.tags?.length ?? 0) - 3}
                          </span>
                        )}
                      </div>

                      {/* 元信息 */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <span>
                          {format(new Date(material.updatedAt ?? material.updated_at ?? 0), 'yyyy-MM-dd', { locale: zhCN })}
                        </span>
                        <span>{currentVersion ? formatFileSize(currentVersion.fileSize) : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">材料名称</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">类型</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">版本</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">标签</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">更新时间</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map((material) => {
                    const currentVersion = (material.versions || []).find(
                      (v) => v.id === material.currentVersionId
                    );
                    const typeColor = getMaterialTypeColor((material.type || material.file_type) as MaterialType);

                    return (
                      <tr
                        key={material.id}
                        onClick={() => handleMaterialClick(material)}
                        className={`hover:bg-slate-50 cursor-pointer ${
                          selectedMaterialId === material.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${typeColor}20` }}
                            >
                              {getFileIcon(currentVersion?.fileName || '')}
                            </div>
                            <span className="font-medium text-slate-900">{material.name || material.title || material.filename}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="badge"
                            style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                          >
                            {getMaterialTypeName((material.type || material.file_type) as MaterialType)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge-gray">v{material.versions?.length ?? material.version ?? 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {(currentVersion?.tags || []).slice(0, 2).map((tag) => (
                              <span key={tag} className="badge-gray text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {format(new Date(material.updatedAt ?? material.updated_at ?? 0), 'yyyy-MM-dd', { locale: zhCN })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMaterialClick(material);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded"
                            >
                              <Eye className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded"
                            >
                              <Edit3 className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMaterial(material.id);
                              }}
                              className="p-1.5 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 详情面板 */}
        {showDetailPanel && selectedMaterial && (
          <div className="w-full lg:w-96 flex-shrink-0 overflow-auto border-l border-slate-200 bg-white">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-slate-900">材料详情</h3>
              <button
                onClick={() => {
                  setShowDetailPanel(false);
                  setSelectedMaterial(null);
                  selectMaterial(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded lg:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

                  <div className="p-4 space-y-6">
              {/* 基本信息 */}
              <div>
                <label className="label">材料名称</label>
                <input
                  type="text"
                  value={selectedMaterial.name}
                  className="input"
                  readOnly
                />
              </div>

              <div>
                <label className="label">材料类型</label>
                <div className="flex items-center gap-2">
                  <span
                    className="badge"
                      style={{
                      backgroundColor: `${getMaterialTypeColor((selectedMaterial.type || selectedMaterial.file_type) as MaterialType)}20`,
                      color: getMaterialTypeColor((selectedMaterial.type || selectedMaterial.file_type) as MaterialType),
                    }}
                    >
                      {getMaterialTypeName((selectedMaterial.type || selectedMaterial.file_type) as MaterialType)}
                    </span>
                </div>
              </div>

              {/* 版本列表 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">版本管理</label>
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    + 添加版本
                  </button>
                </div>
                <div className="space-y-2">
                  {(selectedMaterial.versions || []).map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg border ${
                        version.id === selectedMaterial.currentVersionId
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {version.id === selectedMaterial.currentVersionId && (
                            <span className="badge-primary text-xs">当前版本</span>
                          )}
                          <span className="text-sm font-medium text-slate-900">
                            v{version.version}.0
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatFileSize(version.fileSize)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{version.fileName}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <span>
                          上传于 {format(new Date(version.uploadedAt ?? 0), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </span>
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-slate-200 rounded">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {version.id !== selectedMaterial.currentVersionId && (
                            <button className="p-1 hover:bg-slate-200 rounded text-primary-600">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 标签 */}
              <div>
                <label className="label">标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {((selectedMaterial.versions || []).find((v) => v.id === selectedMaterial.currentVersionId)
                    ?.tags || []).map((tag) => (
                      <span key={tag} className="badge-gray">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="添加标签..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="input flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag) {
                        setNewTag('');
                      }
                    }}
                  />
                  <button className="btn-secondary">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button className="btn-secondary flex-1">
                  <Download className="w-4 h-4" />
                  下载
                </button>
                <button className="btn-secondary flex-1">
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
                <button
                  onClick={() => {
                    deleteMaterial(selectedMaterial.id);
                    setShowDetailPanel(false);
                    setSelectedMaterial(null);
                  }}
                  className="btn-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">上传材料</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              {/* 上传区域 */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">
                  拖拽文件到此处，或
                  <span className="text-primary-600 font-medium">点击选择文件</span>
                </p>
                <p className="text-sm text-slate-500">
                  支持 PDF、JPG、PNG 格式，单个文件不超过 20MB
                </p>
              </div>

              {/* 材料信息 */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="label">材料名称</label>
                  <input type="text" className="input" placeholder="请输入材料名称" />
                </div>

                <div>
                  <label className="label">材料类型</label>
                  <select className="input">
                    {materialTypes.slice(1).map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">标签</label>
                  <input type="text" className="input" placeholder="用逗号分隔多个标签" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowUploadModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleUpload} className="btn-primary">
                <Upload className="w-4 h-4" />
                上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
