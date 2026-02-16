
import React, { useEffect, useState } from 'react';
import { Music, Star, Disc, Sparkles } from 'lucide-react';
import DiscoBall from './DiscoBall';

interface Props {
  onComplete: () => void;
}

const IntroAnimation: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 1: Spotlight start
    const t1 = setTimeout(() => setPhase(1), 500);
    // Phase 2: Title slam
    const t2 = setTimeout(() => setPhase(2), 2000);
    // Phase 3: Sparkle burst
    const t3 = setTimeout(() => setPhase(3), 3500);
    // Phase 4: Transition to app
    const t4 = setTimeout(() => onComplete(), 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Searchlights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-full left-0 w-[100vw] h-[200vh] bg-gradient-to-t from-fuchsia-600/20 to-transparent origin-bottom animate-[sweep_4s_ease-in-out_infinite]" style={{ transform: 'rotate(-20deg)' }} />
        <div className="absolute top-full right-0 w-[100vw] h-[200vh] bg-gradient-to-t from-cyan-600/20 to-transparent origin-bottom animate-[sweep_4s_ease-in-out_infinite_reverse]" style={{ transform: 'rotate(20deg)' }} />
      </div>

      {/* Floating Notes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-fast opacity-0"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              opacity: phase >= 1 ? 0.4 : 0
            }}
          >
            <Music className={i % 2 === 0 ? 'text-fuchsia-400' : 'text-cyan-400'} size={24 + Math.random() * 40} />
          </div>
        ))}
      </div>

      {/* Main Focus */}
      <div className={`relative transition-all duration-1000 transform ${phase >= 1 ? 'scale-100 translate-y-0 opacity-100' : 'scale-50 -translate-y-20 opacity-0'}`}>
        <div className="flex flex-col items-center gap-12">
          <div className="relative">
             <div className="absolute inset-[-40px] rounded-full bg-white/10 blur-3xl animate-pulse" />
             <DiscoBall />
          </div>

          <div className={`text-center space-y-4 transition-all duration-700 ${phase >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'}`}>
             <div className="flex items-center justify-center gap-4 mb-2">
                <Star className="text-yellow-400 animate-spin-slow" size={32} />
                <span className="text-yellow-400 font-black tracking-[1em] uppercase text-sm euro-font">Eurovision Edition</span>
                <Star className="text-yellow-400 animate-spin-slow" size={32} />
             </div>
             <h1 className="text-8xl md:text-[12rem] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 via-yellow-400 to-cyan-400 euro-font neon-gold leading-none">
               EURO QUIZ
             </h1>
             <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent scale-x-0 animate-[grow_1s_ease-out_forwards] delay-1000" />
          </div>
        </div>
      </div>

      {/* Overlay Flash */}
      <div className={`absolute inset-0 bg-white transition-opacity duration-300 pointer-events-none ${phase === 2 ? 'opacity-20' : 'opacity-0'}`} />

      {/* Broadcast Info */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center space-y-2 opacity-60">
        <div className="flex items-center gap-3 justify-center">
           <Disc className="text-cyan-400 animate-spin" size={16} />
           <span className="text-[10px] font-black tracking-[0.4em] uppercase euro-font">Broadcasting Live from The Stage</span>
        </div>
        <div className="text-[8px] text-white/40 uppercase tracking-widest">Signal Strength: EXCELLENT | Mood: FABULOUS</div>
      </div>

      <style>{`
        @keyframes sweep {
          0%, 100% { transform: rotate(-35deg); }
          50% { transform: rotate(-5deg); }
        }
        @keyframes grow {
          to { transform: scale-x(1); }
        }
        .animate-float-fast {
          animation: float-fast 4s ease-in infinite;
        }
        @keyframes float-fast {
          0% { transform: translateY(20px) scale(0.5); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default IntroAnimation;
