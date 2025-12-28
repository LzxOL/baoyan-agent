import type { Material, Project, ProjectDetail, MaterialType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// 生成模拟材料
export const mockMaterials = (): Material[] => {
  return [
    {
      id: 'mat_1',
      userId: 'user_1',
      name: '本科成绩单（大一至大三）',
      type: 'transcript',
      category: '成绩相关',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-06-20'),
      currentVersionId: 'v_1_2',
      versions: [
        {
          id: 'v_1_1',
          version: 1,
          fileName: '成绩单_未盖章版.pdf',
          fileSize: 2456000,
          uploadedAt: new Date('2024-01-15'),
          isDefault: false,
          tags: ['未盖章', '前三学期'],
        },
        {
          id: 'v_1_2',
          version: 2,
          fileName: '成绩单_盖章版_第六学期.pdf',
          fileSize: 2834000,
          uploadedAt: new Date('2024-06-20'),
          isDefault: true,
          tags: ['已盖章', '最新', '完整版'],
          notes: '包含前六学期成绩，教务处盖章',
        },
      ],
      ocrContent: '学年学期 课程名称 学分 成绩 绩点 2021-2022-1 高等数学I 5.0 95 4.0',
    },
    {
      id: 'mat_2',
      userId: 'user_1',
      name: '大学英语六级成绩单',
      type: 'english',
      category: '英语成绩',
      createdAt: new Date('2023-12-10'),
      updatedAt: new Date('2023-12-10'),
      currentVersionId: 'v_2_1',
      versions: [
        {
          id: 'v_2_1',
          version: 1,
          fileName: 'CET6成绩单_568分.pdf',
          fileSize: 1250000,
          uploadedAt: new Date('2023-12-10'),
          isDefault: true,
          tags: ['六级', '568分'],
        },
      ],
      ocrContent: '大学英语六级成绩单 总分 568 听力 180 阅读 200 写作和翻译 188',
    },
    {
      id: 'mat_3',
      userId: 'user_1',
      name: '身份证复印件',
      type: 'id_card',
      category: '身份证明',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      currentVersionId: 'v_3_1',
      versions: [
        {
          id: 'v_3_1',
          version: 1,
          fileName: '身份证_正反面.pdf',
          fileSize: 890000,
          uploadedAt: new Date('2024-01-01'),
          isDefault: true,
          tags: ['身份证', '正反面'],
        },
      ],
    },
    {
      id: 'mat_4',
      userId: 'user_1',
      name: '学生证复印件',
      type: 'id_card',
      category: '身份证明',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      currentVersionId: 'v_4_1',
      versions: [
        {
          id: 'v_4_1',
          version: 1,
          fileName: '学生证_信息页.pdf',
          fileSize: 720000,
          uploadedAt: new Date('2024-01-01'),
          isDefault: true,
          tags: ['学生证', '在读证明'],
        },
      ],
    },
    {
      id: 'mat_5',
      userId: 'user_1',
      name: '全国大学生数学竞赛一等奖',
      type: 'competition',
      category: '竞赛获奖',
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-03-15'),
      currentVersionId: 'v_5_1',
      versions: [
        {
          id: 'v_5_1',
          version: 1,
          fileName: '数学竞赛_一等奖证书.pdf',
          fileSize: 1560000,
          uploadedAt: new Date('2024-03-15'),
          isDefault: true,
          tags: ['数学竞赛', '一等奖', '国家级'],
        },
      ],
    },
    {
      id: 'mat_6',
      userId: 'user_1',
      name: '美国大学生数学建模竞赛M奖',
      type: 'competition',
      category: '竞赛获奖',
      createdAt: new Date('2024-05-01'),
      updatedAt: new Date('2024-05-01'),
      currentVersionId: 'v_6_1',
      versions: [
        {
          id: 'v_6_1',
          version: 1,
          fileName: 'MCM_ICM_M奖证书.pdf',
          fileSize: 1890000,
          uploadedAt: new Date('2024-05-01'),
          isDefault: true,
          tags: ['建模竞赛', 'M奖', '国际级'],
        },
      ],
    },
    {
      id: 'mat_7',
      userId: 'user_1',
      name: '科研论文：深度学习在图像识别中的应用',
      type: 'paper',
      category: '学术成果',
      createdAt: new Date('2024-04-10'),
      updatedAt: new Date('2024-04-10'),
      currentVersionId: 'v_7_1',
      versions: [
        {
          id: 'v_7_1',
          version: 1,
          fileName: '论文_深度学习图像识别.pdf',
          fileSize: 3200000,
          uploadedAt: new Date('2024-04-10'),
          isDefault: true,
          tags: ['第一作者', 'CCF-A', '已发表'],
        },
      ],
      ocrContent: '基于深度学习的图像识别技术研究 摘要：本文提出了一种新的卷积神经网络架构...',
    },
    {
      id: 'mat_8',
      userId: 'user_1',
      name: '个人陈述（通用版）',
      type: 'personal_statement',
      category: '申请文书',
      createdAt: new Date('2024-05-15'),
      updatedAt: new Date('2024-06-25'),
      currentVersionId: 'v_8_3',
      versions: [
        {
          id: 'v_8_1',
          version: 1,
          fileName: '个人陈述_初稿.pdf',
          fileSize: 980000,
          uploadedAt: new Date('2024-05-15'),
          isDefault: false,
          tags: ['初稿', '2000字'],
        },
        {
          id: 'v_8_2',
          version: 2,
          fileName: '个人陈述_修改版.pdf',
          fileSize: 1020000,
          uploadedAt: new Date('2024-06-10'),
          isDefault: false,
          tags: ['修改版', '2500字'],
        },
        {
          id: 'v_8_3',
          version: 3,
          fileName: '个人陈述_最终版.pdf',
          fileSize: 1150000,
          uploadedAt: new Date('2024-06-25'),
          isDefault: true,
          tags: ['最终版', '3000字', '针对CS方向'],
        },
      ],
    },
    {
      id: 'mat_9',
      userId: 'user_1',
      name: '简历',
      type: 'resume',
      category: '申请文书',
      createdAt: new Date('2024-05-01'),
      updatedAt: new Date('2024-06-20'),
      currentVersionId: 'v_9_2',
      versions: [
        {
          id: 'v_9_1',
          version: 1,
          fileName: '简历_基础版.pdf',
          fileSize: 650000,
          uploadedAt: new Date('2024-05-01'),
          isDefault: false,
          tags: ['基础版'],
        },
        {
          id: 'v_9_2',
          version: 2,
          fileName: '简历_强化版.pdf',
          fileSize: 780000,
          uploadedAt: new Date('2024-06-20'),
          isDefault: true,
          tags: ['强化版', '突出科研经历'],
        },
      ],
    },
    {
      id: 'mat_10',
      userId: 'user_1',
      name: '副教授推荐信',
      type: 'recommendation',
      category: '推荐信',
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-01'),
      currentVersionId: 'v_10_1',
      versions: [
        {
          id: 'v_10_1',
          version: 1,
          fileName: '推荐信_李教授.pdf',
          fileSize: 450000,
          uploadedAt: new Date('2024-06-01'),
          isDefault: true,
          tags: ['副教授', '科研导师'],
        },
      ],
    },
    {
      id: 'mat_11',
      userId: 'user_1',
      name: '发明专利证书',
      type: 'patent',
      category: '学术成果',
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date('2024-02-20'),
      currentVersionId: 'v_11_1',
      versions: [
        {
          id: 'v_11_1',
          version: 1,
          fileName: '发明专利_图像处理.pdf',
          fileSize: 2100000,
          uploadedAt: new Date('2024-02-20'),
          isDefault: true,
          tags: ['发明专利', '第一发明人', '实质审查'],
        },
      ],
    },
  ];
};

// 生成模拟项目
export const mockProjects = (): Project[] => {
  return [
    {
      id: 'proj_1',
      userId: 'user_1',
      name: '申请项目 A',
      department: '计算机科学',
      batch: 'summer_camp',
      status: 'filling',
      deadline: new Date('2024-07-15'),
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-26'),
      notes: '目标导师：王教授，研究方向计算机视觉',
    },
    {
      id: 'proj_2',
      userId: 'user_1',
      name: '申请项目 B',
      department: '信息学院',
      batch: 'pre_apply',
      status: 'preparation',
      deadline: new Date('2024-08-20'),
      createdAt: new Date('2024-06-10'),
      updatedAt: new Date('2024-06-20'),
    },
    {
      id: 'proj_3',
      userId: 'user_1',
      name: '申请项目 C',
      department: '计算机学院',
      batch: 'summer_camp',
      status: 'ready',
      deadline: new Date('2024-07-10'),
      createdAt: new Date('2024-05-25'),
      updatedAt: new Date('2024-06-25'),
    },
  ];
};

// 生成模拟项目详情
export const mockProjectDetail = (project: Project): ProjectDetail => {
  const requirements = generateRequirements(project.id, project.batch);
  
  return {
    ...project,
    rawRequirements: getRawRequirements(project.batch),
    requirements,
  };
};

// 根据批次生成清单
const generateRequirements = (projectId: string, batch: string): ProjectDetail['requirements'] => {
  const baseRequirements = [
    {
      id: `${projectId}_req_1`,
      index: 1,
      name: '申请表',
      description: '从报名系统导出后签字的申请表',
      status: 'missing' as const,
      constraint: { must: true, original: true, signed: true, stamped: true },
      candidates: [],
    },
    {
      id: `${projectId}_req_2`,
      index: 2,
      name: '本科成绩单',
      description: '加盖教务处公章的本科阶段成绩单',
      status: 'matched' as const,
      constraint: { must: true, stamped: true },
      matchedMaterialId: 'mat_1',
      matchedVersionId: 'v_1_2',
      matchedAt: new Date(),
      candidates: ['mat_1'],
    },
    {
      id: `${projectId}_req_3`,
      index: 3,
      name: '英语水平证明',
      description: '英语四六级、托福、雅思等成绩单',
      status: 'matched' as const,
      constraint: { must: true },
      matchedMaterialId: 'mat_2',
      matchedVersionId: 'v_2_1',
      matchedAt: new Date(),
      candidates: ['mat_2'],
    },
    {
      id: `${projectId}_req_4`,
      index: 4,
      name: '身份证复印件',
      description: '正反面复印件，有效期需覆盖入学后',
      status: 'matched' as const,
      constraint: { must: true },
      matchedMaterialId: 'mat_3',
      matchedVersionId: 'v_3_1',
      matchedAt: new Date(),
      candidates: ['mat_3', 'mat_4'],
    },
    {
      id: `${projectId}_req_5`,
      index: 5,
      name: '个人陈述',
      description: '约1500字，阐述学术兴趣、研究计划及申请理由',
      status: 'matched' as const,
      constraint: { must: true },
      matchedMaterialId: 'mat_8',
      matchedVersionId: 'v_8_3',
      matchedAt: new Date(),
      candidates: ['mat_8'],
    },
    {
      id: `${projectId}_req_6`,
      index: 6,
      name: '专家推荐信',
      description: '2封副教授及以上专家推荐信，需签字封口',
      status: 'matched' as const,
      constraint: { must: true, signed: true, original: true },
      matchedMaterialId: 'mat_10',
      matchedVersionId: 'v_10_1',
      matchedAt: new Date(),
      candidates: ['mat_10'],
    },
    {
      id: `${projectId}_req_7`,
      index: 7,
      name: '获奖证书',
      description: '竞赛获奖、奖学金等证书（不超过5项）',
      status: 'matched' as const,
      constraint: { must: false },
      matchedMaterialId: 'mat_5',
      matchedVersionId: 'v_5_1',
      matchedAt: new Date(),
      candidates: ['mat_5', 'mat_6'],
    },
    {
      id: `${projectId}_req_8`,
      index: 8,
      name: '学术成果证明',
      description: '已发表论文、专利等（不超过3项）',
      status: 'matched' as const,
      constraint: { must: false },
      matchedMaterialId: 'mat_7',
      matchedVersionId: 'v_7_1',
      matchedAt: new Date(),
      candidates: ['mat_7', 'mat_11'],
    },
    {
      id: `${projectId}_req_9`,
      index: 9,
      name: '简历',
      description: '中英文各一份',
      status: 'matched' as const,
      constraint: { must: true },
      matchedMaterialId: 'mat_9',
      matchedVersionId: 'v_9_2',
      matchedAt: new Date(),
      candidates: ['mat_9'],
    },
  ];
  
  // 根据不同批次调整
  if (batch === 'summer_camp') {
    return [
      ...baseRequirements.slice(0, 3),
      {
        id: `${projectId}_req_4`,
        index: 4,
        name: '学生证复印件',
        description: '在读证明或学生证复印件',
        status: 'matched' as const,
        constraint: { must: true },
        matchedMaterialId: 'mat_4',
        matchedVersionId: 'v_4_1',
        matchedAt: new Date(),
        candidates: ['mat_4'],
      },
      ...baseRequirements.slice(3),
    ];
  }
  
  return baseRequirements;
};

// 获取原始清单文本
const getRawRequirements = (batch: string): string => {
  if (batch === 'summer_camp') {
    return `2024年某高校计算机系优秀大学生夏令营报名通知

一、报名条件
1. 全国重点大学计算机及相关专业本科三年级学生（2025届毕业生）
2. 本科前5学期总评成绩排名在专业前15%
3. 英语水平良好

二、报名材料
请按以下顺序整理材料并合成单个PDF文件：
1. 申请表（从报名系统导出后签字）
2. 本科成绩单（加盖教务处公章）
3. 英语四六级或托福雅思成绩单
4. 学生证复印件（在读证明）
5. 个人陈述（约1500字）
6. 专家推荐信2封（副教授及以上，需签字封口）
7. 获奖证书（不超过5项）
8. 学术成果证明：已发表论文或专利（不超过3项）
9. 简历（中英文各一份）

三、注意事项
- 所有材料需为PDF格式，单个文件不超过10MB
- 成绩单必须为原件扫描件，清晰可辨
- 获奖证书和论文需提供原件或复印件

四、截止日期
2024年7月15日17:00`;
  }
  
  return `2025年预推免报名材料清单

一、基本材料
1. 报名信息表
2. 身份证正反面复印件
3. 学生证复印件

二、成绩材料
4. 本科成绩单原件（需盖章）
5. 排名证明

三、英语材料
6. 英语成绩证明（四六级/托福/雅思）

四、申请文书
7. 个人简历
8. 个人陈述
9. 专家推荐信（2封）

五、附加材料
10. 获奖证书
11. 论文发表证明`;
};

// 根据类型获取材料名称
export const getMaterialTypeName = (type: MaterialType): string => {
  const typeMap: Record<MaterialType, string> = {
    transcript: '成绩单',
    english: '英语成绩',
    id_card: '身份证明',
    competition: '竞赛证书',
    paper: '论文',
    patent: '专利',
    recommendation: '推荐信',
    personal_statement: '个人陈述',
    resume: '简历',
    other: '其他材料',
  };
  return typeMap[type];
};

// 根据类型获取颜色
export const getMaterialTypeColor = (type: MaterialType): string => {
  const colorMap: Record<MaterialType, string> = {
    transcript: '#3B82F6',
    english: '#10B981',
    id_card: '#8B5CF6',
    competition: '#F59E0B',
    paper: '#EC4899',
    patent: '#6366F1',
    recommendation: '#14B8A6',
    personal_statement: '#F97316',
    other: '#6B7280',
  };
  return colorMap[type];
};
