'use client';
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { DrawElement, DrawTool, Point, Project } from '@/shared/types/canvasflow';
import { generateId } from '@/shared/lib/utils';

interface DrawLayerProps {
  elements: DrawElement[];
  tool: DrawTool;
  color: string;
  fill: string;
  width: number;
  fontSize: number;
  opacity: number;
  enabled: boolean;
  selectedIds: string[];
  zoom?: number;
  onAddElement: (el: DrawElement) => void;
  onUpdateElement: (id: string, el: Partial<DrawElement>) => void;
  onDeleteElements: (ids: string[]) => void;
  onSelectIds: (ids: string[]) => void;
  allElements?: DrawElement[];
  projects?: Project[];
  pan?: { x: number; y: number };
  viewportSize?: { width: number; height: number };
}

const CANVAS_SIZE = 8000;

function hitTest(el: DrawElement, x: number, y: number, pad = 8): boolean {
  if (el.type === 'stroke')  return el.points.some(p => Math.hypot(p.x-x,p.y-y) < pad+el.width);
  if (el.type === 'rect' || el.type === 'ellipse') return x>=el.x-pad && x<=el.x+el.w+pad && y>=el.y-pad && y<=el.y+el.h+pad;
  if (el.type === 'arrow') {
    if (el.controlPoint) {
      let minDistance = Infinity;
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const bx = (1 - t) * (1 - t) * el.x1 + 2 * (1 - t) * t * el.controlPoint.x + t * t * el.x2;
        const by = (1 - t) * (1 - t) * el.y1 + 2 * (1 - t) * t * el.controlPoint.y + t * t * el.y2;
        const dist = Math.hypot(bx - x, by - y);
        if (dist < minDistance) minDistance = dist;
      }
      return minDistance < pad + el.width;
    } else {
      const dx=el.x2-el.x1,dy=el.y2-el.y1,len=Math.hypot(dx,dy);
      if(!len) return false;
      const t=Math.max(0,Math.min(1,((x-el.x1)*dx+(y-el.y1)*dy)/(len*len)));
      return Math.hypot(x-(el.x1+t*dx),y-(el.y1+t*dy))<pad+el.width;
    }
  }
  if (el.type === 'text')    return x>=el.x-pad && x<=el.x+el.text.length*el.fontSize*0.6+pad && y>=el.y-pad && y<=el.y+el.fontSize*1.4+pad;
  return false;
}

