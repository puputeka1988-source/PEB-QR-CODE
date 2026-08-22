import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-500/40 bg-slate-900/90 text-emerald-200',
    warning: 'border-amber-500/40 bg-slate-900/90 text-amber-200',
    error: 'border-rose-500/40 bg-slate-900/90 text-rose-200',
    info: 'border-sky-500/40 bg-slate-900/90 text-sky-200'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-in slide-in-from-bottom-5 fade-in duration-200 pointer-events-none">
      <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${borderColors[toast.type]}`}>
        {icons[toast.type]}
        <p className="text-xs sm:text-sm font-semibold text-slate-100 flex-1">{toast.message}</p>
      </div>
    </div>
  );
};
