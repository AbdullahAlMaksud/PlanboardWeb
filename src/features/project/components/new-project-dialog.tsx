'use client';
import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectField as Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Project, ProjectPriority, CardSize } from '@/shared/types/canvasflow';
import { generateId } from '@/shared/lib/utils';

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
  canvasCenter: { x: number; y: number };
}

const PRIORITY_OPTIONS = [
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

export function NewProjectDialog({ open, onClose, onCreate, canvasCenter }: NewProjectDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [size, setSize] = useState<CardSize>('medium');

  const handleCreate = () => {
    const t = title.trim();
    if (!t) return;
    const now = new Date().toISOString();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const project: Project = {
      id: generateId(),
      title: t,
      description: description.trim(),
      priority,
      notes: '',
      links: [],
      tasks: [],
      position: {
        x: Math.max(20, canvasCenter.x - 190 + (Math.random() - 0.5) * 80),
        y: Math.max(20, canvasCenter.y - 230 + (Math.random() - 0.5) * 60),
      },
      size,
      pinned: false,
      date: todayStr,
      minimized: false,
      blockers: [],
      createdAt: now,
      updatedAt: now,
    };
    onCreate(project);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setSize('medium');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="New Project">
      <div className="flex flex-col gap-4">
        <Input
          label="Project Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Portfolio Website"
          autoFocus
        />
        <Textarea
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What's this project about?"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={v => setPriority(v as ProjectPriority)}
          />
          <Select
            label="Card Size"
            options={SIZE_OPTIONS}
            value={size}
            onChange={v => setSize(v as CardSize)}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="default" size="md" onClick={handleCreate} className="flex-1">
            Create Project
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
