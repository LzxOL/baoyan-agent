'use client';

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface CoverInfo {
  studentName: string;
  applicationMajor: string;
  undergraduateSchool: string;
  graduationMajor: string;
  contactInfo: string;
  email: string;
}

interface CoverInfoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (info: CoverInfo) => void;
  initialData?: Partial<CoverInfo>;
}

export default function CoverInfoForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = {}
}: CoverInfoFormProps) {
  const [formData, setFormData] = useState<CoverInfo>({
    studentName: initialData?.studentName || '',
    applicationMajor: initialData?.applicationMajor || '',
    undergraduateSchool: initialData?.undergraduateSchool || '',
    graduationMajor: initialData?.graduationMajor || '',
    contactInfo: initialData?.contactInfo || '',
    email: initialData?.email || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof CoverInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <Sparkles className="w-5 h-5" />
            <span>生成封面信息</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-slate-600 mb-4">
            请填写封面所需的信息，这些信息将用于生成PDF封面页。
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                学生姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="请输入学生姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                申请专业 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.applicationMajor}
                onChange={(e) => handleInputChange('applicationMajor', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="请输入申请专业"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                本科院校 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.undergraduateSchool}
                onChange={(e) => handleInputChange('undergraduateSchool', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="请输入本科院校名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                毕业专业 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.graduationMajor}
                onChange={(e) => handleInputChange('graduationMajor', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="请输入毕业专业"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                联系方式
              </label>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="请输入联系方式"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="请输入邮箱地址"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
            >
              生成封面
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
