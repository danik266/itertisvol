'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '@/lib/LangContext';
import { MessageSquare, X, Send, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import Image from 'next/image';

export default function AssistantWidget() {
  const { t } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'assistant', text: t('Привет! Я ваш 2D виртуальный помощник. Чем могу помочь?', 'Сәлем! Мен сіздің виртуалды көмекшіңізбін. Қалай көмектесе аламын?') }
      ]);
    }
  }, [isOpen, messages.length, t]);

  useEffect(() => {
    if (!speaking) {
      setMouthOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 150);
    return () => clearInterval(interval);
  }, [speaking]);

  const toggleListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { 
        alert(t('Ваш браузер не поддерживает голосовой ввод', 'Браузеріңіз дауыс енгізуді қолдамайды')); 
        return; 
    }

    if (listening) {
        recognitionRef.current?.stop();
        setListening(false);
        return;
    }

    const recognition = new SR();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        send(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const speakNeural = async (text: string) => {
    if (muted) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('TTS failed');

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onplay = () => setSpeaking(true);
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => setSpeaking(false);
      await audio.play();

    } catch (e) {
      console.error('Failed to play neural TTS, falling back to Web Speech', e);
      if ('speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'ru-RU';
        utt.onstart = () => setSpeaking(true);
        utt.onend = () => setSpeaking(false);
        window.speechSynthesis.speak(utt);
      }
    }
  };

  const send = async (overrideText?: string) => {
    const msg = (overrideText || input).trim();
    if (!msg) return;

    setInput('');
    if (listening) {
       recognitionRef.current?.stop();
       setListening(false);
    }
    
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      const reply = data.reply || 'Произошла ошибка, простите.';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      speakNeural(reply);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Ошибка соединения.' }]);
    } finally {
        setLoading(false);
    }
  };

  const toggleMute = () => {
    if (!muted) {
      audioPlayerRef.current?.pause();
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    }
    setMuted(!muted);
  };

  const avatarIdle = "/avatar-idle.png";
  const avatarSpeak = "/avatar-speak.png";

  return (
    <>
      {/* DRAWER / MODAL */}
      <div 
        className={`fixed z-[100] bg-gray-900 overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto origin-bottom-right
          ${isOpen 
            ? 'inset-0 w-full h-[100dvh] rounded-none opacity-100 scale-100 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:max-w-[calc(100vw-3rem)] sm:h-[80vh] sm:max-h-[850px] sm:border sm:border-gray-800 sm:shadow-2xl sm:rounded-[32px]' 
            : 'bottom-6 right-6 w-0 h-0 opacity-0 scale-50 invisible sm:bottom-6 sm:right-6'}
        `}
      >
        {/* Header Options */}
        <div className="absolute top-0 left-0 right-0 z-20 px-3 sm:px-4 py-3 flex items-center justify-between bg-gradient-to-b from-gray-950/90 to-transparent">
           <span className="text-white font-semibold text-xs sm:text-sm uppercase tracking-wider pl-1 drop-shadow-md">AI Ведущий</span>
           <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-800/80 backdrop-blur-md rounded-full text-white hover:bg-gray-700/80 transition shadow-lg shrink-0" title={muted ? "Включить звук" : "Выключить звук"}>
              {muted ? <VolumeX size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Volume2 size={16} className="sm:w-[18px] sm:h-[18px]" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-800/80 backdrop-blur-md rounded-full text-white hover:bg-gray-700/80 transition shadow-lg shrink-0 block sm:hidden" title="Свернуть">
              <X size={18} className="sm:w-[20px] sm:h-[20px]" />
            </button>
          </div>
        </div>

        {/* 2D Avatar Container */}
        <div className="relative w-full h-[45%] sm:h-[55%] min-h-[160px] bg-gradient-to-b from-slate-900 to-slate-950 shrink-0 flex items-end justify-center overflow-hidden border-b border-gray-800">
            {speaking && (
              <div className="absolute inset-0 bg-teal-500/10 blur-3xl animate-pulse"></div>
            )}
            <div className={`relative w-[85%] sm:w-[80%] h-[95%] sm:h-[90%] transition-transform duration-300 ease-in-out origin-bottom
                ${speaking ? 'scale-[1.02] translate-y-1' : 'scale-100 animate-[pulse_4s_ease-in-out_infinite]'}
            `}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
                   <div className="text-6xl sm:text-8xl transition-all duration-100">{mouthOpen ? '😮' : '😐'}</div>
                   <p className="text-[10px] sm:text-xs mt-3 sm:mt-4 text-center px-4 leading-tight">
                     Добавьте<br/><span className="text-teal-500 font-bold">avatar-idle.png</span><br/>и<br/><span className="text-teal-500 font-bold">avatar-speak.png</span><br/>в папку /public
                   </p>
                </div>
                <Image 
                   src={mouthOpen ? avatarSpeak : avatarIdle}
                   alt="2D Avatar"
                   fill
                   className="object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10"
                   unoptimized
                />
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 snap-y pb-[120px] pt-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} snap-end`}>
                <div 
                  className={`max-w-[92%] sm:max-w-[85%] px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[14px] sm:text-[15px] leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md rounded-tr-sm' 
                      : 'bg-gray-800 text-gray-100 shadow-md rounded-tl-sm border border-gray-700/50'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start snap-end">
                <div className="bg-gray-800 border border-gray-700/50 px-4 py-3 sm:py-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center shadow-md">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent pt-10">
            <div className="flex gap-1.5 sm:gap-2 relative bg-gray-800/90 backdrop-blur-lg border border-gray-700 p-1.5 sm:p-2 rounded-2xl shadow-xl">
              <button
                  onClick={toggleListening}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition shrink-0 shadow-md ${
                      listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-teal-400'
                  }`}
              >
                  {listening ? <MicOff size={18} className="sm:w-[20px] sm:h-[20px]" /> : <Mic size={18} className="sm:w-[20px] sm:h-[20px]" />}
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder={listening ? t('Слушаю...', 'Тыңдап тұрмын...') : t('Сообщение...', 'Хабарлама...')}
                className="flex-1 bg-transparent px-2 sm:px-3 text-[14px] sm:text-[15px] focus:outline-none text-white placeholder-gray-400 w-full"
              />

              <button 
                onClick={() => send()} 
                disabled={(!input.trim() && !listening) || loading}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-500 hover:bg-teal-400 flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-white shadow-lg ml-0.5 sm:ml-0"
              >
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toggle Button (visible on desktop or when closed) */}
      <div className={`fixed bottom-6 right-4 sm:right-6 z-[90] transition-transform duration-500 ease-out ${isOpen ? 'translate-y-32 opacity-0 sm:translate-y-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto' : 'translate-y-0 opacity-100'}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(20,184,166,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen ? 'bg-gray-800 text-white rotate-90 scale-75 hidden sm:flex' : 'bg-gradient-to-br from-teal-400 to-teal-600 text-white scale-100 flex'
          }`}
        >
          {isOpen ? <X size={26} className="sm:w-[28px] sm:h-[28px]" /> : <MessageSquare size={26} className="sm:w-[28px] sm:h-[28px]" />}
        </button>
      </div>
    </>
  );
}

