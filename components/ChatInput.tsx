import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Paperclip, X, Search, MapPin, Mic, Square, SlidersHorizontal } from 'lucide-react';
import { Attachment, AttachmentType, ImageAspectRatio, ImageResolution } from '../types';
import { transcribeAudio } from '../services/geminiService';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[], tools: { search: boolean; maps: boolean }) => void;
  disabled: boolean;
  isImageMode?: boolean;
  isVideoMode?: boolean;
  imageSettings?: { aspectRatio: ImageAspectRatio; resolution: ImageResolution };
  onImageSettingsChange?: (settings: { aspectRatio: ImageAspectRatio; resolution: ImageResolution }) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  disabled, 
  isImageMode, 
  isVideoMode,
  imageSettings,
  onImageSettingsChange
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [showImageSettings, setShowImageSettings] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !disabled) {
      onSend(input.trim(), attachments, { search: useSearch, maps: useMaps });
      setInput('');
      setAttachments([]);
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64String = (event.target.result as string).split(',')[1];
          let type: AttachmentType = 'image';
          if (file.type.startsWith('video')) type = 'video';
          if (file.type.startsWith('audio')) type = 'audio';

          setAttachments(prev => [...prev, {
            type,
            mimeType: file.type,
            data: base64String
          }]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          setIsTranscribing(true);
          try {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
              if (reader.result) {
                const base64Data = (reader.result as string).split(',')[1];
                const transcription = await transcribeAudio(base64Data, 'audio/webm');
                setInput(prev => (prev ? prev + " " : "") + transcription);
              }
              setIsTranscribing(false);
            };
            stream.getTracks().forEach(t => t.stop());
          } catch (e) {
            console.error("Transcription failed", e);
            setIsTranscribing(false);
          }
        };

        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic access denied", err);
        alert("Microphone access is required for dictation.");
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const updateImageSetting = (key: 'aspectRatio' | 'resolution', value: string) => {
    if (onImageSettingsChange && imageSettings) {
      onImageSettingsChange({ ...imageSettings, [key]: value });
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm p-4">
      <div className="max-w-4xl mx-auto">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative w-16 h-16 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-shrink-0">
                {att.type === 'image' ? (
                  <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 uppercase">{att.type}</div>
                )}
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-3 bg-gray-900 border border-gray-800 rounded-3xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all duration-300">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-indigo-400 hover:bg-gray-800 rounded-full transition-colors"
            title="Attach Image/Video/Audio"
            disabled={disabled || isRecording || isTranscribing}
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
          />

          <textarea
            ref={textareaRef}
            value={isTranscribing ? "Transcribing audio..." : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : isImageMode ? "Describe the image to generate or edit..." : isVideoMode ? "Describe the video to generate..." : "Ask anything..."}
            disabled={disabled || isTranscribing}
            rows={1}
            className={`flex-1 max-h-[120px] bg-transparent text-base p-3 resize-none focus:outline-none disabled:opacity-50 ${isRecording ? 'text-red-400 animate-pulse' : 'text-gray-100 placeholder-gray-500'}`}
            style={{ overflowY: input.length > 100 ? 'auto' : 'hidden' }}
          />

          <button
            onClick={toggleRecording}
            disabled={disabled || isTranscribing}
            className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
              isRecording 
                ? 'bg-red-500/20 text-red-500 animate-pulse ring-1 ring-red-500' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={isRecording ? "Stop Recording" : "Dictate"}
          >
            {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
          </button>

          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || disabled || isRecording || isTranscribing}
            className="p-3 mb-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-full transition-all duration-200 shadow-lg shadow-indigo-900/20 active:scale-95 flex-shrink-0"
          >
            <SendHorizontal size={20} />
          </button>
        </div>

        {/* Standard Tools (Search/Maps) */}
        {!isImageMode && !isVideoMode && (
          <div className="flex gap-4 mt-3 ml-2">
            <button 
              onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                useSearch ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'
              }`}
            >
              <Search size={12} />
              Google Search
            </button>
            <button 
              onClick={() => setUseMaps(!useMaps)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                useMaps ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'
              }`}
            >
              <MapPin size={12} />
              Google Maps
            </button>
          </div>
        )}

        {/* Image Studio Controls */}
        {isImageMode && imageSettings && (
          <div className="flex flex-wrap items-center gap-3 mt-3 ml-2">
            <button
               onClick={() => setShowImageSettings(!showImageSettings)}
               className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all"
            >
              <SlidersHorizontal size={12} />
              Settings
            </button>
            
            {showImageSettings && (
              <div className="flex items-center gap-3 bg-gray-900 p-1.5 rounded-lg border border-gray-800 animate-fade-in">
                <div className="flex flex-col gap-0.5">
                   <span className="text-[10px] text-gray-500 px-1">Ratio</span>
                   <select 
                      value={imageSettings.aspectRatio}
                      onChange={(e) => updateImageSetting('aspectRatio', e.target.value)}
                      className="bg-gray-800 text-xs text-white border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-500"
                   >
                     <option value="1:1">1:1 (Square)</option>
                     <option value="16:9">16:9 (Landscape)</option>
                     <option value="9:16">9:16 (Portrait)</option>
                     <option value="4:3">4:3</option>
                     <option value="3:4">3:4</option>
                   </select>
                </div>

                <div className="w-px h-6 bg-gray-800"></div>

                <div className="flex flex-col gap-0.5">
                   <span className="text-[10px] text-gray-500 px-1">Quality</span>
                   <select 
                      value={imageSettings.resolution}
                      onChange={(e) => updateImageSetting('resolution', e.target.value)}
                      className="bg-gray-800 text-xs text-white border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-500"
                   >
                     <option value="1K">Standard (Flash)</option>
                     <option value="2K">High (2K Pro)</option>
                     <option value="4K">Ultra (4K Pro)</option>
                   </select>
                </div>
              </div>
            )}
            
            {!showImageSettings && (
               <span className="text-[10px] text-gray-500">
                  {imageSettings.aspectRatio} • {imageSettings.resolution === '1K' ? 'Nano Banana' : imageSettings.resolution}
               </span>
            )}
          </div>
        )}
      </div>
      <div className="text-center mt-2">
        <p className="text-[10px] text-gray-600">
          Uday Kiran's Chat Bot can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};