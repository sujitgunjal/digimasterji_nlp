import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, Mic, Sparkles } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export const AudioPlayerDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoText, setDemoText] = useState(
    'Namaste! Welcome to DigiMasterJi. Photosynthesis is the process by which green plants make food using sunlight and carbon dioxide.'
  );

  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecorder();

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(demoText);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">Audio & Voice Engine Demo</h1>
        <p className="text-slate-400 text-xs mb-6">
          Test speech-to-text recording and browser text-to-speech audio rendering
        </p>

        <div className="space-y-6">
          {/* TTS Player Card */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-xs font-bold uppercase text-violet-400 mb-2">Text to Speech Synthesis</h3>
            <textarea
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              rows={3}
              className="w-full p-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 mb-3"
            />
            <button
              onClick={handleSpeak}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-violet-600/30 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause Speech' : 'Play TTS Audio'}</span>
            </button>
          </div>

          {/* Voice Input Card */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase text-indigo-400 mb-1">Microphone Input</h3>
              <p className="text-xs text-slate-400">
                {isRecording ? `Recording... (${recordingTime}s)` : 'Click to record your voice'}
              </p>
            </div>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-4 rounded-2xl transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800 text-violet-400 hover:bg-slate-700'
              }`}
            >
              <Mic className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
