import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, AlertCircle, Volume2, Download, ExternalLink, MapPin } from 'lucide-react';
import { ChatMessage, Role } from '../types';
import { textToSpeech } from '../services/geminiService';

interface MessageBubbleProps {
  message: ChatMessage;
  userName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, userName }) => {
  const isUser = message.role === Role.USER;

  const playTTS = async () => {
    try {
      const audioBuffer = await textToSpeech(message.content);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await ctx.decodeAudioData(audioBuffer);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.error("TTS Error", e);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600' : message.isError ? 'bg-red-500' : 'bg-emerald-600'
        } shadow-lg`} title={isUser ? (userName || 'User') : 'Bot'}>
          {isUser ? (
            <User size={16} className="text-white" />
          ) : message.isError ? (
            <AlertCircle size={16} className="text-white" />
          ) : (
            <Bot size={16} className="text-white" />
          )}
        </div>

        {/* Bubble */}
        <div className="flex flex-col gap-2">
          <div
            className={`relative px-5 py-3.5 rounded-2xl shadow-md text-sm md:text-base leading-relaxed overflow-hidden ${
              isUser
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : message.isError
                  ? 'bg-red-900/50 border border-red-800 text-red-200 rounded-tl-none'
                  : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-none'
            }`}
          >
            {/* User Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {message.attachments.map((att, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-white/20">
                    {att.type === 'image' && (
                      <img src={`data:${att.mimeType};base64,${att.data}`} className="max-h-40 object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Generated Image */}
            {message.generatedImage && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-700">
                <img src={`data:image/png;base64,${message.generatedImage}`} alt="Generated" className="w-full h-auto" />
                <div className="bg-gray-900 p-2 flex justify-end">
                  <a href={`data:image/png;base64,${message.generatedImage}`} download="gemini-image.png" className="text-xs flex items-center gap-1 text-gray-400 hover:text-white">
                    <Download size={14} /> Download
                  </a>
                </div>
              </div>
            )}

            {/* Generated Video */}
            {message.generatedVideo && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-700">
                <video controls src={message.generatedVideo} className="w-full h-auto" />
              </div>
            )}

            {/* Grounding / Citations */}
            {message.groundingChunks && message.groundingChunks.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-700/50">
                <p className="text-xs text-gray-400 font-semibold mb-2">Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {message.groundingChunks.map((chunk, i) => {
                     if (chunk.web) {
                       return (
                         <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-gray-900/50 hover:bg-gray-900 px-2 py-1 rounded text-blue-400 border border-gray-700">
                           <ExternalLink size={10} /> {chunk.web.title || "Web Source"}
                         </a>
                       );
                     }
                     if (chunk.maps) {
                        return (
                          <a key={i} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-gray-900/50 hover:bg-gray-900 px-2 py-1 rounded text-green-400 border border-gray-700">
                            <MapPin size={10} /> {chunk.maps.title || "Map Location"}
                          </a>
                        );
                     }
                     return null;
                  })}
                </div>
              </div>
            )}

            {!isUser && !message.isError && (
              <button 
                onClick={playTTS} 
                className="absolute top-2 right-2 text-gray-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Read aloud"
              >
                <Volume2 size={16} />
              </button>
            )}
          </div>
          
          <div className={`text-[10px] text-gray-500 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
             {isUser && userName ? `${userName} • ` : ''}
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};