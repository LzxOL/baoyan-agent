export interface Material {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  file_url?: string;
  title?: string;
  file_type: string;
  file_size?: number;
  storage_path?: string;
  category?: string;
  tags: string[];
  metadata: Record<string, any>;
  version: number;
  is_default: boolean;
  parent_id?: string; // 版本关联
  uploaded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  university: string;
  college?: string;
  program?: string;
  batch_type?: string;
  requirements_text?: string;
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface RequirementItem {
  id: string;
  application_id: string;
  item_number: number;
  item_name: string;
  is_required: boolean;
  constraints: {
    needStamp?: boolean;
    needSignature?: boolean;
    needOriginal?: boolean;
    copies?: number;
  };
  status: 'pending' | 'matched' | 'confirmed' | 'missing';
  created_at: string;
}

export interface MaterialMatch {
  id: string;
  requirement_item_id: string;
  material_id: string;
  confidence_score: number;
  match_reason: string;
  is_confirmed: boolean;
  created_at: string;
  material?: Material;
}

export const MATERIAL_CATEGORIES = [
  { value: 'transcript', label: '成绩单' },
  { value: 'english', label: '英语水平证明' },
  { value: 'identity', label: '身份证明' },
  { value: 'certificate', label: '竞赛证书' },
  { value: 'paper', label: '论文' },
  { value: 'recommendation', label: '推荐信' },
  { value: 'personal', label: '个人陈述' },
  { value: 'photo', label: '证件照' },
  { value: 'other', label: '其他' },
];

// Legacy types for compatibility
export type MaterialType =
  | 'transcript'
  | 'english'
  | 'id_card'
  | 'competition'
  | 'paper'
  | 'patent'
  | 'recommendation'
  | 'personal_statement'
  | 'resume'
  | 'other';

export type ProjectStatus =
  | 'preparation'
  | 'filling'
  | 'ready'
  | 'submitted'
  | 'rejected';

export type ProjectBatch =
  | 'summer_camp'
  | 'pre_apply'
  | 'formal_apply';

export interface Project {
  id: string;
  userId: string;
  name: string;
  department: string;
  batch: ProjectBatch;
  status: ProjectStatus;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export type RequirementStatus =
  | 'missing'
  | 'matched'
  | 'pending'
  | 'optional';

export interface RequirementConstraint {
  must: boolean;
  original?: boolean;
  stamped?: boolean;
  signed?: boolean;
  colorPrint?: boolean;
  format?: string;
  sizeLimit?: number;
}

export interface RequirementItemLegacy {
  id: string;
  projectId: string;
  index: number;
  name: string;
  description?: string;
  status: RequirementStatus;
  constraint: RequirementConstraint;
  matchedMaterialId?: string;
  matchedVersionId?: string;
  candidates: string[];
  matchedAt?: Date;
  notes?: string;
}

export interface ProjectDetail extends Project {
  rawRequirements?: string;
  requirements: RequirementItemLegacy[];
}

export interface MergeTask {
  id: string;
  projectId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface UserStats {
  totalMaterials: number;
  totalProjects: number;
  upcomingDeadlines: number;
  completedApplications: number;
  totalPdfGenerated: number;
}

export type NotificationType =
  | 'deadline'
  | 'update'
  | 'match'
  | 'missing'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface Category {
  id: string;
  user_id: string;
  value: string;  // unique identifier (e.g., 'custom_category')
  label: string;  // display name (e.g., 'Custom Category')
  created_at: string;
  updated_at: string;
}
