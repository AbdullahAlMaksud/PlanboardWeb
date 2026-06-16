'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/shared/lib/utils';

interface CalendarPickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
}

export function CalendarPicker({ value, onChange, className }: CalendarPickerProps) {
  // Parse initial date or default to today
  const selectedDate = value ? new Date(value) : null;
  const [currentMonth, setCurrentMonth] = useState(() => {
    return selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1) : new Date();
  });

  const [isOpen, setIsOpen] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get days in month
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  // Get starting day of week (0 = Sunday)
  const getStartDayOfWeek = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month);

  const days = [];
  // Fill leading empty days
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  // Fill actual month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (date: Date) => {
    // Format to YYYY-MM-DD
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const formattedLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : 'Select date';

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-full px-2.5 py-1 text-[10px] text-slate-500 font-semibold hover:bg-slate-100 hover:text-slate-700 transition-colors select-none cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500/30',
            className
          )}
        >
          <CalendarIcon size={11} className="text-slate-400" />
          <span>{formattedLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 select-none pointer-events-auto" align="start">
        {/* Header: Prev/Next & Month/Year */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-slate-800">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Days of Week label */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1.5">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {days.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-7 w-7" />;

            const selected = isSelected(date);
            const today = isToday(date);

            return (
              <button
                key={date.toISOString()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectDay(date);
                }}
                className={cn(
                  'h-7 w-7 rounded-lg flex items-center justify-center transition-all font-medium text-[11px]',
                  selected
                    ? 'bg-indigo-600 text-white shadow-sm font-bold scale-105'
                    : today
                    ? 'bg-slate-100 text-indigo-600 font-bold border border-indigo-200/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
