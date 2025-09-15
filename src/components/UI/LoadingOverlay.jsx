import React from 'react';

export default function LoadingOverlay({ loading = false, text = 'Loading...', fullScreen = false }) {
  if (!loading) return null;
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-[9999]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-indigo-600 border-gray-200 mb-3" />
          <div className="text-sm font-semibold text-gray-700">{text}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-50`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-indigo-600 border-gray-200 mb-3" />
        <div className="text-sm font-semibold text-gray-700">{text}</div>
      </div>
    </div>
  );
}
