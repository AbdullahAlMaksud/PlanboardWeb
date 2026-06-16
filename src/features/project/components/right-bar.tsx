'use client';
import React, { useRef } from 'react';
import { Layers, Pencil, Download, Upload, RotateCcw } from 'lucide-react';

interface RightBarProps {
  activeTab: 'projects' | 'draw';
  onTabChange: (tab: 'projects' | 'draw') => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export function RightBar({
  activeTab,
  onTabChange,
  onExport,
  onImport,
  onReset,
}: RightBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="w-16 h-full flex flex-col justify-between items-center py-4 bg-white border-l border-slate-100 shadow-[ -1px_0_10px_rgba(0,0,0,0.02) ] z-30 flex-shrink-0">
      {/* Top Section: Tabs */}
      <div className="flex flex-col gap-4 w-full items-center">
        {/* Projects Tab */}
        <button
          onClick={() => onTabChange('projects')}
          title="Project Tracker"
          className={`relative p-3 rounded-xl transition-all duration-200 group ${
            activeTab === 'projects'
              ? 'text-indigo-600 bg-indigo-50/80 shadow-sm shadow-indigo-100/50'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers size={20} className="stroke-[2px]" />
          {/* Tooltip */}
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Projects
          </span>
          {activeTab === 'projects' && (
            <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-l-md" />
          )}
        </button>

        {/* Draw Tab */}
        <button
          onClick={() => onTabChange('draw')}
          title="Drawing Canvas"
          className={`relative p-3 rounded-xl transition-all duration-200 group ${
            activeTab === 'draw'
              ? 'text-indigo-600 bg-indigo-50/80 shadow-sm shadow-indigo-100/50'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Pencil size={20} className="stroke-[2px]" />
          {/* Tooltip */}
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Draw
          </span>
          {activeTab === 'draw' && (
            <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-l-md" />
          )}
        </button>
      </div>

      {/* Bottom Section: Actions */}
      <div className="flex flex-col gap-3 w-full items-center">
        {/* Export */}
        <button
          onClick={onExport}
          title="Export Workspace"
          className="relative p-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all group"
        >
          <Download size={18} />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Export
          </span>
        </button>

        {/* Import */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Workspace"
          className="relative p-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all group"
        >
          <Upload size={18} />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Import
          </span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          title="Reset Workspace"
          className="relative p-2.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all group"
        >
          <RotateCcw size={18} />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Reset
          </span>
        </button>

        {/* Hidden Input for Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
