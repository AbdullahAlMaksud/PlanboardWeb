'use client';
import React from 'react';
import { Target, X, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { FocusTask, Project, TaskStatus } from '@/shared/types/canvasflow';
import { Button } from '@/components/ui/button';

interface TodayFocusProps {
  focusTasks: FocusTask[];
  projects: Project[];
  onRemove: (taskId: string) => void;
  onClose: () => void;
}

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  if (status === 'finished') return <CheckCircle2 size={12} className="text-emerald-500" />;
  if (status === 'ongoing') return <Clock size={12} className="text-blue-500" />;
  return <Circle size={12} className="text-slate-300" />;
};

export function TodayFocus({ focusTasks, projects, onRemove, onClose }: TodayFocusProps) {
  const resolved = focusTasks.slice(0, 3).map(ft => {
    const project = projects.find(p => p.id === ft.projectId);
    const task = project?.tasks.find(t => t.id === ft.taskId);
    return task && project ? { task, project, focusTask: ft } : null;
  }).filter(Boolean) as { task: NonNullable<ReturnType<Project['tasks']['find']>>; project: Project; focusTask: FocusTask }[];

  return (
    <div className="absolute bottom-6 right-6 z-30 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-indigo-500" />
          <span className="text-xs font-semibold text-slate-700">Today&apos;s Focus</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={13} />
        </Button>
      </div>

      <div className="p-3 flex flex-col gap-2">
        {resolved.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-slate-400">No tasks focused yet.</p>
            <p className="text-xs text-slate-300 mt-1">Pin up to 3 tasks from any project.</p>
          </div>
        )}

        {resolved.map(({ task, project }) => (
          <div
            key={task.id}
            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 group"
          >
            <StatusIcon status={task.status} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium leading-snug ${task.status === 'finished' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {task.title}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{project.title}</p>
            </div>
            <button
              onClick={() => onRemove(task.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {focusTasks.length < 3 && (
          <p className="text-[10px] text-slate-300 text-center mt-1">
            {3 - focusTasks.length} slot{3 - focusTasks.length !== 1 ? 's' : ''} remaining — pin from any task
          </p>
        )}
      </div>
    </div>
  );
}
