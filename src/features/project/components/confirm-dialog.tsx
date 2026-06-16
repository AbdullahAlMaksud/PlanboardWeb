'use client';
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">{message}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="md"
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
