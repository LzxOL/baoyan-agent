---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 304402201f13c96d1164b04aa41b24d1090e306abe62eb4df856a59517c3223c1fabdce4022023c004db5c7182bd75736ce0462b31527755c31898b0e24fb4d6ff573c45455a
    ReservedCode2: 3044022026c71696d71634f1f0d91d063affaf46e026b83e565a20c62a5e23682cf165b402207c321ff6c12bd020d9c2805bf385f603d15a770eb1522cdb24c5f391e5140975
---

# Supabase 集成使用指南

本指南将帮助您完成 Supabase 后端配置，实现 PDF 文件上传和数据库管理功能。

## 目录

1. [环境准备](#环境准备)
2. [Supabase 配置](#supabase-配置)
3. [数据库设置](#数据库设置)
4. [存储桶配置](#存储桶配置)
5. [运行演示](#运行演示)
6. [常见问题](#常见问题)

## 环境准备

### 前置条件

- Node.js 18+ 版本
- npm 或 yarn 包管理器
- Supabase 账号（免费注册 https://supabase.com）

### 安装依赖

确保已安装 Supabase JavaScript 客户端库：

```bash
npm install @supabase/supabase-js
```

## Supabase 配置

### 步骤 1：创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://database.new) 创建新项目
2. 填写项目名称（如 `baoyan-agent`）
3. 设置数据库密码
4. 等待项目创建完成（约 1 分钟）

### 步骤 2：获取项目凭证

在项目设置中获取以下信息：

- **Project URL**：项目地址，格式为 `https://xxxxx.supabase.co`
- **anon public key**：匿名公钥，用于客户端认证
- **service_role key**：服务角色密钥（**仅服务端使用，不要暴露到客户端**）

### 步骤 3：配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# 服务端使用（不要在客户端代码中使用）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**注意**：确保 `.env.local` 已添加到 `.gitignore` 中，不要提交到版本控制。

## 数据库设置

### 步骤 1：创建材料表

在 Supabase Dashboard 中打开 **SQL Editor**，执行以下 SQL 语句：

```sql
-- 创建材料表
CREATE TABLE public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT DEFAULT 'application/pdf',
  material_type TEXT DEFAULT 'other',
  category TEXT DEFAULT '未分类',
  tags TEXT[] DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_content TEXT,
  ai_summary TEXT
);

-- 创建索引
CREATE INDEX idx_materials_user_id ON public.materials(user_id);
CREATE INDEX idx_materials_type ON public.materials(material_type);
CREATE INDEX idx_materials_uploaded_at ON public.materials(uploaded_at DESC);
```

### 步骤 2：启用行级安全（RLS）

```sql
-- 启用行级安全
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的材料
CREATE POLICY "Users can view own materials"
ON public.materials FOR SELECT
USING (auth.uid() = user_id);

-- 用户只能上传自己的材料
CREATE POLICY "Users can upload own materials"
ON public.materials FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的材料
CREATE POLICY "Users can update own materials"
ON public.materials FOR UPDATE
USING (auth.uid() = user_id);

-- 用户只能删除自己的材料
CREATE POLICY "Users can delete own materials"
ON public.materials FOR DELETE
USING (auth.uid() = user_id);
```

## 存储桶配置

### 步骤 1：创建存储桶

在 Supabase Dashboard 中打开 **Storage**，点击 **New Bucket**：

- **Bucket Name**：`agent-materials`
- **Public Access**：建议关闭（私人文档更安全）
- **File Size Limit**：10MB

### 步骤 2：配置存储策略

在 **SQL Editor** 中执行以下 SQL：

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-materials', 'agent-materials', false)
ON CONFLICT DO NOTHING;

-- 允许认证用户上传文件
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-materials' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户查看自己的文件
CREATE POLICY "Allow viewing own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agent-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己的文件
CREATE POLICY "Allow deleting own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 运行演示

### 启动开发服务器

```bash
npm run dev
```

### 访问演示页面

打开浏览器访问 `http://localhost:3000/supabase-demo`

您将看到：

1. **快速开始指南**：详细配置步骤
2. **功能演示**：完整的文件上传和管理界面

## 常见问题

### Q1: 上传文件时提示 "Invalid API Key"

**原因**：环境变量未正确配置或 Supabase 客户端未初始化。

**解决方案**：
1. 检查 `.env.local` 文件是否存在且格式正确
2. 确认 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 正确
3. 重启开发服务器（`npm run dev`）

### Q2: 上传失败，提示 "Permission denied"

**原因**：存储桶策略未正确配置或 RLS 策略阻止操作。

**解决方案**：
1. 确认存储桶存在且名称正确
2. 检查存储策略是否已创建
3. 确认用户已登录（RLS 策略基于 `auth.uid()`）

### Q3: 文件上传后无法访问

**原因**：存储桶设置为私有，需要生成 signed URL 或公开访问。

**解决方案**：
1. 获取公开 URL：`supabase.storage.from('bucket').getPublicUrl(path)`
2. 或生成签名 URL：`supabase.storage.from('bucket').createSignedUrl(path, expiresIn)`

### Q4: 文件大小限制

**原因**：Supabase Storage 默认限制为 6MB。

**解决方案**：
1. 在 Supabase Storage 设置中调整文件大小限制
2. 当前代码中已设置为 10MB 限制

### Q5: 如何实现用户认证？

**Supabase 提供了完整的认证解决方案**，可以集成：

- 邮箱/密码登录
- 手机号验证码登录
- 第三方登录（微信、GitHub 等）

集成方式：

```typescript
import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// 在客户端使用
const supabase = createClientComponentClient()

// 注册用户
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})

// 登录
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})
```

## 进阶功能

### 1. 文件分类自动识别

结合 AI 服务（如 OpenAI、Claude）实现：

```typescript
// 上传后调用 AI 分析
const aiAnalysis = await analyzeFileContent(file);
await supabase
  .from('materials')
  .update({
    material_type: aiAnalysis.type,
    category: aiAnalysis.category,
    tags: aiAnalysis.tags,
  })
  .eq('id', materialId);
```

### 2. OCR 文字提取

使用云函数处理 PDF：

```typescript
// Supabase Edge Function 示例
await supabase.functions.invoke('extract-pdf-text', {
  body: { filePath: material.file_path },
});
```

### 3. 实时同步

使用 Supabase Realtime 监听数据变化：

```typescript
const channel = supabase
  .channel('materials-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'materials' },
    (payload) => {
      console.log('数据变化:', payload);
    }
  )
  .subscribe();
```

## 总结

通过以上配置，您已成功实现：

- ✅ PDF 文件上传到云存储
- ✅ 文件元数据存储到 PostgreSQL
- ✅ 基于用户身份的安全访问控制
- ✅ 完整的 CRUD 操作支持

后续可以继续扩展：

- 集成用户认证系统
- 添加 AI 辅助分类
- 实现 OCR 文字提取
- 添加文件版本管理
