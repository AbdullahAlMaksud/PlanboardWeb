'use client';
import React, { useState } from 'react';
import { Inbox, X, Plus, ArrowRight } from 'lucide-react';
import { InboxItem, Project } from '@/shared/types/canvasflow';
import { Button } from '@/components/ui/button';
import { generateId } from '@/shared/lib/utils';

interface InboxPanelProps {
  items: InboxItem[];
  projects: Project[];
  onAdd: (item: InboxItem) => void;
  onRemove: (id: string) => void;
  onMoveToProject: (item: InboxItem, projectId: string) => void;
  onClose: () => void;
}

export function InboxPanel({ items, projects, onAdd, onRemove, onMoveToProject, onClose }: InboxPanelProps) {
  const [draft, setDraft] = useState('');
  const [movingId, setMovingId] = useState<string | null>(null);

  const addItem = () => {
    const title = draft.trim();
    if (!title) return;
    onAdd({ id: generateId(), title, createdAt: new Date().toISOString() });
    setDraft('');
  };

  return (
    <div className="absolute bottom-6 left-6 z-30 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-2">
          <Inbox size={14} className="text-amber-500" />
          <span className="text-xs font-semibold text-slate-700">Quick Inbox</span>
          {items.length > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-600 rounded-full px-1.5 py-0.5 font-medium">
              {items.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={13} />
        </Button>
      </div>

      <div className="p-3 flex flex-col gap-2 max-h-72 overflow-y-auto">
        {/* Add input */}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Capture a quick idea…"
            className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <Button variant="subtle" size="icon" onClick={addItem}>
            <Plus size={13} />
          </Button>
        </div>

        {items.length === 0 && (
          <div className="text-center py-3">
            <p className="text-xs text-slate-400">Your inbox is clear.</p>
            <p className="text-xs text-slate-300 mt-0.5">Jot ideas here and move them to projects later.</p>
          </div>
        )}

        {items.map(item => (
          <div key={item.id} className="group">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="flex-1 text-xs text-slate-700 leading-snug">{item.title}</p>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setMovingId(movingId === item.id ? null : item.id)}
                  className="text-slate-400 hover:text-indigo-500 transition-colors"
                  title="Move to project"
                >
                  <ArrowRight size={12} />
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            {movingId === item.id && (
              <div className="mt-1 ml-2 flex flex-col gap-1">
                {projects.length === 0 && <p className="text-xs text-slate-400 italic">No projects yet</p>}
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onMoveToProject(item, p.id); setMovingId(null); }}
                    className="text-left text-xs text-indigo-600 hover:text-indigo-800 py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    → {p.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
