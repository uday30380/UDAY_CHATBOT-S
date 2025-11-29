import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 p-4 bg-gray-850 rounded-2xl rounded-tl-none w-fit animate-fade-in border border-gray-800">
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
    </div>
  );
};
