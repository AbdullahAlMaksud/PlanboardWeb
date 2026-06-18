'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Project, AppSettings } from '@/shared/types/canvasflow';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Clipboard,
  Sparkles,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  FilePenIcon
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface WorkReportModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onCopied: () => void;
  settings?: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const PRESETS = [
  {
    id: 'detailed',
    label: 'Detailed Report',
    template: `Work Update ({projectTitle})
{date}

Tasks Completed:
{completedTasks}

Ongoing Tasks / In Progress:
{ongoingTasks}

Blockers (if any):
{blockers}`
  },
  {
    id: 'minimal',
    label: 'Minimal Summary',
    template: `[{projectTitle}] Update ({date})
✓ Completed: {completedTasksCount} tasks
⚡ In Progress: {ongoingTasksCount} tasks
⚠️ Blockers: {blockersCount}`
  },
  {
    id: 'slack',
    label: 'Slack / Discord Message',
    template: `*Work Update - {projectTitle}* ({date})
• *Completed:*
{completedTasks}
• *Ongoing:*
{ongoingTasks}
• *Blockers:* {blockersCount} blocker(s)`
  },
  {
    id: 'custom',
    label: 'Custom Template',
    template: `Work Update ({projectTitle})
{date}

Custom Format:
- Done: {completedTasksCount}
- Doing: {ongoingTasksCount}
- Blockers: {blockers}`
  }
];

const PLACEHOLDERS = [
  { value: '{projectTitle}', label: 'Project Title' },
  { value: '{date}', label: 'Project Date' },
  { value: '{completedTasks}', label: 'Completed Tasks' },
  { value: '{ongoingTasks}', label: 'Ongoing Tasks' },
  { value: '{todoTasks}', label: 'Todo Tasks' },
  { value: '{blockers}', label: 'Blockers' },
  { value: '{completedTasksCount}', label: 'Completed Count' },
  { value: '{ongoingTasksCount}', label: 'Ongoing Count' },
  { value: '{todoTasksCount}', label: 'Todo Count' },
  { value: '{blockersCount}', label: 'Blockers Count' },
];

