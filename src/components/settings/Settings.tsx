'use client';

import { useState } from 'react';
import {
  User,
  Bell,
  HardDrive,
  Shield,
  HelpCircle,
  Info,
  Moon,
  Sun,
  Globe,
  Mail,
  Smartphone,
  Save,
  Trash2,
  Download,
  Upload,
  ChevronRight,
} from 'lucide-react';

type SettingsSection = 'profile' | 'notifications' | 'storage' | 'about';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [darkMode, setDarkMode] = useState(false);

  // 用户信息
  const [profile, setProfile] = useState({
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '138****8888',
    university: 'XX大学',
    major: '计算机科学与技术',
    grade: '2021级',
  });

  // 通知设置
  const [notifications, setNotifications] = useState({
    deadlineReminder: true,
    materialMatch: true,
    systemUpdate: false,
    emailNotify: true,
    smsNotify: false,
  });

  const sections = [
    { id: 'profile', label: '个人信息', icon: User },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'storage', label: '存储管理', icon: HardDrive },
    { id: 'about', label: '关于', icon: Info },
  ] as const;

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">姓名</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">电子邮箱</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">手机号码</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">所在院校</label>
                  <input
                    type="text"
                    value={profile.university}
                    onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">专业</label>
                  <input
                    type="text"
                    value={profile.major}
                    onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">年级</label>
                  <input
                    type="text"
                    value={profile.grade}
                    onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <button className="btn-primary">
                <Save className="w-4 h-4" />
                保存更改
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">通知偏好</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">截止日期提醒</p>
                      <p className="text-sm text-slate-500">在报名截止前收到提醒通知</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.deadlineReminder}
                      onChange={(e) =>
                        setNotifications({ ...notifications, deadlineReminder: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">材料匹配通知</p>
                      <p className="text-sm text-slate-500">当材料匹配成功时收到通知</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.materialMatch}
                      onChange={(e) =>
                        setNotifications({ ...notifications, materialMatch: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">系统更新通知</p>
                      <p className="text-sm text-slate-500">接收新功能和更新通知</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.systemUpdate}
                      onChange={(e) =>
                        setNotifications({ ...notifications, systemUpdate: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">通知方式</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">邮件通知</p>
                      <p className="text-sm text-slate-500">通过邮件接收重要通知</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotify}
                      onChange={(e) =>
                        setNotifications({ ...notifications, emailNotify: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">短信通知</p>
                      <p className="text-sm text-slate-500">通过短信接收紧急通知</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.smsNotify}
                      onChange={(e) =>
                        setNotifications({ ...notifications, smsNotify: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">存储使用情况</h3>
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                      <HardDrive className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">256 MB</p>
                      <p className="text-sm text-slate-500">已使用 1 GB 存储空间</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">总容量</p>
                    <p className="text-lg font-semibold text-slate-900">1 GB</p>
                  </div>
                </div>
                <div className="progress-bar h-3">
                  <div className="progress-bar-fill" style={{ width: '25%' }} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">文件管理</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4 hover:shadow-card-hover transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Download className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">导出全部材料</p>
                      <p className="text-sm text-slate-500">下载所有材料到本地</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="card p-4 hover:shadow-card-hover transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">导入材料</p>
                      <p className="text-sm text-slate-500">从其他平台导入</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="card p-4 hover:shadow-card-hover transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">清理缓存</p>
                      <p className="text-sm text-slate-500">释放存储空间</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="card p-4 hover:shadow-card-hover transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-600">删除全部数据</p>
                      <p className="text-sm text-slate-500">此操作不可恢复</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">保研智囊</h2>
              <p className="text-slate-500 mt-2">版本 1.0.0</p>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">产品介绍</h3>
              <p className="text-slate-600 leading-relaxed">
                保研智囊是一款面向保研人群的智能材料管理平台。我们致力于帮助学生更高效地管理、保研材料，
                通过智能匹配和一键合成功能，让保研报名变得更加轻松便捷。
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">功能特性</h3>
              <div className="space-y-3">
                {[
                  '材料库管理：集中存储、分类管理、版本控制',
                  '智能匹配：AI 自动解析招生要求并匹配合适材料',
                  '一键合成：按要求顺序自动合并生成 PDF',
                  '进度追踪：实时查看各项目准备进度',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">联系我们</h3>
              <div className="space-y-3">
                <p className="text-slate-600">
                  <span className="font-medium">邮箱：</span>
                  support@baoyan.cn
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">反馈：</span>
                  如果您有任何建议或问题，欢迎随时与我们联系
                </p>
              </div>
            </div>

            <div className="text-center text-sm text-slate-400">
              <p>© 2024 保研智囊. 保留所有权利。</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex gap-6">
      {/* 左侧导航 */}
      <div className="w-64 flex-shrink-0">
        <div className="card p-4 sticky top-6">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as SettingsSection)}
                  className={`w-full sidebar-item ${
                    activeSection === section.id ? 'sidebar-item-active' : 'sidebar-item-inactive'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 右侧内容 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl">
          {/* 页面标题 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              {sections.find((s) => s.id === activeSection)?.label}
            </h1>
          </div>

          {/* 内容区域 */}
          <div className="card p-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
