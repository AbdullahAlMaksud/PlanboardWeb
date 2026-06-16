'use client';
import React, { useState } from 'react';
import {
  X, Trash2, Plus, Link, ArrowRight, Circle, Clock, CheckCircle2, Target,
  ExternalLink, ChevronDown, ChevronRight, ChevronUp, Lock, Unlock
} from 'lucide-react';
import { Project, ProjectTask, TaskStatus, ProjectPriority, FocusTask } from '@/shared/types/canvasflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectField as Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getPriorityColor, generateId, getStatusColor } from '@/shared/lib/utils';

interface ProjectDetailsPanelProps {
  project: Project;
  focusTasks: FocusTask[];
  onUpdate: (updates: Partial<Project>) => void;
  onDelete: () => void;
  onClose: () => void;
  onAddFocusTask: (taskId: string, projectId: string) => void;
  onRemoveFocusTask: (taskId: string) => void;
}

const STATUS_GROUPS: { status: TaskStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'todo', label: 'Todo', icon: <Circle size={13} className="text-slate-400" /> },
  { status: 'ongoing', label: 'Ongoing', icon: <Clock size={13} className="text-blue-500" /> },
  { status: 'finished', label: 'Finished', icon: <CheckCircle2 size={13} className="text-emerald-500" /> },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const TASK_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'finished', label: 'Finished' },
];

