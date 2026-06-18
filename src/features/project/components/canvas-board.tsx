'use client';
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Project, DrawElement, DrawTool } from '@/shared/types/canvasflow';
import { ProjectCard } from './project-card';
import { EmptyState } from './empty-state';
import { DrawLayer } from '@/features/draw/components/draw-layer';
import { FloatingDrawToolbar } from '@/features/draw/components/floating-draw-toolbar';
import { StickyNote } from '@/features/draw/components/sticky-note';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface CanvasBoardProps {
  projects: Project[];
  selectedId: string | null;
  onSelectProject: (id: string | null) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onNewProject: () => void;
  drawMode: boolean;
  drawTool: DrawTool;
  drawColor: string;
  drawFill: string;
  drawWidth: number;
  drawFontSize: number;
  drawOpacity: number;
  drawElements: DrawElement[];
  selectedDrawIds: string[];
  onAddElement: (el: DrawElement) => void;
  onUpdateElement: (id: string, el: Partial<DrawElement>) => void;
  onDeleteElements: (ids: string[]) => void;
  onSelectDrawIds: (ids: string[]) => void;
  onToolChange: (t: DrawTool) => void;
  onColorChange: (c: string) => void;
  onFillChange: (c: string) => void;
  onWidthChange: (w: number) => void;
  onFontSizeChange: (s: number) => void;
  onOpacityChange: (o: number) => void;
  onClearAll: () => void;
  onExitDraw: () => void;
  children?: React.ReactNode;
  activeTab: 'projects' | 'draw';
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

export function CanvasBoard({
  projects, selectedId, onSelectProject, onUpdateProject, onDeleteProject, onNewProject,
  drawMode, drawTool, drawColor, drawFill, drawWidth, drawFontSize, drawOpacity,
  drawElements, selectedDrawIds,
  onAddElement, onUpdateElement, onDeleteElements, onSelectDrawIds,
  onToolChange, onColorChange, onFillChange, onWidthChange, onFontSizeChange, onOpacityChange,
  onClearAll, onExitDraw,
  children,
  activeTab,
}: CanvasBoardProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pan,  setPan]  = useState({ x: 60, y: 60 });
  const [zoom, setZoom] = useState(1);
  const panRef   = useRef({ x: 60, y: 60 });
  const zoomRef  = useRef(1);
  const isPanning  = useRef(false);
  const panStart   = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const spaceRef   = useRef(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const updateSize = () => {
      setViewportSize({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();
    const ob = new ResizeObserver(updateSize);
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  // Keep refs in sync so event handlers always see current values
  useEffect(() => { panRef.current = pan; },  [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  /* ── Wheel: Ctrl/Meta = zoom, alt = horizontal pan, plain = pan ───── */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // zoom toward cursor
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.08 : 0.93;
        setZoom(prev => {
          const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * factor));
          const ratio = next / prev;
          setPan(p => ({ x: cx - ratio * (cx - p.x), y: cy - ratio * (cy - p.y) }));
          return next;
        });
      } else if (e.altKey) {
        // alt + scroll = pan horizontally (using vertical scroll wheel input)
        setPan(p => ({ x: p.x - (e.deltaY || e.deltaX), y: p.y }));
      } else {
        // pan normally
        setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  /* ── Space key ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault(); spaceRef.current = true; setSpaceDown(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') { spaceRef.current = false; setSpaceDown(false); }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  /* ── Pan via middle-mouse or space+drag ────────────────────────────── */
  const handleViewportPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const isMiddle = e.button === 1;
    const isSpace  = spaceRef.current;
    if (!isMiddle && !isSpace) return;
    e.preventDefault();
    isPanning.current = true;
    panStart.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y };
    viewportRef.current!.setPointerCapture(e.pointerId);
  }, []);

  const handleViewportPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    setPan({
      x: panStart.current.px + e.clientX - panStart.current.mx,
      y: panStart.current.py + e.clientY - panStart.current.my,
    });
  }, []);

  const handleViewportPointerUp = useCallback(() => { isPanning.current = false; }, []);

  /* ── Zoom controls ──────────────────────────────────────────────────── */
  const zoomIn  = () => setZoom(z => Math.min(MAX_ZOOM, +(z * 1.15).toFixed(3)));
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, +(z / 1.15).toFixed(3)));
  const resetView = () => { setZoom(1); setPan({ x: 60, y: 60 }); };

  /* ── Bare-canvas click → deselect ──────────────────────────────────── */
  const handleWorldClick = useCallback((e: React.MouseEvent) => {
    if (drawMode) return;
    const target = e.target as HTMLElement;
    if (!target.closest('[data-card]')) onSelectProject(null);
  }, [drawMode, onSelectProject]);

  const handleUpdateProjectWithConnections = useCallback((id: string, updates: Partial<Project>) => {
    const project = projects.find(p => p.id === id);
    if (project && updates.position) {
      const dx = updates.position.x - project.position.x;
      const dy = updates.position.y - project.position.y;
      
      // Update any attached arrows
      drawElements.forEach(el => {
        if (el.type === 'arrow') {
          const isStartAttached = el.startAttachId === id;
          const isEndAttached = el.endAttachId === id;
          
          if (isStartAttached && isEndAttached) {
            const changes: Partial<DrawElement> = {
              x1: el.x1 + dx,
              y1: el.y1 + dy,
              x2: el.x2 + dx,
              y2: el.y2 + dy,
            };
            if (el.controlPoint) {
              changes.controlPoint = {
                x: el.controlPoint.x + dx,
                y: el.controlPoint.y + dy,
              };
            }
            onUpdateElement(el.id, changes);
          } else if (isStartAttached) {
            const changes: Partial<DrawElement> = {
              x1: el.x1 + dx,
              y1: el.y1 + dy,
            };
            if (el.controlPoint) {
              changes.controlPoint = {
                x: el.controlPoint.x + dx / 2,
                y: el.controlPoint.y + dy / 2,
              };
            }
            onUpdateElement(el.id, changes);
          } else if (isEndAttached) {
            const changes: Partial<DrawElement> = {
              x2: el.x2 + dx,
              y2: el.y2 + dy,
            };
            if (el.controlPoint) {
              changes.controlPoint = {
                x: el.controlPoint.x + dx / 2,
                y: el.controlPoint.y + dy / 2,
              };
            }
            onUpdateElement(el.id, changes);
          }
        }
      });
    }
    onUpdateProject(id, updates);
  }, [projects, drawElements, onUpdateElement, onUpdateProject]);

  const handleUpdateStickyWithConnections = useCallback((id: string, changes: any) => {
    if (changes.x !== undefined || changes.y !== undefined) {
      const orig = drawElements.find(el => el.id === id);
      if (orig && orig.type === 'sticky') {
        const dx = changes.x !== undefined ? changes.x - orig.x : 0;
        const dy = changes.y !== undefined ? changes.y - orig.y : 0;
        
        if (dx !== 0 || dy !== 0) {
          drawElements.forEach(el => {
            if (el.type === 'arrow') {
              const isStartAttached = el.startAttachId === id;
              const isEndAttached = el.endAttachId === id;
              
              if (isStartAttached && isEndAttached) {
                const arrowChanges: Partial<Extract<DrawElement, { type: 'arrow' }>> = {
                  x1: el.x1 + dx,
                  y1: el.y1 + dy,
                  x2: el.x2 + dx,
                  y2: el.y2 + dy,
                };
                if (el.controlPoint) {
                  arrowChanges.controlPoint = {
                    x: el.controlPoint.x + dx,
                    y: el.controlPoint.y + dy,
                  };
                }
                onUpdateElement(el.id, arrowChanges);
              } else if (isStartAttached) {
                const arrowChanges: Partial<Extract<DrawElement, { type: 'arrow' }>> = {
                  x1: el.x1 + dx,
                  y1: el.y1 + dy,
                };
                if (el.controlPoint) {
                  arrowChanges.controlPoint = {
                    x: el.controlPoint.x + dx / 2,
                    y: el.controlPoint.y + dy / 2,
                  };
                }
                onUpdateElement(el.id, arrowChanges);
              } else if (isEndAttached) {
                const arrowChanges: Partial<Extract<DrawElement, { type: 'arrow' }>> = {
                  x2: el.x2 + dx,
                  y2: el.y2 + dy,
                };
                if (el.controlPoint) {
                  arrowChanges.controlPoint = {
                    x: el.controlPoint.x + dx / 2,
                    y: el.controlPoint.y + dy / 2,
                  };
                }
                onUpdateElement(el.id, arrowChanges);
              }
            }
          });
        }
      }
    }
    onUpdateElement(id, changes);
  }, [drawElements, onUpdateElement]);

  const cursor = isPanning.current ? 'grabbing' : spaceDown ? 'grab' : 'default';

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#f8fafc', cursor, userSelect: 'none' }}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={handleViewportPointerUp}
    >
      {/* ── Dot-grid background (tracks pan+zoom) ───────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #c7d2e2 1.2px, transparent 1.2px)',
          backgroundSize:     `${28 * zoom}px ${28 * zoom}px`,
          backgroundPosition: `${pan.x % (28 * zoom)}px ${pan.y % (28 * zoom)}px`,
        }}
      />

      {/* ── World transform container ───────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: 1, height: 1,          // zero-size anchor; children use absolute coords
          transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        onClick={handleWorldClick}
      >
        {/* Draw canvas layer - always rendered, enabled in draw mode */}
        <DrawLayer
          elements={drawElements.filter(el => el.type !== 'sticky')}
          allElements={drawElements}
          projects={projects}
          tool={drawTool}
          color={drawColor}
          fill={drawFill}
          width={drawWidth}
          fontSize={drawFontSize}
          opacity={drawOpacity}
          enabled={activeTab === 'draw' && drawMode && !spaceDown}
          selectedIds={selectedDrawIds}
          onAddElement={onAddElement}
          onUpdateElement={onUpdateElement}
          onDeleteElements={onDeleteElements}
          onSelectIds={onSelectDrawIds}
          zoom={zoom}
          pan={pan}
          viewportSize={viewportSize}
        />

        {/* Sticky notes - always rendered */}
        {drawElements.filter(el => el.type === 'sticky').map(el => (
          <StickyNote
            key={el.id}
            element={el}
            zoom={zoom}
            onUpdate={(changes) => handleUpdateStickyWithConnections(el.id, changes)}
            onDelete={() => { onDeleteElements([el.id]); onSelectDrawIds([]); }}
          />
        ))}

        {/* Project cards */}
        {activeTab === 'projects' && projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            isSelected={selectedId === project.id}
            onSelect={() => !drawMode && onSelectProject(project.id)}
            onUpdate={updates => handleUpdateProjectWithConnections(project.id, updates)}
            onDelete={() => onDeleteProject(project.id)}
            zoom={zoom}
          />
        ))}

      </div>

      {activeTab === 'projects' && projects.length === 0 && (
        <EmptyState onNewProject={onNewProject} />
      )}

      {/* ── Floating panels: focus / inbox (fixed to viewport) ─────── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
        <div className="relative w-full h-full pointer-events-none">
          {children}
        </div>
      </div>

      {/* ── Floating draw toolbar (fixed to viewport left) ──────────── */}
      {drawMode && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
          <FloatingDrawToolbar
            tool={drawTool} color={drawColor} fill={drawFill}
            width={drawWidth} fontSize={drawFontSize} opacity={drawOpacity}
            selectedCount={selectedDrawIds.length}
            onToolChange={onToolChange} onColorChange={onColorChange}
            onFillChange={onFillChange} onWidthChange={onWidthChange}
            onFontSizeChange={onFontSizeChange} onOpacityChange={onOpacityChange}
            onDeleteSelected={() => { onDeleteElements(selectedDrawIds); onSelectDrawIds([]); }}
            onClearAll={onClearAll} onClose={onExitDraw}
          />
        </div>
      )}

      {/* ── Zoom HUD (bottom-right) ─────────────────────────────────── */}
      <div className="absolute bottom-5 right-5 z-40 flex flex-col gap-1 pointer-events-auto">
        <button onClick={zoomIn} title="Zoom in (Ctrl+scroll)"
          className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
          <ZoomIn size={14} />
        </button>
        <button onClick={resetView} title="Reset view"
          className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={zoomOut} title="Zoom out"
          className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
          <ZoomOut size={14} />
        </button>
      </div>

      {/* ── Bottom hint ─────────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <span className="text-[10px] text-slate-400 bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-slate-100 shadow-sm">
          Scroll to pan · Ctrl+Scroll to zoom · Space+drag or middle-mouse to pan
        </span>
      </div>
    </div>
  );
}
