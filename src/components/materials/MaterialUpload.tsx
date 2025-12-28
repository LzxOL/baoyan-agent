'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, generateFileName } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Material, MATERIAL_CATEGORIES } from '@/types';

interface MaterialUploadProps {
  onUploadComplete: (material: Material) => void;
  onClose: () => void;
  initialCategory?: string;
}

interface FileItem {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  category?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// 智能分类推断
function inferCategory(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('成绩') || lower.includes('transcript')) return 'transcript';
  if (lower.includes('四级') || lower.includes('六级') || lower.includes('cet') || lower.includes('雅思') || lower.includes('托福') || lower.includes('英语')) return 'english';
  if (lower.includes('身份证') || lower.includes('学生证') || lower.includes('id')) return 'identity';
  if (lower.includes('证书') || lower.includes('获奖') || lower.includes('竞赛') || lower.includes('award')) return 'certificate';
  if (lower.includes('论文') || lower.includes('paper') || lower.includes('publication')) return 'paper';
  if (lower.includes('推荐') || lower.includes('recommend')) return 'recommendation';
  if (lower.includes('个人陈述') || lower.includes('自述') || lower.includes('statement')) return 'personal';
  if (lower.includes('照片') || lower.includes('photo') || lower.includes('证件照')) return 'photo';
  return '';
}

export default function MaterialUpload({ onUploadComplete, onClose, initialCategory }: MaterialUploadProps) {
  const { user } = useAuth();
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [globalTags, setGlobalTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '不支持的文件类型，仅支持 PDF、JPG、PNG';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件过大，最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const items: FileItem[] = newFiles.map(file => {
      const error = validateFile(file);
      return {
        file,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
        category: initialCategory || inferCategory(file.name),
      };
    });
    setFileItems(prev => [...prev, ...items]);
  }, [initialCategory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, [addFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFileItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileCategory = (index: number, category: string) => {
    setFileItems(prev => prev.map((item, i) =>
      i === index ? { ...item, category } : item
    ));
  };

  const uploadFiles = async () => {
    if (!user || fileItems.length === 0) return;

    const validItems = fileItems.filter(item => item.status !== 'error');
    if (validItems.length === 0) return;

    setUploading(true);
    const tags = globalTags.split(',').map(t => t.trim()).filter(Boolean);

    for (let i = 0; i < fileItems.length; i++) {
      const item = fileItems[i];
      if (item.status === 'error') continue;

      setFileItems(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      try {
        // 生成唯一存储路径（使用 generateFileName，避免中文/编码/冲突问题）
        const filePath = generateFileName(user.id, item.file.name);

        setFileItems(prev => prev.map((f, idx) =>
          idx === i ? { ...f, progress: 30 } : f
        ));

        // 上传到 Supabase Storage（使用唯一路径，默认不覆盖）
        const { error: uploadError } = await supabase.storage.from('agent-materials').upload(filePath, item.file, { upsert: false });
        if (uploadError) throw new Error(uploadError.message || '上传失败');

        setFileItems(prev => prev.map((f, idx) =>
          idx === i ? { ...f, progress: 70 } : f
        ));

        // 获取公开 URL
        const { data: urlData } = supabase.storage
          .from('agent-materials')
          .getPublicUrl(filePath);

        // 保存到数据库（记录原始文件名到 filename 字段，storage_path 为内部唯一路径）
        const { data: inserted, error: insertError } = await supabase.from('materials').insert({
          user_id: user.id,
          filename: item.file.name,
          storage_path: filePath,
          file_path: urlData.publicUrl,
          file_url: urlData.publicUrl,
          file_size: item.file.size,
          file_type: item.file.type,
          material_type: 'other',
          category: item.category || '未分类',
          tags: tags,
          processing_status: 'pending',
        }).select().single();
        if (insertError) throw new Error(insertError.message || '数据库插入失败');
        const data = inserted;

        setFileItems(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'success', progress: 100 } : f
        ));
        onUploadComplete(data);
      } catch (err: any) {
        setFileItems(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: err.message || '上传失败' } : f
        ));
      }
    }

    setUploading(false);

    // 如果全部成功则关闭
    const allSuccess = fileItems.every(item => item.status === 'success' || item.status === 'error');
    if (allSuccess && fileItems.some(item => item.status === 'success')) {
      setTimeout(() => onClose(), 1000);
    }
  };

  const pendingCount = fileItems.filter(f => f.status === 'pending').length;
  const successCount = fileItems.filter(f => f.status === 'success').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div>
            <h2 className="text-xl font-bold">上传材料</h2>
            <p className="text-sm text-white/80 mt-1">支持批量上传，自动智能分类</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 拖拽区域 */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${dragActive
                ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
            `}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${dragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
            <p className="text-gray-700 font-medium mb-2">
              {dragActive ? '释放鼠标上传文件' : '拖拽文件到此处'}
            </p>
            <p className="text-sm text-gray-500">或点击选择文件</p>
            <p className="text-xs text-gray-400 mt-3">支持 PDF、JPG、PNG，单文件最大 50MB</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 文件列表 */}
          {fileItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  已选择 {fileItems.length} 个文件
                  {successCount > 0 && <span className="text-green-600 ml-2">({successCount} 已完成)</span>}
                </h3>
                {fileItems.length > 1 && (
                  <button
                    onClick={() => setFileItems([])}
                    className="text-sm text-gray-500 hover:text-red-600"
                  >
                    清空列表
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {fileItems.map((item, i) => (
                  <div
                    key={i}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-colors
                      ${item.status === 'error' ? 'bg-red-50 border-red-200' :
                        item.status === 'success' ? 'bg-green-50 border-green-200' :
                        'bg-gray-50 border-gray-200'}
                    `}
                  >
                    {/* 文件图标 */}
                    <div className="flex-shrink-0">
                      {item.status === 'uploading' ? (
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                      ) : item.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : item.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : item.file.type === 'application/pdf' ? (
                        <FileText className="w-5 h-5 text-red-500" />
                      ) : (
                        <Image className="w-5 h-5 text-blue-500" />
                      )}
                    </div>

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                      {item.error ? (
                        <p className="text-xs text-red-600">{item.error}</p>
                      ) : item.status === 'uploading' ? (
                        <div className="mt-1">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">{(item.file.size / 1024).toFixed(1)} KB</p>
                      )}
                    </div>

                    {/* 分类选择 */}
                    {item.status === 'pending' && (
                      <select
                        value={item.category || ''}
                        onChange={e => updateFileCategory(i, e.target.value)}
                        className="text-xs px-2 py-1 border rounded bg-white"
                      >
                        <option value="">自动分类</option>
                        {MATERIAL_CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    )}

                    {/* 删除按钮 */}
                    {item.status !== 'uploading' && item.status !== 'success' && (
                      <button
                        onClick={() => removeFile(i)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 全局标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              添加标签 <span className="text-gray-400 font-normal">(可选，逗号分隔)</span>
            </label>
            <input
              type="text"
              value={globalTags}
              onChange={e => setGlobalTags(e.target.value)}
              placeholder="如：大三上学期, 已盖章, 最新版"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {['已盖章', '最新版', '原件', '复印件'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setGlobalTags(prev => prev ? `${prev}, ${tag}` : tag)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex gap-3 p-5 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={uploadFiles}
            disabled={pendingCount === 0 || uploading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                上传中...
              </>
            ) : (
              <>上传 {pendingCount > 0 && `(${pendingCount})`}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
