'use client';
import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  Lock, Unlock, Pin, MoreHorizontal,
  Circle, CheckCircle2, Clock, Plus, X, Check, GripVertical, Calendar,
  Layers, ChevronUp, ChevronDown
} from 'lucide-react';
import { Project, ProjectTask, TaskStatus, ProjectPriority } from '@/shared/types/canvasflow';
import { getPriorityColor, calcProgress, getCardDimensions, formatRelativeTime, generateId } from '@/shared/lib/utils';
import { SelectField } from '@/components/ui/select';
import { CalendarPicker } from '@/components/ui/calendar-picker';

const TASK_STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'finished', label: 'Finished' },
];

const TASK_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Project>) => void;
  onDelete: () => void;
  zoom?: number; // canvas zoom level — needed to convert screen px → world px
}

type TabFilter = 'all' | TaskStatus;

const PRIORITY_LABELS: Record<ProjectPriority, string> = { low:'Low', medium:'Medium', high:'High', urgent:'Urgent' };
const PRIORITY_OPTIONS: ProjectPriority[] = ['low','medium','high','urgent'];
const STATUS_CYCLE: Record<TaskStatus,TaskStatus> = { todo:'ongoing', ongoing:'finished', finished:'todo' };
const TAB_CONFIG = [
  { key:'all'      as TabFilter, label:'All',   activeClass:'bg-slate-800 text-white' },
  { key:'todo'     as TabFilter, label:'Todo',  activeClass:'bg-slate-200 text-slate-700' },
  { key:'ongoing'  as TabFilter, label:'Doing', activeClass:'bg-blue-500 text-white' },
  { key:'finished' as TabFilter, label:'Done',  activeClass:'bg-emerald-500 text-white' },
];

function useDragReorder(tasks: ProjectTask[], onReorder: (t: ProjectTask[]) => void) {
  const fromIdx = useRef<number | null>(null);
  const toIdx = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const onDragStart = (idx: number, id: string) => { 
    fromIdx.current = idx; 
    setDraggingId(id); 
  };

  const onDragEnter = (idx: number, id: string) => { 
    toIdx.current = idx; 
    setOverId(id); 
  };

  const onDragEnd = () => {
    const from = fromIdx.current;
    const to = toIdx.current;
    if (from !== null && to !== null && from !== to) {
      const arr = [...tasks]; 
      const [item] = arr.splice(from, 1); 
      arr.splice(to, 0, item); 
      onReorder(arr);
    }
    fromIdx.current = null; 
    toIdx.current = null;
    setDraggingId(null); 
    setOverId(null);
  };

  return { onDragStart, onDragEnter, onDragEnd, draggingId, overId };
}

