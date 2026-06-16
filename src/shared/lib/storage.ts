import { WorkspaceData, AppSettings } from '@/shared/types/canvasflow';

const STORAGE_KEY = 'planboard-workspace-v1';

const DEFAULT_SETTINGS: AppSettings = {
  showTodayFocus: true, showInbox: false,
  canvasOffset: { x: 0, y: 0 }, canvasScale: 1,
  drawMode: false, drawTool: 'pencil',
  drawColor: '#1e293b', drawFill: 'transparent', drawWidth: 2,
  drawFontSize: 16, drawOpacity: 1,
};

export function loadWorkspace(): WorkspaceData | null {
  if (typeof window === 'undefined') return null;
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem('canvasflow-workspace-v1');
    }
    if (!raw) return null;
    return JSON.parse(raw) as WorkspaceData;
  } catch { return null; }
}

export function saveWorkspace(data: WorkspaceData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastSaved: new Date().toISOString() }));
  } catch { console.error('Failed to save'); }
}

export function clearWorkspace(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function exportWorkspace(data: WorkspaceData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importWorkspace(file: File): Promise<WorkspaceData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target?.result as string) as WorkspaceData); }
      catch { reject(new Error('Invalid backup file')); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function getDefaultSettings(): AppSettings { return { ...DEFAULT_SETTINGS }; }
