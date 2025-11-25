import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, CheckCircle2 } from 'lucide-react';
import { RecorderStatus } from '../types';

interface AudioRecorderProps {
  onRecordingComplete: (base64: string, mimeType: string) => void;
  onClear: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, onClear }) => {
  const [status, setStatus] = useState<RecorderStatus>(RecorderStatus.IDLE);
  const [timer, setTimer] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          onRecordingComplete(base64String, blob.type);
        };
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStatus(RecorderStatus.RECORDING);
      
      setTimer(0);
      timerIntervalRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === RecorderStatus.RECORDING) {
      mediaRecorderRef.current.stop();
      setStatus(RecorderStatus.FINISHED);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const clearRecording = () => {
    setStatus(RecorderStatus.IDLE);
    setTimer(0);
    chunksRef.current = [];
    onClear();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-2 my-4 w-full">
      <div className="flex items-center gap-3">
        {status === RecorderStatus.IDLE && (
          <button
            onClick={startRecording}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-600 text-white hover:bg-zinc-700 hover:border-zinc-500 transition-all active:scale-95 shadow-lg"
            title="Start Recording"
          >
            <Mic size={24} />
          </button>
        )}

        {status === RecorderStatus.RECORDING && (
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <button
                onClick={stopRecording}
                className="relative flex items-center justify-center w-14 h-14 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-900/50"
              >
                <Square size={20} fill="currentColor" />
              </button>
            </div>
            <span className="font-mono text-red-400 font-bold">{formatTime(timer)}</span>
          </div>
        )}

        {status === RecorderStatus.FINISHED && (
          <div className="flex items-center gap-3 animate-fade-in">
             <div className="flex items-center justify-center w-14 h-14 rounded-full bg-jacare-500 text-white shadow-lg shadow-jacare-500/30">
                <CheckCircle2 size={24} />
             </div>
             <div className="flex flex-col">
                <span className="text-jacare-500 font-semibold text-sm">Audio Captured</span>
                <button 
                  onClick={clearRecording}
                  className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 mt-1 transition-colors"
                >
                  <Trash2 size={12} /> Discard
                </button>
             </div>
          </div>
        )}
      </div>
      
      <div className="h-4 text-xs font-medium text-gray-500">
        {status === RecorderStatus.IDLE && "Tap to hum, sing, or whistle"}
        {status === RecorderStatus.RECORDING && "Recording... Sing clearly!"}
        {status === RecorderStatus.FINISHED && "Ready to search"}
      </div>
    </div>
  );
};

export default AudioRecorder;