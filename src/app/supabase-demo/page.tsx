'use client';

import { useState } from 'react';
import MaterialManagement from '@/components/supabase/MaterialManagement';
import {
  ArrowLeft,
  Database,
  Cloud,
  Shield,
  Zap,
  FileText,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function SupabaseDemoPage() {
  const [activeTab, setActiveTab] = useState<'demo' | 'docs'>('demo');

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Supabase 集成演示</h1>
          <p className="text-slate-500 mt-1">基于 Supabase 的文件上传与数据库管理</p>
        </div>
      </div>

      {/* 功能特性介绍 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Supabase Storage</h3>
          </div>
          <p className="text-sm text-slate-600">
            安全存储 PDF 文件，支持拖拽上传、分片传输、断点续传
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">PostgreSQL 数据库</h3>
          </div>
          <p className="text-sm text-slate-600">
            结构化存储文件元数据，支持全文搜索和高级查询
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">行级安全 (RLS)</h3>
          </div>
          <p className="text-sm text-slate-600">
            基于用户身份的文件访问控制，确保数据隐私安全
          </p>
        </div>
      </div>

      {/* 快速开始指南 */}
      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">快速开始</h2>
          <p className="text-sm text-slate-500 mt-1">按照以下步骤配置 Supabase</p>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {/* 步骤 1 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">创建 Supabase 项目</h3>
                <p className="text-sm text-slate-600 mt-1">
                  访问 <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">supabase.com</a> 注册账号并创建新项目
                </p>
              </div>
            </div>

            {/* 步骤 2 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">配置环境变量</h3>
                <p className="text-sm text-slate-600 mt-1">
                  在项目根目录创建 <code className="bg-slate-100 px-2 py-0.5 rounded">.env.local</code> 文件
                </p>
                <div className="mt-2 p-3 bg-slate-900 rounded-lg">
                  <pre className="text-sm text-slate-300 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
                  </pre>
                </div>
              </div>
            </div>

            {/* 步骤 3 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">创建数据库表</h3>
                <p className="text-sm text-slate-600 mt-1">
                  在 Supabase SQL Editor 中执行 <code className="bg-slate-100 px-2 py-0.5 rounded">SUPABASE_SETUP.md</code> 中的 SQL 语句
                </p>
              </div>
            </div>

            {/* 步骤 4 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">创建存储桶</h3>
                <p className="text-sm text-slate-600 mt-1">
                  在 Supabase Storage 中创建名为 <code className="bg-slate-100 px-2 py-0.5 rounded">agent-materials</code> 的存储桶
                </p>
              </div>
            </div>

            {/* 步骤 5 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-medium flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">开始使用</h3>
                <p className="text-sm text-slate-600 mt-1">
                  现在您可以上传 PDF 文件到 Supabase 了！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 功能演示 */}
      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">功能演示</h2>
          <p className="text-sm text-slate-500 mt-1">上传 PDF 文件到 Supabase Storage 并在数据库中建立索引</p>
        </div>
        <div className="p-5">
          <MaterialManagement />
        </div>
      </div>

      {/* 注意事项 */}
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-slate-900">注意事项</h3>
            <ul className="text-sm text-slate-600 mt-2 space-y-1">
              <li>• 当前演示使用模拟数据，配置 Supabase 后将连接真实数据库</li>
              <li>• 建议将存储桶设置为私有，确保文件安全</li>
              <li>• 启用 RLS 策略后，用户只能访问自己的文件</li>
              <li>• 文件大小限制可在 Supabase Storage 设置中调整</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
