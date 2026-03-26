import React from 'react';

const Skeleton = ({ className = '', variant = 'text' }) => {
  const baseClass = "animate-pulse bg-border-main/50 rounded-lg";
  
  let variantClass = "";
  if (variant === 'circle') variantClass = "rounded-full aspect-square";
  if (variant === 'card') variantClass = "h-40 w-full rounded-2xl";
  if (variant === 'list-item') variantClass = "h-16 w-full rounded-xl";
  if (variant === 'text') variantClass = "h-4 w-3/4 mb-2";

  return <div className={`${baseClass} ${variantClass} ${className}`} />;
};

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="w-48 h-8" />
      <Skeleton className="w-32 h-10 rounded-2xl" />
    </div>
    <Skeleton variant="card" className="h-64" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
    </div>
    <div className="space-y-4">
      <Skeleton className="w-40 h-6" />
      {[1, 2, 3].map(i => <Skeleton key={i} variant="list-item" />)}
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-baseline mb-6">
      <Skeleton className="w-64 h-10" />
      <Skeleton className="w-32 h-10" />
    </div>
    <div className="bg-card-bg border border-border-main rounded-3xl overflow-hidden">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="p-6 border-b border-border-main flex items-center gap-4">
          <Skeleton variant="circle" className="w-12 h-12" />
          <div className="flex-1">
            <Skeleton className="w-1/4 h-5" />
            <Skeleton className="w-1/6 h-3" />
          </div>
          <Skeleton className="w-16 h-8 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
