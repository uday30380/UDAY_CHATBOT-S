import React, { useEffect, useRef, useState } from 'react';
import { X, MicOff, Mic } from 'lucide-react';
import { LiveClient } from '../services/geminiService';

interface LiveSessionProps {
  onClose: () => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const clientRef = useRef<LiveClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Audio Input variables
  const inputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Output Audio
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Input Audio
        inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        clientRef.current = new LiveClient(
          (audioData) => playAudio(audioData),
          () => onClose()
        );

        await clientRef.current.connect();
        setStatus('connected');
        startRecording(stream);

      } catch (err) {
        console.error("Failed to start live session", err);
        setStatus('error');
      }
    };

    init();

    return () => {
      // Cleanup
      clientRef.current?.disconnect();
      streamRef.current?.getTracks().forEach(t => t.stop());
      processorRef.current?.disconnect();
      inputContextRef.current?.close();
      audioContextRef.current?.close();
    };
  }, []);

  const startRecording = (stream: MediaStream) => {
    if (!inputContextRef.current) return;
    
    const source = inputContextRef.current.createMediaStreamSource(stream);
    const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (isMuted) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert Float32 to PCM Int16
      const l = inputData.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        // Simple clamp
        const s = Math.max(-1, Math.min(1, inputData[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Convert to Base64
      let binary = '';
      const bytes = new Uint8Array(int16.buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);

      clientRef.current?.sendAudio(b64);
    };

    source.connect(processor);
    processor.connect(inputContextRef.current.destination);
  };

  const playAudio = async (data: ArrayBuffer) => {
    if (!audioContextRef.current) return;
    try {
      // Create audio buffer (1 channel, 24kHz)
      const float32 = new Float32Array(data.byteLength / 2);
      const dataView = new DataView(data);
      for (let i = 0; i < data.byteLength / 2; i++) {
        float32[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }
      
      const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (e) {
      console.error("Audio playback error", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center">
      <div className="absolute top-8 right-8">
         <button onClick={onClose} className="p-4 bg-gray-800 rounded-full hover:bg-gray-700 text-white">
           <X size={24} />
         </button>
      </div>

      <div className="relative mb-12">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
          status === 'connected' ? 'bg-indigo-500 animate-pulse-slow shadow-[0_0_50px_rgba(99,102,241,0.5)]' : 'bg-gray-800'
        }`}>
          <Mic size={48} className="text-white" />
        </div>
        {status === 'connecting' && (
          <div className="absolute -bottom-10 w-full text-center text-gray-400 text-sm">Connecting...</div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-white mb-8">VEMPATI UDAY KIRAN Live</h2>

      <div className="flex gap-6">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-6 rounded-full transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
      </div>
    </div>
  );
};