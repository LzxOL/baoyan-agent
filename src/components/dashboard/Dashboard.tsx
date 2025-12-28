'use client';

import { useAppStore } from '@/store/useAppStore';
import {
  FileText,
  FolderKanban,
  Clock,
  CheckCircle2,
  FileOutput,
  ArrowRight,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { format, isAfter, isBefore, addDays, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';

export default function Dashboard() {
  const { materials, projects, notifications } = useAppStore();

  // 计算统计数据
  const totalMaterials = materials.reduce(
    (sum, mat) => sum + mat.versions.length,
    0
  );
  const activeProjects = projects.filter(
    (p) => p.status !== 'submitted' && p.status !== 'rejected'
  ).length;
  const upcomingDeadlines = projects.filter((p) => {
    if (!p.deadline) return false;
    const deadline = new Date(p.deadline);
    const soon = addDays(new Date(), 7);
    return isAfter(deadline, new Date()) && isBefore(deadline, soon);
  }).length;
  const completedProjects = projects.filter(
    (p) => p.status === 'submitted'
  ).length;

  // 获取最近项目
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  // 获取即将截止的项目
  const urgentProjects = [...projects]
    .filter((p) => p.deadline && isBefore(new Date(p.deadline), addDays(new Date(), 14)))
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);

  const stats = [
    {
      label: '材料版本总数',
      value: totalMaterials,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: '进行中项目',
      value: activeProjects,
      icon: FolderKanban,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: '即将截止',
      value: upcomingDeadlines,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      label: '已完成报名',
      value: completedProjects,
      icon: CheckCircle2,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
  ];

  const getBatchLabel = (batch: string) => {
    switch (batch) {
      case 'summer_camp':
        return '夏令营';
      case 'pre_apply':
        return '预推免';
      case 'formal_apply':
        return '正式推免';
      default:
        return batch;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'preparation':
        return { label: '准备中', class: 'badge-gray' };
      case 'filling':
        return { label: '填报中', class: 'badge-primary' };
      case 'ready':
        return { label: '已就绪', class: 'badge-success' };
      case 'submitted':
        return { label: '已提交', class: 'badge-success' };
      case 'rejected':
        return { label: '被拒绝', class: 'badge-danger' };
      default:
        return { label: status, class: 'badge-gray' };
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
          <p className="text-slate-500 mt-1">欢迎回来，查看您的保研进度</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(), 'yyyy年M月d日', { locale: zhCN })}</span>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 快捷操作与即将截止 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 即将截止的项目 */}
        <div className="card">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-slate-900">即将截止</h2>
              </div>
              <Link
                href="#projects"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {urgentProjects.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">暂无即将截止的项目</p>
              </div>
            ) : (
              urgentProjects.map((project) => (
                <Link
                  key={project.id}
                  href="#projects"
                  className="block p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{project.name}</p>
                      <p className="text-sm text-slate-500">{project.department}</p>
                    </div>
                    <div className="text-right">
                      <span className="badge-warning">
                        {format(new Date(project.deadline!), 'MM月dd日', { locale: zhCN })}
                      </span>
                      <p className="text-xs text-amber-600 mt-1">
                        {formatDistanceToNow(new Date(project.deadline!), {
                          locale: zhCN,
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="card">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h2 className="font-semibold text-slate-900">最近项目</h2>
              </div>
              <Link
                href="#projects"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {recentProjects.length === 0 ? (
              <div className="text-center py-6">
                <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">暂无项目，开始创建吧</p>
              </div>
            ) : (
              recentProjects.map((project) => {
                const status = getStatusLabel(project.status);
                return (
                  <Link
                    key={project.id}
                    href="#projects"
                    className="block p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{project.name}</p>
                        <p className="text-sm text-slate-500">{project.department}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          {getBatchLabel(project.batch)}
                        </span>
                        <span className={status.class}>{status.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 材料概览 */}
      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileOutput className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-slate-900">材料库概览</h2>
            </div>
            <Link
              href="#library"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              管理材料
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { type: 'transcript', name: '成绩单', count: 0 },
              { type: 'english', name: '英语成绩', count: 0 },
              { type: 'id_card', name: '身份证明', count: 0 },
              { type: 'competition', name: '竞赛证书', count: 0 },
              { type: 'paper', name: '学术成果', count: 0 },
            ].map((item) => {
              const count = materials.filter((m) => m.type === item.type).length;
              return (
                <div
                  key={item.type}
                  className="text-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
