'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, generateFileName, isSupabaseConfigured } from '@/lib/supabase';
import type { Material } from '@/types';
import SignUpModal from '@/components/auth/SignUpModal';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  Cloud,
  CloudOff,
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  material?: Material;
}

interface SupabaseUploadProps {
  userId: string;
  onUploadComplete?: (material: Material) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
}

const DEFAULT_ACCEPTED_TYPES = ['application/pdf'];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

export default function SupabaseUpload({
  userId,
  onUploadComplete,
  maxFileSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: SupabaseUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const fileMapRef = useRef<Record<string, File>>({});

  /* =========================
     Auth 状态监听
  ========================= */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_: any, session: any) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* =========================
     文件校验
  ========================= */
  const validateFile = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      return `不支持的文件类型，仅支持 PDF`;
    }
    if (file.size > maxFileSize) {
      return `文件大小超过 ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB`;
    }
    return null;
  };

  /* =========================
     上传到 Storage
  ========================= */
  const uploadToStorage = async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from('agent-materials')
      .upload(path, file, { upsert: false });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage
      .from('agent-materials')
      .getPublicUrl(path);

    return data.publicUrl;
  };

  /* =========================
     写入数据库
  ========================= */
  const saveToDatabase = async (file: File, path: string, url: string) => {
    // After DB migration: insert full record directly using filename and storage_path
    const { data, error } = await supabase
      .from('materials')
      .insert({
        user_id: userId,
        filename: file.name,
        storage_path: path,
        file_path: url,
        file_url: url,
        file_size: file.size,
        file_type: file.type,
        material_type: 'other',
        category: '未分类',
        tags: [],
        processing_status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(error.message || '数据库插入失败');
    return data;
  };

  /* =========================
     统一处理上传
  ========================= */
  const handleUpload = async (file: File, existingId?: string) => {
    const error = validateFile(file);
    const id = existingId ?? crypto.randomUUID();

    if (error) {
      setFiles((f) => [
        ...f,
        { id, name: file.name, size: file.size, type: file.type, status: 'error', progress: 0, error },
      ]);
      return;
    }

    setFiles((f) => {
      const exists = f.find(x => x.id === id);
      if (exists) {
        return f.map(x => x.id === id ? { ...x, status: 'uploading', progress: 0 } : x);
      }
      return [...f, { id, name: file.name, size: file.size, type: file.type, status: 'uploading', progress: 0 }];
    });

    try {
      const path = generateFileName(userId, file.name);
      const url = await uploadToStorage(file, path);
      // uploadToStorage returns public URL; ensure DB field mapping matches frontend expectations
      const material = await saveToDatabase(file, path, url);

      setFiles((f) =>
        f.map((x) =>
          x.id === id
            ? { ...x, status: 'success', progress: 100, material }
            : x
        )
      );
      onUploadComplete?.(material);
    } catch (err: any) {
      setFiles((f) =>
        f.map((x) =>
          x.id === id ? { ...x, status: 'error', error: err.message } : x
        )
      );
    } finally {
      try { delete fileMapRef.current[id]; } catch {}
    }
  };

  /* =========================
     input change
  ========================= */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []) as File[];
    const items = selected.map(file => {
      const id = crypto.randomUUID();
      fileMapRef.current[id] = file;
      return { id, name: file.name, size: file.size, type: file.type, status: 'pending' as const, progress: 0 };
    });
    setFiles(f => [...f, ...items]);
    e.target.value = '';
  };

  /* =========================
     拖拽处理
  ========================= */
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const selected = Array.from(e.dataTransfer.files || []) as File[];
    const items = selected.map(file => {
      const id = crypto.randomUUID();
      fileMapRef.current[id] = file;
      return { id, name: file.name, size: file.size, type: file.type, status: 'pending' as const, progress: 0 };
    });
    setFiles(f => [...f, ...items]);
  };

  /* =========================
     未配置
  ========================= */
  if (!isConfigured) {
    return (
      <div className="card p-6">
        <div className="flex gap-3 bg-amber-50 p-4 rounded-lg">
          <CloudOff className="text-amber-600" />
          <p className="text-amber-800 text-sm">
            请配置 Supabase 环境变量
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     未登录
  ========================= */
  if (!currentUser) {
    return (
      <div className="card p-6 text-center">
        <p className="mb-3">请先注册或登录</p>
        <button className="btn-primary" onClick={() => setShowSignUp(true)}>
          注册 / 登录
        </button>
        <SignUpModal open={showSignUp} onClose={() => setShowSignUp(false)} />
      </div>
    );
  }

  /* =========================
     正式 UI
  ========================= */
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-4">
      {/* 上传区 */}
      <div
        className={`card p-6 border-2 border-dashed cursor-pointer transition ${
          isDragOver ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center">
          <Cloud className="mx-auto mb-3 text-slate-400" size={40} />
          <p className="font-medium">
            {isDragOver ? '释放文件以上传' : '拖拽 PDF 文件到此处，或点击选择'}
          </p>
          <p className="text-sm text-slate-500">
            最大 {(maxFileSize / (1024 * 1024)).toFixed(0)}MB
          </p>
          <div className="inline-flex items-center gap-2 mt-3 btn-primary">
            <Upload size={16} /> 选择文件
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">已选择 {files.length} 个文件</h3>
            <div className="flex gap-2">
              <button onClick={() => setFiles([])} className="text-sm text-gray-500 hover:text-red-600">清空列表</button>
              <button onClick={() => {
                // upload pending files
                files.filter(f => f.status === 'pending').forEach(f => {
                  const file = fileMapRef.current[f.id];
                  if (file) void handleUpload(file, f.id);
                });
              }} className="px-3 py-1 bg-indigo-600 text-white rounded">开始上传</button>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((item) => (
              <div key={item.id} className={`
                flex items-center gap-3 p-3 rounded-lg border transition-colors
                ${item.status === 'error' ? 'bg-red-50 border-red-200' : item.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}
              `}>
                <div className="flex-shrink-0">
                  {item.status === 'uploading' ? <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /> : item.status === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : item.status === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <FileText className="w-5 h-5 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  {item.error ? <p className="text-xs text-red-600">{item.error}</p> : item.status === 'uploading' ? <div className="mt-1"><div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${item.progress}%` }} /></div></div> : <p className="text-xs text-gray-500">{(item.size / 1024).toFixed(1)} KB</p>}
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'success' && <button onClick={() => window.open(item.material?.file_url || item.material?.file_path, '_blank')} className="p-1.5 hover:bg-gray-100 rounded"><Eye className="w-4 h-4 text-gray-500" /></button>}
                  <button onClick={() => removeFile(item.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  async function removeFile(id: string) {
    const file = files.find((f) => f.id === id);
    if (!file?.material) return;
    const storagePath = file.material.storage_path || file.material.file_path;
    await supabase.storage.from('agent-materials').remove([storagePath]);
    await supabase.from('materials').delete().eq('id', file.material.id);
    setFiles((f) => f.filter((x) => x.id !== id));
  }
}
