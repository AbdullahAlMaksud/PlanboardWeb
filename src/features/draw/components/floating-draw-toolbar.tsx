'use client';
import React, { useState } from 'react';
import {
  MousePointer2, Pencil, Square, Circle, ArrowRight,
  Type, Eraser, Trash2, X, ChevronRight, ChevronLeft,
  Minus, Settings2, StickyNote as StickyIcon
} from 'lucide-react';
import { DrawTool } from '@/shared/types/canvasflow';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

const TOOLS: { key: DrawTool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { key: 'select',  icon: <MousePointer2 size={17} />, label: 'Select',  shortcut: 'V' },
  { key: 'pencil',  icon: <Pencil size={17} />,         label: 'Pencil',  shortcut: 'P' },
  { key: 'rect',    icon: <Square size={17} />,          label: 'Rect',    shortcut: 'R' },
  { key: 'ellipse', icon: <Circle size={17} />,          label: 'Circle',  shortcut: 'E' },
  { key: 'arrow',   icon: <ArrowRight size={17} />,      label: 'Arrow',   shortcut: 'A' },
  { key: 'text',    icon: <Type size={17} />,            label: 'Text',    shortcut: 'T' },
  { key: 'sticky',  icon: <StickyIcon size={17} />,      label: 'Sticky',  shortcut: 'S' },
  { key: 'eraser',  icon: <Eraser size={17} />,          label: 'Eraser',  shortcut: 'X' },
];

const STROKE_COLORS = [
  '#1e293b','#ef4444','#f97316','#eab308',
  '#22c55e','#3b82f6','#8b5cf6','#ec4899','#ffffff',
];
const FILL_COLORS = [
  'transparent','#fee2e2','#fef3c7','#dcfce7',
  '#dbeafe','#ede9fe','#fce7f3','#f1f5f9',
];
const WIDTHS = [1, 2, 4, 7, 12];

interface FloatingDrawToolbarProps {
  tool: DrawTool;
  color: string;
  fill: string;
  width: number;
  fontSize: number;
  opacity: number;
  selectedCount: number;
  onToolChange: (t: DrawTool) => void;
  onColorChange: (c: string) => void;
  onFillChange: (c: string) => void;
  onWidthChange: (w: number) => void;
  onFontSizeChange: (s: number) => void;
  onOpacityChange: (o: number) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function FloatingDrawToolbar({
  tool, color, fill, width, fontSize, opacity, selectedCount,
  onToolChange, onColorChange, onFillChange, onWidthChange,
  onFontSizeChange, onOpacityChange,
  onDeleteSelected, onClearAll, onClose,
}: FloatingDrawToolbarProps) {
  const [showOptions, setShowOptions] = useState(false);
  const needsFill = tool === 'rect' || tool === 'ellipse';
  const needsFont = tool === 'text';

  return (
    <div
      className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50"
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* Options panel — slides out ABOVE the toolbar */}
      {showOptions && (
        <div className="flex flex-col gap-4 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-60">
          {/* Stroke color */}
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Stroke</p>
            <div className="grid grid-cols-5 gap-1.5">
              {STROKE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${color === c ? 'border-indigo-500 scale-110 shadow-sm' : 'border-slate-200'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <label
                className="w-7 h-7 rounded-lg border-2 border-dashed border-slate-300 cursor-pointer flex items-center justify-center hover:border-indigo-400 transition-colors"
                title="Custom"
              >
                <input type="color" value={color} onChange={e => onColorChange(e.target.value)} className="sr-only" />
                <span className="text-[10px] text-slate-400 font-bold">+</span>
              </label>
            </div>
          </div>

          {/* Fill color */}
          {needsFill && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Fill</p>
              <div className="grid grid-cols-4 gap-1.5">
                {FILL_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => onFillChange(c)}
                    className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${fill === c ? 'border-indigo-500 scale-110' : 'border-slate-200'}`}
                    style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}
                    title={c === 'transparent' ? 'No fill' : c}
                  >
                    {c === 'transparent' && (
                      <svg viewBox="0 0 16 16" className="w-full h-full">
                        <line x1="2" y1="14" x2="14" y2="2" stroke="#ef4444" strokeWidth="1.5"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Font size */}
          {needsFont && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Font Size</p>
              <div className="grid grid-cols-3 gap-1">
                {[12,16,20,28,36,48].map(s => (
                  <button
                    key={s}
                    onClick={() => onFontSizeChange(s)}
                    className={`py-1 rounded-lg text-xs transition-colors ${fontSize === s ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stroke width */}
          {!needsFont && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Width</p>
              <div className="flex flex-col gap-1">
                {WIDTHS.map(w => (
                  <button
                    key={w}
                    onClick={() => onWidthChange(w)}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-colors ${width === w ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="rounded-full bg-slate-700 flex-shrink-0" style={{ width: Math.min(w*3,20), height: Math.min(w*3,20) }} />
                    <span className="text-[11px] text-slate-500">{w}px</span>
                    {width === w && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opacity */}
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Opacity — {Math.round(opacity * 100)}%
            </p>
            <input
              type="range" min={0.1} max={1} step={0.05}
              value={opacity}
              onChange={e => onOpacityChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Main horizontal tool strip */}
      <TooltipProvider>
        <div className="flex flex-row bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden items-center px-3 py-1.5 gap-2.5">
          {/* Exit draw button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 animate-all"
              >
                <X size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Exit draw mode (Esc)</TooltipContent>
          </Tooltip>

          <div className="h-5 w-[1px] bg-slate-200 flex-shrink-0" />

          {/* Tool buttons */}
          <div className="flex flex-row gap-0.5 items-center">
            {TOOLS.map(t => (
              <Tooltip key={t.key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onToolChange(t.key)}
                    className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all
                      ${tool === t.key
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}
                    `}
                  >
                    {t.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t.label} <span className="text-slate-400 ml-1">({t.shortcut})</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-slate-200 flex-shrink-0" />

          {/* Color swatch & Settings */}
          <div className="flex items-center flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowOptions(v => !v)}
                  className="flex items-center gap-1 group"
                >
                  <div className="relative w-8 h-8 rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    <div className="absolute inset-0" style={{ backgroundColor: color }} />
                    {needsFill && (
                      <div
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-tl-md border-t border-l border-slate-200"
                        style={{ backgroundColor: fill === 'transparent' ? '#fff' : fill }}
                      >
                        {fill === 'transparent' && (
                          <svg viewBox="0 0 16 16" className="absolute inset-0">
                            <line x1="2" y1="14" x2="14" y2="2" stroke="#ef4444" strokeWidth="1.5"/>
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  <Settings2
                    size={13}
                    className={`transition-colors ${showOptions ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>Colors & options</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 flex-shrink-0" />

          {/* Width quick select (horizontal layout) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[1,2,4,7].map(w => (
              <Tooltip key={w}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onWidthChange(w)}
                    className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all ${width === w ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  >
                    <div
                      className={`rounded-full ${width === w ? 'bg-indigo-600' : 'bg-slate-500'}`}
                      style={{ width: Math.min(w * 2 + 1, 12), height: Math.min(w * 2 + 1, 12) }}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{w}px width</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Selected delete action */}
          {selectedCount > 0 && (
            <>
              <div className="h-5 w-[1px] bg-slate-200 flex-shrink-0" />
              <div className="flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onDeleteSelected}
                      className="flex items-center justify-center w-8 h-8 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Delete {selectedCount} selected (Del)</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}

          {/* Clear all */}
          <div className="h-5 w-[1px] bg-slate-200 flex-shrink-0" />
          <div className="flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClearAll}
                  className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Eraser size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Clear all drawings</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
