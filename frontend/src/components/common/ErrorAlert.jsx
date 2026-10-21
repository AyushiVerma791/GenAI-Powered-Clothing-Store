import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorAlert({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between text-sm shadow-sm my-4">
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-800 font-bold ml-4 text-sm"
        >
          &times;
        </button>
      )}
    </div>
  );
}
