'use client';
import React, { useState } from 'react';
import {
  MousePointer2, Pencil, Square, Circle, ArrowRight,
  Type, Eraser, Trash2, X, Minus, ChevronDown,
} from 'lucide-react';
import { DrawTool } from '@/shared/types/canvasflow';

const TOOLS: { key: DrawTool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { key: 'select',  icon: <MousePointer2 size={15} />, label: 'Select',  shortcut: 'V' },
  { key: 'pencil',  icon: <Pencil size={15} />,        label: 'Pencil',  shortcut: 'P' },
  { key: 'rect',    icon: <Square size={15} />,         label: 'Rect',    shortcut: 'R' },
  { key: 'ellipse', icon: <Circle size={15} />,         label: 'Ellipse', shortcut: 'E' },
  { key: 'arrow',   icon: <ArrowRight size={15} />,     label: 'Arrow',   shortcut: 'A' },
  { key: 'text',    icon: <Type size={15} />,           label: 'Text',    shortcut: 'T' },
  { key: 'eraser',  icon: <Eraser size={15} />,         label: 'Eraser',  shortcut: 'Del' },
];

const STROKE_COLORS = [
  '#1e293b', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ffffff',
];

const FILL_COLORS = [
  'transparent', '#fee2e2', '#fef3c7', '#dcfce7',
  '#dbeafe',    '#ede9fe', '#fce7f3', '#f1f5f9',
];

const WIDTHS = [1, 2, 4, 7, 12];

interface DrawToolbarProps {
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

export function DrawToolbar({
  tool, color, fill, width, fontSize, opacity, selectedCount,
  onToolChange, onColorChange, onFillChange, onWidthChange,
  onFontSizeChange, onOpacityChange,
  onDeleteSelected, onClearAll, onClose,
}: DrawToolbarProps) {
  const [showMore, setShowMore] = useState(false);

  const needsFill = tool === 'rect' || tool === 'ellipse';
  const needsFont = tool === 'text';

  return (
    <div
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
      style={{ pointerEvents: 'all' }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* secondary panel */}
      {showMore && (
        <div className="flex items-start gap-4 bg-white/98 backdrop-blur border border-slate-200 rounded-2xl px-5 py-3 shadow-xl">
          {/* stroke color */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Stroke</span>
            <div className="grid grid-cols-3 gap-1">
              {STROKE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${color === c ? 'border-indigo-500 scale-110' : 'border-slate-200'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              {/* custom color */}
              <label className="w-6 h-6 rounded-md border-2 border-dashed border-slate-300 cursor-pointer flex items-center justify-center hover:border-indigo-400 transition-colors overflow-hidden" title="Custom color">
                <input type="color" value={color} onChange={e => onColorChange(e.target.value)} className="opacity-0 absolute w-1 h-1" />
                <span className="text-[9px] text-slate-400">+</span>
              </label>
            </div>
          </div>

          {/* fill color */}
          {needsFill && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Fill</span>
              <div className="grid grid-cols-4 gap-1">
                {FILL_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => onFillChange(c)}
                    className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${fill === c ? 'border-indigo-500 scale-110' : 'border-slate-200'}`}
                    style={{ backgroundColor: c === 'transparent' ? undefined : c }}
                    title={c === 'transparent' ? 'No fill' : c}
                  >
                    {c === 'transparent' && (
                      <svg viewBox="0 0 24 24" className="w-full h-full"><line x1="4" y1="20" x2="20" y2="4" stroke="#ef4444" strokeWidth="2"/></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* stroke width */}
          {!needsFont && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Width</span>
              <div className="flex flex-col gap-1">
                {WIDTHS.map(w => (
                  <button
                    key={w}
                    onClick={() => onWidthChange(w)}
                    className={`flex items-center gap-2 px-2 py-0.5 rounded-lg transition-colors ${width === w ? 'bg-indigo-100' : 'hover:bg-slate-100'}`}
                  >
                    <div
                      className="rounded-full bg-slate-700"
                      style={{ width: Math.min(w * 3, 20), height: Math.min(w * 3, 20) }}
                    />
                    <span className="text-[10px] text-slate-500">{w}px</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* font size */}
          {needsFont && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Size</span>
              <div className="flex flex-col gap-1">
                {[12, 16, 20, 28, 36, 48].map(s => (
                  <button
                    key={s}
                    onClick={() => onFontSizeChange(s)}
                    className={`px-3 py-0.5 rounded-lg text-xs transition-colors ${fontSize === s ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* opacity */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Opacity</span>
            <input
              type="range" min={0.1} max={1} step={0.05}
              value={opacity}
              onChange={e => onOpacityChange(parseFloat(e.target.value))}
              className="w-20 accent-indigo-500"
            />
            <span className="text-[10px] text-slate-400 text-center">{Math.round(opacity * 100)}%</span>
          </div>
        </div>
      )}

      {/* main toolbar */}
      <div className="flex items-center gap-1 bg-white/98 backdrop-blur border border-slate-200 rounded-2xl px-3 py-2 shadow-xl">
        {/* tools */}
        <div className="flex items-center gap-0.5 pr-3 border-r border-slate-200">
          {TOOLS.map(t => (
            <button
              key={t.key}
              onClick={() => onToolChange(t.key)}
              title={`${t.label} (${t.shortcut})`}
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all
                ${tool === t.key
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}
              `}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* current color preview */}
        <div className="flex items-center gap-2 px-3 border-r border-slate-200">
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="w-5 h-5 rounded-md border-2 border-slate-300 cursor-pointer hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: color }}
              onClick={() => setShowMore(v => !v)}
              title="Stroke color"
            />
            {needsFill && (
              <div
                className="w-4 h-4 rounded border-2 border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: fill === 'transparent' ? '#fff' : fill }}
                onClick={() => setShowMore(v => !v)}
                title="Fill color"
              >
                {fill === 'transparent' && (
                  <svg viewBox="0 0 16 16"><line x1="2" y1="14" x2="14" y2="2" stroke="#ef4444" strokeWidth="1.5"/></svg>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowMore(v => !v)}
            className={`text-slate-400 hover:text-slate-700 transition-colors ${showMore ? 'text-indigo-500' : ''}`}
            title="More options"
          >
            <ChevronDown size={13} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* width quick pick */}
        <div className="flex items-center gap-1 px-3 border-r border-slate-200">
          {[1, 2, 4, 7].map(w => (
            <button
              key={w}
              onClick={() => onWidthChange(w)}
              title={`${w}px`}
              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${width === w ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            >
              <div className="rounded-full bg-slate-700" style={{ width: Math.min(w * 2.5, 16), height: Math.min(w * 2.5, 16) }} />
            </button>
          ))}
        </div>

        {/* selected actions */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-1 px-3 border-r border-slate-200">
            <span className="text-xs text-indigo-600 font-medium">{selectedCount} selected</span>
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete selected (Del)"
            >
              <Trash2 size={12} /> Del
            </button>
          </div>
        )}

        {/* clear + close */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="Clear all drawings"
          >
            <Trash2 size={13} />
            Clear
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            title="Exit draw mode (Esc)"
          >
            <X size={13} /> Exit
          </button>
        </div>
      </div>

      {/* shortcut hint */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        {TOOLS.slice(0, 6).map(t => (
          <span key={t.key}><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">{t.shortcut}</kbd> {t.label}</span>
        ))}
        <span><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">Del</kbd> Erase sel.</span>
      </div>
    </div>
  );
}