export function WorkReportModal({
  open,
  onClose,
  projects,
  onCopied,
  settings,
  onUpdateSettings
}: WorkReportModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [templateId, setTemplateId] = useState(() => settings?.reportTemplateId || 'detailed');
  const [templateText, setTemplateText] = useState(() => {
    const tid = settings?.reportTemplateId || 'detailed';
    if (tid === 'custom') {
      return settings?.customReportTemplate || PRESETS.find(p => p.id === 'custom')!.template;
    }
    const preset = PRESETS.find(p => p.id === tid);
    return preset ? preset.template : PRESETS[0].template;
  });

  // State to hold active report content per project
  const [reports, setReports] = useState<Record<string, string>>({});
  // Track status of report editing ('template' | 'ai' | 'edited')
  const [customized, setCustomized] = useState<Record<string, 'template' | 'ai' | 'edited'>>({});
  // Track individual AI loading states
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  // Track collapsible cards open state
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});

  // AI settings state (persisted locally)
  const [localApiKey, setLocalApiKey] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [showAiSettings, setShowAiSettings] = useState(false);

  // Sync settings/localStorage state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalApiKey(localStorage.getItem('planboard_gemini_api_key') || '');
      setAiTone(localStorage.getItem('planboard_ai_tone') || 'professional');
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setLocalApiKey(key);
    localStorage.setItem('planboard_gemini_api_key', key);
  };

  const handleSaveTone = (tone: string) => {
    setAiTone(tone);
    localStorage.setItem('planboard_ai_tone', tone);
  };

  // Sync with state changes (e.g. imports or defaults change)
  useEffect(() => {
    const tid = settings?.reportTemplateId || 'detailed';
    setTemplateId(tid);
    if (tid === 'custom') {
      setTemplateText(settings?.customReportTemplate || PRESETS.find(p => p.id === 'custom')!.template);
    } else {
      const preset = PRESETS.find(p => p.id === tid);
      if (preset) setTemplateText(preset.template);
    }
  }, [settings?.reportTemplateId, settings?.customReportTemplate]);

  const handleInsertPlaceholder = (placeholder: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const newText = text.substring(0, start) + placeholder + text.substring(end);

    setTemplateId('custom');
    setTemplateText(newText);
    onUpdateSettings({
      reportTemplateId: 'custom',
      customReportTemplate: newText,
    });

    // Focus back and place cursor after the inserted variable
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 10);
  };

  const formatDate = (dateStr?: string) => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const targetDate = dateStr
      ? (() => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
      })()
      : new Date();

    const weekday = weekdays[targetDate.getDay()];
    const day = targetDate.getDate();
    const month = months[targetDate.getMonth()];
    const year = targetDate.getFullYear();

    return `${weekday}, ${day} ${month}, ${year}`;
  };

  // Helper function to compile report template for a single project
  const compileProjectReport = useCallback((project: Project, template: string) => {
    const completed = project.tasks.filter(t => t.status === 'finished');
    const ongoing = project.tasks.filter(t => t.status === 'ongoing');
    const todo = project.tasks.filter(t => t.status === 'todo');
    const blockers = project.blockers || [];

    const completedList = completed.length > 0 ? completed.map(t => `- ${t.title}`).join('\n') : '- No completed task right now.';
    const ongoingList = ongoing.length > 0 ? ongoing.map(t => `- ${t.title}`).join('\n') : '- No ongoing task right now.';
    const todoList = todo.length > 0 ? todo.map(t => `- ${t.title}`).join('\n') : '- No todo task right now.';
    const blockersList = blockers.length > 0 ? blockers.map(b => `- ${b}`).join('\n') : 'No blocker right now';

    return template
      .replace(/{projectTitle}/g, project.title)
      .replace(/{date}/g, formatDate(project.date))
      .replace(/{completedTasks}/g, completedList)
      .replace(/{ongoingTasks}/g, ongoingList)
      .replace(/{todoTasks}/g, todoList)
      .replace(/{blockers}/g, blockersList)
      .replace(/{completedTasksCount}/g, String(completed.length))
      .replace(/{ongoingTasksCount}/g, String(ongoing.length))
      .replace(/{todoTasksCount}/g, String(todo.length))
      .replace(/{blockersCount}/g, String(blockers.length));
  }, []);

  // Update reports when template, projects change, preserving customized/ai text
  useEffect(() => {
    setReports(prev => {
      const nextReports = { ...prev };
      projects.forEach(project => {
        if (!customized[project.id] || customized[project.id] === 'template') {
          nextReports[project.id] = compileProjectReport(project, templateText);
        }
      });
      return nextReports;
    });
  }, [projects, templateText, compileProjectReport, customized]);

  // Reset/Initialize states when modal opens
  useEffect(() => {
    if (open) {
      const initialReports: Record<string, string> = {};
      const initialCustomized: Record<string, 'template' | 'ai' | 'edited'> = {};
      const initialOpenCards: Record<string, boolean> = {};
      projects.forEach(project => {
        initialReports[project.id] = compileProjectReport(project, templateText);
        initialCustomized[project.id] = 'template';
        initialOpenCards[project.id] = true; // Open by default
      });
      setReports(initialReports);
      setCustomized(initialCustomized);
      setOpenCards(initialOpenCards);
      setAiLoading({});
    }
  }, [open, projects, templateText, compileProjectReport]);

  // Auto-resize textareas to fit content perfectly, eliminating internal scrollbars
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const textareas = document.querySelectorAll('.auto-height-textarea');
        textareas.forEach((el) => {
          const textarea = el as HTMLTextAreaElement;
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight + 4}px`;
        });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [reports, templateText, open, openCards]);

  // Individual Actions
  const handleReportTextChange = (projectId: string, newText: string) => {
    setReports(prev => ({ ...prev, [projectId]: newText }));
    setCustomized(prev => ({ ...prev, [projectId]: 'edited' }));
  };

  const handleResetCard = (project: Project) => {
    const compiled = compileProjectReport(project, templateText);
    setReports(prev => ({ ...prev, [project.id]: compiled }));
    setCustomized(prev => ({ ...prev, [project.id]: 'template' }));
  };

  const handleAIEnhance = async (project: Project) => {
    const currentText = reports[project.id];
    if (!currentText || !currentText.trim()) return;

    setAiLoading(prev => ({ ...prev, [project.id]: true }));
    setOpenCards(prev => ({ ...prev, [project.id]: true }));
    try {
      const response = await fetch('/api/enhance-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentText,
          projectTitle: project.title,
          apiKey: localApiKey,
          tone: aiTone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance report');
      }

      setReports(prev => ({ ...prev, [project.id]: data.enhancedText }));
      setCustomized(prev => ({ ...prev, [project.id]: 'ai' }));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error running AI Enhancement');
    } finally {
      setAiLoading(prev => ({ ...prev, [project.id]: false }));
    }
  };

  const handleCopyCard = (projectId: string) => {
    const text = reports[projectId];
    if (text) {
      navigator.clipboard.writeText(text);
      onCopied();
    }
  };

  const handleDownloadCard = (project: Project) => {
    const text = reports[project.id];
    if (!text) return;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.setAttribute('download', `${safeTitle}_work_report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Global Actions
  const handleAIEnhanceAll = async () => {
    const promises = projects.map(async (project) => {
      const currentText = reports[project.id];
      if (!currentText || !currentText.trim() || aiLoading[project.id]) return;

      setAiLoading(prev => ({ ...prev, [project.id]: true }));
      setOpenCards(prev => ({ ...prev, [project.id]: true }));
      try {
        const response = await fetch('/api/enhance-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: currentText,
            projectTitle: project.title,
            apiKey: localApiKey,
            tone: aiTone,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Error polishing ${project.title}`);
        }

        setReports(prev => ({ ...prev, [project.id]: data.enhancedText }));
        setCustomized(prev => ({ ...prev, [project.id]: 'ai' }));
      } catch (err: any) {
        console.error(err);
      } finally {
        setAiLoading(prev => ({ ...prev, [project.id]: false }));
      }
    });

    await Promise.all(promises);
  };

  const handleCopyAll = () => {
    const combined = projects.map(p => {
      const text = reports[p.id] || '';
      return `### ${p.title}\n\n${text}`;
    }).join('\n\n---\n\n');

    navigator.clipboard.writeText(combined);
    onCopied();
  };

  const handleDownloadCombined = () => {
    const combined = projects.map(p => {
      const text = reports[p.id] || '';
      return `### ${p.title}\n\n${text}`;
    }).join('\n\n---\n\n');

    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob([combined], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `combined_work_report_${dateStr}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSeparate = () => {
    projects.forEach((project, idx) => {
      const text = reports[project.id];
      if (!text) return;
      setTimeout(() => {
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        link.setAttribute('download', `${safeTitle}_work_report.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 300);
    });
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onClose={onClose} title="Workspace Work Report" className="max-w-6xl">
        <div className="flex flex-col gap-6 max-h-[82vh] overflow-y-auto w-full pr-1.5 scrollbar-thin">
          <p className="text-xs text-slate-400 flex-shrink-0">
            Customize your report template formatting using variable placeholders. Your formatted updates will update live as separate project cards in the workspace.
          </p>

          {/* Two-column layout grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-1">

            {/* Left Column: Editor & Options */}
            <div className="flex flex-col gap-3.5 md:col-span-5">
              {/* Preset Dropdown */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none mb-1">
                  Select Preset Template
                </label>
                <Select
                  value={templateId}
                  onValueChange={(id) => {
                    setTemplateId(id);
                    let newText = templateText;
                    if (id === 'custom') {
                      newText = settings?.customReportTemplate || PRESETS.find(p => p.id === 'custom')!.template;
                    } else {
                      newText = PRESETS.find(p => p.id === id)!.template;
                    }
                    setTemplateText(newText);
                    onUpdateSettings({
                      reportTemplateId: id,
                      customReportTemplate: id === 'custom' ? newText : settings?.customReportTemplate,
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Preset Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Code Textarea Editor */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                  Template Editor
                </label>
                <Textarea
                  ref={textareaRef}
                  value={templateText}
                  onChange={(e) => {
                    const newText = e.target.value;
                    setTemplateId('custom');
                    setTemplateText(newText);
                    onUpdateSettings({
                      reportTemplateId: 'custom',
                      customReportTemplate: newText,
                    });
                  }}
                  wrapperClassName="w-full"
                  className="w-full p-3 text-xs font-mono leading-relaxed text-slate-700 bg-white border-slate-200 rounded-xl focus:ring-1 resize-none overflow-hidden auto-height-textarea"
                  placeholder="Write your template text formats..."
                />
              </div>

              {/* Clickable Variable Tags */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest select-none">
                  Insert Variables (Click to add)
                </label>
                <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto p-2 border border-slate-200/50 bg-slate-50/50 rounded-xl">
                  {PLACEHOLDERS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleInsertPlaceholder(p.value)}
                      className="text-[9px] font-semibold bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 px-2 py-0.5 rounded-full cursor-pointer transition-all shadow-xs"
                      title={`Insert ${p.value}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Assistant Settings Panel */}
              <div className="border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAiSettings(!showAiSettings)}
                  className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-700 bg-slate-100/85 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span>AI Enhancement Assistant</span>
                  </div>
                  {showAiSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAiSettings && (
                  <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-200 bg-white">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Gemini API Key (Optional Override)
                      </label>
                      <input
                        type="password"
                        placeholder="AI key from .env.local used by default"
                        value={localApiKey}
                        onChange={(e) => handleSaveApiKey(e.target.value)}
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                      <p className="text-[9px] text-slate-400">
                        Saved securely in your browser's local storage.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        AI Polish Tone & Style
                      </label>
                      <Select value={aiTone} onValueChange={handleSaveTone}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select tone style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">👔 Professional & Polite</SelectItem>
                          <SelectItem value="concise">⚡ Concise & Direct</SelectItem>
                          <SelectItem value="bullets">📋 Clean Bullet Points</SelectItem>
                          <SelectItem value="executive">💼 Executive Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Project Work Update Cards */}
            <div className="flex flex-col gap-3 md:col-span-7">
              <div className="flex items-center justify-between flex-shrink-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                  Workspace Work Updates ({projects.length})
                </label>

                {projects.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAIEnhanceAll}
                      disabled={Object.values(aiLoading).some(Boolean)}
                      className="text-[10px] font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50/50 cursor-pointer flex items-center gap-1.5 py-1 px-2.5 rounded-lg h-7"
                    >
                      {Object.values(aiLoading).some(Boolean) ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Sparkles size={11} />
                      )}
                      Enhance All
                    </Button>

                    <div className="relative group">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] font-bold text-slate-600 cursor-pointer flex items-center gap-1.5 py-1 px-2.5 rounded-lg h-7"
                      >
                        <Download size={11} />
                        Download All
                      </Button>
                      <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 w-44 animate-in fade-in slide-in-from-top-1">
                        <button
                          type="button"
                          onClick={handleDownloadCombined}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <FileText size={12} className="text-slate-400" />
                          Combined File (.md)
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadSeparate}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Download size={12} className="text-slate-400" />
                          Separate Files (Batch)
                        </button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAll}
                      className="text-[10px] font-bold text-slate-600 cursor-pointer flex items-center gap-1.5 py-1 px-2.5 rounded-lg h-7"
                    >
                      <Clipboard size={11} />
                      Copy All
                    </Button>
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col gap-4">
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                    <p className="text-xs text-slate-400">No projects found in this workspace.</p>
                  </div>
                ) : (
                  projects.map((project) => {
                    const status = customized[project.id] || 'template';
                    const isLoading = aiLoading[project.id];
                    const reportText = reports[project.id] || '';
                    const isCardOpen = openCards[project.id] !== false;

                    return (
                      <Collapsible
                        key={project.id}
                        open={isCardOpen}
                        onOpenChange={(open) => setOpenCards(prev => ({ ...prev, [project.id]: open }))}
                        className="flex flex-col border border-slate-200/80 rounded-2xl bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300"
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-start gap-2.5 flex-grow cursor-pointer select-none py-1">
                              {isCardOpen ? (
                                <ChevronUp size={16} className="text-slate-400 transition-transform duration-200" />
                              ) : (
                                <ChevronDown size={16} className="text-slate-400 transition-transform duration-200" />
                              )}
                              <div className='flex flex-col'>
                                <h4 className="text-xs font-bold text-slate-700">{project.title}</h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {project.date ? formatDate(project.date) : 'No date'}
                                </span>
                              </div>

                            </div>
                          </CollapsibleTrigger>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className='flex items-center gap-1.5'>
                              {status === 'ai' && (
                                <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700 text-[9px] px-1.5 py-0">
                                  <Sparkles size={9} /> AI Polished
                                </Badge>
                              )}
                              {status === 'edited' && (
                                <Badge className="bg-amber-50 border-amber-200 text-amber-700 text-[9px] px-1.5 py-0">
                                  <FilePenIcon size={9} /> Customized
                                </Badge>
                              )}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleAIEnhance(project)}
                                  disabled={isLoading}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                >
                                  {isLoading ? (
                                    <Loader2 size={13} className="animate-spin text-indigo-600" />
                                  ) : (
                                    <Sparkles size={13} />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Enhance tone and fix spelling using AI</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCard(project.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                >
                                  <Clipboard size={13} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Copy report to clipboard</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadCard(project)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                >
                                  <Download size={13} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Download markdown report file</TooltipContent>
                            </Tooltip>

                            {status !== 'template' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => handleResetCard(project)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <RotateCcw size={13} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Revert to default template compiled text</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <CollapsibleContent className="transition-all data-[state=closed]:hidden">
                          <div className="p-3 bg-white relative border-t border-slate-100">
                            {isLoading && (
                              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                                <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-md">
                                  <Loader2 size={14} className="animate-spin text-indigo-600" />
                                  <span className="text-xs font-semibold text-slate-600">Polishing report...</span>
                                </div>
                              </div>
                            )}
                            <Textarea
                              value={reportText}
                              onChange={(e) => handleReportTextChange(project.id, e.target.value)}
                              className="w-full p-2.5 font-mono text-[11px] leading-relaxed text-slate-700 bg-slate-50/30 border-slate-200/80 rounded-xl focus:ring-1 focus:bg-white resize-none overflow-hidden auto-height-textarea"
                              placeholder="Report text content..."
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Modal Buttons Footer */}
          <div className="flex gap-2 pt-2 flex-shrink-0 border-t border-slate-100 mt-auto">
            <Button variant="ghost" size="md" onClick={onClose} className="cursor-pointer ml-auto">
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </TooltipProvider>
  );
}
