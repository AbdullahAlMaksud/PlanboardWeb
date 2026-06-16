'use client';
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle size={15} className="text-emerald-600" />,
    error: <AlertCircle size={15} className="text-red-500" />,
    info: <Info size={15} className="text-blue-500" />,
  };

  const colors = {
    success: 'border-emerald-100 bg-white',
    error: 'border-red-100 bg-white',
    info: 'border-blue-100 bg-white',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border shadow-lg px-4 py-2.5 text-sm text-slate-700 font-medium ${colors[toast.type]}`}
    >
      {icons[toast.type]}
      {toast.message}
    </div>
  );
}
