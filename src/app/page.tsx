'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, WorkspaceData, InboxItem, FilterChip, ProjectTask, DrawElement, DrawTool, FocusTask } from '@/shared/types/canvasflow';
import { loadWorkspace, saveWorkspace, clearWorkspace, exportWorkspace, importWorkspace } from '@/shared/lib/storage';
import { createSeedWorkspace } from '@/shared/lib/seed';
import { generateId } from '@/shared/lib/utils';
import { CanvasBoard } from '@/features/project/components/canvas-board';
import { ProjectDetailsPanel } from '@/features/project/components/project-details-panel';
import { TodayFocus } from '@/features/project/components/today-focus';
import { InboxPanel } from '@/features/project/components/inbox-panel';
import { NewProjectDialog } from '@/features/project/components/new-project-dialog';
import { ConfirmDialog } from '@/features/project/components/confirm-dialog';
import { ToastContainer, ToastData } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNav } from '@/components/common/navbar';
import { WorkReportModal } from '@/features/project/modal/work-report-modal';
import { Search, Plus, Target, Inbox, Timer } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { PomodoroTimer } from '@/components/common/pomodoro-timer';

function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const add = useCallback((message: string, type: ToastData['type'] = 'success') => {
    setToasts(p => [...p, { id: generateId(), message, type }]);
  }, []);
  const remove = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, addToast: add, removeToast: remove };
}

const FILTERS: { key: FilterChip; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pinned', label: 'Pinned' },
  { key: 'high-priority', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'active', label: 'Active' },
  { key: 'finished', label: 'Done' },
];

function filterProjects(projects: Project[], query: string, filter: FilterChip): Project[] {
  let r = projects;
  if (query.trim()) {
    const q = query.toLowerCase();
    r = r.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) ||
      p.notes.toLowerCase().includes(q) || p.tasks.some(t => t.title.toLowerCase().includes(q)));
  }
  switch (filter) {
    case 'pinned': return r.filter(p => p.pinned);
    case 'high-priority': return r.filter(p => p.priority === 'high');
    case 'urgent': return r.filter(p => p.priority === 'urgent');
    case 'active': return r.filter(p => p.tasks.some(t => t.status !== 'finished'));
    case 'finished': return r.filter(p => p.tasks.length > 0 && p.tasks.every(t => t.status === 'finished'));
    default: return r;
  }
}

