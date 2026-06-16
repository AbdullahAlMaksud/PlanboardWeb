'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Project, AppSettings } from '@/shared/types/canvasflow';
import { Clipboard } from 'lucide-react';
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

  // Compile template text with project records
  const generateReport = () => {
    if (projects.length === 0) {
      return `No projects found in this workspace.`;
    }

    return projects.map((project) => {
      const completed = project.tasks.filter(t => t.status === 'finished');
      const ongoing = project.tasks.filter(t => t.status === 'ongoing');
      const todo = project.tasks.filter(t => t.status === 'todo');
      const blockers = project.blockers || [];

      const completedList = completed.length > 0 ? completed.map(t => `- ${t.title}`).join('\n') : '- No completed task right now.';
      const ongoingList = ongoing.length > 0 ? ongoing.map(t => `- ${t.title}`).join('\n') : '- No ongoing task right now.';
      const todoList = todo.length > 0 ? todo.map(t => `- ${t.title}`).join('\n') : '- No todo task right now.';
      const blockersList = blockers.length > 0 ? blockers.map(b => `- ${b}`).join('\n') : 'No blocker right now';

      return templateText
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
    }).join('\n\n---------------\n\n');
  };

  const reportText = generateReport();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    onCopied();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Workspace Work Report" className="max-w-4xl">
      <div className="flex flex-col gap-4 max-h-[75vh] w-full">
        <p className="text-xs text-slate-400">
          Customize your report template formatting using variable placeholders. Your formatted updates will update live in the preview pane.
        </p>
        
        {/* Two-column layout grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden flex-grow min-h-0 p-1">
          
          {/* Left Column: Editor & Options */}
          <div className="flex flex-col gap-3 min-h-0">
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
            <div className="flex flex-col gap-1 flex-grow min-h-[180px]">
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
                wrapperClassName="flex-1 flex flex-col min-h-0"
                className="w-full flex-1 p-3 text-xs font-mono leading-relaxed text-slate-700 bg-white border-slate-200 rounded-xl focus:ring-1"
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
          </div>

          {/* Right Column: Live Monospace Preview */}
          <div className="flex flex-col gap-1 min-h-[280px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
              Live Generated Preview
            </label>
            <div className="w-full h-full overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
              {reportText}
            </div>
          </div>
        </div>

        {/* Modal Buttons Footer */}
        <div className="flex gap-2 pt-2 flex-shrink-0 border-t border-slate-100">
          <Button variant="default" size="md" onClick={handleCopy} className="flex-grow cursor-pointer">
            <Clipboard size={14} />
            Copy Report
          </Button>
          <Button variant="ghost" size="md" onClick={onClose} className="cursor-pointer">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
