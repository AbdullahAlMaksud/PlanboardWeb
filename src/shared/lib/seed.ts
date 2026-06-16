import { WorkspaceData, Project } from '@/shared/types/canvasflow';
import { generateId } from './utils';

function makeProject(title: string, description: string, priority: Project['priority'],
  position: { x: number; y: number },
  tasks: Array<{ title: string; status: Project['tasks'][0]['status']; priority: Project['tasks'][0]['priority'] }>
): Project {
  const now = new Date().toISOString();
  return {
    id: generateId(), title, description, priority, notes: '', links: [],
    tasks: tasks.map(t => ({ id: generateId(), title: t.title, status: t.status, priority: t.priority, createdAt: now, updatedAt: now })),
    position, size: 'medium', pinned: false, createdAt: now, updatedAt: now,
  };
}

export function createSeedWorkspace(): WorkspaceData {
  const now = new Date().toISOString();
  const projects: Project[] = [
    makeProject('Mini Kanban', 'Build a simple kanban board for personal task management', 'high', { x: 60, y: 80 }, [
      { title: 'Design card component', status: 'finished', priority: 'medium' },
      { title: 'Add drag-and-drop', status: 'ongoing', priority: 'high' },
      { title: 'Write unit tests', status: 'todo', priority: 'low' },
      { title: 'Deploy to Vercel', status: 'todo', priority: 'medium' },
    ]),
    makeProject('Portfolio Website', 'Personal portfolio to showcase projects and writing', 'medium', { x: 420, y: 60 }, [
      { title: 'Design hero section', status: 'finished', priority: 'high' },
      { title: 'Write about page copy', status: 'finished', priority: 'low' },
      { title: 'Add project showcase', status: 'ongoing', priority: 'medium' },
      { title: 'SEO optimization', status: 'todo', priority: 'medium' },
    ]),
    makeProject('Learning Tracker', 'Track courses, books, and skills being learned this quarter', 'low', { x: 780, y: 100 }, [
      { title: 'Finish TypeScript course', status: 'ongoing', priority: 'high' },
      { title: 'Read Clean Code', status: 'ongoing', priority: 'medium' },
      { title: 'Complete React docs', status: 'finished', priority: 'medium' },
      { title: 'Practice algorithms', status: 'todo', priority: 'low' },
    ]),
  ];
  return {
    projects, inbox: [
      { id: generateId(), title: 'Look into Framer for animations', createdAt: now },
      { id: generateId(), title: 'Try Supabase for next project', createdAt: now },
    ],
    focusTasks: [], drawElements: [],
    settings: {
      showTodayFocus: true, showInbox: false,
      canvasOffset: { x: 0, y: 0 }, canvasScale: 1,
      drawMode: false, drawTool: 'pencil',
      drawColor: '#1e293b', drawFill: 'transparent', drawWidth: 2,
      drawFontSize: 16, drawOpacity: 1,
    },
    version: 1, lastSaved: now,
  };
}