export function ProjectDetailsPanel({
  project,
  focusTasks,
  onUpdate,
  onDelete,
  onClose,
  onAddFocusTask,
  onRemoveFocusTask,
}: ProjectDetailsPanelProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);
  const [newBlocker, setNewBlocker] = useState('');
  const [showAddBlocker, setShowAddBlocker] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const colors = getPriorityColor(project.priority);

  const addTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const now = new Date().toISOString();
    const task: ProjectTask = {
      id: generateId(),
      title,
      status: newTaskStatus,
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
    };
    onUpdate({ tasks: [...project.tasks, task], updatedAt: now });
    setNewTaskTitle('');
  };

  const updateTask = (taskId: string, updates: Partial<ProjectTask>) => {
    const now = new Date().toISOString();
    onUpdate({
      tasks: project.tasks.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: now } : t),
      updatedAt: now,
    });
  };

  const deleteTask = (taskId: string) => {
    onUpdate({ tasks: project.tasks.filter(t => t.id !== taskId), updatedAt: new Date().toISOString() });
  };

  const addLink = () => {
    if (!newLinkUrl.trim()) return;
    const link = { id: generateId(), label: newLinkLabel || newLinkUrl, url: newLinkUrl };
    onUpdate({ links: [...project.links, link] });
    setNewLinkLabel('');
    setNewLinkUrl('');
    setShowAddLink(false);
  };

  const addBlocker = () => {
    const text = newBlocker.trim();
    if (!text) return;
    onUpdate({ blockers: [...(project.blockers || []), text] });
    setNewBlocker('');
    setShowAddBlocker(false);
  };

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-100">
        <div className={`h-0.5 ${colors.accent}`} />
        <div className="flex items-center justify-between px-5 py-3">
          <Badge className={colors.badge}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
          </Badge>
          <div className="flex items-center gap-1.5">
            {/* Pin action */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdate({ pinned: !project.pinned })}
              title={project.pinned ? "Unlock card position" : "Lock card position"}
              className={`w-8 h-8 rounded-lg ${project.pinned ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {project.pinned ? <Lock size={14} /> : <Unlock size={14} />}
            </Button>

            {/* Minimize action */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdate({ minimized: !project.minimized })}
              title={project.minimized ? "Expand card body" : "Minimize card body"}
              className={`w-8 h-8 rounded-lg ${project.minimized ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {project.minimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </Button>

            <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

            {/* Delete action */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              title="Delete project"
              className="h-8 px-2.5"
            >
              <Trash2 size={13} />
              Delete
            </Button>

            {/* Close action */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close sidebar"
              className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X size={15} />
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Title */}
        <Input
          value={project.title}
          onChange={e => onUpdate({ title: e.target.value, updatedAt: new Date().toISOString() })}
          className="text-base font-semibold border-0 border-b border-slate-100 rounded-none px-0 focus:ring-0 focus:border-indigo-300"
          placeholder="Project title"
        />

        {/* Description */}
        <Textarea
          value={project.description}
          onChange={e => onUpdate({ description: e.target.value, updatedAt: new Date().toISOString() })}
          placeholder="Add a description…"
          rows={2}
          className="border-slate-100 text-sm"
        />

        {/* Priority + Size row */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={project.priority}
            onChange={v => onUpdate({ priority: v as ProjectPriority, updatedAt: new Date().toISOString() })}
          />
          <Select
            label="Card Size"
            options={SIZE_OPTIONS}
            value={project.size}
            onChange={v => onUpdate({ size: v as Project['size'], customSize: undefined, updatedAt: new Date().toISOString() })}
          />
        </div>

        {/* Notes */}
        <Textarea
          label="Notes"
          value={project.notes}
          onChange={e => onUpdate({ notes: e.target.value, updatedAt: new Date().toISOString() })}
          placeholder="Private notes…"
          rows={3}
          className="border-slate-100 text-sm"
        />

        {/* Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Links</span>
            <Button variant="ghost" size="sm" onClick={() => setShowAddLink(!showAddLink)}>
              <Plus size={12} />
              Add
            </Button>
          </div>
          {showAddLink && (
            <div className="flex flex-col gap-2 mb-3 p-3 bg-slate-50 rounded-xl">
              <Input
                placeholder="Label (optional)"
                value={newLinkLabel}
                onChange={e => setNewLinkLabel(e.target.value)}
              />
              <Input
                placeholder="https://..."
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLink()}
              />
              <div className="flex gap-2">
                <Button variant="subtle" size="sm" onClick={addLink}>Save Link</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddLink(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {project.links.map(link => (
            <div key={link.id} className="flex items-center gap-2 py-1.5 group">
              <Link size={12} className="text-slate-400" />
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline flex-1 truncate flex items-center gap-1"
              >
                {link.label}
                <ExternalLink size={10} />
              </a>
              <button
                onClick={() => onUpdate({ links: project.links.filter(l => l.id !== link.id) })}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {project.links.length === 0 && !showAddLink && (
            <p className="text-xs text-slate-400 italic">No links yet</p>
          )}
        </div>

        {/* Blockers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Blockers</span>
            <Button variant="ghost" size="sm" onClick={() => setShowAddBlocker(!showAddBlocker)}>
              <Plus size={12} />
              Add
            </Button>
          </div>
          {showAddBlocker && (
            <div className="flex flex-col gap-2 mb-3 p-3 bg-slate-50 rounded-xl">
              <input
                placeholder="What is blocking this project?"
                value={newBlocker}
                onChange={e => setNewBlocker(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addBlocker()}
                className="w-full h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <div className="flex gap-2">
                <Button variant="subtle" size="sm" onClick={addBlocker}>Save Blocker</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddBlocker(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {(project.blockers || []).map((blocker, idx) => (
            <div key={idx} className="flex items-center gap-2 py-1.5 group">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              <p className="text-xs text-slate-700 flex-1 truncate">{blocker}</p>
              <button
                onClick={() => onUpdate({ blockers: (project.blockers || []).filter((_, i) => i !== idx) })}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {(!project.blockers || project.blockers.length === 0) && !showAddBlocker && (
            <p className="text-xs text-slate-400 italic">No blockers right now</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Add task */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 select-none">Add Task</span>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Task title…"
              className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <Select
              value={newTaskStatus}
              onChange={val => setNewTaskStatus(val as TaskStatus)}
              options={STATUS_OPTIONS}
              className="h-9 text-xs"
              wrapperClassName="w-24 flex-shrink-0"
            />
            <Button variant="default" size="md" onClick={addTask} className="h-9 px-3.5 flex-shrink-0">
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* Task groups */}
        {STATUS_GROUPS.map(group => {
          const tasks = project.tasks.filter(t => t.status === group.status);
          const isCollapsed = collapsedSections[group.status];
          return (
            <div key={group.status}>
              <button
                onClick={() => toggleSection(group.status)}
                className="flex items-center gap-2 w-full text-left mb-2 group"
              >
                {isCollapsed ? <ChevronRight size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                {group.icon}
                <span className="text-xs font-medium text-slate-600">{group.label}</span>
                <span className="ml-auto text-xs text-slate-400">{tasks.length}</span>
              </button>
              {!isCollapsed && (
                <div className="flex flex-col gap-1 pl-2">
                  {tasks.length === 0 && (
                    <p className="text-xs text-slate-300 italic py-1">Nothing here yet</p>
                  )}
                  {tasks.map(task => {
                    const isFocused = focusTasks.some(f => f.taskId === task.id);
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        isFocused={isFocused}
                        onUpdate={updates => updateTask(task.id, updates)}
                        onDelete={() => deleteTask(task.id)}
                        onToggleFocus={() =>
                          isFocused ? onRemoveFocusTask(task.id) : onAddFocusTask(task.id, project.id)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: ProjectTask;
  isFocused: boolean;
  onUpdate: (updates: Partial<ProjectTask>) => void;
  onDelete: () => void;
  onToggleFocus: () => void;
}

function TaskRow({ task, isFocused, onUpdate, onDelete, onToggleFocus }: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const colorClass = getStatusColor(task.status);

  const NEXT_STATUS: Record<TaskStatus, TaskStatus> = { todo: 'ongoing', ongoing: 'finished', finished: 'todo' };

  const saveTitle = () => {
    if (title.trim()) onUpdate({ title: title.trim() });
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-50 group transition-colors">
      <button
        onClick={() => onUpdate({ status: NEXT_STATUS[task.status] })}
        className={`flex-shrink-0 transition-colors ${colorClass}`}
        title="Cycle status"
      >
        {task.status === 'finished' ? (
          <CheckCircle2 size={14} className="text-emerald-500" />
        ) : task.status === 'ongoing' ? (
          <Clock size={14} className="text-blue-500" />
        ) : (
          <Circle size={14} className="text-slate-300" />
        )}
      </button>

      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(task.title); setEditing(false); } }}
          className="flex-1 text-xs border-0 outline-none bg-transparent"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-xs cursor-text ${task.status === 'finished' ? 'line-through text-slate-400' : 'text-slate-700'}`}
        >
          {task.title}
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleFocus}
          title={isFocused ? 'Remove from Today Focus' : 'Add to Today Focus'}
          className={`p-1 rounded transition-colors ${isFocused ? 'text-indigo-500' : 'text-slate-400 hover:text-indigo-500'}`}
        >
          <Target size={11} />
        </button>
        <Select
          value={task.status}
          onChange={val => onUpdate({ status: val as TaskStatus })}
          options={[
            { value: 'todo', label: 'Todo' },
            { value: 'ongoing', label: 'Ongoing' },
            { value: 'finished', label: 'Done' }
          ]}
          className="h-6 text-[10px] py-0 px-1 border-0 bg-transparent shadow-none w-18 text-slate-400 focus:ring-0 hover:bg-slate-100/30"
        />
        <button onClick={onDelete} className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors">
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
