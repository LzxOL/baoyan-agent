'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Wand2, Check, AlertCircle, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, FUNCTIONS_URL } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Application, RequirementItem, MaterialMatch, Material } from '@/types';

interface Props {
  application: Application;
  onBack: () => void;
}

export default function ApplicationWorkspace({ application, onBack }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<RequirementItem[]>([]);
  const [matches, setMatches] = useState<Record<string, MaterialMatch[]>>({});
  const [materials, setMaterials] = useState<Material[]>([]);
  const [requirementsText, setRequirementsText] = useState(application.requirements_text || '');
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [application.id]);

  async function loadData() {
    const { data: itemsData } = await supabase
      .from('requirement_items')
      .select('*')
      .eq('application_id', application.id)
      .order('item_number');
    if (itemsData) setItems(itemsData);

    const { data: materialsData } = await supabase
      .from('materials')
      .select('*')
      .eq('user_id', user!.id);
    if (materialsData) setMaterials(materialsData);

    if (itemsData) {
      const matchMap: Record<string, MaterialMatch[]> = {};
      for (const item of itemsData) {
        const { data: matchData } = await supabase
          .from('material_matches')
          .select('*')
          .eq('requirement_item_id', item.id)
          .order('confidence_score', { ascending: false });
        if (matchData) {
          matchMap[item.id] = matchData.map((m: any) => ({
            ...m,
            material: materialsData?.find((mat: Material) => mat.id === m.material_id)
          }));
        }
      }
      setMatches(matchMap);
    }
  }

  async function parseRequirements() {
    if (!requirementsText.trim()) return;
    setParsing(true);

    try {
      await supabase
        .from('applications')
        .update({ requirements_text: requirementsText })
        .eq('id', application.id);

      await supabase.from('requirement_items').delete().eq('application_id', application.id);

      const res = await fetch(`${FUNCTIONS_URL}/parse-requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          requirementsText,
          applicationId: application.id,
        }),
      });

      const result = await res.json();
      if (result.data) {
        setItems(result.data);
        setMatches({});
      }
    } finally {
      setParsing(false);
    }
  }

  async function matchAllItems() {
    if (items.length === 0 || materials.length === 0) return;
    setMatching(true);

    try {
      const newMatches: Record<string, MaterialMatch[]> = {};

      for (const item of items) {
        await supabase.from('material_matches').delete().eq('requirement_item_id', item.id);

        const res = await fetch(`${FUNCTIONS_URL}/match-materials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            requirementItemId: item.id,
            userId: user!.id,
          }),
        });

        const result = await res.json();
        if (result.data?.matches) {
          newMatches[item.id] = result.data.matches;
        }
      }

      setMatches(newMatches);

      await supabase
        .from('applications')
        .update({ status: 'in_progress' })
        .eq('id', application.id);
    } finally {
      setMatching(false);
    }
  }

  async function confirmMatch(itemId: string, matchId: string) {
    await supabase
      .from('material_matches')
      .update({ is_confirmed: true })
      .eq('id', matchId);

    await supabase
      .from('material_matches')
      .update({ is_confirmed: false })
      .eq('requirement_item_id', itemId)
      .neq('id', matchId);

    setMatches(prev => ({
      ...prev,
      [itemId]: prev[itemId]?.map(m => ({
        ...m,
        is_confirmed: m.id === matchId,
      })),
    }));

    await supabase
      .from('requirement_items')
      .update({ status: 'confirmed' })
      .eq('id', itemId);
  }

  async function generatePDF() {
    setGenerating(true);
    try {
      const confirmedMaterials: string[] = [];
      for (const item of items) {
        const itemMatches = matches[item.id] || [];
        const confirmed = itemMatches.find(m => m.is_confirmed);
        if (confirmed?.material?.file_path) {
          confirmedMaterials.push(confirmed.material.file_path);
        }
      }

      if (confirmedMaterials.length === 0) {
        alert('请先确认至少一份材料');
        return;
      }

      const message = `已选择 ${confirmedMaterials.length} 份材料。\n\n请手动下载以下文件后使用PDF合并工具合并：\n\n${confirmedMaterials.join('\n')}`;

      if (confirm(message + '\n\n是否打开第一份材料？')) {
        window.open(confirmedMaterials[0], '_blank');
      }

      await supabase
        .from('applications')
        .update({ status: 'completed' })
        .eq('id', application.id);

    } finally {
      setGenerating(false);
    }
  }

  const getItemStatus = (item: RequirementItem) => {
    const itemMatches = matches[item.id] || [];
    const hasConfirmed = itemMatches.some(m => m.is_confirmed);

    if (hasConfirmed) return { text: '已确认', color: 'bg-green-100 text-green-700' };
    if (itemMatches.length > 0) return { text: '待确认', color: 'bg-yellow-100 text-yellow-700' };
    return { text: '待匹配', color: 'bg-gray-100 text-gray-600' };
  };

  const confirmedCount = items.filter(item => matches[item.id]?.some(m => m.is_confirmed)).length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{application.university}</h1>
          <p className="text-gray-500">{application.college} - {application.program}</p>
        </div>
        <button
          onClick={generatePDF}
          disabled={confirmedCount === 0 || generating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          {generating ? '生成中...' : '生成PDF'}
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">完成进度</span>
          <span className="text-sm text-gray-500">{confirmedCount} / {items.length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: items.length ? `${(confirmedCount / items.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-lg font-semibold mb-4">清单解析</h2>
          <textarea
            value={requirementsText}
            onChange={e => setRequirementsText(e.target.value)}
            placeholder="粘贴招生简章中的材料清单要求..."
            className="w-full h-48 px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={parseRequirements}
              disabled={!requirementsText.trim() || parsing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Wand2 className="w-5 h-5" />
              {parsing ? '解析中...' : '智能解析'}
            </button>
            <button
              onClick={matchAllItems}
              disabled={items.length === 0 || matching}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${matching ? 'animate-spin' : ''}`} />
              {matching ? '匹配中...' : '一键匹配'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-lg font-semibold mb-4">材料库状态</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-3xl font-bold text-indigo-600">{materials.length}</p>
              <p className="text-sm text-gray-600">已上传材料</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{confirmedCount}</p>
              <p className="text-sm text-gray-600">已确认匹配</p>
            </div>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">清单条目 ({items.length})</h2>
          </div>
          <div className="divide-y">
            {items.map(item => {
              const status = getItemStatus(item);
              const itemMatches = matches[item.id] || [];
              const isExpanded = expandedItem === item.id;

              return (
                <div key={item.id}>
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium">
                      {item.item_number}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.item_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                          {status.text}
                        </span>
                        {item.is_required && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">必需</span>
                        )}
                        {item.constraints?.needStamp && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">需盖章</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pl-16">
                      {itemMatches.length === 0 ? (
                        <p className="text-gray-500 text-sm">暂无匹配材料，请点击"一键匹配"</p>
                      ) : (
                        <div className="space-y-2">
                          {itemMatches.map(match => (
                            <div
                              key={match.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                match.is_confirmed ? 'border-green-500 bg-green-50' : 'border-gray-200'
                              }`}
                            >
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {match.material?.filename || '未知文件'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  置信度: {(match.confidence_score * 100).toFixed(0)}% - {match.match_reason}
                                </p>
                              </div>
                              {match.is_confirmed ? (
                                <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg">已确认</span>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); confirmMatch(item.id, match.id); }}
                                  className="px-3 py-1 border border-indigo-600 text-indigo-600 text-sm rounded-lg hover:bg-indigo-50"
                                >
                                  确认
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
