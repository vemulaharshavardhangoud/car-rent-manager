import React from 'react';
import { Ghost, Plus } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = Ghost, 
  title = "No data found", 
  message = "Try adjusting your filters or adding a new entry.",
  actionLabel,
  onAction,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-card-bg/50 rounded-[2.5rem] border border-dashed border-border-main transition-all ${className}`}>
      <div className="w-20 h-20 bg-main-bg rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-border-main/20">
        <Icon className="w-10 h-10 text-text-muted opacity-30" />
      </div>
      
      <h3 className="text-xl font-black text-text-main tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-text-muted font-medium max-w-[280px] leading-relaxed mb-8">
        {message}
      </p>

      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
