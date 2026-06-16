'use client';
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { DrawElement, DrawTool, Point } from '@/shared/types/canvasflow';
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
}

const CANVAS_SIZE = 8000;

function hitTest(el: DrawElement, x: number, y: number, pad = 8): boolean {
  if (el.type === 'stroke')  return el.points.some(p => Math.hypot(p.x-x,p.y-y) < pad+el.width);
  if (el.type === 'rect' || el.type === 'ellipse') return x>=el.x-pad && x<=el.x+el.w+pad && y>=el.y-pad && y<=el.y+el.h+pad;
  if (el.type === 'arrow')   { const dx=el.x2-el.x1,dy=el.y2-el.y1,len=Math.hypot(dx,dy); if(!len) return false; const t=Math.max(0,Math.min(1,((x-el.x1)*dx+(y-el.y1)*dy)/(len*len))); return Math.hypot(x-(el.x1+t*dx),y-(el.y1+t*dy))<pad+el.width; }
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
    const ang=Math.atan2(el.y2-el.y1,el.x2-el.x1), head=Math.max(12,el.width*4);
    ctx.beginPath(); ctx.moveTo(el.x1,el.y1); ctx.lineTo(el.x2,el.y2); ctx.stroke();
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
}: DrawLayerProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const currentPts  = useRef<Point[]>([]);
  const isDrawing   = useRef(false);
  const draftRef    = useRef<{ type: DrawTool; sx:number; sy:number; cx:number; cy:number }|null>(null);
  const dragSel     = useRef<{sx:number;sy:number;cx:number;cy:number}|null>(null);
  const moveStart   = useRef<{ox:number;oy:number;snaps:DrawElement[]}|null>(null);
  const [textInput, setTextInput] = useState<{x:number;y:number;val:string}|null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext('2d'); if(!ctx) return;
    ctx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
    elements.forEach(el => renderEl(ctx, el, selectedIds.includes(el.id)));

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
      const x=Math.min(d.sx,d.cx),y=Math.min(d.sy,d.cy),w=Math.abs(d.cx-d.sx),h=Math.abs(d.cy-d.sy);
      if (d.type==='rect') {
        ctx.fillStyle=fill==='transparent'?'transparent':fill;
        ctx.beginPath(); ctx.roundRect(x,y,w,h,4);
        if (fill!=='transparent') ctx.fill(); ctx.stroke();
      } else if (d.type==='ellipse') {
        ctx.fillStyle=fill==='transparent'?'transparent':fill;
        ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);
        if (fill!=='transparent') ctx.fill(); ctx.stroke();
      } else if (d.type==='arrow') {
        ctx.setLineDash([]); ctx.fillStyle=color;
        const ang=Math.atan2(d.cy-d.sy,d.cx-d.sx),head=Math.max(12,width*4);
        ctx.beginPath(); ctx.moveTo(d.sx,d.sy); ctx.lineTo(d.cx,d.cy); ctx.stroke();
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
      const x=Math.min(ds.sx,ds.cx),y=Math.min(ds.sy,ds.cy),w=Math.abs(ds.cx-ds.sx),h=Math.abs(ds.cy-ds.sy);
      ctx.save(); ctx.globalAlpha=0.12; ctx.fillStyle='#6366f1'; ctx.fillRect(x,y,w,h);
      ctx.globalAlpha=0.5; ctx.strokeStyle='#6366f1'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.strokeRect(x,y,w,h);
      ctx.setLineDash([]); ctx.restore();
    }
  }, [elements, selectedIds, color, fill, width, opacity]);

  useEffect(() => { redraw(); }, [redraw]);

  // get canvas coords from pointer event (accounts for zoom via CSS transform on parent)
  const getPos = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // rect is already scaled by CSS transform, so just divide by current scale
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
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
      const hit = [...elements].reverse().find(el=>hitTest(el,pos.x,pos.y));
      if (hit) {
        const sel = selectedIds.includes(hit.id) ? selectedIds : [hit.id];
        onSelectIds(sel);
        const snaps = elements.filter(el=>sel.includes(el.id));
        moveStart.current = { ox:pos.x, oy:pos.y, snaps: JSON.parse(JSON.stringify(snaps)) };
      } else {
        onSelectIds([]);
        dragSel.current = { sx:pos.x, sy:pos.y, cx:pos.x, cy:pos.y };
      }
      return;
    }

    if (tool==='pencil') { currentPts.current=[pos]; draftRef.current={type:'pencil',sx:pos.x,sy:pos.y,cx:pos.x,cy:pos.y}; return; }
    draftRef.current = { type:tool, sx:pos.x, sy:pos.y, cx:pos.x, cy:pos.y };
  }, [enabled, tool, elements, selectedIds, erase, onSelectIds]);

  const handleMove = useCallback((e: React.PointerEvent) => {
    if (!enabled || !isDrawing.current) return;
    e.preventDefault();
    const pos = getPos(e);

    if (tool==='eraser') { erase(pos); return; }

    if (tool==='select') {
      if (moveStart.current) {
        const dx=pos.x-moveStart.current.ox, dy=pos.y-moveStart.current.oy;
        moveStart.current.snaps.forEach(orig => {
          if (orig.type==='stroke')   onUpdateElement(orig.id,{points:orig.points.map(p=>({x:p.x+dx,y:p.y+dy}))} as Partial<DrawElement>);
          else if (orig.type==='rect'||orig.type==='ellipse') onUpdateElement(orig.id,{x:orig.x+dx,y:orig.y+dy} as Partial<DrawElement>);
          else if (orig.type==='arrow') onUpdateElement(orig.id,{x1:orig.x1+dx,y1:orig.y1+dy,x2:orig.x2+dx,y2:orig.y2+dy} as Partial<DrawElement>);
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
  }, [enabled, tool, erase, onUpdateElement, redraw]);

  const handleUp = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    isDrawing.current = false;
    const pos = getPos(e);

    if (tool==='select') {
      if (moveStart.current) { moveStart.current=null; }
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
      if (Math.hypot(pos.x-d.sx,pos.y-d.sy)>8) onAddElement({id,type:'arrow',x1:d.sx,y1:d.sy,x2:pos.x,y2:pos.y,color,width,opacity});
    }

    draftRef.current=null; redraw();
  }, [enabled, tool, color, fill, width, opacity, elements, onAddElement, onSelectIds, redraw]);

  const commitText = useCallback(() => {
    if (textInput?.val.trim()) {
      onAddElement({id:generateId(),type:'text',x:textInput.x,y:textInput.y,text:textInput.val.trim(),color,fontSize,opacity});
    }
    setTextInput(null);
  }, [textInput, color, fontSize, opacity, onAddElement]);

  // delete key
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

  return (
    <div style={{ position:'absolute', top:0, left:0, width:CANVAS_SIZE, height:CANVAS_SIZE, pointerEvents: enabled?'all':'none', zIndex: enabled?15:0 }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ display:'block', cursor, touchAction:'none', width:CANVAS_SIZE, height:CANVAS_SIZE }}
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
