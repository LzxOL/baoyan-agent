# 封面生成功能部署指南

本指南将帮助您部署PDF封面生成功能，该功能允许用户在生成PDF时自动在前添加个性化封面。

## 已完成的修改

### 1. 前端修改
- ✅ 创建了 `CoverInfoForm.tsx` 组件用于收集用户信息
- ✅ 修改了 `MaterialsPage.tsx` 在PDF生成前显示封面表单
- ✅ 添加了封面生成和PDF合并逻辑

### 2. 后端修改
- ✅ 创建了 `/api/generate-cover` API端点
- ✅ 修改了Python脚本支持从Supabase storage读取文件
- ✅ 添加了新的依赖到 `requirements.txt`

### 3. 部署配置
- ✅ 更新了 `render.yaml` 配置
- ✅ 配置了Supabase环境变量

## 部署步骤

### 步骤1：更新Supabase Storage结构

确保您的Supabase storage bucket `institution-assets` 中有以下文件结构：

```
institution-assets/
├── pdf_generate/
│   ├── config/
│   │   ├── word_template.docx      # 模板文件
│   │   ├── logo_mapping.json       # logo映射文件
│   │   └── template_spec.json      # 模板规格文件
│   └── school-logos/               # 学校logo文件夹
│       ├── 清华大学.svg
│       ├── 北京大学.png
│       └── ... (其他学校logo)
```

### 步骤2：重新部署Python后端到Render

1. 访问您的Render控制台
2. 找到 `baoyan-agent-parse` 服务
3. 点击 "Manual Deploy" -> "Deploy latest commit"
4. 等待部署完成

### 步骤3：配置Render环境变量

在Render服务的Environment设置中，确保添加以下环境变量：

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**重要**：使用 `SUPABASE_SERVICE_ROLE_KEY` 而不是 `SUPABASE_ANON_KEY`，因为需要访问storage文件。

### 步骤4：更新Vercel前端环境变量

在Vercel项目设置中，更新以下环境变量以指向新的Render服务：

```env
PY_GENERATE_COVER_URL=https://your-render-service.onrender.com/generate-cover
```

### 步骤5：测试功能

1. 重新部署前端到Vercel
2. 登录应用，进入材料页面
3. 添加一些文件到画布
4. 点击"生成PDF"按钮
5. 填写封面信息表单
6. 等待PDF生成和下载

## 故障排除

### 问题1：封面生成失败
**错误**：`封面生成失败: 模板下载失败`

**解决方案**：
- 检查Supabase storage中文件路径是否正确
- 确认环境变量 `SUPABASE_SERVICE_ROLE_KEY` 配置正确
- 检查storage bucket权限

### 问题2：PDF无法合并
**错误**：`Item fail [filename]`

**解决方案**：
- 检查文件URL是否可访问
- 确认文件格式支持（PDF、PNG、JPG）

### 问题3：LibreOffice未找到
**错误**：`LibreOffice (soffice) not found`

**解决方案**：
- Render部署已自动安装LibreOffice
- 如果仍有问题，请联系Render支持

## 功能说明

### 封面表单字段
- **学生姓名**：必填，显示在封面
- **申请专业**：必填，显示在封面
- **本科院校**：必填，用于匹配学校logo
- **毕业专业**：必填，显示在封面
- **联系方式**：可选
- **邮箱**：可选

### 工作流程
1. 用户点击"生成PDF"
2. 显示封面信息表单
3. 用户填写信息并提交
4. 系统调用Python后端生成封面PDF
5. 将封面与画布中现有PDF合并
6. 生成最终的完整PDF供下载

## 技术细节

- **模板引擎**：python-docx + 自定义占位符替换
- **Logo匹配**：基于文件名和JSON映射的智能匹配
- **PDF转换**：LibreOffice (soffice)
- **存储**：Supabase Storage
- **部署**：Render (Python后端) + Vercel (Next.js前端)

## 下一步优化建议

1. **缓存机制**：缓存生成的封面以提高性能
2. **预览功能**：在提交前预览封面效果
3. **模板管理**：允许用户自定义模板
4. **批量处理**：支持批量生成多个封面
5. **错误处理**：更详细的错误信息和重试机制
