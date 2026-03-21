'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Bot, Volume2, VolumeX } from 'lucide-react';
import { useLang } from '@/lib/LangContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIGuide() {
  const { lang } = useLang();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        lang === 'kz'
          ? 'Қандай сұрақтарыңыз бар?'
          : 'Какие у вас есть вопросы?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);

  // ── Mute ──────────────────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const mutedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai_guide_muted') === 'true';
    mutedRef.current = saved;
    setIsMuted(saved);
    setMounted(true);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      localStorage.setItem('ai_guide_muted', String(next));
      if (next) {
        window.speechSynthesis?.cancel();
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
      }
      return next;
    });
  }, []);

  // ── Speak ─────────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string, currentLang: string) => {
    if (typeof window === 'undefined') return;
    if (mutedRef.current) return;

    const voice = currentLang === 'kz' ? 'kk-KZ-DauletNeural' : 'ru-RU-DmitryNeural';
    console.log(`TTS: Initiating ${voice} for: "${text.substring(0, 30)}..."`);

    // 1. DIRECT Neural TTS via stable public proxy (Bypasses server blocks/422/501)
    try {
      // kuku.lu is an extremely stable, high-availability Edge TTS relay
      const directUrl = `https://tts.kuku.lu/edge?voice=${voice}&text=${encodeURIComponent(text)}`;
      const res = await fetch(directUrl);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = 0.98;
        
        audio.play().then(() => console.log(`✓ Direct Neural (${voice}) played`))
        .catch(e => {
          console.warn("Direct play failed, trying backend...", e);
          tryBackendSpeak(text, currentLang);
        });
        return;
      }
    } catch (err) {
      console.warn('Direct proxy failed, trying backend...', err);
    }

    // 2. Try Backend TTS (API)
    tryBackendSpeak(text, currentLang);
  }, []);

  const tryBackendSpeak = async (text: string, currentLang: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: currentLang }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = 0.98;
        audio.play().then(() => console.log('✓ Backend Neural played'))
        .catch(() => fallbackSpeak(text, currentLang));
      } else {
        fallbackSpeak(text, currentLang);
      }
    } catch (err) {
      fallbackSpeak(text, currentLang);
    }
  };

  // 1.2 Fallback to Local Browser TTS (Robotic but works everywhere)
  const fallbackSpeak = (text: string, currentLang: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const trySpeak = () => {
      if (mutedRef.current) return;
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = currentLang === 'kz' ? 'kk-KZ' : 'ru-RU';
        
        const voices = window.speechSynthesis.getVoices();
        const prefix = currentLang === 'kz' ? 'kk' : 'ru';
        
        const voice = 
          voices.find(v => v.lang.startsWith(prefix) && v.name.includes('Online')) ||
          voices.find(v => v.lang.startsWith(prefix) && (v.name.includes('Yuri') || v.name.includes('Pavel') || v.name.includes('Google'))) ||
          voices.find(v => v.lang.startsWith(prefix) && v.name.toLowerCase().includes('male')) ||
          voices.find(v => v.lang.startsWith(prefix));

        if (voice) {
          utter.voice = voice;
          utter.pitch = voice.name.toLowerCase().includes('male') ? 0.95 : 0.75;
          utter.rate = 1.0;
        } else {
          utter.pitch = 0.75;
          utter.rate = 1.0;
        }
        
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.error('Local TTS error:', err);
      }
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = trySpeak;
    } else {
      setTimeout(trySpeak, 50);
    }
  };

  // ── Greeting ──────────────────────────────────────────────────────────────────
  const greetingPlayedRef = useRef(false);

  useEffect(() => {
    const greeting =
      lang === 'kz'
        ? 'Қандай сұрақтарыңыз бар?'
        : 'Какие у вас есть вопросы?';

    setBubbleText(greeting);
    const bubbleTimer = setTimeout(() => setBubbleText(null), 7000);

    const playGreeting = () => {
      if (greetingPlayedRef.current) return;
      greetingPlayedRef.current = true;
      // speak(greeting, lang); // Disabled automatic greeting sound as requested
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener('click', playGreeting);
      document.removeEventListener('keydown', playGreeting);
      document.removeEventListener('touchstart', playGreeting);
      document.removeEventListener('scroll', playGreeting);
      document.removeEventListener('mousemove', playGreeting);
    };

    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        ctx.resume().then(() => setTimeout(playGreeting, 300));
      } catch { /* fallback */ }
    };

    const unlockTimer = setTimeout(unlockAudio, 500);

    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setTimeout(playGreeting, 800);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          if (!greetingPlayedRef.current) setTimeout(playGreeting, 300);
        };
      }
    }

    document.addEventListener('click', playGreeting, { once: true });
    document.addEventListener('keydown', playGreeting, { once: true });
    document.addEventListener('touchstart', playGreeting, { once: true });
    document.addEventListener('scroll', playGreeting, { once: true });
    document.addEventListener('mousemove', playGreeting, { once: true });

    return () => {
      clearTimeout(bubbleTimer);
      clearTimeout(unlockTimer);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chat ──────────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const res = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages, language: lang }),
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      speak(data.reply, lang);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: lang === 'kz' ? 'Кешіріңіз, қате кетті.' : 'Извините, произошла ошибка.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Icons (hydration-safe) ────────────────────────────────────────────────────
  const MuteIcon22 = mounted && isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />;
  const MuteIcon18 = mounted && isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ════════════════════════════════════════════
          MOBILE CHAT — на весь экран
      ════════════════════════════════════════════ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex flex-col md:hidden bg-white"
          style={{ height: '100dvh' }}
        >
          <div className="bg-[#1a7f84] text-white px-4 py-4 flex justify-between items-center shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full"><Bot size={22} /></div>
              <span className="font-bold tracking-wide text-base">
                {lang === 'kz' ? 'Виртуалды Гид' : 'Виртуальный Гид'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleMute} className="hover:bg-white/20 p-2 rounded-full text-white transition-colors">
                {MuteIcon22}
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full text-white transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 px-4 py-4 overflow-y-auto bg-slate-50 flex flex-col gap-3 min-h-0">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                  ? 'bg-[#ff8a00] text-white rounded-[1.2rem] rounded-br-[0.2rem]'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-[1.2rem] rounded-bl-[0.2rem]'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200/80 shadow-sm rounded-[1.2rem] rounded-bl-[0.2rem] px-4 py-3 flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="px-3 py-3 bg-white border-t border-slate-100 shrink-0 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === 'kz' ? 'Сұрағыңызды жазыңыз...' : 'Напишите ваш вопрос...'}
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a7f84] focus:ring-1 focus:ring-[#1a7f84] transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#1a7f84] text-white p-3 rounded-full hover:bg-[#156a6e] disabled:opacity-50 transition-colors flex-shrink-0 shadow-md"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MOBILE TRIGGER — персонаж большой внизу справа
      ════════════════════════════════════════════ */}
      {!isOpen && (
        <div className="fixed bottom-[-1rem] left-0 z-50 md:hidden flex flex-col items-start">
          {/* Пузырь */}
          {bubbleText && (
            <div className="mb-2 ml-4 bg-white text-slate-800 text-xs font-semibold py-2 px-3 rounded-2xl shadow-xl border border-slate-100 max-w-[180px] text-center relative z-20">
              {bubbleText}
              <div className="absolute -bottom-2 left-10 w-4 h-4 bg-white border-b border-r border-slate-100 transform rotate-45" />
            </div>
          )}

          {/* Персонаж + иконка звука */}
          <div className="relative cursor-pointer" onClick={() => setIsOpen(true)}>

            <div className="animate-float-mobile">
              <img
                src="/images/guide_hello.png"
                alt="AI Guide"
                className="w-[130px] h-auto object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          DESKTOP — персонаж + чат в углу
      ════════════════════════════════════════════ */}
      <div className="fixed bottom-0 right-0 z-50 hidden md:flex flex-row-reverse items-end">
        {isOpen && (
          <div className="bg-white rounded-t-3xl shadow-2xl w-[420px] flex flex-col overflow-hidden border border-slate-200 mr-6 mb-6 h-[36rem] origin-bottom-right animate-in zoom-in-95 duration-200 z-10 relative">
            <div className="bg-[#1a7f84] text-white p-5 flex justify-between items-center rounded-t-3xl shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full"><Bot size={24} /></div>
                <span className="font-bold font-display tracking-wide text-lg">
                  {lang === 'kz' ? 'Виртуалды Гид' : 'Виртуальный Гид'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="hover:bg-white/20 p-2 rounded-full text-white transition-colors">
                  {MuteIcon22}
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-slate-50 flex flex-col gap-4 min-h-0 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 text-base leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-[#ff8a00] text-white rounded-[1.5rem] rounded-br-[0.25rem]'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-[1.5rem] rounded-bl-[0.25rem]'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200/80 shadow-sm rounded-[1.5rem] rounded-bl-[0.25rem] p-4 flex gap-1.5 items-center h-12">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 shrink-0 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === 'kz' ? 'Сұрағыңызды жазыңыз...' : 'Напишите ваш вопрос...'}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-6 py-2 text-base focus:outline-none focus:border-[#1a7f84] focus:ring-1 focus:ring-[#1a7f84] transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#1a7f84] text-white p-3.5 rounded-full hover:bg-[#156a6e] disabled:opacity-50 transition-colors flex-shrink-0 shadow-md"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        )}

        {/* Персонаж десктоп */}
        <div
          className="relative cursor-pointer group flex-shrink-0 z-20 translate-y-[4rem]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <button
            onClick={toggleMute}
            className="absolute right-10 bottom-[6rem] bg-white shadow-lg rounded-full p-2.5 text-[#1a7f84] hover:scale-110 transition-transform z-40 border border-slate-100"
          >
            {MuteIcon18}
          </button>
          <div className={`absolute -top-24 left-1/2 -translate-x-1/2 bg-white text-slate-800 text-base font-bold py-3 px-6 rounded-2xl shadow-xl border border-slate-100 transition-all z-30 text-center min-w-[200px] max-w-[280px] ${bubbleText
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
            }`}>
            {bubbleText || (lang === 'kz' ? 'Сұрағыңыз бар ма?' : 'Есть вопросы?')}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-slate-100 transform rotate-45" />
          </div>
          <div className="relative animate-float">
            <img
              src={isOpen ? '/images/guide_character.png' : '/images/guide_hello.png'}
              alt="AI Guide"
              className="w-[14rem] lg:w-[17rem] h-auto max-h-[90vh] object-contain group-hover:scale-105 transition-transform origin-bottom"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%   { transform: translateY(0px); }
            50%  { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes float-mobile {
            0%   { transform: translateY(0px); }
            50%  { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }
          .animate-float        { animation: float 4s ease-in-out infinite; }
          .animate-float-mobile { animation: float-mobile 3s ease-in-out infinite; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        `
      }} />
    </>
  );
}