'use client';
import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Project } from '@/shared/types/canvasflow';
import { Clipboard } from 'lucide-react';

interface WorkReportModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onCopied: () => void;
}

export function WorkReportModal({ open, onClose, projects, onCopied }: WorkReportModalProps) {
  // Generate the report content
  const generateReport = () => {
    if (projects.length === 0) {
      return `No projects found in this workspace.`;
    }

    const formatDate = (dateStr?: string) => {
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      const targetDate = dateStr 
        ? (() => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
          })()
        : new Date();
        
      const weekday = weekdays[targetDate.getDay()];
      const day = targetDate.getDate();
      const month = months[targetDate.getMonth()];
      const year = targetDate.getFullYear();
      
      return `${weekday}, ${day} ${month}, ${year}`;
    };

    return projects.map((project) => {
      const completed = project.tasks.filter(t => t.status === 'finished');
      const ongoing = project.tasks.filter(t => t.status === 'ongoing');
      const blockers = project.blockers || [];

      let section = `Work Update (${project.title})\n`;
      section += `${formatDate(project.date)}\n\n\n`;

      section += `Tasks Completed:\n`;
      if (completed.length > 0) {
        completed.forEach(t => {
          section += `- ${t.title}\n`;
        });
      } else {
        section += `- No completed task right now.\n`;
      }
      section += `\n`;

      section += `Ongoing Tasks / In Progress:\n`;
      if (ongoing.length > 0) {
        ongoing.forEach(t => {
          section += `- ${t.title}\n`;
        });
      } else {
        section += `- No ongoing task right now.\n`;
      }
      section += `\n`;

      section += `Blockers (if any):\n`;
      if (blockers.length > 0) {
        blockers.forEach(b => {
          section += `- ${b}\n`;
        });
      } else {
        section += `No blocker right now\n`;
      }

      return section.trim();
    }).join('\n\n---------------\n\n');
  };

  const reportText = generateReport();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    onCopied();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Workspace Work Report">
      <div className="flex flex-col gap-4 max-h-[70vh]">
        <p className="text-xs text-slate-400">
          This report compiles all completed and ongoing tasks across all projects in your workspace.
        </p>
        <div className="flex-grow overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap max-h-[40vh]">
          {reportText}
        </div>
        <div className="flex gap-2 pt-1 flex-shrink-0">
          <Button variant="default" size="md" onClick={handleCopy} className="flex-grow">
            <Clipboard size={14} />
            Copy Report
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
