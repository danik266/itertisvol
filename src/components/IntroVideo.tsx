'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';

interface IntroVideoProps {
  onComplete: () => void;
}

export default function IntroVideo({ onComplete }: IntroVideoProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStart = () => {
    setHasStarted(true);
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error("Video play failed:", err);
      });
    }
  };

  const handleVideoEnd = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 1000); // 1s fade out
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[9999] bg-[#1a7f84] flex items-center justify-center overflow-hidden"
        >
          {/* Splash Screen (Interaction Trigger) */}
          {!hasStarted && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="group relative flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 group-hover:bg-white/20 transition-all duration-300">
                <Play className="text-white fill-white ml-1 w-10 h-10" />
              </div>
              <div className="text-center">
                <h2 className="text-white font-display font-bold text-2xl tracking-widest mb-2">IT-ERTIS VOLUNTEER</h2>
                <p className="text-white/60 font-medium tracking-widest text-sm uppercase">Нажать для входа</p>
              </div>
              {/* Pulsing effect */}
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-white animate-ping opacity-20 pointer-events-none" />
            </motion.button>
          )}

          {/* Full Screen Video */}
          <video
            ref={videoRef}
            src="/guide-movie.mp4"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${hasStarted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onEnded={handleVideoEnd}
            playsInline
          />

          {/* Skip Button (Optional but good UX) */}
          {hasStarted && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleVideoEnd}
              className="absolute bottom-10 right-10 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors z-[10000]"
            >
              Пропустить
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
