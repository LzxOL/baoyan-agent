'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Material } from '@/types';
import SupabaseUpload from './SupabaseUpload';
import {
  FileText,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Grid3X3,
  List,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

type ViewMode = 'grid' | 'list';

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentUserId, setCurrentUserId] = useState<string>('demo-user-001');

  // 获取材料列表
  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('获取材料失败:', error);
        return;
      }

      setMaterials(data || []);
    } catch (err) {
      console.error('获取材料异常:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchMaterials();
  }, []);

  // 处理上传完成
  const handleUploadComplete = (material: Material) => {
    fetchMaterials();
  };

  // 删除材料
  const handleDelete = async (material: Material) => {
    if (!confirm(`确定要删除 "${material.title}" 吗？`)) return;

    try {
      // 删除存储文件
      await supabase.storage.from('agent-materials').remove([material.file_path]);

      // 删除数据库记录
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', material.id);

      if (error) {
        alert('删除失败: ' + error.message);
        return;
      }

      // 刷新列表
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
    } catch (err: any) {
      alert('删除失败: ' + err.message);
    }
  };

  // 获取处理状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  // 获取处理状态标签
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string }> = {
      pending: { label: '待处理', class: 'badge-gray' },
      processing: { label: '处理中', class: 'badge-primary' },
      completed: { label: '已完成', class: 'badge-success' },
      failed: { label: '失败', class: 'badge-danger' },
    };
    const { label, class: className } = config[status] || config.pending;
    return <span className={className}>{label}</span>;
  };

  // 过滤材料
  const filteredMaterials = materials.filter((material) => {
    const title = (material.title || material.filename || '').toString();
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || ((material.type || material.file_type) === filterType);
    return matchesSearch && matchesType;
  });

  // 材料类型选项
  const materialTypes = [
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

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">材料管理</h1>
          <p className="text-slate-500 mt-1">使用 Supabase 上传和管理您的保研材料</p>
        </div>
        <button onClick={fetchMaterials} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 上传区域 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">上传新材料</h2>
        <SupabaseUpload userId={currentUserId} onUploadComplete={handleUploadComplete} />
      </div>

      {/* 工具栏 */}
      <div className="card p-3">
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
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* 类型筛选 */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input py-2 w-40"
          >
            {materialTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

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
      {isLoading ? (
        <div className="card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">加载中...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="card p-12">
          <div className="empty-state">
            <FileText className="empty-state-icon" />
            <p className="empty-state-title">暂无材料</p>
            <p className="empty-state-description">
              {searchQuery || filterType !== 'all'
                ? '试试调整搜索条件或筛选器'
                : '上传您的第一份材料'}
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="card-hover overflow-hidden">
              {/* 预览区域 */}
              <div className="h-32 bg-slate-100 flex items-center justify-center">
                <FileText className="w-12 h-12 text-red-500" />
              </div>

              {/* 信息区域 */}
              <div className="p-4">
                <h3 className="font-medium text-slate-900 truncate" title={material.title}>
                  {material.title}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">{material.category}</p>

                {/* 标签 */}
                <div className="flex items-center gap-2 mt-3">
                  {getStatusBadge(material.processing_status || 'pending')}
                  <span className="text-xs text-slate-400">
                    {formatFileSize(material.file_size ?? 0)}
                  </span>
                </div>

                {/* 元信息 */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>
                    {format(new Date(material.uploaded_at ?? 0), 'yyyy-MM-dd', { locale: zhCN })}
                  </span>
                    <div className="flex items-center gap-1">
                    {getStatusIcon(material.processing_status || 'pending')}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex-1 text-xs py-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载
                  </a>
                  <button
                    onClick={() => handleDelete(material)}
                    className="btn-ghost text-red-500 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">文件名称</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">类型</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">大小</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">上传时间</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="font-medium text-slate-900">{material.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-gray">{material.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatFileSize(material.file_size ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(material.processing_status || 'pending')}       
                        {getStatusBadge(material.processing_status || 'pending')}      
                      </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {format(new Date(material.uploaded_at ?? 0), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-slate-100 rounded"
                        title="查看"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                      </a>
                      <button
                        onClick={() => handleDelete(material)}
                        className="p-1.5 hover:bg-red-50 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 统计信息 */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>共 {filteredMaterials.length} 个材料</span>
          <span>存储使用: {formatFileSize(filteredMaterials.reduce((sum, m) => sum + (m.file_size ?? 0), 0))}</span>
        </div>
      </div>
    </div>
  );
}
