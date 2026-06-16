import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-4 px-6 border-t border-slate-200/50 bg-white text-center text-xs text-slate-400">
      <p>&copy; {new Date().getFullYear()} CanvasFlow. All rights reserved.</p>
    </footer>
  );
}