export function ProjectCard({ project, isSelected, onSelect, onUpdate, onDelete, zoom = 1 }: ProjectCardProps) {
  const cardRef       = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const dragState     = useRef<{ mx:number; my:number; px:number; py:number } | null>(null);
  const resizeState   = useRef<{ mx:number; my:number; w:number; h:number  } | null>(null);
  const moved         = useRef(false);

  const [editTitle,     setEditTitle]     = useState(false);
  const [editDesc,      setEditDesc]      = useState(false);
  const [titleVal,      setTitleVal]      = useState(project.title);
  const [descVal,       setDescVal]       = useState(project.description);
  const [newTaskTitle,  setNewTaskTitle]  = useState('');
  const [newTaskPri,    setNewTaskPri]    = useState<ProjectPriority>('medium');
  const [showPriPicker, setShowPriPicker] = useState(false);
  const [activeTab,     setActiveTab]     = useState<TabFilter>('all');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskVal, setEditingTaskVal] = useState('');

  const [isAnimating, setIsAnimating] = useState(false);
  const prevMinimized = useRef(project.minimized);

  useEffect(() => {
    if (prevMinimized.current !== project.minimized) {
      setIsAnimating(true);
      prevMinimized.current = project.minimized;
    }
  }, [project.minimized]);

  useEffect(() => { setTitleVal(project.title);       }, [project.title]);
  useEffect(() => { setDescVal(project.description);  }, [project.description]);

  const dims   = getCardDimensions(project.size, project.customSize);
  const colors = getPriorityColor(project.priority);
  const prog   = calcProgress(project.tasks);
  const todoCnt  = project.tasks.filter(t => t.status === 'todo').length;
  const doingCnt = project.tasks.filter(t => t.status === 'ongoing').length;
  const doneCnt  = project.tasks.filter(t => t.status === 'finished').length;
  const isSmall  = project.size === 'small' && !project.customSize;

  const filteredTasks = activeTab === 'all'
    ? project.tasks
    : project.tasks.filter(t => t.status === activeTab);

  /* ── Card move — via grip handle, screen delta ÷ zoom ──────────────── */
  const handleGripDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (project.pinned) return;
    e.stopPropagation(); e.preventDefault();
    moved.current = false;
    dragState.current = { mx: e.clientX, my: e.clientY, px: project.position.x, py: project.position.y };
    const handle = dragHandleRef.current!;
    handle.setPointerCapture(e.pointerId);
    function onMove(ev: PointerEvent) {
      if (!dragState.current) return;
      const dx = (ev.clientX - dragState.current.mx) / zoom;
      const dy = (ev.clientY - dragState.current.my) / zoom;
      if (!moved.current && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) moved.current = true;
      if (moved.current) onUpdate({ position: { x: dragState.current.px + dx, y: dragState.current.py + dy } });
    }
    function onUp() { dragState.current = null; handle.removeEventListener('pointermove', onMove); handle.removeEventListener('pointerup', onUp); }
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  }, [project.pinned, project.position, onUpdate, zoom]);

  /* ── Resize ─────────────────────────────────────────────────────────── */
  const handleResizeDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); e.preventDefault();
    resizeState.current = { mx: e.clientX, my: e.clientY, w: dims.width, h: dims.height };
    const el = e.currentTarget as HTMLDivElement;
    el.setPointerCapture(e.pointerId);
    function onMove(ev: PointerEvent) {
      if (!resizeState.current) return;
      onUpdate({ customSize: {
        width:  Math.max(300, resizeState.current.w + (ev.clientX - resizeState.current.mx) / zoom),
        height: Math.max(300, resizeState.current.h + (ev.clientY - resizeState.current.my) / zoom),
      }});
    }
    function onUp() { resizeState.current = null; el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerup', onUp); }
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  }, [dims, onUpdate, zoom]);

  const saveTitle = () => { if (titleVal.trim()) onUpdate({ title: titleVal.trim(), updatedAt: new Date().toISOString() }); else setTitleVal(project.title); setEditTitle(false); };
  const saveDesc  = () => { onUpdate({ description: descVal, updatedAt: new Date().toISOString() }); setEditDesc(false); };

  const saveTaskTitle = (taskId: string) => {
    const t = editingTaskVal.trim();
    if (t) {
      onUpdate({
        tasks: project.tasks.map(tk => tk.id === taskId ? { ...tk, title: t, updatedAt: new Date().toISOString() } : tk),
        updatedAt: new Date().toISOString()
      });
    }
    setEditingTaskId(null);
  };

  const addTask = () => {
    const t = newTaskTitle.trim(); if (!t) return;
    const now = new Date().toISOString();
    onUpdate({ tasks: [...project.tasks, { id: generateId(), title: t, status: 'todo', priority: newTaskPri, createdAt: now, updatedAt: now }], updatedAt: now });
    setNewTaskTitle('');
  };
  const cycleTask  = (id: string) => { const now = new Date().toISOString(); onUpdate({ tasks: project.tasks.map(t => t.id === id ? { ...t, status: STATUS_CYCLE[t.status], updatedAt: now } : t), updatedAt: now }); };
  const deleteTask = (id: string) => onUpdate({ tasks: project.tasks.filter(t => t.id !== id), updatedAt: new Date().toISOString() });

  const { onDragStart, onDragEnter, onDragEnd, draggingId, overId } =
    useDragReorder(project.tasks, tasks => onUpdate({ tasks, updatedAt: new Date().toISOString() }));
  const realIndexOf = (task: ProjectTask) => project.tasks.findIndex(t => t.id === task.id);
  const tabCount = (k: TabFilter) => k==='all' ? project.tasks.length : k==='todo' ? todoCnt : k==='ongoing' ? doingCnt : doneCnt;

  const headerStyles = {
    urgent: 'from-red-600 to-rose-700 border-red-700 text-white shadow-xs',
    high: 'from-orange-500 to-amber-600 border-orange-600 text-white shadow-xs',
    medium: 'from-indigo-600 to-blue-700 border-indigo-700 text-white shadow-xs',
    low: 'from-slate-700 to-slate-800 border-slate-800/80 text-white shadow-xs',
  };
  const headerStyle = headerStyles[project.priority] || headerStyles.medium;

  const transitionStyle = isAnimating
    ? { transition: 'height 250ms cubic-bezier(0.4, 0, 0.2, 1), background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1)' }
    : { transition: 'box-shadow 200ms, background-color 200ms, border-color 200ms' };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target === cardRef.current && e.propertyName === 'height') {
      setIsAnimating(false);
    }
  };

  return (
    <div
      ref={cardRef}
      data-card
      style={{
        position: 'absolute',
        left: project.position.x,
        top:  project.position.y,
        width:  dims.width,
        height: project.minimized ? 40 : dims.height,
        userSelect: 'none',
        overflow: (project.minimized || isAnimating) ? 'hidden' : 'visible',
        ...transitionStyle,
      }}
      className={`group flex flex-col rounded-[20px]
        ${project.minimized 
          ? `bg-gradient-to-r border ${headerStyle}` 
          : 'bg-white border border-slate-200'
        }
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 shadow-lg' : 'hover:shadow-md'}
      `}
      onClick={e => { if (!moved.current) { e.stopPropagation(); onSelect(); } }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* ── HEADER DRAG HANDLER (Shadcn card header style) ── */}
      <div
        ref={dragHandleRef}
        onPointerDown={handleGripDown}
        onDoubleClick={e => {
          const target = e.target as HTMLElement;
          if (!target.closest('button') && !target.closest('input')) {
            e.stopPropagation();
            onUpdate({ minimized: !project.minimized, updatedAt: new Date().toISOString() });
          }
        }}
        style={{ touchAction: 'none' }}
        className={`h-10 w-full px-3.5 flex items-center justify-between cursor-grab active:cursor-grabbing select-none flex-shrink-0
          ${project.minimized
            ? 'bg-transparent border-none rounded-[20px]'
            : `bg-gradient-to-r rounded-t-[20px] border-b ${headerStyle}`
          }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Layers size={14} className="text-white/80 flex-shrink-0" />
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            {editTitle ? (
              <input
                autoFocus
                value={titleVal}
                onChange={e => setTitleVal(e.target.value)}
                onBlur={saveTitle}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') {
                    setTitleVal(project.title);
                    setEditTitle(false);
                  }
                }}
                className="w-full bg-white/20 border border-white/10 rounded px-1.5 py-0.5 text-xs font-semibold outline-none text-white focus:bg-white/30 focus:border-white/30"
              />
            ) : (
              <span
                onDoubleClick={e => {
                  e.stopPropagation();
                  setEditTitle(true);
                }}
                title="Double-click to edit title"
                className="text-xs font-semibold text-white truncate leading-tight cursor-text hover:text-white/80 transition-colors"
              >
                {project.title || 'Project Board'}
              </span>
            )}
            {project.date && (
              <span className="text-[9px] text-white/70 font-semibold leading-none mt-0.5 truncate">
                {(() => {
                  const [y, m, d] = project.date.split('-');
                  if (y && m && d) {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
                  }
                  return project.date;
                })()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          <button
            onClick={e => {
              e.stopPropagation();
              onUpdate({ minimized: !project.minimized, updatedAt: new Date().toISOString() });
            }}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 text-white/70 hover:text-white cursor-pointer"
            title={project.minimized ? 'Expand Card' : 'Minimize Card'}
          >
            {project.minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded-lg hover:bg-red-500/80 transition-colors flex-shrink-0 text-white/70 hover:text-white cursor-pointer"
            title="Delete Card"
          >
            <X size={13} />
          </button>
        </div>
      </div>
      <div
        className="flex-1 flex flex-col min-h-0 transition-opacity duration-200"
        style={{
          opacity: project.minimized ? 0 : 1,
          pointerEvents: project.minimized ? 'none' : 'auto',
        }}
      >
          {/* Quick Add Task Row */}
          <div className="px-3.5 pt-3 pb-2.5 flex gap-1.5 items-center flex-shrink-0 border-b border-slate-100/60" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTask();
                }
              }}
              placeholder="Quick add task…"
              className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <SelectField
              value={newTaskPri}
              onChange={val => setNewTaskPri(val as ProjectPriority)}
              options={TASK_PRIORITY_OPTIONS}
              className="h-8 text-[10px] rounded-lg"
              wrapperClassName="w-20 flex-shrink-0"
            />
            <button
              onClick={addTask}
              className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
              title="Add task"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="flex flex-col gap-1 px-3.5 pt-3 flex-shrink-0">
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex-1 min-w-0">
                {!isSmall && (editDesc ? (
                  <textarea
                    autoFocus
                    value={descVal}
                    rows={2}
                    onChange={e => setDescVal(e.target.value)}
                    onBlur={saveDesc}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setDescVal(project.description);
                        setEditDesc(false);
                      }
                    }}
                    className="w-full text-xs bg-indigo-50 border border-indigo-300 rounded-md px-2 py-1 outline-none resize-none font-normal text-slate-700"
                  />
                ) : (
                  <p
                    className="text-xs text-slate-500 line-clamp-2 cursor-text hover:text-slate-600 font-normal"
                    onDoubleClick={e => {
                      e.stopPropagation();
                      setEditDesc(true);
                    }}
                    title="Double-click to edit description"
                  >
                    {project.description || <span className="italic text-slate-300">Add description…</span>}
                  </p>
                ))}
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="relative">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowPriPicker(v => !v);
                    }}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold hover:opacity-85 transition-all ${colors.badge}`}
                  >
                    <span className={`w-1 h-1 rounded-full ${colors.dot}`} />
                    {PRIORITY_LABELS[project.priority]}
                  </button>
                  {showPriPicker && (
                    <div
                      className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-100 py-1 w-24"
                      onClick={e => e.stopPropagation()}
                    >
                      {PRIORITY_OPTIONS.map(p => {
                        const c = getPriorityColor(p);
                        return (
                          <button
                            key={p}
                            onClick={e => {
                              e.stopPropagation();
                              onUpdate({ priority: p, updatedAt: new Date().toISOString() });
                              setShowPriPicker(false);
                            }}
                            className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] hover:bg-slate-50 text-left text-slate-700 font-medium"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} /> {PRIORITY_LABELS[p]}
                            {project.priority === p && <Check size={8} className="ml-auto text-indigo-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <CalendarPicker
                  value={project.date}
                  onChange={val => onUpdate({ date: val, updatedAt: new Date().toISOString() })}
                />
              </div>
            </div>
          </div>

          <div className="px-3.5 pt-2 flex flex-col gap-1 flex-shrink-0">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-350" style={{ width: `${prog}%` }} />
              </div>
              <span className="ml-2.5 flex-shrink-0">{prog}%</span>
            </div>
          </div>

          <div className="px-3.5 pt-3.5 flex items-center justify-between border-b border-slate-100/60 pb-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/20">
              {TAB_CONFIG.map(btn => (
                <button key={btn.key} onClick={() => setActiveTab(btn.key)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                    activeTab === btn.key ? btn.activeClass + ' shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}>
                  {btn.label}
                  <span className={`text-[9px] px-1 py-0.2 rounded-full ${activeTab === btn.key ? 'bg-white/20 text-inherit' : 'bg-slate-200 text-slate-500'}`}>
                    {tabCount(btn.key)}
                  </span>
                </button>
              ))}
            </div>
            {!isSmall && project.updatedAt && (
              <span className="text-[9px] text-slate-300 font-semibold">{formatRelativeTime(project.updatedAt)}</span>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-2 pt-1.5 pb-1" onClick={e => e.stopPropagation()}>
            {filteredTasks.length === 0
              ? <p className="text-center text-xs text-slate-300 italic py-3">No tasks here</p>
              : (
                <div className="flex flex-col gap-0.5">
                  {filteredTasks.map(task => {
                    const ri = realIndexOf(task);
                    const isDragging = draggingId === task.id;
                    const isOver     = overId === task.id && draggingId && draggingId !== task.id;
                    return (
                      <div key={task.id} draggable
                        onDragStart={() => onDragStart(ri, task.id)}
                        onDragEnter={() => onDragEnter(ri, task.id)}
                        onDragEnd={()   => onDragEnd()}
                        onDragOver={e  => e.preventDefault()}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all group/task hover:bg-slate-50
                          ${isDragging ? 'opacity-30 scale-95' : ''}
                          ${isOver ? 'border-t-2 border-indigo-400' : ''}`}
                      >
                        <GripVertical size={13} className="flex-shrink-0 text-slate-200 group-hover/task:text-slate-400 cursor-grab" />
                        <button onClick={e => { e.stopPropagation(); cycleTask(task.id); }} className="flex-shrink-0 hover:scale-110 transition-transform">
                          {task.status==='finished' ? <CheckCircle2 size={13} className="text-emerald-500" />
                            : task.status==='ongoing' ? <Clock size={13} className="text-blue-400" />
                            : <Circle size={13} className="text-slate-300" />}
                        </button>

                        {editingTaskId === task.id ? (
                          <input
                            autoFocus
                            value={editingTaskVal}
                            onChange={e => setEditingTaskVal(e.target.value)}
                            onBlur={() => saveTaskTitle(task.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveTaskTitle(task.id);
                              if (e.key === 'Escape') setEditingTaskId(null);
                            }}
                            className="flex-1 text-sm bg-slate-50 border border-slate-300 rounded px-2 py-0.5 outline-none font-normal text-slate-700"
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            onDoubleClick={e => {
                              e.stopPropagation();
                              setEditingTaskId(task.id);
                              setEditingTaskVal(task.title);
                            }}
                            title="Double-click to edit inline"
                            className={`flex-1 text-sm leading-snug truncate cursor-text ${
                              task.status==='finished' ? 'line-through text-slate-300' : 'text-slate-600 hover:text-indigo-600'
                            }`}
                          >
                            {task.title}
                          </span>
                        )}

                        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full opacity-40 ${getPriorityColor(task.priority).dot}`} title={task.priority} />
                        <button onClick={e => { e.stopPropagation(); deleteTask(task.id); }} className="flex-shrink-0 opacity-0 group-hover/task:opacity-100 text-slate-300 hover:text-red-400 transition-all"><X size={12} /></button>
                      </div>
                    );
                  })}
                </div>
              )
            }

          </div>
          <div className="flex items-center justify-between px-2.5 pb-2 pt-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); onUpdate({ pinned: !project.pinned }); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              title={project.pinned ? 'Unlock' : 'Lock position'}>
              {project.pinned ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={e => { e.stopPropagation(); onSelect(); }} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Open details"><MoreHorizontal size={12} /></button>
            </div>
          </div>
          {!project.pinned && (
            <div className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end pb-1 pr-1 opacity-0 group-hover:opacity-70 transition-opacity"
              onPointerDown={handleResizeDown}>
              <div className="w-2.5 h-2.5 rounded-sm border-b-2 border-r-2 border-slate-400" />
            </div>
          )}
      </div>
    </div>
  );
}

