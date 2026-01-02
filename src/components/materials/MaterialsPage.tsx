'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Plus, Search, FileText, Image as ImageIcon, Eye, Download, 
  Trash2, ChevronRight, MoreVertical, Loader2,
  FolderOpen, X, Move, Sparkles, Edit2,
  GripHorizontal, ArrowRightLeft, FileWarning, RotateCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { Material, MATERIAL_CATEGORIES, Category } from '@/types';
import MaterialUpload from './MaterialUpload';
import CoverInfoForm from './CoverInfoForm';
import { PDFDocument } from 'pdf-lib';

// --- Types 定义 ---

// 画布项
interface CanvasItem {
  id: string;         // 画布上唯一的实例 ID
  materialId: string; // 关联的原始材料 ID
  missingLabel?: string; // 如果为缺失占位（UI 展示用）
  rotation?: number; // rotation degrees
}

// --- 组件：右键/更多菜单 (Context Menu) ---
function ContextMenu({ 
  isOpen, 
  onClose, 
  position, 
  actions 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  position: { top: number; left: number };
  actions: { label: string; icon: any; onClick: () => void; danger?: boolean }[];
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部自动关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-[100] w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-100 py-1.5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden ring-1 ring-slate-900/5"
    >
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={(e) => { e.stopPropagation(); action.onClick(); onClose(); }}
          className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors 
            ${action.danger 
              ? 'text-red-600 hover:bg-red-50' 
              : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'}
          `}
        >
          <action.icon className={`w-4 h-4 ${action.danger ? 'text-red-500' : 'text-slate-400'}`} />
          <span className="font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// --- 主页面组件 ---
export default function MaterialsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // --- 1. 数据状态 ---
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- 2. UI 交互状态 ---
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string | undefined>(undefined);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['transcript', 'english']));
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  
  // 菜单状态
  const [menuState, setMenuState] = useState<{ 
    isOpen: boolean; 
    id: string | null; 
    top: number; 
    left: number; 
    type?: 'file' | 'category' 
  }>({ isOpen: false, id: null, top: 0, left: 0, type: undefined });

  // PDF 生成状态
  const [generatingPdf, setGeneratingPdf] = useState(false);
  // iframe 加载状态
  const [iframeLoadingMap, setIframeLoadingMap] = useState<Record<string, boolean>>({});
  // 封面信息表单状态
  const [showCoverForm, setShowCoverForm] = useState(false);
  const [coverInfo, setCoverInfo] = useState<any>(null);
  // 本地分类列表
  type CategoryItem = { value: string; label: string };
  const [categories, setCategories] = useState<CategoryItem[]>(() => MATERIAL_CATEGORIES.slice());
  const [parsing, setParsing] = useState(false);

  // --- 3. 画布状态 ---
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  // 用于画布内排序的拖拽源索引
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  // candidate matches for placeholders
  const [candidatesMap, setCandidatesMap] = useState<Record<string, Array<{ id: string; score?: number }>>>({});

  // 替换面板状态
  const [replaceState, setReplaceState] = useState<{ isOpen: boolean; itemId?: string | null; top: number; left: number }>({ isOpen: false, itemId: null, top: 0, left: 0 });
  const { selectedProjectId, selectProject } = useAppStore();
  // drag preview & placeholder helpers
  const [draggingPreviewId, setDraggingPreviewId] = useState<string | null>(null);
  const [dragPreviewPos, setDragPreviewPos] = useState<{ x: number; y: number } | null>(null);
  // placeholder drag/hover/upload helpers
  const [hoverPlaceholderId, setHoverPlaceholderId] = useState<string | null>(null);
  const [uploadForPlaceholderId, setUploadForPlaceholderId] = useState<string | null>(null);
  
  // --- 4. Agent 输入状态 ---
  const [agentInput, setAgentInput] = useState('');

  // --- 初始化加载数据 ---
  useEffect(() => {
    async function load() {
      if (!user) {
        // when logged out, ensure page refresh so other components update
        setMaterials([]);
        setCustomCategories([]);
        setLoading(false);
        try { router.refresh(); } catch (e) {}
        return;
      }
      setLoading(true);

      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (!materialsError && materialsData) setMaterials(materialsData);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!categoriesError && categoriesData) setCustomCategories(categoriesData);

      setLoading(false);
      // Ensure other parts of the app (server components / caches) refresh after login
      try { router.refresh(); } catch (e) {}
    }
    load();
  }, [user]);

  // Listen for global auth changes triggered from Header or other places
  useEffect(() => {
    const handler = () => {
      try { router.refresh(); } catch {}
      // also reload client-side data
      (async () => {
        setLoading(true);
        try {
          if (user?.id) {
            const { data: materialsData } = await supabase
              .from('materials')
              .select('*')
              .eq('user_id', user.id)
              .order('uploaded_at', { ascending: false });
            if (materialsData) setMaterials(materialsData);
            const { data: categoriesData } = await supabase
              .from('categories')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            if (categoriesData) setCustomCategories(categoriesData);
          } else {
            setMaterials([]);
            setCustomCategories([]);
          }
        } catch (e) {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    };
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, [user]);

  // Expose debug helpers
  useEffect(() => {
    try {
      (window as any)._supabase = supabase;
    } catch (e) {}
  }, []);

  // Remember previous project id to save canvas before switching
  const prevProjectRef = useRef<string | null>(null);
  const canvasRef = useRef<CanvasItem[]>([]);
  useEffect(() => { canvasRef.current = canvasItems; }, [canvasItems]);
  // in-memory cache per project
  const canvasCacheRef = useRef<Record<string, CanvasItem[]>>({});

  // 保存状态提示（toast）
  const [saveStatus, setSaveStatus] = useState<{ status: 'idle' | 'saving' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  // 立即保存 canvas 到 DB 或 localStorage
  const saveCanvasImmediate = async (items: CanvasItem[], projectId?: string) => {
    setSaveStatus({ status: 'saving', message: '正在保存画布...' });
    try {
      const pid = projectId || selectedProjectId;
      if (user?.id && pid) {
        try {
          const { data: existing, error: existErr } = await supabase
            .from('project_canvases')
            .select('id')
            .eq('project_id', pid)
            .maybeSingle();
          
          if (existing && existing.id) {
            const { error: updErr } = await supabase
              .from('project_canvases')
              .update({ canvas: items })
              .eq('project_id', pid);
            if (updErr) throw updErr;
          } else {
            const { error: insErr } = await supabase
              .from('project_canvases')
              .insert({ project_id: pid, canvas: items, user_id: user.id }); // Added user_id here as per previous fix
            if (insErr) {
               // retry update if duplicate
               const { error: updErr2 } = await supabase
                  .from('project_canvases')
                  .update({ canvas: items })
                  .eq('project_id', pid);
               if (updErr2) throw updErr2;
            }
          }
        } catch (err: any) {
           throw err;
        }
      } else if (projectId || selectedProjectId) {
        const pid = projectId || selectedProjectId;
        try { localStorage.setItem(`baoyan_canvas_${pid}`, JSON.stringify(items)); } catch {}
      }
      
      try {
        const pid = projectId ?? selectedProjectId;
        if (pid) canvasCacheRef.current[pid] = JSON.parse(JSON.stringify(items));
      } catch {}
      setSaveStatus({ status: 'success', message: '画布已保存' });
      setTimeout(() => setSaveStatus({ status: 'idle' }), 1200);
      return { ok: true };
    } catch (e: any) {
      console.error('saveCanvasImmediate failed', e);
      try { if (selectedProjectId) localStorage.setItem(`baoyan_canvas_${selectedProjectId}`, JSON.stringify(items)); } catch {}
      setSaveStatus({ status: 'error', message: '保存失败，已回退到本地' });
      setTimeout(() => setSaveStatus({ status: 'idle' }), 2000);
      return { ok: false, error: e };
    }
  };

  // 设置画布并立即保存
  const setAndSaveCanvas = (updater: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[]), projectId?: string) => {
    setCanvasItems(prev => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      // de-duplicate
      const seen = new Set<string>();
      const unique = [];
      for (const it of next) {
        if (!it || !it.id) continue;
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        unique.push(it);
      }
      canvasRef.current = unique;
      try {
        const pid = projectId ?? selectedProjectId;
        if (pid) canvasCacheRef.current[pid] = JSON.parse(JSON.stringify(unique));
      } catch {}
      saveCanvasImmediate(unique, projectId).catch(() => {});
      return unique;
    });
  };

  // Load per-project canvas
  useEffect(() => {
    (async () => {
      try {
        const prev = prevProjectRef.current;
        if (prev && prev !== selectedProjectId) {
          try {
            await saveCanvasImmediate(canvasRef.current, prev);
          } catch (e) {
            try { localStorage.setItem(`baoyan_canvas_${prev}`, JSON.stringify(canvasRef.current)); } catch {}
          }
        }

        if (!selectedProjectId) {
          setCanvasItems([]);
          prevProjectRef.current = null;
          return;
        }

        let loaded: CanvasItem[] | null = null;
        try { if (selectedProjectId && canvasCacheRef.current[selectedProjectId]) loaded = canvasCacheRef.current[selectedProjectId]; } catch {}

        if (loaded) setCanvasItems(JSON.parse(JSON.stringify(loaded)));

        let dbLoaded: CanvasItem[] | null = null;
        if (user?.id) {
          try {
            const { data, error } = await supabase
              .from('project_canvases')
              .select('canvas')
              .eq('project_id', selectedProjectId)
              .maybeSingle();
            if (!error && data?.canvas && Array.isArray(data.canvas)) {
              dbLoaded = data.canvas;
            } else if (!error && data && data.canvas === null) {
              dbLoaded = [];
            }
          } catch (e) { /* ignore */ }
        }

        if (!dbLoaded) {
          try {
            const key = `baoyan_canvas_${selectedProjectId}`;
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) dbLoaded = parsed;
            }
          } catch (e) { /* ignore */ }
        }

        if (dbLoaded) {
           setCanvasItems(dbLoaded);
           if (selectedProjectId) canvasCacheRef.current[selectedProjectId] = dbLoaded;
        }

        prevProjectRef.current = selectedProjectId;
      } catch (e) {
        setCanvasItems([]);
      }
    })();
  }, [selectedProjectId, user]);

  // Listen for external save requests
  useEffect(() => {
    const handler = (e: any) => {
      const resolver = e?.detail?.resolve;
      (async () => {
        try {
          if (!selectedProjectId) {
            resolver && resolver({ ok: true });
            return;
          }
          const result = await saveCanvasImmediate(canvasRef.current);
          if (result && result.ok) {
            resolver && resolver({ ok: true });
          } else {
            resolver && resolver({ ok: false, error: result?.error });
          }
        } catch (err) {
          try { localStorage.setItem(`baoyan_canvas_${selectedProjectId}`, JSON.stringify(canvasRef.current)); } catch {}
          resolver && resolver({ ok: false, error: err });
        }
      })();
    };
    window.addEventListener('requestCanvasSave', handler as EventListener);
    return () => window.removeEventListener('requestCanvasSave', handler as EventListener);
  }, [selectedProjectId, user]);

  // Unmount save
  useEffect(() => {
    return () => {
      (async () => {
        try {
          if (prevProjectRef.current) {
            await saveCanvasImmediate(canvasItems, prevProjectRef.current);
          }
        } catch (e) {}
      })();
    };
  }, []);

  // expose materials
  useEffect(() => {
    try { (window as any)._materials = materials; } catch {}
  }, [materials]);

  // ==========================
  // 逻辑模块 A: 侧边栏拖拽
  // ==========================
  const handleDragStartFromSidebar = (e: React.DragEvent, materialId: string) => {
    e.dataTransfer.setData('type', 'sidebar-item');
    e.dataTransfer.setData('materialId', materialId);
    e.dataTransfer.effectAllowed = 'copy';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    setDraggingPreviewId(materialId);
    const onDragOverDoc = (ev: DragEvent) => {
      ev.preventDefault();
      setDragPreviewPos({ x: ev.clientX + 12, y: ev.clientY + 12 });
    };
    const onDragEndDoc = () => {
      setDraggingPreviewId(null);
      setDragPreviewPos(null);
      document.removeEventListener('dragover', onDragOverDoc);
      document.removeEventListener('dragend', onDragEndDoc);
    };
    document.addEventListener('dragover', onDragOverDoc);
    document.addEventListener('dragend', onDragEndDoc);
  };

  const handleDropOnCanvasContainer = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (type === 'sidebar-item') {
      const materialId = e.dataTransfer.getData('materialId');
      if (!materialId) return;
      const exists = materials.find(m => m.id === materialId);
      if (!exists) return;
      const pid = selectedProjectId;
      addCanvasItem(materialId, pid ?? undefined);
    }
  };

  const handlePlaceholderDrop = async (e: React.DragEvent, placeholderId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (type === 'sidebar-item') {
      const matId = e.dataTransfer.getData('materialId');
      if (matId) {
        replaceCanvasItemWith(placeholderId, matId);
        setHoverPlaceholderId(null);
        return;
      }
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadForPlaceholderId(placeholderId);
      setShowUpload(true);
    }
    setHoverPlaceholderId(null);
  };

  const addCanvasItem = (materialId: string, projectId?: string) => {
    const id = `${materialId}-${Date.now()}`;
    setAndSaveCanvas(prev => {
      if (prev.some(p => p.id === id)) return prev;
      return [...prev, { id, materialId, rotation: 0 }];
    }, projectId);
    setIframeLoadingMap(prev => ({ ...prev, [id]: true }));
  };

  const addPlaceholderItem = (label: string, candidates?: Array<{ id: string; score?: number }>, projectId?: string) => {
    const id = `missing-${label.replace(/\s+/g,'_')}-${Date.now()}`;
    setAndSaveCanvas(prev => [...prev, { id, materialId: id, missingLabel: label }], projectId);
    if (candidates && candidates.length > 0) {
      setCandidatesMap(prev => ({ ...prev, [id]: candidates }));
    }
  };

  const acceptCandidate = (placeholderId: string, materialId: string, projectId?: string) => {
    const pid = projectId ?? selectedProjectId;
    setAndSaveCanvas(prev => prev.map(it => it.id === placeholderId ? { id: `${materialId}-${Date.now()}`, materialId } : it), pid ?? undefined);
    setCandidatesMap(prev => {
      const next = { ...prev };
      delete next[placeholderId];
      return next;
    });
  };

  // 简单的关键词匹配
  const parseRequiredItems = (text: string): { label: string; category: string }[] => {
    const lower = text.toLowerCase();
    const items: { label: string; category: string }[] = [];
    const patterns: Array<{ re: RegExp; category: string; label: string }> = [
      { re: /报名表|报名/, category: 'personal', label: '报名表/申请表' },
      { re: /成绩单|transcript|成绩/, category: 'transcript', label: '本科成绩单' },
      { re: /总评成绩|排名|排名证明/, category: 'transcript', label: '成绩排名证明' },
      { re: /外语|托福|雅思|四级|六级|cet|toefl/, category: 'english', label: '外语水平证明' },
      { re: /论文|paper|publication/, category: 'paper', label: '学术论文/出版物' },
      { re: /推荐信|recommend/, category: 'recommendation', label: '推荐信' },
      { re: /证书|获奖|award/, category: 'certificate', label: '证书/获奖证明' },
      { re: /身份证|id card|身份证明/, category: 'identity', label: '身份证明' },
      { re: /照片|证件照|photo/, category: 'photo', label: '证件照' },
    ];

    const numberedRe = /\(?\d+\)?[^\n;，。)]+/g;
    const numberedMatches: string[] = [];
    let mm: RegExpExecArray | null;
    while ((mm = numberedRe.exec(text)) !== null) {
      numberedMatches.push(mm[0]);
    }
    if (numberedMatches.length > 0) {
      for (const seg of numberedMatches) {
        let matched = false;
        for (const p of patterns) {
          if (p.re.test(seg)) {
            items.push({ label: p.label, category: p.category });
            matched = true;
            break;
          }
        }
        if (!matched) items.push({ label: seg.trim(), category: 'other' });
      }
      return items;
    }

    for (const p of patterns) {
      if (p.re.test(lower)) items.push({ label: p.label, category: p.category });
    }
    if (items.length === 0 && /材料|materials/.test(lower)) {
      const parts = text.split(/[,;；，。]/).map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        let matched = false;
        for (const p of patterns) {
          if (p.re.test(part)) { items.push({ label: p.label, category: p.category }); matched = true; break; }
        }
        if (!matched) items.push({ label: part, category: 'other' });
      }
    }
    return items;
  };

  // Agent 主流程
  const agentArrangeFromText = async (text: string) => {
    if (!text || !text.trim()) return;
    setParsing(true);
    const currentProject = selectedProjectId;
    try {
      const resp = await fetch('/api/agent/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) throw new Error('API Error');

      const json = await resp.json();
      let required: { label: string; category: string }[] = (json && Array.isArray(json.items) ? json.items : null) || parseRequiredItems(text);
      if (!Array.isArray(required) || required.length === 0) {
        required = parseRequiredItems(text);
      }

      if (!required || required.length === 0) {
        alert('未识别到明确的材料项，请尝试更详细的描述。');
        return;
      }

      let matchesFromLLM: any = null;
      try {
        const matchResp = await fetch((window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000/match' : (process.env.NEXT_PUBLIC_PY_MATCH_URL || 'http://127.0.0.1:8000/match')), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: required, materials: materials.map(m => ({ id: m.id, filename: m.filename, category: m.category, tags: m.tags })) }),
        });
        if (matchResp.ok) matchesFromLLM = await matchResp.json();
        if (matchesFromLLM && !matchesFromLLM.matches && Array.isArray(matchesFromLLM)) {
            matchesFromLLM = { matches: matchesFromLLM };
        }
      } catch (e) {
        console.warn('match call failed', e);
      }

      for (const req of required) {
        let cat = String(req.category || '').toLowerCase();
        let label = String(req.label || '').trim();
        label = label.replace(/^[\s\u3000]*[（(]?\d+[）)]?[\s\.\)]*/, '').trim();

        if (!cat || cat === 'other') {
          const inferred = parseRequiredItems(label);
          if (inferred && inferred.length > 0) {
            cat = inferred[0].category || cat;
            label = inferred[0].label || label;
          }
        }

        const labelTokens = label.toLowerCase().split(/[^a-z0-9\u4e00-\u9fff]+/).filter(Boolean);
        
        const scores: Array<{ id: string; score: number; mat: Material }> = [];
        for (const m of materials) {
          let score = 0;
          const mcat = (m.category || '').toLowerCase();
          const fname = (m.filename || '').toLowerCase();
          const tags = (m.tags || []).map((t: any) => String(t).toLowerCase());
          
          if (cat && mcat === cat) score += 5; 
          if (cat && mcat && mcat.includes(cat)) score += 2;
          for (const t of labelTokens) {
            if (t.length <= 1) continue;
            if (fname.includes(t)) score += 3;
            if (tags.some(tt => tt.includes(t))) score += 2;
          }
          const first = labelTokens[0] || '';
          if (first && fname.startsWith(first)) score += 2;

          scores.push({ id: m.id, score, mat: m });
        }

        scores.sort((a, b) => b.score - a.score);
        
        let used = false;
        if (matchesFromLLM && Array.isArray(matchesFromLLM.matches)) {
          const idx = required.indexOf(req);
          const matchEntry = matchesFromLLM.matches[idx] || matchesFromLLM.matches.find((x:any) => x.item_label === req.label);
            if (matchEntry && Array.isArray(matchEntry.candidates) && matchEntry.candidates.length > 0) {
            const top = matchEntry.candidates[0];
            if (top && top.id) {
              const foundMat = materials.find(m => m.id === top.id);
              if (foundMat) {
                addCanvasItem(foundMat.id, currentProject ?? undefined);
                used = true;
              }
            }
          }
        }
        if (!used) {
          const best = scores[0];
          if (best && best.score > 0) {
            addCanvasItem(best.mat.id, currentProject ?? undefined);
          } else {
            let candidateList: Array<{ id: string; score?: number }> | undefined = undefined;
            if (matchesFromLLM && Array.isArray(matchesFromLLM.matches)) {
              const idx = required.indexOf(req);
              const matchEntry = matchesFromLLM.matches[idx];
              if (matchEntry && Array.isArray(matchEntry.candidates) && matchEntry.candidates.length > 0) {
                candidateList = matchEntry.candidates.map((c: any) => ({ id: c.id, score: c.score }));
              }
            }
            addPlaceholderItem(label || cat, candidateList, currentProject ?? undefined);
          }
        }
      }
    } catch (e: any) {
      console.error('agent parse failed', e);
      alert('解析服务暂时不可用，请手动整理。');
    } finally {
      setParsing(false);
    }
  };

  // ==========================
  // 逻辑模块 B: 画布内排序
  // ==========================
  const handleCanvasItemDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('type', 'canvas-sort');
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemIndex(index);
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; 
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleCanvasItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newItems = [...canvasItems];
    const item = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, item);
    setAndSaveCanvas(newItems);
    setDraggedItemIndex(index);
  };

  const handleCanvasItemDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const removeCanvasItemById = (itemId: string) => {
    setAndSaveCanvas(prev => prev.filter(i => i.id !== itemId));
    setIframeLoadingMap(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  // Replace panel functions
  const openReplacePanel = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setReplaceState({ isOpen: true, itemId, top: rect.bottom + 6, left: rect.left });
  };

  const closeReplacePanel = () => {
    setReplaceState({ isOpen: false, itemId: null, top: 0, left: 0 });
  };

  const replaceCanvasItemWith = (placeholderId: string, newMaterialId: string) => {
    const pid = selectedProjectId;
    setAndSaveCanvas(prev => prev.map(it => it.id === placeholderId ? { id: `${newMaterialId}-${Date.now()}`, materialId: newMaterialId } : it), pid ?? undefined);
    setCandidatesMap(prev => {
      const next = { ...prev };
      delete next[placeholderId];
      return next;
    });
    closeReplacePanel();
  };

  // ==========================
  // 逻辑模块 C: 文件与分类操作
  // ==========================
  const tryRemoveStoragePath = async (path?: string) => {
    if (!path) return false;
    const candidatesSet = new Set<string>();
    candidatesSet.add(path);
    try { candidatesSet.add(decodeURIComponent(path)); } catch {}
    if (path.startsWith('/')) candidatesSet.add(path.slice(1));
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash > 0) candidatesSet.add(path.slice(lastSlash + 1));

    const candidates = Array.from(candidatesSet);
    for (const p of candidates) {
      if (!p) continue;
      try {
        const { error } = await supabase.storage.from('agent-materials').remove([p]);
        if (!error) return true;
      } catch {}
    }
    return false;
  };

  const handleRename = async (id: string) => {
    if (!user) return alert('请先登录');
    const m = materials.find(x => x.id === id);
    if (!m) return;
    const newName = prompt("请输入新的文件名", m.filename);
    if (newName && newName !== m.filename) {
        await supabase.from('materials').update({ filename: newName }).eq('id', id);
        setMaterials(prev => prev.map(x => x.id === id ? { ...x, filename: newName || x.filename } : x));
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return alert('请先登录');
    if (!confirm('确定要删除此文件吗？')) return;
    const mat = materials.find(m => m.id === id);
    let path = mat?.storage_path;
    if (!path && mat?.file_path) {
        try { path = decodeURIComponent(new URL(mat.file_path).pathname.split('/object/public/')[1]); } catch {}
    }
    if (path) await tryRemoveStoragePath(path);
    await supabase.from('materials').delete().eq('id', id);
    setMaterials(prev => prev.filter(m => m.id !== id));
    setAndSaveCanvas(prev => prev.filter(i => i.materialId !== id));
  };

  const renameCategory = async (catValue: string) => {
    if (!user) return alert('请登录');
    const name = prompt('新名称:', catValue);
    if (!name?.trim()) return;
    const custom = customCategories.find(c => c.value === catValue);
    if (custom) {
        await supabase.from('categories').update({ label: name.trim() }).eq('id', custom.id);
        setCustomCategories(p => p.map(c => c.id === custom.id ? { ...c, label: name.trim() } : c));
    } else {
        await supabase.from('materials').update({ category: name.trim() }).eq('category', catValue).eq('user_id', user.id);
        setMaterials(p => p.map(m => m.category === catValue ? { ...m, category: name.trim() } : m));
    }
    setMenuState(p => ({ ...p, isOpen: false }));
  };

  const deleteCategory = async (catValue: string) => {
    if (!user) return alert('请登录');
    if (!confirm('确认删除分类及所有文件？')) return;
    const { data: mats } = await supabase.from('materials').select('storage_path,file_path').eq('category', catValue).eq('user_id', user.id);
    if (mats) {
        for (const m of mats) {
            let p = m.storage_path;
            if(!p && m.file_path) try { p = decodeURIComponent(new URL(m.file_path).pathname.split('/object/public/')[1]); } catch {}
            if(p) await tryRemoveStoragePath(p);
        }
    }
    await supabase.from('materials').delete().eq('category', catValue).eq('user_id', user.id);
    const custom = customCategories.find(c => c.value === catValue);
    if(custom) {
        await supabase.from('categories').delete().eq('id', custom.id);
        setCustomCategories(p => p.filter(c => c.id !== custom.id));
    }
    setMaterials(p => p.filter(m => m.category !== catValue));
    setMenuState(p => ({ ...p, isOpen: false }));
  };

  // ==========================
  // 逻辑模块 D: PDF 合成
  // ==========================
  const handleGeneratePDF = async () => {
    if (generatingPdf) return;
    // 如果还没有封面信息，显示表单
    if (!coverInfo) {
      setShowCoverForm(true);
      return;
    }
    await generatePDFWithCover();
  };

  const generatePDFWithCover = async () => {
    setGeneratingPdf(true);
    try {
      const entries = canvasItems.map(i => ({ item: i, mat: materials.find(m => m.id === i.materialId) })).filter(e => e.mat) as { item: CanvasItem; mat: Material }[];
      if (entries.length === 0) throw new Error('画布无有效文件');

      // 1. 生成封面PDF
      let coverPdfBytes: Uint8Array | null = null;
      if (coverInfo) {
        try {
          const coverResponse = await fetch('/api/generate-cover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(coverInfo),
          });
          if (coverResponse.ok) {
            coverPdfBytes = new Uint8Array(await coverResponse.arrayBuffer());
          } else {
            console.warn('封面生成失败:', await coverResponse.text());
          }
        } catch (e) {
          console.warn('封面生成失败:', e);
        }
      }

      // 2. 合并所有PDF
      const doc = await PDFDocument.create();

      // 如果有封面，先添加封面
      if (coverPdfBytes) {
        const coverDoc = await PDFDocument.load(coverPdfBytes);
        const coverPages = await doc.copyPages(coverDoc, coverDoc.getPageIndices());
        coverPages.forEach(p => doc.addPage(p));
      }

      // 添加画布中的其他文件
      for (const entry of entries) {
        const m = entry.mat;
        const rotation = entry.item.rotation || 0;
        try {
            const buf = await fetch(m.file_path).then(r => r.arrayBuffer());
            if (m.file_type.includes('pdf')) {
                const src = await PDFDocument.load(buf);
                const copied = await doc.copyPages(src, src.getPageIndices());
                copied.forEach(p => {
                  doc.addPage(p);
                  try { (p as any).setRotation?.(rotation); } catch {}
                });
            } else {
                const img = m.file_type.includes('png') ? await doc.embedPng(buf) : await doc.embedJpg(buf);
                const p = doc.addPage();
                const { width, height } = p.getSize();
                const s = Math.min(width / img.width, height / img.height);
                p.drawImage(img, { x: (width - img.width * s) / 2, y: (height - img.height * s) / 2, width: img.width * s, height: img.height * s });
                try { (p as any).setRotation?.(rotation); } catch {}
            }
        } catch (e) { console.warn('Item fail', m.filename, e); }
      }
      const pdfBytes = await doc.save();
      const uint8 = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes as any);
      const blob = new Blob([uint8], { type: 'application/pdf' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `merged_${Date.now()}.pdf`; a.click();
    } catch (e: any) { alert(e.message); }
    finally { setGeneratingPdf(false); }
  };

  // ==========================
  // 逻辑模块 E: Agent 触发 (简化版)
  // ==========================
  const handleSubmitAgent = async () => {
    if (!agentInput.trim()) return;
    const text = agentInput;
    setAgentInput('');
    await agentArrangeFromText(text);
  };

  // ==========================
  // 逻辑模块 F: 封面生成
  // ==========================
  const handleCoverFormSubmit = async (info: any) => {
    setCoverInfo(info);
    setShowCoverForm(false);
    // 自动开始PDF生成
    await generatePDFWithCover();
  };

  // ==========================
  // Render
  // ==========================
  const allCats = [...MATERIAL_CATEGORIES, ...customCategories.map(c => ({ value: c.value, label: c.label }))];
  const visibleCats = allCats.filter(c => materials.some(m => (m.category || 'other') === c.value) || customCategories.some(cc => cc.value === c.value));

  return (
    <div className="h-screen bg-[#F0F4F8] text-slate-800 font-sans flex overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. Sidebar (Materials) */}
      <aside className="w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-lg shadow-slate-200/50">
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100/80 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 font-bold text-lg text-slate-800 tracking-tight">
            <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
              <FolderOpen className="w-5 h-5" />
            </div>
            <span>材料库</span>
          </div>
          <button
            onClick={async () => {
              if (!user) return alert('请先登录');
              const name = prompt('请输入新分类名称：');
              if (!name?.trim()) return;
              const value = name.trim().toLowerCase().replace(/[^\w]+/g, '_') + '_' + Date.now();
              const { error } = await supabase.from('categories').insert({ user_id: user.id, value, label: name.trim() });
              if(error) alert(error.message);
              else { window.location.reload(); }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="新建分类"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {loading && <div className="p-4 text-center text-slate-400 text-xs flex flex-col items-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/>加载中...</div>}
          {!loading && visibleCats.map((cat: { value: string; label: string }) => {
            const items = materials.filter(m => (m.category || 'other') === cat.value);
            const open = expandedCategories.has(cat.value);
            return (
              <div key={cat.value} className="select-none">
                <div 
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
                    ${open ? 'bg-slate-100/80 text-slate-900' : 'hover:bg-slate-50 text-slate-600'}
                  `}
                  onClick={() => setExpandedCategories(prev => { const n = new Set(prev); n.has(cat.value) ? n.delete(cat.value) : n.add(cat.value); return n; })}
                >
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-90 text-indigo-500' : ''}`} />
                  <span className="font-medium text-sm flex-1 truncate">{cat.label}</span>
                  <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded-full min-w-[1.5rem] text-center shadow-sm">{items.length}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setUploadCategory(cat.value); setShowUpload(true); }} className="p-1 hover:bg-white text-indigo-600 rounded shadow-sm border border-transparent hover:border-slate-100 transition-all" title="上传到此分类"><Plus className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setMenuState({ isOpen: true, id: cat.value, top: rect.bottom + 5, left: rect.left, type: 'category' }); }} className="p-1 hover:bg-white text-slate-500 rounded shadow-sm border border-transparent hover:border-slate-100 transition-all"><MoreVertical className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                   <div className="pl-3 space-y-1 ml-3 border-l border-slate-200">
                    {items.length === 0 && <div className="text-xs text-slate-400 pl-4 py-2 italic">此分类为空</div>}
                    {items.map(m => (
                      <div 
                        key={m.id}
                        draggable
                        onDragStart={(e) => handleDragStartFromSidebar(e, m.id)}
                        onMouseEnter={() => setHoveredFileId(m.id)}
                        onMouseLeave={() => setHoveredFileId(null)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing border border-transparent transition-all
                          ${hoveredFileId === m.id || menuState.id === m.id ? 'bg-white shadow-sm border-slate-100' : 'hover:bg-slate-50'}
                        `}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-1.5 rounded-md ${m.file_type.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                             {m.file_type.includes('pdf') ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                          </div>
                          <span className="text-sm truncate text-slate-700 font-medium">{m.filename}</span>
                        </div>
                        <button
                          className={`p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all 
                            ${menuState.id === m.id || hoveredFileId === m.id ? 'opacity-100' : 'opacity-0'}
                          `}
                          onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setMenuState({ isOpen: true, id: m.id, top: rect.bottom + 5, left: rect.left }); }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <div className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-widest flex items-center justify-center gap-2">
               <GripHorizontal className="w-3 h-3"/> 拖拽文件至右侧画布
            </div>
        </div>
      </aside>

      {/* 2. Main Content (Canvas + Agent Panel) */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* A. Canvas */}
        <div className="flex-1 relative bg-[#F0F4F8] flex flex-col overflow-hidden">
           
           {/* Canvas Toolbar */}
           <div className="flex-none h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md z-20 border-b border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-slate-500">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">PDF Workspace</span>
                 </div>
                 <div className="w-px h-4 bg-slate-300"></div>
                 <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{canvasItems.length} 页文档</span>
              </div>
              <button
                 onClick={handleGeneratePDF}
                 disabled={generatingPdf}
                 className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-medium hover:-translate-y-0.5"
               >
                 {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                 <span>{generatingPdf ? '正在合并...' : '生成 PDF'}</span>
               </button>
           </div>

           {/* The Grid Canvas Container */}
           <div 
             className="flex-1 w-full overflow-y-auto p-8"
             onDragOver={(e) => e.preventDefault()}
             onDrop={handleDropOnCanvasContainer}
             style={{ 
               backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)', 
               backgroundSize: '24px 24px' 
             }}
           >
              {canvasItems.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-500">
                   <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center mb-6 bg-slate-50/50 shadow-inner">
                      <Move className="w-10 h-10 text-slate-300" />
                   </div>
                   <p className="text-lg font-medium text-slate-500">工作台空空如也</p>
                   <p className="text-sm text-slate-400 mt-2">从左侧拖入文件，或在下方使用 AI 自动抓取</p>
                </div>
              )}

              {/* Grid Layout */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-8 content-start pb-20">
                {canvasItems.map((item, index) => {
                  const material = materials.find(m => m.id === item.materialId);
                  
                  // --- 缺失占位符渲染 (红色虚线框) ---
                  if (!material && item.missingLabel) {
                    const candidates = candidatesMap[item.id] || [];
                    return (
                      <div
                        key={item.id}
                      className={`relative flex flex-col bg-red-50/30 backdrop-blur-sm rounded-2xl shadow-sm border-2 border-dashed border-red-300 h-[240px] group hover:border-red-400 transition-all hover:shadow-md animate-in fade-in zoom-in-95 duration-300 ${hoverPlaceholderId === item.id ? 'scale-105 ring-2 ring-indigo-300' : ''}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => { e.preventDefault(); setHoverPlaceholderId(item.id); }}
                      onDragLeave={(e) => { e.preventDefault(); setHoverPlaceholderId(prev => prev === item.id ? null : prev); }}
                      onDrop={(e) => handlePlaceholderDrop(e, item.id)}
                      >
                        <div className="h-9 flex items-center justify-between px-3 border-b border-red-100/50 bg-red-100/50 rounded-t-2xl">
                           <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs truncate max-w-[100px]">
                             <FileWarning className="w-3.5 h-3.5" />
                             <span title={item.missingLabel}>缺: {item.missingLabel}</span>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); removeCanvasItemById(item.id); }} 
                             className="text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full p-1 transition-colors"
                           >
                             <X className="w-3.5 h-3.5"/>
                           </button>
                        </div>
                        
                        {/* 候选推荐列表 */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                           {candidates.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-[10px] text-slate-400 text-center p-2">
                               <Search className="w-6 h-6 mb-2 opacity-50" />
                               <span>暂无推荐文件</span>
                               <span className="opacity-50 mt-1">请手动拖入或上传</span>
                             </div>
                           ) : (
                             candidates.map(c => {
                               const m = materials.find(x => x.id === c.id);
                               if (!m) return null;
                               return (
                                 <div 
                                   key={c.id} 
                                   className="bg-white p-2 rounded-lg border border-slate-100 hover:border-indigo-300 hover:shadow-md hover:ring-1 hover:ring-indigo-300 transition-all group/candidate cursor-pointer" 
                                   onClick={() => acceptCandidate(item.id, c.id)}
                                 >
                                    <div className="flex items-center gap-2 mb-1.5">
                                       {m.file_type.includes('pdf') ? <FileText className="w-3.5 h-3.5 text-red-500"/> : <ImageIcon className="w-3.5 h-3.5 text-blue-500"/>}
                                       <div className="text-[11px] font-medium truncate flex-1 text-slate-700" title={m.filename}>{m.filename}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                       <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 rounded-full">匹配度 {c.score}</span>
                                       <span className="text-[10px] text-white bg-indigo-600 px-2 py-0.5 rounded-full font-medium opacity-0 group-hover/candidate:opacity-100 transition-all shadow-sm">使用</span>
                                    </div>
                                 </div>
                               );
                             })
                           )}
                        </div>
                      </div>
                    );
                  }

                  if (!material) return null;

                  // --- 正常文件卡片渲染 ---
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleCanvasItemDragStart(e, index)}
                      onDragOver={(e) => handleCanvasItemDragOver(e, index)}
                      onDragEnd={handleCanvasItemDragEnd}
                      className={`
                        relative flex flex-col bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 cursor-move transition-all duration-300 active:scale-[1.02] h-[240px] group hover:-translate-y-1
                        ${draggedItemIndex === index ? 'opacity-30 scale-95 grayscale' : 'opacity-100'}
                      `}
                    >
                      {/* 序号 Badge */}
                      <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-white z-30 pointer-events-none transition-transform group-hover:scale-110">
                        {index + 1}
                      </div>
                      
                      {/* 顶部操作栏 */}
                  <div className="h-9 bg-white/90 backdrop-blur-sm rounded-t-2xl border-b border-slate-100 flex items-center justify-between px-2.5 relative z-20">
                        <GripHorizontal className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={(e) => openReplacePanel(e, item.id)}
                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded p-1 transition-colors"
                                title="替换文件"
                            >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setCanvasItems(prev => prev.map(ci => ci.id === item.id ? { ...ci, rotation: ((ci.rotation || 0) + 90) } : ci)); }}
                                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded p-1 transition-colors"
                                title="旋转"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onPointerDown={(e) => e.stopPropagation()} 
                                onClick={(e) => { e.stopPropagation(); removeCanvasItemById(item.id); }} 
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded p-1 transition-colors"
                                title="移除"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                      </div>

                      {/* 内容缩略图 */}
                      <div className="flex-1 bg-slate-50 overflow-hidden relative group-hover:bg-slate-100 transition-colors">
                         <div className="absolute inset-0 z-20 bg-transparent"></div>
                        {material.file_type.includes('pdf') ? (
                          <div className="w-[200%] h-[200%] origin-top-left transform scale-50 bg-white relative shadow-inner" style={{ transform: `scale(0.5) rotate(${item.rotation || 0}deg)` }}>
                            {iframeLoadingMap[item.id] && (
                              <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                              </div>
                            )}
                            <iframe 
                              src={`${material.file_path}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                              className="w-full h-full border-none pointer-events-none select-none opacity-90 group-hover:opacity-100 transition-opacity"
                              tabIndex={-1}
                              title="preview"
                              onLoad={() => setIframeLoadingMap(prev => ({ ...prev, [item.id]: false }))}
                            />
                          </div>
                        ) : (
                          <img 
                            src={material.file_path} 
                            className="w-full h-full object-cover select-none pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity" 
                            alt="" 
                            style={{ transform: `rotate(${item.rotation || 0}deg)` }}
                          />
                        )}
                      </div>

                      {/* 底部文件名 */}
                      <div className="h-10 px-3 flex items-center bg-white rounded-b-2xl border-t border-slate-50">
                        <div className="text-xs font-medium text-slate-700 truncate w-full" title={material.filename}>
                          {material.filename}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>
        </div>

        {/* B. Agent Parsing Area (New Compact UI) */}
        <div className="bg-white border-t border-slate-200 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] shrink-0">
          <div className="max-w-4xl mx-auto w-full p-5 flex flex-col gap-3">
             {/* Header Label */}
             <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                   <Sparkles className="w-4 h-4" />
                   <span>智能提取</span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Powered by LLM</span>
             </div>

             {/* Input Area */}
             <div className="relative group">
                <textarea
                  value={agentInput}
                  onChange={e => setAgentInput(e.target.value)}
                  placeholder="在此粘贴招生简章中的「申请材料清单」文本..."
                  rows={3}
                  className="w-full pl-4 pr-32 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm shadow-sm placeholder:text-slate-400 resize-none group-hover:bg-white group-hover:shadow-md"
                />
                <button
                  onClick={handleSubmitAgent}
                  disabled={parsing || !agentInput.trim()}
                  className={`absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm
                    ${parsing || !agentInput.trim()
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-200'
                    }`}
                >
                  {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>自动抓取</span>
                </button>
             </div>
          </div>
        </div>

      </main>

      {/* --- 替换选择面板 (Replace Panel) --- */}
      {replaceState.isOpen && replaceState.itemId && (
        <>
            <div className="fixed inset-0 z-[105]" onClick={closeReplacePanel}></div>
            <div 
                style={{ top: replaceState.top, left: replaceState.left }} 
                className="fixed z-[110] w-72 max-h-80 bg-white rounded-xl shadow-2xl ring-1 ring-slate-900/10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
            >
                <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">选择替换文件</span>
                    <button onClick={closeReplacePanel} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5"/></button>
                </div>
                <div className="overflow-y-auto p-2 space-y-3 custom-scrollbar flex-1">
                    {visibleCats.map((cat: { value: string; label: string }) => {
                        const items = materials.filter(m => (m.category || 'other') === cat.value);
                        if (items.length === 0) return null;
                        return (
                            <div key={cat.value}>
                                <div className="text-[10px] text-indigo-500 font-bold mb-1.5 px-2 uppercase">{cat.label}</div>
                                <div className="space-y-1">
                                    {items.map(it => (
                                        <button 
                                            key={it.id} 
                                            onClick={() => replaceCanvasItemWith(replaceState.itemId as string, it.id)} 
                                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 flex items-center gap-2 group transition-colors"
                                        >
                                            <ArrowRightLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-xs font-medium truncate flex-1">{it.filename}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
      )}

      {/* --- 全局模态框 --- */}
      <ContextMenu 
        isOpen={menuState.isOpen} 
        position={{ top: menuState.top, left: menuState.left }} 
        onClose={() => setMenuState(p=>({...p,isOpen:false}))} 
        actions={
          menuState.type === 'category'
          ? [
              { label: '重命名分类', icon: Edit2, onClick: () => { if(menuState.id) renameCategory(menuState.id); } },
              { label: '删除分类', icon: Trash2, onClick: () => { if(menuState.id) deleteCategory(menuState.id); }, danger: true }
            ]
          : [
              { label: '预览文件', icon: Eye, onClick: () => { const m = materials.find(x => x.id === menuState.id); if(m) setPreviewMaterial(m); } },
              { label: '重命名', icon: Edit2, onClick: () => { if(menuState.id) handleRename(menuState.id); } },
              { label: '删除文件', icon: Trash2, onClick: () => { if(menuState.id) handleDelete(menuState.id); }, danger: true }
            ]
        }
      />
      {showUpload && <MaterialUpload initialCategory={uploadCategory} onUploadComplete={(m) => {
        setMaterials(prev => [m, ...prev]);
        if (uploadForPlaceholderId) {
          replaceCanvasItemWith(uploadForPlaceholderId, m.id);
          setUploadForPlaceholderId(null);
        }
      }} onClose={() => { setShowUpload(false); setUploadForPlaceholderId(null); }} />}
      {previewMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-in fade-in duration-200" onClick={() => setPreviewMaterial(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${previewMaterial.file_type.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                     {previewMaterial.file_type.includes('pdf') ? <FileText className="w-5 h-5"/> : <ImageIcon className="w-5 h-5"/>}
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{previewMaterial.filename}</h3>
               </div>
               <button onClick={() => setPreviewMaterial(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6"/></button>
             </div>
             <div className="flex-1 bg-slate-50 p-8 flex justify-center items-start overflow-auto">
                {previewMaterial.file_type.includes('pdf') ? (
                  <iframe src={previewMaterial.file_path} className="w-full h-full bg-white shadow-xl rounded-xl max-w-5xl" />
                ) : (
                  <img src={previewMaterial.file_path} className="max-w-full max-h-full object-contain shadow-xl rounded-xl" alt="" />
                )}
             </div>
          </div>
        </div>
      )}
      {draggingPreviewId && dragPreviewPos && (() => {
        const mat = materials.find(m => m.id === draggingPreviewId);
        return (
          <div style={{ position: 'fixed', left: dragPreviewPos.x, top: dragPreviewPos.y, zIndex: 9999, pointerEvents: 'none' }} className="w-40 p-2 rounded-lg bg-white shadow-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${mat?.file_type?.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-sm text-slate-700 truncate">{mat?.filename || '文件'}</div>
            </div>
          </div>
        );
      })(      )}

      {/* 封面信息表单 */}
      <CoverInfoForm
        isOpen={showCoverForm}
        onClose={() => setShowCoverForm(false)}
        onSubmit={handleCoverFormSubmit}
        initialData={coverInfo}
      />

      {/* Save toast */}
      {saveStatus.status !== 'idle' && (
        <div className="fixed right-6 bottom-6 z-[120]">
          <div className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${saveStatus.status === 'saving' ? 'bg-yellow-50 text-yellow-800' : saveStatus.status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {saveStatus.message || (saveStatus.status === 'saving' ? '正在保存...' : saveStatus.status === 'success' ? '保存成功' : '保存失败')}
          </div>
        </div>
      )}
    </div>
  );
}