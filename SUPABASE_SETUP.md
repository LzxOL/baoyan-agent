---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3045022020f3bdaefc6ae2a676e5810d4145de81f1083f3e81aa360cef4a995cfc101344022100948fc8a9da7026acb110b17266de41852074c49ce4a5ce4194117c9e58c32a80
    ReservedCode2: 304502210096eb71ac8662aca65c6b1092a7b7a47474e222be0ebc9ca6e08c28b2a35fdba60220147c6ca099f0d09aa75d50dd28fc6895a8d4ef8e066f4135ae5deeac7350c117
---

# Supabase Configuration for Baoyan Agent Platform

## 1. Environment Variables

创建 `.env.local` 文件并添加以下配置：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 可选：如果使用服务端 API，需要服务密钥（不要暴露到客户端）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 2. 获取 Supabase 配置

1. 访问 https://supabase.com 注册账号
2. 创建新项目：https://database.new
3. 在项目设置中找到以下信息：
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY，仅服务端使用)

## 3. 数据库设置

在 Supabase 的 SQL Editor 中执行以下 SQL 来创建数据库表和设置安全策略：

```sql
-- ============================================
-- 1. 创建材料表
-- ============================================
create table public.materials (
  id uuid default gen_random_uuid() primary key,
  
  -- 用户关联
  user_id uuid references auth.users(id) not null,
  
  -- 文件信息
  title text not null,
  description text,
  file_path text not null,
  file_url text not null,
  file_size integer not null,
  file_type text default 'application/pdf',
  
  -- 材料分类
  material_type text default 'other',
  category text default '未分类',
  
  -- 标签
  tags text[] default '{}',
  
  -- 时间戳
  uploaded_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- 处理状态（供 AI Agent 使用）
  processing_status text default 'pending' check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  ocr_content text,
  ai_summary text
);

-- ============================================
-- 2. 启用行级安全（RLS）
-- ============================================
alter table public.materials enable row level security;

-- ============================================
-- 3. 创建安全策略
-- ============================================

-- 策略：用户只能查看自己的材料
create policy "用户只能查看自己的材料"
on public.materials for select
using (auth.uid() = user_id);

-- 策略：用户只能插入自己的材料
create policy "用户只能上传自己的材料"
on public.materials for insert
with check (auth.uid() = user_id);

-- 策略：用户只能更新自己的材料
create policy "用户只能更新自己的材料"
on public.materials for update
using (auth.uid() = user_id);

-- 策略：用户只能删除自己的材料
create policy "用户只能删除自己的材料"
on public.materials for delete
using (auth.uid() = user_id);

-- ============================================
-- 4. 创建索引以提高查询性能
-- ============================================
create index idx_materials_user_id on public.materials(user_id);
create index idx_materials_type on public.materials(material_type);
create index idx_materials_uploaded_at on public.materials(uploaded_at desc);
```

## 4. Storage 存储桶设置

在 Supabase 的 Storage 管理页面中：

1. 创建新的存储桶：
   - 桶名称：`agent-materials`
   - 公开访问：建议关闭（私人文档更安全）
   - 文件大小限制：10MB

2. 执行以下 SQL 设置存储策略：

```sql
-- ============================================
-- Storage 存储桶策略
-- ============================================

-- 创建存储桶（如果尚未创建）
insert into storage.buckets (id, name, public)
values ('agent-materials', 'agent-materials', false)
on conflict do nothing;

-- 策略：允许认证用户上传文件
create policy "允许认证用户上传文件"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'agent-materials' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 策略：允许用户查看自己的文件
create policy "允许用户查看自己的文件"
on storage.objects for select
to authenticated
using (
  bucket_id = 'agent-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 策略：允许用户删除自己的文件
create policy "允许用户删除自己的文件"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'agent-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

## 5. 快速测试

创建测试数据：

```sql
-- 插入一条测试数据（实际使用中应通过应用插入）
insert into public.materials (user_id, title, file_path, file_url, file_size, material_type)
values 
(
  '00000000-0000-0000-0000-000000000001',  -- 替换为实际用户 ID
  '测试成绩单.pdf',
  '00000000-0000-0000-0000-000000000001/test_score.pdf',
  'https://your-project.supabase.co/storage/v1/object/private/agent-materials/00000000-0000-0000-0000-000000000001/test_score.pdf',
  2456000,
  'transcript'
);
```

## 6. 注意事项

1. **ANON KEY vs SERVICE ROLE KEY**：
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`：客户端可用的公钥，用于常规操作
   - `SUPABASE_SERVICE_ROLE_KEY`：服务端密钥，有更高权限，不要暴露到客户端

2. **文件安全**：
   - 建议将存储桶设置为私有
   - 使用 RLS 策略确保用户只能访问自己的文件
   - 分享文件时生成 signed URL（有时效限制的链接）

3. **文件大小**：
   - 默认限制：10MB
   - 如需更大文件，可在 Storage 设置中调整
   - 大文件建议分片上传

4. **监控和日志**：
   - 在 Supabase Dashboard 中可以查看 API 请求日志
   - 可以设置告警通知
