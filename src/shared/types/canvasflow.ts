export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'ongoing' | 'finished';
export type CardSize = 'small' | 'medium' | 'large';
export type FilterChip = 'all' | 'pinned' | 'high-priority' | 'urgent' | 'active' | 'finished';

export type DrawTool = 'select' | 'pencil' | 'rect' | 'ellipse' | 'arrow' | 'text' | 'eraser' | 'sticky';

export interface Point { x: number; y: number; }

export type DrawElement =
  | { id: string; type: 'stroke'; points: Point[]; color: string; width: number; opacity: number }
  | { id: string; type: 'rect';   x: number; y: number; w: number; h: number; color: string; fill: string; width: number; opacity: number }
  | { id: string; type: 'ellipse'; x: number; y: number; w: number; h: number; color: string; fill: string; width: number; opacity: number }
  | { id: string; type: 'arrow';  x1: number; y1: number; x2: number; y2: number; color: string; width: number; opacity: number }
  | { id: string; type: 'text';   x: number; y: number; text: string; color: string; fontSize: number; opacity: number }
  | { id: string; type: 'sticky'; x: number; y: number; text: string; color: string; opacity?: number };

export interface ProjectTask {
  id: string; title: string; status: TaskStatus; priority: ProjectPriority;
  createdAt: string; updatedAt: string;
}
export interface ProjectLink { id: string; label: string; url: string; }

export interface Project {
  id: string; title: string; description: string; priority: ProjectPriority;
  notes: string; links: ProjectLink[]; tasks: ProjectTask[];
  position: { x: number; y: number }; size: CardSize;
  customSize?: { width: number; height: number }; pinned: boolean;
  date?: string;
  minimized?: boolean;
  blockers?: string[];
  createdAt: string; updatedAt: string;
}
export interface InboxItem { id: string; title: string; createdAt: string; }
export interface FocusTask { taskId: string; projectId: string; addedAt: string; }

export interface AppSettings {
  showTodayFocus: boolean; showInbox: boolean;
  canvasOffset: { x: number; y: number }; canvasScale: number;
  drawMode: boolean; drawTool: DrawTool;
  drawColor: string; drawFill: string; drawWidth: number; drawFontSize: number; drawOpacity: number;
  reportTemplateId?: string;
  customReportTemplate?: string;
}

export interface WorkspaceData {
  projects: Project[]; inbox: InboxItem[]; focusTasks: FocusTask[];
  settings: AppSettings; drawElements: DrawElement[];
  version: number; lastSaved: string;
}
