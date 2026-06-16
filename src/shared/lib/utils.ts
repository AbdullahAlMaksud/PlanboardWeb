import { ProjectPriority, TaskStatus, CardSize } from '@/shared/types/canvasflow';

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getPriorityColor(priority: ProjectPriority): {
  badge: string;
  border: string;
  accent: string;
  dot: string;
} {
  switch (priority) {
    case 'urgent':
      return {
        badge: 'bg-red-50 text-red-600 border-red-200',
        border: 'border-red-200',
        accent: 'bg-red-500',
        dot: 'bg-red-500',
      };
    case 'high':
      return {
        badge: 'bg-orange-50 text-orange-600 border-orange-200',
        border: 'border-orange-200',
        accent: 'bg-orange-500',
        dot: 'bg-orange-500',
      };
    case 'medium':
      return {
        badge: 'bg-blue-50 text-blue-600 border-blue-200',
        border: 'border-blue-200',
        accent: 'bg-blue-500',
        dot: 'bg-blue-500',
      };
    case 'low':
      return {
        badge: 'bg-slate-50 text-slate-500 border-slate-200',
        border: 'border-slate-200',
        accent: 'bg-slate-400',
        dot: 'bg-slate-400',
      };
  }
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'todo': return 'text-slate-500';
    case 'ongoing': return 'text-blue-600';
    case 'finished': return 'text-emerald-600';
  }
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'todo': return 'Todo';
    case 'ongoing': return 'Ongoing';
    case 'finished': return 'Finished';
  }
}

export function getCardDimensions(size: CardSize, custom?: { width: number; height: number }): { width: number; height: number } {
  if (custom) return custom;
  switch (size) {
    case 'small': return { width: 320, height: 360 };
    case 'medium': return { width: 380, height: 460 };
    case 'large': return { width: 440, height: 560 };
  }
}

export function calcProgress(tasks: { status: TaskStatus }[]): number {
  if (tasks.length === 0) return 0;
  const finished = tasks.filter(t => t.status === 'finished').length;
  return Math.round((finished / tasks.length) * 100);
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

