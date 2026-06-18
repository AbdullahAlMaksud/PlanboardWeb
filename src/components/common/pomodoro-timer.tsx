'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Minus, Plus } from 'lucide-react';

interface PomodoroTimerProps {
  isOpen: boolean;
}

interface CircularProgressProps {
  percent: number;
  colorClass: string;
}

function CircularTimerProgress({ percent, colorClass }: CircularProgressProps) {
  const radius = 16;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-10 h-10 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-xs flex-shrink-0">
      <svg className="w-10 h-10 transform -rotate-90 absolute top-0 left-0">
        {/* Background track */}
        <circle
          className="text-slate-100"
          strokeWidth="2.5"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
        />
        {/* Active progress */}
        <circle
          className={`${colorClass} transition-all duration-300`}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
        />
      </svg>
      {/* Percentage Text inside circle */}
      <span className="text-[8px] font-black text-slate-800 leading-none select-none">
        {Math.round(percent)}%
      </span>
    </div>
  );
}

export function PomodoroTimer({ isOpen }: PomodoroTimerProps) {
  // Mode-specific durations (in minutes)
  const [focusMinutes, setFocusMinutes] = useState<number>(25);
  const [breakMinutes, setBreakMinutes] = useState<number>(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(15);
  
  // States
  const [mode, setMode] = useState<'focus' | 'break' | 'long-break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Play synthesized melody using Web Audio API
  const playWebAudioChime = useCallback(() => {
    try {
      const AudioCtxConstructor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxConstructor();
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.05);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      // Ascending major chord melody
      playNote(523.25, now, 0.25);       // C5
      playNote(659.25, now + 0.12, 0.25); // E5
      playNote(783.99, now + 0.24, 0.25); // G5
      playNote(1046.50, now + 0.36, 0.5); // C6
    } catch {
      // Ignore
    }
  }, []);

  // Play alarm sound
  const playFinishedMelody = useCallback(() => {
    if (isMuted) return;
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav');
      audio.volume = 0.5;
      audio.play().catch(() => {
        playWebAudioChime();
      });
    } catch {
      playWebAudioChime();
    }
  }, [isMuted, playWebAudioChime]);

  // Play click sound
  const playClickSound = useCallback(() => {
    if (isMuted) return;
    try {
      const AudioCtxConstructor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxConstructor();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch {
      // ignore
    }
  }, [isMuted]);

  // Main timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            playFinishedMelody();
            
            let nextMode: 'focus' | 'break' | 'long-break' = 'focus';
            let nextDuration = focusMinutes * 60;
            
            if (mode === 'focus') {
              nextMode = 'break';
              nextDuration = breakMinutes * 60;
            } else if (mode === 'break') {
              nextMode = 'focus';
              nextDuration = focusMinutes * 60;
            } else if (mode === 'long-break') {
              nextMode = 'focus';
              nextDuration = focusMinutes * 60;
            }
            
            setMode(nextMode);
            return nextDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, mode, focusMinutes, breakMinutes, longBreakMinutes, playFinishedMelody]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    playClickSound();
    setIsRunning(false);
    if (mode === 'focus') setTimeLeft(focusMinutes * 60);
    else if (mode === 'break') setTimeLeft(breakMinutes * 60);
    else setTimeLeft(longBreakMinutes * 60);
  };

  const handleModeChange = (newMode: 'focus' | 'break' | 'long-break') => {
    playClickSound();
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'focus') setTimeLeft(focusMinutes * 60);
    else if (newMode === 'break') setTimeLeft(breakMinutes * 60);
    else setTimeLeft(longBreakMinutes * 60);
  };

  const adjustMinutes = (targetMode: 'focus' | 'break' | 'long-break', amount: number) => {
    playClickSound();
    if (targetMode === 'focus') {
      const newVal = Math.min(180, Math.max(1, focusMinutes + amount));
      setFocusMinutes(newVal);
      if (!isRunning && mode === 'focus') {
        setTimeLeft(newVal * 60);
      }
    } else if (targetMode === 'break') {
      const newVal = Math.min(60, Math.max(1, breakMinutes + amount));
      setBreakMinutes(newVal);
      if (!isRunning && mode === 'break') {
        setTimeLeft(newVal * 60);
      }
    } else {
      const newVal = Math.min(120, Math.max(1, longBreakMinutes + amount));
      setLongBreakMinutes(newVal);
      if (!isRunning && mode === 'long-break') {
        setTimeLeft(newVal * 60);
      }
    }
  };

  const totalDuration = mode === 'focus' 
    ? focusMinutes * 60 
    : mode === 'break' 
      ? breakMinutes * 60 
      : longBreakMinutes * 60;
  const progressPercent = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 100;

  const modeColors = {
    focus: 'text-indigo-600',
    break: 'text-emerald-600',
    'long-break': 'text-cyan-600'
  };

  return (
    <motion.div
      animate={
        isOpen
          ? isRunning
            ? { opacity: 1, y: 0, scale: 1, display: 'flex', width: 220, height: 56, borderRadius: 28, padding: '8px 10px' }
            : { opacity: 1, y: 0, scale: 1, display: 'flex', width: 410, height: 200, borderRadius: 24, padding: '18px' }
          : { opacity: 0, y: 20, scale: 0.95, transitionEnd: { display: 'none' } }
      }
      initial={{ opacity: 0, y: 20, scale: 0.95, display: 'none' }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#e4ebf6] border border-slate-300/60 shadow-xl z-50 pointer-events-auto select-none font-mono flex flex-col justify-between overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {isRunning ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between w-full h-full gap-2.5 px-1"
          >
            <CircularTimerProgress 
              percent={progressPercent} 
              colorClass={modeColors[mode]} 
            />
            <span className="text-[22px] font-black text-slate-800 tracking-tighter tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <button
              onClick={() => { playClickSound(); setIsRunning(false); }}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center cursor-pointer shadow-xs text-slate-800 flex-shrink-0 active:scale-95 transition-transform"
              title="Pause"
            >
              <Pause size={10} fill="currentColor" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col justify-between w-full h-full gap-3.5"
          >
            {/* Top Header Section */}
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">pomodoro timer</span>
              <div className="flex items-center gap-1.5">
                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="p-1 hover:bg-white/40 rounded transition-colors text-slate-500 hover:text-slate-700 cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw size={12} />
                </button>
                {/* Sound Button */}
                <button
                  onClick={() => { playClickSound(); setIsMuted(!isMuted); }}
                  className="p-1 hover:bg-white/40 rounded transition-colors text-slate-500 hover:text-slate-700 cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
              </div>
            </div>

            {/* Middle Layout (Clock Circle + Giant Countdown Display + Start Button) */}
            <div className="flex items-center justify-between bg-white/25 border border-white/10 rounded-2xl p-2.5">
              <div className="flex items-center gap-3">
                {/* Circular Progress surrounding Percentage */}
                <CircularTimerProgress 
                  percent={progressPercent} 
                  colorClass={modeColors[mode]} 
                />
                {/* Giant Digital Readout */}
                <span className="text-3xl font-black text-slate-800 tracking-tighter tabular-nums select-all">
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Start / Pause Button Card on Right */}
              <button
                onClick={() => { playClickSound(); setIsRunning(!isRunning); }}
                className="h-9 px-5 rounded-xl border flex items-center justify-center text-[10px] font-black uppercase tracking-wider shadow-xs cursor-pointer active:scale-[0.96] transition-all bg-white text-slate-800 hover:bg-slate-50 border-slate-200/85"
              >
                <span className="flex items-center gap-1"><Play size={10} fill="currentColor" /> Start</span>
              </button>
            </div>

            {/* Bottom Mode Selectors with Plus/Minus Adjustments */}
            <div className="grid grid-cols-3 gap-2.5 mt-0.5">
              
              {/* Focus Mode Card */}
              <div className="flex flex-col gap-1">
                <span 
                  onClick={() => handleModeChange('focus')}
                  className={`text-[9px] font-bold cursor-pointer transition-colors px-1 leading-none ${
                    mode === 'focus' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Focus
                </span>
                <div 
                  onClick={() => mode !== 'focus' && handleModeChange('focus')}
                  className={`bg-white rounded-xl px-1.5 py-1 border flex items-center justify-between cursor-pointer transition-all shadow-xs ${
                    mode === 'focus' ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200/80'
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); adjustMinutes('focus', -1); }}
                    disabled={isRunning}
                    className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus size={9.5} />
                  </button>
                  <span className="text-xs font-black text-slate-800 tabular-nums">{focusMinutes}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); adjustMinutes('focus', 1); }}
                    disabled={isRunning}
                    className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                  >
                    <Plus size={9.5} />
                  </button>
                </div>
              </div>

              {/* Short Break Mode Card */}
              <div className="flex flex-col gap-1">
                <span 
                  onClick={() => handleModeChange('break')}
                  className={`text-[9px] font-bold cursor-pointer transition-colors px-1 leading-none whitespace-nowrap ${
                    mode === 'break' ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Short Breake
                </span>
                <div 
                  onClick={() => mode !== 'break' && handleModeChange('break')}
                  className={`bg-white rounded-xl px-1.5 py-1 border flex items-center justify-between cursor-pointer transition-all shadow-xs ${
                    mode === 'break' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80'
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); adjustMinutes('break', -1); }}
                    disabled={isRunning}
                    className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus size={9.5} />
                  </button>
                  <span className="text-xs font-black text-slate-800 tabular-nums">{breakMinutes}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); adjustMinutes('break', 1); }}
                    disabled={isRunning}
                    className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                  >
                    <Plus size={9.5} />
                  </button>
                </div>
              </div>

              {/* Long Break Mode Card */}
              <div className="flex flex-col gap-1">
                <span 
                  onClick={() => handleModeChange('long-break')}
                  className={`text-[9px] font-bold cursor-pointer transition-colors px-1 leading-none whitespace-nowrap ${
                    mode === 'long-break' ? 'text-cyan-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Long Brake
                </span>
                <div 
                  onClick={() => mode !== 'long-break' && handleModeChange('long-break')}
                  className={`bg-white rounded-xl px-1.5 py-1 border flex items-center justify-between cursor-pointer transition-all shadow-xs ${
                    mode === 'long-break' ? 'border-cyan-500 ring-2 ring-cyan-500/10' : 'border-slate-200/80'
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); adjustMinutes('long-break', -1); }}
                    disabled={isRunning}
                    className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus size={9.5} />
                  </button>
                  <span className="text-xs font-black text-slate-800 tabular-nums">{longBreakMinutes}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); adjustMinutes('long-break', 1); }}
                    disabled={isRunning}
                    className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                  >
                    <Plus size={9.5} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