function renderEl(ctx: CanvasRenderingContext2D, el: DrawElement, selected=false) {
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  if (el.type==='stroke') {
    if (el.points.length<2) { ctx.restore(); return; }
    ctx.strokeStyle=el.color; ctx.lineWidth=el.width; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath(); ctx.moveTo(el.points[0].x,el.points[0].y);
    for (let i=1;i<el.points.length;i++) {
      const p=el.points[i-1],c=el.points[i];
      ctx.quadraticCurveTo(p.x,p.y,(p.x+c.x)/2,(p.y+c.y)/2);
    }
    ctx.stroke();
  } else if (el.type==='rect') {
    ctx.strokeStyle=el.color; ctx.lineWidth=el.width;
    ctx.fillStyle=el.fill==='transparent'?'transparent':el.fill;
    ctx.beginPath(); ctx.roundRect(el.x,el.y,el.w,el.h,4);
    if (el.fill!=='transparent') ctx.fill(); ctx.stroke();
  } else if (el.type==='ellipse') {
    ctx.strokeStyle=el.color; ctx.lineWidth=el.width;
    ctx.fillStyle=el.fill==='transparent'?'transparent':el.fill;
    ctx.beginPath(); ctx.ellipse(el.x+el.w/2,el.y+el.h/2,Math.abs(el.w/2),Math.abs(el.h/2),0,0,Math.PI*2);
    if (el.fill!=='transparent') ctx.fill(); ctx.stroke();
  } else if (el.type==='arrow') {
    ctx.strokeStyle=el.color; ctx.fillStyle=el.color; ctx.lineWidth=el.width; ctx.lineCap='round';
    const ang = el.controlPoint 
      ? Math.atan2(el.y2 - el.controlPoint.y, el.x2 - el.controlPoint.x)
      : Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
    const head=Math.max(12,el.width*4);
    const lineX2 = el.x2 - head * Math.cos(ang) * Math.cos(Math.PI / 6);
    const lineY2 = el.y2 - head * Math.sin(ang) * Math.cos(Math.PI / 6);
    ctx.beginPath(); ctx.moveTo(el.x1,el.y1);
    if (el.controlPoint) {
      ctx.quadraticCurveTo(el.controlPoint.x, el.controlPoint.y, lineX2, lineY2);
    } else {
      ctx.lineTo(lineX2,lineY2);
    }
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(el.x2,el.y2);
    ctx.lineTo(el.x2-head*Math.cos(ang-Math.PI/6),el.y2-head*Math.sin(ang-Math.PI/6));
    ctx.lineTo(el.x2-head*Math.cos(ang+Math.PI/6),el.y2-head*Math.sin(ang+Math.PI/6));
    ctx.closePath(); ctx.fill();
  } else if (el.type==='text') {
    ctx.font=`${el.fontSize}px -apple-system,BlinkMacSystemFont,sans-serif`;
    ctx.fillStyle=el.color; ctx.textBaseline='top';
    el.text.split('\n').forEach((ln,i)=>ctx.fillText(ln,el.x,el.y+i*el.fontSize*1.3));
  }
  if (selected) {
    ctx.globalAlpha=0.35; ctx.strokeStyle='#6366f1'; ctx.lineWidth=2; ctx.setLineDash([4,3]);
    if (el.type==='stroke') {
      const xs=el.points.map(p=>p.x),ys=el.points.map(p=>p.y);
      ctx.strokeRect(Math.min(...xs)-6,Math.min(...ys)-6,Math.max(...xs)-Math.min(...xs)+12,Math.max(...ys)-Math.min(...ys)+12);
    } else if (el.type==='rect'||el.type==='ellipse') {
      ctx.strokeRect(el.x-4,el.y-4,el.w+8,el.h+8);
    } else if (el.type==='arrow') {
      ctx.strokeRect(Math.min(el.x1,el.x2)-6,Math.min(el.y1,el.y2)-6,Math.abs(el.x2-el.x1)+12,Math.abs(el.y2-el.y1)+12);
    } else if (el.type==='text') {
      ctx.strokeRect(el.x-4,el.y-4,el.text.length*el.fontSize*0.6+8,el.fontSize*1.4+8);
    }
    ctx.setLineDash([]);
  }
  ctx.restore();
}

