'use client';

import React, { useState, useRef } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface StickyNoteProps {
  element: any; // DrawElement with type 'sticky'
  zoom: number;
  onUpdate: (changes: Partial<any>) => void;
  onDelete: () => void;
}

const STICKY_COLORS = [
  { value: '#fef3c7', bg: 'bg-amber-100/95 text-amber-950 border-amber-200/80', dot: 'bg-amber-400 hover:ring-amber-500/30' },
  { value: '#d1fae5', bg: 'bg-emerald-100/95 text-emerald-955 border-emerald-200/80', dot: 'bg-emerald-400 hover:ring-emerald-500/30' },
  { value: '#e0f2fe', bg: 'bg-sky-100/95 text-sky-955 border-sky-200/80', dot: 'bg-sky-400 hover:ring-sky-500/30' },
  { value: '#ffe4e6', bg: 'bg-rose-100/95 text-rose-955 border-rose-200/80', dot: 'bg-rose-400 hover:ring-rose-500/30' },
  { value: '#f3e8ff', bg: 'bg-purple-100/95 text-purple-955 border-purple-200/80', dot: 'bg-purple-400 hover:ring-purple-500/30' },
];

export function StickyNote({ element, zoom, onUpdate, onDelete }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const activeColorConfig = STICKY_COLORS.find(c => c.value === element.color) || STICKY_COLORS[0];

  const handlePointerDown = (e: React.PointerEvent) => {
    const handle = (e.target as HTMLElement).closest('[data-drag-handle]');
    if (!handle) return;

    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: element.x,
      oy: element.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.current.x) / zoom;
    const dy = (e.clientY - dragStart.current.y) / zoom;
    onUpdate({
      x: Math.round(dragStart.current.ox + dx),
      y: Math.round(dragStart.current.oy + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: 200,
        height: 200,
        zIndex: 30,
      }}
      className={cn(
        'flex flex-col rounded-xl border p-2.5 shadow-md transition-shadow select-none pointer-events-auto',
        activeColorConfig.bg,
        isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''
      )}
    >
      {/* Top Bar: Drag handle, Color options & Delete */}
      <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-1.5 mb-1.5">
        {/* Colors and Drag Handle */}
        <div className="flex items-center gap-1.5">
          {/* Drag Grip */}
          <div
            data-drag-handle
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-move p-0.5 rounded text-black/35 hover:text-black/60 hover:bg-black/5 transition-all"
            title="Drag note"
          >
            <GripHorizontal size={13} />
          </div>

          {/* Color pickers */}
          <div className="flex items-center gap-1">
            {STICKY_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => onUpdate({ color: c.value })}
                className={cn(
                  'w-3 h-3 rounded-full transition-all hover:scale-110 hover:ring-2 ring-offset-1',
                  c.dot,
                  element.color === c.value ? 'ring-2 ring-black/20 scale-105' : ''
                )}
                title="Change color"
              />
            ))}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="p-0.5 rounded text-black/35 hover:text-red-600 hover:bg-black/5 transition-colors"
          title="Delete note"
        >
          <X size={12} />
        </button>
      </div>

      {/* Main Text Content */}
      <textarea
        value={element.text}
        onChange={e => onUpdate({ text: e.target.value })}
        placeholder="Write a note…"
        className="flex-1 w-full bg-transparent border-0 resize-none outline-none focus:ring-0 p-0 text-xs leading-relaxed font-sans placeholder:text-black/30 text-inherit"
      />
    </div>
  );
}