export default function CanvasFlowApp() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDrawIds, setSelectedDrawIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showWorkReport, setShowWorkReport] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = loadWorkspace();
    if (saved) {
      // migrate old data
      if (!saved.drawElements) (saved as WorkspaceData).drawElements = (saved as WorkspaceData & { drawStrokes?: DrawElement[] }).drawStrokes || [];
      if (!saved.settings.drawTool) saved.settings.drawTool = 'pencil';
      if (!saved.settings.drawFill) saved.settings.drawFill = 'transparent';
      if (!saved.settings.drawFontSize) saved.settings.drawFontSize = 16;
      if (!saved.settings.drawOpacity) saved.settings.drawOpacity = 1;
      setWorkspace(saved);
    } else {
      const seed = createSeedWorkspace();
      setWorkspace(seed);
      saveWorkspace(seed);
    }
  }, []);

  const scheduleSave = useCallback((data: WorkspaceData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveWorkspace(data), 600);
  }, []);

  const update = useCallback((updater: (prev: WorkspaceData) => WorkspaceData) => {
    setWorkspace(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const activeTab = workspace?.settings?.drawMode ? 'draw' : 'projects';

  const handleTabChange = useCallback((tab: 'projects' | 'draw') => {
    update(w => ({ ...w, settings: { ...w.settings, drawMode: tab === 'draw' } }));
    if (tab === 'draw') {
      setSelectedProjectId(null);
      addToast('Drawing mode enabled · V P R E A T shortcuts', 'info');
    } else {
      addToast('Project tracker enabled', 'info');
    }
  }, [update, addToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
      if (!isTyping) {
        if (e.key === 'n' || e.key === 'N') { e.preventDefault(); if (activeTab === 'projects') setShowNewProject(true); }
        if (e.key === 'Escape') { setSelectedProjectId(null); setShowNewProject(false); }
        if (e.key === 'f' || e.key === 'F') { e.preventDefault(); update(w => ({ ...w, settings: { ...w.settings, showTodayFocus: !w.settings.showTodayFocus } })); }
        if (e.key === 'd' || e.key === 'D') { e.preventDefault(); handleTabChange(activeTab === 'projects' ? 'draw' : 'projects'); }
        // draw tool shortcuts (only in draw mode)
        if (activeTab === 'draw') {
          const toolMap: Record<string, DrawTool> = { v: 'select', p: 'pencil', r: 'rect', e: 'ellipse', a: 'arrow', t: 'text', s: 'sticky' };
          const tool = toolMap[e.key.toLowerCase()];
          if (tool) { e.preventDefault(); update(w => ({ ...w, settings: { ...w.settings, drawTool: tool } })); }
        }
      }
      if (e.key === '/' && !isTyping) { e.preventDefault(); (document.querySelector('[data-search]') as HTMLInputElement)?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [update, activeTab, handleTabChange]);

  if (!workspace) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
          <p className="text-sm text-slate-400">Loading Planboard AI…</p>
        </div>
      </div>
    );
  }

  const filteredProjects = filterProjects(workspace.projects, searchQuery, activeFilter);
  const selectedProject = workspace.projects.find(p => p.id === selectedProjectId) ?? null;
  const s = workspace.settings;

  // project ops
  const createProject = (project: Project) => { update(w => ({ ...w, projects: [...w.projects, project] })); setSelectedProjectId(project.id); addToast('Project created'); };
  const updateProject = (id: string, up: Partial<Project>) => update(w => ({ ...w, projects: w.projects.map(p => p.id === id ? { ...p, ...up, updatedAt: new Date().toISOString() } : p) }));
  const deleteProject = (id: string) => { update(w => ({ ...w, projects: w.projects.filter(p => p.id !== id), focusTasks: w.focusTasks.filter(ft => ft.projectId !== id) })); if (selectedProjectId === id) setSelectedProjectId(null); addToast('Project deleted'); };

  // focus
  const addFocus = (taskId: string, projectId: string) => {
    if (workspace.focusTasks.length >= 3) { addToast('Today Focus is full', 'error'); return; }
    if (workspace.focusTasks.some(ft => ft.taskId === taskId)) return;
    update(w => ({ ...w, focusTasks: [...w.focusTasks, { taskId, projectId, addedAt: new Date().toISOString() }] }));
    addToast('Added to Today Focus', 'info');
  };
  const removeFocus = (taskId: string) => update(w => ({ ...w, focusTasks: w.focusTasks.filter(ft => ft.taskId !== taskId) }));

  // inbox
  const addInbox = (item: InboxItem) => update(w => ({ ...w, inbox: [...w.inbox, item] }));
  const removeInbox = (id: string) => update(w => ({ ...w, inbox: w.inbox.filter(i => i.id !== id) }));
  const moveInboxToProject = (item: InboxItem, projectId: string) => {
    const now = new Date().toISOString();
    const task: ProjectTask = { id: generateId(), title: item.title, status: 'todo', priority: 'medium', createdAt: now, updatedAt: now };
    update(w => ({ ...w, inbox: w.inbox.filter(i => i.id !== item.id), projects: w.projects.map(p => p.id === projectId ? { ...p, tasks: [...p.tasks, task], updatedAt: now } : p) }));
    addToast('Moved to project', 'success');
  };

  // draw ops
  const addElement = (el: DrawElement) => update(w => ({ ...w, drawElements: [...(w.drawElements || []), el] }));
  const updateElement = (id: string, changes: Partial<DrawElement>) => update(w => ({ ...w, drawElements: (w.drawElements || []).map(el => el.id === id ? { ...el, ...changes } as DrawElement : el) }));
  const deleteElements = (ids: string[]) => { update(w => ({ ...w, drawElements: (w.drawElements || []).filter(el => !ids.includes(el.id)) })); setSelectedDrawIds([]); };
  const clearAll = () => { update(w => ({ ...w, drawElements: [] })); setSelectedDrawIds([]); addToast('Canvas cleared', 'info'); };

  const setSetting = <K extends keyof typeof s>(key: K, val: typeof s[K]) => update(w => ({ ...w, settings: { ...w.settings, [key]: val } }));

  const handleExport = () => { exportWorkspace(workspace); addToast('Exported', 'success'); };
  const handleImport = async (file: File) => {
    try {
      const data = await importWorkspace(file);
      if (!data.drawElements) data.drawElements = [];
      setWorkspace(data); saveWorkspace(data); addToast('Imported successfully', 'success');
    } catch { addToast('Failed to import', 'error'); }
  };
  const handleReset = () => { clearWorkspace(); const seed = createSeedWorkspace(); setWorkspace(seed); saveWorkspace(seed); setSelectedProjectId(null); addToast('Reset to defaults', 'info'); };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 relative">
      <FloatingNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onExport={handleExport}
        onImport={handleImport}
        onReset={() => setConfirmReset(true)}
        onOpenReport={() => setShowWorkReport(true)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          <CanvasBoard
            projects={filteredProjects} selectedId={selectedProjectId}
            onSelectProject={id => { if (activeTab === 'projects') setSelectedProjectId(id); }}
            onUpdateProject={updateProject}
            onDeleteProject={id => setConfirmDelete(id)}
            onNewProject={() => setShowNewProject(true)}
            activeTab={activeTab}
            drawMode={activeTab === 'draw'} drawTool={s.drawTool}
            drawColor={s.drawColor} drawFill={s.drawFill}
            drawWidth={s.drawWidth} drawFontSize={s.drawFontSize} drawOpacity={s.drawOpacity}
            drawElements={workspace.drawElements || []}
            selectedDrawIds={selectedDrawIds}
            onAddElement={addElement} onUpdateElement={updateElement}
            onDeleteElements={deleteElements} onSelectDrawIds={setSelectedDrawIds}
            onToolChange={t => setSetting('drawTool', t)}
            onColorChange={c => setSetting('drawColor', c)}
            onFillChange={c => setSetting('drawFill', c)}
            onWidthChange={w => setSetting('drawWidth', w)}
            onFontSizeChange={fs => setSetting('drawFontSize', fs)}
            onOpacityChange={o => setSetting('drawOpacity', o)}
            onClearAll={clearAll}
            onExitDraw={() => handleTabChange('projects')}
          >
            {s.showTodayFocus && activeTab === 'projects' && (
              <div className="absolute bottom-20 right-6 pointer-events-auto z-40">
                <TodayFocus focusTasks={workspace.focusTasks} projects={workspace.projects} onRemove={removeFocus} onClose={() => setSetting('showTodayFocus', false)} />
              </div>
            )}
            {s.showInbox && activeTab === 'projects' && (
              <div className="absolute bottom-20 left-6 pointer-events-auto z-40">
                <InboxPanel items={workspace.inbox} projects={workspace.projects} onAdd={addInbox} onRemove={removeInbox} onMoveToProject={moveInboxToProject} onClose={() => setSetting('showInbox', false)} />
              </div>
            )}
          </CanvasBoard>
        </div>

        <AnimatePresence>
          {selectedProject && activeTab === 'projects' && (
            <>
              {/* Drawer backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProjectId(null)}
                className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs z-[90] pointer-events-auto"
              />
              {/* Drawer Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 w-[420px] bg-white shadow-2xl border-l border-slate-200/50 z-[100] flex flex-col pointer-events-auto overflow-hidden"
              >
                <ProjectDetailsPanel
                  project={selectedProject} focusTasks={workspace.focusTasks}
                  onUpdate={up => updateProject(selectedProject.id, up)}
                  onDelete={() => setConfirmDelete(selectedProject.id)}
                  onClose={() => setSelectedProjectId(null)}
                  onAddFocusTask={addFocus} onRemoveFocusTask={removeFocus}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Projects mode bottom-center floating toolbar */}
      {activeTab === 'projects' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-full shadow-lg px-4.5 py-2.5 flex items-center gap-3 z-50 pointer-events-auto max-w-[95vw]">
          {/* Search */}
          <div className="relative w-48 flex-shrink-0">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search… (/)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              data-search
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
            />
          </div>

          <div className="h-4 w-[1px] bg-slate-200 flex-shrink-0" />

          {/* Filters */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${activeFilter === f.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-200 flex-shrink-0" />

          {/* Extra Toggles */}
          <TooltipProvider>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSetting('showTodayFocus', !s.showTodayFocus)}
                    className={`p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer ${s.showTodayFocus
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <Target size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Today Focus (F)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSetting('showInbox', !s.showInbox)}
                    className={`p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer ${s.showInbox
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <Inbox size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Quick Inbox</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowPomodoro(p => !p)}
                    className={`p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer ${showPomodoro
                        ? 'bg-indigo-50 text-indigo-600 font-bold'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <Timer size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Pomodoro Timer</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <div className="h-4 w-[1px] bg-slate-200 flex-shrink-0" />

          {/* New Project */}
          <button
            onClick={() => setShowNewProject(true)}
            className="whitespace-nowrap flex-shrink-0 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm shadow-indigo-100 cursor-pointer"
          >
            <Plus size={12} />
            New Project
          </button>
        </div>
      )}

      <NewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} onCreate={createProject} canvasCenter={{ x: 400, y: 300 }} />
      <ConfirmDialog open={confirmReset} title="Reset Workspace" message="Delete all projects and restore defaults. Cannot be undone." confirmLabel="Reset Everything" onConfirm={handleReset} onClose={() => setConfirmReset(false)} />
      <ConfirmDialog open={!!confirmDelete} title="Delete Project" message="Permanently delete this project and all tasks. Cannot be undone." confirmLabel="Delete Project" onConfirm={() => confirmDelete && deleteProject(confirmDelete)} onClose={() => setConfirmDelete(null)} />

      <WorkReportModal
        open={showWorkReport}
        onClose={() => setShowWorkReport(false)}
        projects={workspace.projects}
        onCopied={() => addToast('Report copied to clipboard', 'success')}
        settings={workspace.settings}
        onUpdateSettings={(up) => update(w => ({ ...w, settings: { ...w.settings, ...up } }))}
      />

      <PomodoroTimer isOpen={showPomodoro} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