export function DrawLayer({
  elements, tool, color, fill, width, fontSize, opacity,
  enabled, selectedIds, zoom=1,
  onAddElement, onUpdateElement, onDeleteElements, onSelectIds,
  allElements, projects,
  pan, viewportSize,
}: DrawLayerProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const currentPts  = useRef<Point[]>([]);
  const isDrawing   = useRef(false);
  const draftRef    = useRef<{ type: DrawTool; sx:number; sy:number; cx:number; cy:number }|null>(null);
  const dragSel     = useRef<{sx:number;sy:number;cx:number;cy:number}|null>(null);
  const moveStart   = useRef<{ox:number;oy:number;snaps:DrawElement[]}|null>(null);
  const dragControlRef = useRef<{ id: string }|null>(null);
  const resizeStartRef = useRef<{
    id: string;
    handle: 'tl' | 'tr' | 'bl' | 'br';
    ox: number;
    oy: number;
    ow: number;
    oh: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [textInput, setTextInput] = useState<{x:number;y:number;val:string}|null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const getCardBounds = (proj: Project) => {
    let w = 320, h = 400;
    if (proj.size === 'small') { w = 280; h = 180; }
    else if (proj.size === 'medium') { w = 320; h = 400; }
    else if (proj.size === 'large') { w = 420; h = 550; }
    if (proj.customSize) { w = proj.customSize.width; h = proj.customSize.height; }
    if (proj.minimized) h = 40;
    return { x1: proj.position.x, y1: proj.position.y, x2: proj.position.x + w, y2: proj.position.y + h };
  };

  const getClosestPointOnRect = (px: number, py: number, rx1: number, ry1: number, rx2: number, ry2: number) => {
    const x1 = Math.min(rx1, rx2);
    const x2 = Math.max(rx1, rx2);
    const y1 = Math.min(ry1, ry2);
    const y2 = Math.max(ry1, ry2);
    
    const cx = Math.max(x1, Math.min(px, x2));
    const cy = Math.max(y1, Math.min(py, y2));
    if (cx !== px || cy !== py) return { x: cx, y: cy };
    
    const dLeft = px - x1;
    const dRight = x2 - px;
    const dTop = py - y1;
    const dBottom = y2 - py;
    const minDist = Math.min(dLeft, dRight, dTop, dBottom);
    if (minDist === dLeft) return { x: x1, y: py };
    if (minDist === dRight) return { x: x2, y: py };
    if (minDist === dTop) return { x: px, y: y1 };
    return { x: px, y: y2 };
  };

  const findAttachment = (px: number, py: number): { id: string; x: number; y: number } | null => {
    let bestDist = 24;
    let bestSnap: { id: string; x: number; y: number } | null = null;

    if (projects) {
      projects.forEach(proj => {
        const bounds = getCardBounds(proj);
        const x1 = Math.min(bounds.x1, bounds.x2);
        const x2 = Math.max(bounds.x1, bounds.x2);
        const y1 = Math.min(bounds.y1, bounds.y2);
        const y2 = Math.max(bounds.y1, bounds.y2);
        const isInside = px >= x1 && px <= x2 && py >= y1 && py <= y2;
        
        const snap = getClosestPointOnRect(px, py, x1, y1, x2, y2);
        const dist = isInside ? 0 : Math.hypot(px - snap.x, py - snap.y);
        
        if (dist < bestDist) {
          bestDist = dist;
          bestSnap = { id: proj.id, x: snap.x, y: snap.y };
        }
      });
    }

    if (allElements) {
      allElements.forEach(el => {
        if (el.type === 'sticky') {
          const x1 = el.x, y1 = el.y, x2 = el.x + 200, y2 = el.y + 200;
          const isInside = px >= x1 && px <= x2 && py >= y1 && py <= y2;
          
          const snap = getClosestPointOnRect(px, py, x1, y1, x2, y2);
          const dist = isInside ? 0 : Math.hypot(px - snap.x, py - snap.y);
          
          if (dist < bestDist) {
            bestDist = dist;
            bestSnap = { id: el.id, x: snap.x, y: snap.y };
          }
        } else if (el.type === 'rect' || el.type === 'ellipse') {
          const x1 = Math.min(el.x, el.x + el.w);
          const x2 = Math.max(el.x, el.x + el.w);
          const y1 = Math.min(el.y, el.y + el.h);
          const y2 = Math.max(el.y, el.y + el.h);
          const isInside = px >= x1 && px <= x2 && py >= y1 && py <= y2;
          
          const snap = getClosestPointOnRect(px, py, el.x, el.y, el.x + el.w, el.y + el.h);
          const dist = isInside ? 0 : Math.hypot(px - snap.x, py - snap.y);
          
          if (dist < bestDist) {
            bestDist = dist;
            bestSnap = { id: el.id, x: snap.x, y: snap.y };
          }
        }
      });
    }

    return bestSnap;
  };

  const findClickedResizeHandle = (pos: Point) => {
    for (const id of selectedIds) {
      const el = elements.find(e => e.id === id);
      if (el && (el.type === 'rect' || el.type === 'ellipse')) {
        const handleSize = 8 / zoom;
        const pad = 6 / zoom;
        const x = el.x;
        const y = el.y;
        const w = el.w;
        const h = el.h;

        const handles: { name: 'tl' | 'tr' | 'bl' | 'br'; hx: number; hy: number }[] = [
          { name: 'tl', hx: x, hy: y },
          { name: 'tr', hx: x + w, hy: y },
          { name: 'bl', hx: x, hy: y + h },
          { name: 'br', hx: x + w, hy: y + h },
        ];

        for (const hd of handles) {
          if (Math.hypot(pos.x - hd.hx, pos.y - hd.hy) < (handleSize + pad)) {
            return { id, handle: hd.name, el };
          }
        }
      }
    }
    return null;
  };

  const recalculateArrowAttachments = (targetId: string, updatedEl?: any) => {
    allElements?.forEach(el => {
      if (el.type === 'arrow') {
        const isStartAttached = el.startAttachId === targetId;
        const isEndAttached = el.endAttachId === targetId;
        if (!isStartAttached && !isEndAttached) return;

        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        if (updatedEl) {
          if (updatedEl.type === 'sticky') {
            x1 = updatedEl.x; y1 = updatedEl.y; x2 = updatedEl.x + 200; y2 = updatedEl.y + 200;
          } else {
            x1 = updatedEl.x; y1 = updatedEl.y; x2 = updatedEl.x + updatedEl.w; y2 = updatedEl.y + updatedEl.h;
          }
        } else {
          const shape = elements.find(e => e.id === targetId) || allElements?.find(e => e.id === targetId);
          if (!shape) return;
          if (shape.type === 'sticky') {
            x1 = shape.x; y1 = shape.y; x2 = shape.x + 200; y2 = shape.y + 200;
          } else if (shape.type === 'rect' || shape.type === 'ellipse') {
            x1 = shape.x; y1 = shape.y; x2 = shape.x + shape.w; y2 = shape.y + shape.h;
          } else {
            return;
          }
        }

        const changes: Partial<Extract<DrawElement, { type: 'arrow' }>> = {};

        if (isStartAttached) {
          const targetRef = el.controlPoint || { x: el.x2, y: el.y2 };
          const snap = getClosestPointOnRect(targetRef.x, targetRef.y, x1, y1, x2, y2);
          changes.x1 = snap.x;
          changes.y1 = snap.y;
        }

        if (isEndAttached) {
          const targetRef = el.controlPoint || { x: el.x1, y: el.y1 };
          const snap = getClosestPointOnRect(targetRef.x, targetRef.y, x1, y1, x2, y2);
          changes.x2 = snap.x;
          changes.y2 = snap.y;
        }

        onUpdateElement(el.id, changes);
      }
    });
  };

  const updateAttachedArrows = (elementId: string, dx: number, dy: number) => {
    allElements?.forEach(el => {
      if (el.type === 'arrow') {
        const isStartAttached = el.startAttachId === elementId;
        const isEndAttached = el.endAttachId === elementId;
        
        if (isStartAttached && isEndAttached) {
          const changes: Partial<DrawElement> = {
            x1: el.x1 + dx,
            y1: el.y1 + dy,
            x2: el.x2 + dx,
            y2: el.y2 + dy
          };
          if (el.controlPoint) {
            changes.controlPoint = {
              x: el.controlPoint.x + dx,
              y: el.controlPoint.y + dy
            };
          }
          onUpdateElement(el.id, changes);
        } else if (isStartAttached) {
          const changes: Partial<DrawElement> = {
            x1: el.x1 + dx,
            y1: el.y1 + dy
          };
          if (el.controlPoint) {
            changes.controlPoint = {
              x: el.controlPoint.x + dx / 2,
              y: el.controlPoint.y + dy / 2
            };
          }
          onUpdateElement(el.id, changes);
        } else if (isEndAttached) {
          const changes: Partial<DrawElement> = {
            x2: el.x2 + dx,
            y2: el.y2 + dy
          };
          if (el.controlPoint) {
            changes.controlPoint = {
              x: el.controlPoint.x + dx / 2,
              y: el.controlPoint.y + dy / 2
            };
          }
          onUpdateElement(el.id, changes);
        }
      }
    });
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext('2d'); if(!ctx) return;
    
    const w = viewportSize?.width ?? 1200;
    const h = viewportSize?.height ?? 800;
    const z = zoom;
    const px = pan?.x ?? 0;
    const py = pan?.y ?? 0;
    const minX = -px / z;
    const minY = -py / z;

    ctx.clearRect(0, 0, w, h);
    
    ctx.save();
    ctx.scale(z, z);
    ctx.translate(-minX, -minY);

    elements.forEach(el => renderEl(ctx, el, selectedIds.includes(el.id)));

    // selected arrow control point handles (rendering blue handles to bend arrows)
    selectedIds.forEach(id => {
      const el = elements.find(e => e.id === id) || allElements?.find(e => e.id === id);
      if (el && el.type === 'arrow') {
        const cx = el.controlPoint ? el.controlPoint.x : (el.x1 + el.x2) / 2;
        const cy = el.controlPoint ? el.controlPoint.y : (el.y1 + el.y2) / 2;
        
        ctx.save();
        ctx.fillStyle = '#6366f1';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 / z;
        ctx.beginPath();
        ctx.arc(cx, cy, 6 / z, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    });

    // selected shape resize handles
    selectedIds.forEach(id => {
      const el = elements.find(e => e.id === id);
      if (el && (el.type === 'rect' || el.type === 'ellipse')) {
        const x = el.x;
        const y = el.y;
        const w_el = el.w;
        const h_el = el.h;
        const handleSize = 7 / z;
        
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.5 / z;

        const handles = [
          { hx: x, hy: y },
          { hx: x + w_el, hy: y },
          { hx: x, hy: y + h_el },
          { hx: x + w_el, hy: y + h_el }
        ];

        handles.forEach(hd => {
          ctx.beginPath();
          ctx.rect(hd.hx - handleSize / 2, hd.hy - handleSize / 2, handleSize, handleSize);
          ctx.fill();
          ctx.stroke();
        });
        ctx.restore();
      }
    });

    // draft pencil
    if (draftRef.current?.type==='pencil' && currentPts.current.length>1) {
      ctx.save(); ctx.globalAlpha=opacity; ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.beginPath(); ctx.moveTo(currentPts.current[0].x,currentPts.current[0].y);
      for (let i=1;i<currentPts.current.length;i++) {
        const p=currentPts.current[i-1],c=currentPts.current[i];
        ctx.quadraticCurveTo(p.x,p.y,(p.x+c.x)/2,(p.y+c.y)/2);
      }
      ctx.stroke(); ctx.restore();
    }

    // draft shape
    const d=draftRef.current;
    if (d && ['rect','ellipse','arrow'].includes(d.type)) {
      ctx.save(); ctx.globalAlpha=opacity*0.8;
      ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.setLineDash([5,3]);
      const x=Math.min(d.sx,d.cx),y=Math.min(d.sy,d.cy),w_val=Math.abs(d.cx-d.sx),h_val=Math.abs(d.cy-d.sy);
      if (d.type==='rect') {
        ctx.fillStyle=fill==='transparent'?'transparent':fill;
        ctx.beginPath(); ctx.roundRect(x,y,w_val,h_val,4);
        if (fill!=='transparent') ctx.fill(); ctx.stroke();
      } else if (d.type==='ellipse') {
        ctx.fillStyle=fill==='transparent'?'transparent':fill;
        ctx.beginPath(); ctx.ellipse(x+w_val/2,y+h_val/2,w_val/2,h_val/2,0,0,Math.PI*2);
        if (fill!=='transparent') ctx.fill(); ctx.stroke();
      } else if (d.type==='arrow') {
        ctx.setLineDash([]); ctx.fillStyle=color;
        const ang=Math.atan2(d.cy-d.sy,d.cx-d.sx),head=Math.max(12,width*4);
        const lineX2 = d.cx - head * Math.cos(ang) * Math.cos(Math.PI / 6);
        const lineY2 = d.cy - head * Math.sin(ang) * Math.cos(Math.PI / 6);
        ctx.beginPath(); ctx.moveTo(d.sx,d.sy); ctx.lineTo(lineX2,lineY2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(d.cx,d.cy);
        ctx.lineTo(d.cx-head*Math.cos(ang-Math.PI/6),d.cy-head*Math.sin(ang-Math.PI/6));
        ctx.lineTo(d.cx-head*Math.cos(ang+Math.PI/6),d.cy-head*Math.sin(ang+Math.PI/6));
        ctx.closePath(); ctx.fill();
      }
      ctx.setLineDash([]); ctx.restore();
    }

    // drag-select box
    if (dragSel.current) {
      const ds=dragSel.current;
      const x=Math.min(ds.sx,ds.cx),y=Math.min(ds.sy,ds.cy),w_val=Math.abs(ds.cx-ds.sx),h_val=Math.abs(ds.cy-ds.sy);
      ctx.save(); ctx.globalAlpha=0.12; ctx.fillStyle='#6366f1'; ctx.fillRect(x,y,w_val,h_val);
      ctx.globalAlpha=0.5; ctx.strokeStyle='#6366f1'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.strokeRect(x,y,w_val,h_val);
      ctx.setLineDash([]); ctx.restore();
    }

    ctx.restore();
  }, [elements, selectedIds, color, fill, width, opacity, allElements, zoom, pan, viewportSize]);

  useEffect(() => { redraw(); }, [redraw]);

  const getPos = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const z = zoom;
    const px = pan?.x ?? 0;
    const py = pan?.y ?? 0;
    const minX = -px / z;
    const minY = -py / z;
    return {
      x: minX + (e.clientX - rect.left) / z,
      y: minY + (e.clientY - rect.top) / z
    };
  };

  const erase = useCallback((pos:Point) => {
    const ids = elements.filter(el=>hitTest(el,pos.x,pos.y,12)).map(el=>el.id);
    if (ids.length) onDeleteElements(ids);
  }, [elements,onDeleteElements]);

  const handleDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault(); e.stopPropagation();
    const pos = getPos(e);
    canvasRef.current!.setPointerCapture(e.pointerId);
    isDrawing.current = true;

    if (tool==='eraser') { erase(pos); return; }
    if (tool==='text') { setTextInput({x:pos.x,y:pos.y,val:''}); setTimeout(()=>textRef.current?.focus(),30); return; }
    if (tool==='sticky') {
      onAddElement({
        id: generateId(),
        type: 'sticky',
        x: Math.round(pos.x - 100),
        y: Math.round(pos.y - 100),
        text: '',
        color: '#fef3c7',
      } as any);
      isDrawing.current = false;
      return;
    }

    if (tool==='select') {
      // Check if clicking arrow control point handle
      const clickedHandleId = selectedIds.find(id => {
        const el = elements.find(e => e.id === id) || allElements?.find(e => e.id === id);
        if (el && el.type === 'arrow') {
          const cx = el.controlPoint ? el.controlPoint.x : (el.x1 + el.x2) / 2;
          const cy = el.controlPoint ? el.controlPoint.y : (el.y1 + el.y2) / 2;
          return Math.hypot(pos.x - cx, pos.y - cy) < 10;
        }
        return false;
      });

      if (clickedHandleId) {
        dragControlRef.current = { id: clickedHandleId };
        return;
      }

      // Check if clicking shape resize handle
      const clickedResize = findClickedResizeHandle(pos);
      if (clickedResize) {
        resizeStartRef.current = {
          id: clickedResize.id,
          handle: clickedResize.handle,
          ox: clickedResize.el.x,
          oy: clickedResize.el.y,
          ow: clickedResize.el.w,
          oh: clickedResize.el.h,
          startX: pos.x,
          startY: pos.y
        };
        return;
      }

      const hit = [...elements].reverse().find(el=>hitTest(el,pos.x,pos.y));
      if (hit) {
        const sel = selectedIds.includes(hit.id) ? selectedIds : [hit.id];
        onSelectIds(sel);
        const snaps = elements.filter(el=>sel.includes(el.id)) || allElements?.filter(el=>sel.includes(el.id));
        moveStart.current = { ox:pos.x, oy:pos.y, snaps: JSON.parse(JSON.stringify(snaps)) };
      } else {
        onSelectIds([]);
        dragSel.current = { sx:pos.x, sy:pos.y, cx:pos.x, cy:pos.y };
      }
      return;
    }

    if (tool==='pencil') { currentPts.current=[pos]; draftRef.current={type:'pencil',sx:pos.x,sy:pos.y,cx:pos.x,cy:pos.y}; return; }
    draftRef.current = { type:tool, sx:pos.x, sy:pos.y, cx:pos.x, cy:pos.y };
  }, [enabled, tool, elements, selectedIds, erase, onSelectIds, allElements, zoom, pan, viewportSize]);

  const handleMove = useCallback((e: React.PointerEvent) => {
    if (!enabled || !isDrawing.current) return;
    e.preventDefault();
    const pos = getPos(e);

    if (tool==='eraser') { erase(pos); return; }

    if (tool==='select') {
      if (dragControlRef.current) {
        const arrowId = dragControlRef.current.id;
        onUpdateElement(arrowId, {
          controlPoint: { x: pos.x, y: pos.y }
        });
        redraw();
        return;
      }

      if (resizeStartRef.current) {
        const { id, handle, ox, oy, ow, oh, startX, startY } = resizeStartRef.current;
        const dx = pos.x - startX;
        const dy = pos.y - startY;

        let nx = ox, ny = oy, nw = ow, nh = oh;

        if (handle === 'tl') {
          nx = ox + dx;
          ny = oy + dy;
          nw = ow - dx;
          nh = oh - dy;
        } else if (handle === 'tr') {
          ny = oy + dy;
          nw = ow + dx;
          nh = oh - dy;
        } else if (handle === 'bl') {
          nx = ox + dx;
          nw = ow - dx;
          nh = oh + dy;
        } else if (handle === 'br') {
          nw = ow + dx;
          nh = oh + dy;
        }

        const minSize = 10;
        if (nw < minSize) {
          if (handle === 'tl' || handle === 'bl') nx = ox + ow - minSize;
          nw = minSize;
        }
        if (nh < minSize) {
          if (handle === 'tl' || handle === 'tr') ny = oy + oh - minSize;
          nh = minSize;
        }

        onUpdateElement(id, { x: nx, y: ny, w: nw, h: nh } as any);
        recalculateArrowAttachments(id, { x: nx, y: ny, w: nw, h: nh, type: 'rect' });
        redraw();
        return;
      }

      if (moveStart.current) {
        const dx=pos.x-moveStart.current.ox, dy=pos.y-moveStart.current.oy;
        moveStart.current.snaps.forEach(orig => {
          if (orig.type==='stroke')   onUpdateElement(orig.id,{points:orig.points.map(p=>({x:p.x+dx,y:p.y+dy}))} as Partial<DrawElement>);
          else if (orig.type==='rect'||orig.type==='ellipse') {
            onUpdateElement(orig.id,{x:orig.x+dx,y:orig.y+dy} as Partial<DrawElement>);
            updateAttachedArrows(orig.id, dx, dy);
          }
          else if (orig.type==='arrow') {
            const changes: Partial<DrawElement> = { x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x2 + dx, y2: orig.y2 + dy };
            if (orig.controlPoint) {
              changes.controlPoint = { x: orig.controlPoint.x + dx, y: orig.controlPoint.y + dy };
            }
            onUpdateElement(orig.id, changes);
          }
          else if (orig.type==='text') onUpdateElement(orig.id,{x:orig.x+dx,y:orig.y+dy} as Partial<DrawElement>);
        });
      } else if (dragSel.current) {
        dragSel.current = { ...dragSel.current, cx:pos.x, cy:pos.y };
        redraw();
      }
      return;
    }

    if (!draftRef.current) return;
    draftRef.current.cx = pos.x; draftRef.current.cy = pos.y;
    if (tool==='pencil') currentPts.current.push(pos);
    redraw();
  }, [enabled, tool, erase, onUpdateElement, redraw, allElements, zoom, pan, viewportSize]);

  const handleUp = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    isDrawing.current = false;
    const pos = getPos(e);

    if (tool==='select') {
      if (dragControlRef.current) {
        // Drop snap check for control points when bending is released
        dragControlRef.current = null;
        redraw();
        return;
      }
      if (resizeStartRef.current) {
        resizeStartRef.current = null;
        redraw();
        return;
      }
      if (moveStart.current) { 
        moveStart.current.snaps.forEach(orig => {
          if (orig.type === 'arrow') {
            const dx = pos.x - moveStart.current!.ox;
            const dy = pos.y - moveStart.current!.oy;
            const startSnap = findAttachment(orig.x1 + dx, orig.y1 + dy);
            const endSnap = findAttachment(orig.x2 + dx, orig.y2 + dy);
            const changes: Partial<Extract<DrawElement, { type: 'arrow' }>> = {};
            if (startSnap) { changes.x1 = startSnap.x; changes.y1 = startSnap.y; changes.startAttachId = startSnap.id; }
            else { changes.startAttachId = undefined; }
            if (endSnap) { changes.x2 = endSnap.x; changes.y2 = endSnap.y; changes.endAttachId = endSnap.id; }
            else { changes.endAttachId = undefined; }
            onUpdateElement(orig.id, changes);
          }
        });
        moveStart.current=null; 
      }
      else if (dragSel.current) {
        const ds=dragSel.current;
        const x1=Math.min(ds.sx,ds.cx),y1=Math.min(ds.sy,ds.cy),x2=Math.max(ds.sx,ds.cx),y2=Math.max(ds.sy,ds.cy);
        if (x2-x1>4||y2-y1>4) {
          onSelectIds(elements.filter(el=>{
            if (el.type==='stroke') return el.points.some(p=>p.x>=x1&&p.x<=x2&&p.y>=y1&&p.y<=y2);
            if (el.type==='rect'||el.type==='ellipse') return el.x>=x1&&el.x+el.w<=x2&&el.y>=y1&&el.y+el.h<=y2;
            if (el.type==='arrow') return Math.min(el.x1,el.x2)>=x1&&Math.max(el.x1,el.x2)<=x2&&Math.min(el.y1,el.y2)>=y1&&Math.max(el.y1,el.y2)<=y2;
            if (el.type==='text') return el.x>=x1&&el.y>=y1&&el.x<=x2&&el.y<=y2;
            return false;
          }).map(el=>el.id));
        }
        dragSel.current=null; redraw();
      }
      return;
    }

    if (!draftRef.current) return;
    const d=draftRef.current; const id=generateId();

    if (tool==='pencil' && currentPts.current.length>1) {
      onAddElement({id,type:'stroke',points:[...currentPts.current],color,width,opacity});
      currentPts.current=[];
    } else if (tool==='rect') {
      const x=Math.min(d.sx,pos.x),y=Math.min(d.sy,pos.y),w=Math.abs(pos.x-d.sx),h=Math.abs(pos.y-d.sy);
      if (w>4&&h>4) onAddElement({id,type:'rect',x,y,w,h,color,fill,width,opacity});
    } else if (tool==='ellipse') {
      const x=Math.min(d.sx,pos.x),y=Math.min(d.sy,pos.y),w=Math.abs(pos.x-d.sx),h=Math.abs(pos.y-d.sy);
      if (w>4&&h>4) onAddElement({id,type:'ellipse',x,y,w,h,color,fill,width,opacity});
    } else if (tool==='arrow') {
      if (Math.hypot(pos.x-d.sx,pos.y-d.sy)>8) {
        const startSnap = findAttachment(d.sx, d.sy);
        const endSnap = findAttachment(pos.x, pos.y);
        
        const x1 = startSnap ? startSnap.x : d.sx;
        const y1 = startSnap ? startSnap.y : d.sy;
        const x2 = endSnap ? endSnap.x : pos.x;
        const y2 = endSnap ? endSnap.y : pos.y;

        onAddElement({
          id,
          type: 'arrow',
          x1, y1, x2, y2,
          color, width, opacity,
          startAttachId: startSnap?.id,
          endAttachId: endSnap?.id
        });
      }
    }

    draftRef.current=null; redraw();
  }, [enabled, tool, color, fill, width, opacity, elements, onAddElement, onSelectIds, redraw, allElements, zoom, pan, viewportSize]);

  const commitText = useCallback(() => {
    if (textInput?.val.trim()) {
      onAddElement({id:generateId(),type:'text',x:textInput.x,y:textInput.y,text:textInput.val.trim(),color,fontSize,opacity});
    }
    setTextInput(null);
  }, [textInput, color, fontSize, opacity, onAddElement]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (!enabled) return;
      if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if ((e.key==='Delete'||e.key==='Backspace') && selectedIds.length) { onDeleteElements(selectedIds); onSelectIds([]); }
      if (e.key==='Escape') { onSelectIds([]); setTextInput(null); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [enabled, selectedIds, onDeleteElements, onSelectIds]);

  const cursor = !enabled ? 'default' : tool==='select' ? 'default' : tool==='eraser' ? 'cell' : tool==='text' ? 'text' : 'crosshair';

  const w = viewportSize?.width ?? 1200;
  const h = viewportSize?.height ?? 800;
  const z = zoom;
  const px = pan?.x ?? 0;
  const py = pan?.y ?? 0;
  const minX = -px / z;
  const minY = -py / z;
  const canvasWidth = w / z;
  const canvasHeight = h / z;

  return (
    <div style={{
      position: 'absolute',
      left: minX,
      top: minY,
      width: canvasWidth,
      height: canvasHeight,
      pointerEvents: enabled ? 'all' : 'none',
      zIndex: enabled ? 15 : 0
    }}>
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        style={{
          display: 'block',
          cursor,
          touchAction: 'none',
          width: canvasWidth,
          height: canvasHeight
        }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
      />
      {textInput && (
        <textarea
          ref={textRef}
          value={textInput.val}
          onChange={e => setTextInput(p => p ? {...p, val:e.target.value} : p)}
          onBlur={commitText}
          onKeyDown={e => { if (e.key==='Escape') commitText(); }}
          style={{
            position:'absolute', left:textInput.x, top:textInput.y,
            font:`${fontSize}px -apple-system,BlinkMacSystemFont,sans-serif`,
            color, background:'rgba(255,255,255,0.95)',
            border:'1.5px dashed #6366f1', borderRadius:4,
            outline:'none', resize:'none', minWidth:140, minHeight:fontSize*1.8,
            padding:'2px 6px', zIndex:100, lineHeight:1.4,
          }}
          rows={3} placeholder="Type here…"
        />
      )}
    </div>
  );
}
