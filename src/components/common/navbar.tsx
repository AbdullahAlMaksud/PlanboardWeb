'use client';
import React, { useRef } from 'react';
import { Layers, Pencil, Download, Upload, RotateCcw, FileText } from 'lucide-react';
import { AnimatedLogo } from '../ui/animated-logo';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface FloatingNavProps {
  activeTab: 'projects' | 'draw';
  onTabChange: (tab: 'projects' | 'draw') => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onOpenReport: () => void;
}

export function FloatingNav({
  activeTab,
  onTabChange,
  onExport,
  onImport,
  onReset,
  onOpenReport,
}: FloatingNavProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-full shadow-lg px-4 py-1.5 flex items-center gap-5 z-50 pointer-events-auto select-none max-w-[95vw]">
      {/* Brand logo & title */}
      <div className="flex items-center gap-1.5 flex-shrink-0 group cursor-pointer">
        <AnimatedLogo size={20} />
        <span className="font-bold text-slate-800 text-xs bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight group-hover:opacity-80 transition-opacity">
          CanvasFlow
        </span>
      </div>

      {/* Vertical separator */}
      <div className="h-4 w-[1px] bg-slate-200" />

      {/* Tab Select Controller */}
      <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/20">
        <button
          onClick={() => onTabChange('projects')}
          className={`px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
            activeTab === 'projects'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Layers size={12} className={activeTab === 'projects' ? 'text-indigo-500' : ''} />
          Projects
        </button>
        <button
          onClick={() => onTabChange('draw')}
          className={`px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
            activeTab === 'draw'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Pencil size={12} className={activeTab === 'draw' ? 'text-indigo-500' : ''} />
          Draw
        </button>
      </div>

      {/* Vertical separator */}
      <div className="h-4 w-[1px] bg-slate-200" />

      {/* Utility buttons */}
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {/* Import */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Upload size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Import Backup</TooltipContent>
          </Tooltip>

          {/* Export */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onExport}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Export Backup</TooltipContent>
          </Tooltip>

          {/* Work Report */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenReport}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FileText size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Work Report</TooltipContent>
          </Tooltip>

          {/* Reset */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onReset}
                className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Reset Workspace</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
