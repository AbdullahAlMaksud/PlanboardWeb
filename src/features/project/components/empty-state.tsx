'use client';
import React from 'react';
import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onNewProject: () => void;
}

export function EmptyState({ onNewProject }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none select-none">
      <div className="flex flex-col items-center gap-5 max-w-md w-full px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center shadow-sm">
          <Layers size={28} className="text-indigo-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">Your canvas is empty</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Create your first project to get started. Cards live wherever you drop them.
          </p>
        </div>
        <div className="pointer-events-auto">
          <Button variant="default" size="md" onClick={onNewProject}>
            <Plus size={15} />
            Create first project
          </Button>
        </div>
        <p className="text-xs text-slate-300">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-mono text-[10px]">N</kbd> to create a project</p>
      </div>
    </div>
  );
}
