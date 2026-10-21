import React from 'react';

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size] || 'w-8 h-8 border-3';

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3">
      <div
        className={`${sizeClasses} border-neutral-300 border-t-neutral-900 rounded-full animate-spin`}
      />
      {text && <p className="text-sm font-medium text-neutral-500">{text}</p>}
    </div>
  );
}
