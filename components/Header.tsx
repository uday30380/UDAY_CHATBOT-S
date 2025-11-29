
import React from 'react';
import { Sparkles, Trash2, Mic, Image as ImageIcon, Video, Brain, Zap, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { AppMode, User } from '../types';

interface HeaderProps {
  onClearChat: () => void;
  hasMessages: boolean;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenSettings: () => void;
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onClearChat, 
  hasMessages, 
  currentMode, 
  onModeChange, 
  onOpenSettings,
  user,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Logo & Name */}
        <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => onModeChange('chat-flash')}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-sm tracking-tight text-white uppercase hidden md:block">VEMPATI UDAY KIRAN'S BOT</h1>
          <h1 className="font-bold text-sm tracking-tight text-white uppercase md:hidden">VEMPATI UDAY KIRAN</h1>
        </div>

        {/* Mode Selector */}
        {currentMode !== 'admin-dashboard' && (
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800 overflow-x-auto no-scrollbar max-w-[200px] md:max-w-none flex-1 md:flex-none justify-start md:justify-center">
            <button
              onClick={() => onModeChange('chat-flash')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                currentMode === 'chat-flash' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Zap size={14} /> <span className="hidden sm:inline">Flash</span>
            </button>
            <button
              onClick={() => onModeChange('chat-reasoning')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                currentMode === 'chat-reasoning' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Brain size={14} /> <span className="hidden sm:inline">Reasoning</span>
            </button>
            <button
              onClick={() => onModeChange('image-studio')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                currentMode === 'image-studio' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ImageIcon size={14} /> <span className="hidden sm:inline">Image</span>
            </button>
            <button
              onClick={() => onModeChange('video-studio')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                currentMode === 'video-studio' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Video size={14} /> <span className="hidden sm:inline">Video</span>
            </button>
          </div>
        )}
        
        {currentMode === 'admin-dashboard' && (
          <div className="flex-1 flex justify-center">
             <span className="bg-gray-800 border border-gray-700 text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
               Admin Console
             </span>
          </div>
        )}

        {/* Actions & Profile */}
        <div className="flex items-center gap-3 flex-shrink-0">
          
          {user?.isAdmin && (
            <button
              onClick={() => onModeChange(currentMode === 'admin-dashboard' ? 'chat-flash' : 'admin-dashboard')}
              className={`p-2 rounded-full transition-all ${
                currentMode === 'admin-dashboard'
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Admin Dashboard"
            >
              <LayoutDashboard size={18} />
            </button>
          )}
          
          {currentMode !== 'admin-dashboard' && (
            <button
              onClick={() => onModeChange('live')}
              className={`p-2 rounded-full transition-all ${
                currentMode === 'live' 
                  ? 'bg-red-500/20 text-red-400 animate-pulse' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
              title="Live Voice"
            >
              <Mic size={18} />
            </button>
          )}

          <div className="h-6 w-px bg-gray-800 hidden sm:block"></div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-medium text-white">{user.name}</span>
                <span className="text-[10px] text-gray-500 uppercase">{user.isAdmin ? 'Admin' : 'Guest'}</span>
              </div>
              
              <div className="relative group">
                <div className="w-8 h-8 rounded-full bg-indigo-500 border border-indigo-400 flex items-center justify-center text-xs font-bold text-white cursor-pointer overflow-hidden">
                   {user.avatar && !user.avatar.includes('default-user') ? (
                     <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                   ) : (
                     user.name.charAt(0)
                   )}
                </div>
                
                {/* Dropdown for Logout */}
                <div className="absolute right-0 mt-2 w-32 bg-gray-900 border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                   <button 
                     onClick={onOpenSettings} 
                     className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2 rounded-t-lg"
                   >
                     <Settings size={12} /> Settings
                   </button>
                   <button 
                     onClick={onLogout} 
                     className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-gray-800 hover:text-red-300 flex items-center gap-2 rounded-b-lg border-t border-gray-800"
                   >
                     <LogOut size={12} /> Sign Out
                   </button>
                </div>
              </div>
            </div>
          )}

          {hasMessages && currentMode !== 'admin-dashboard' && (
            <button
              onClick={onClearChat}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors duration-200 ml-1"
              title="Clear Chat"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
