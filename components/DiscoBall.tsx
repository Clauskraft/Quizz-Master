
import React from 'react';

const DiscoBall: React.FC = () => {
  return (
    <div className="relative w-16 h-16 md:w-20 md:h-20 group">
      {/* Light rays/Reflections */}
      <div className="absolute inset-[-100%] pointer-events-none overflow-visible z-[-1]">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-[200%] h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
              animation: `disco-rays 4s linear infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* The Ball itself */}
      <div className="w-full h-full rounded-full relative overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-white/20 animate-[spin_10s_linear_infinite] bg-gray-300">
        {/* Mirror Grid Pattern using CSS */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '8px 8px',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
          }}
        />
        
        {/* Dynamic highlights */}
        <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/30 via-transparent to-cyan-500/30 mix-blend-overlay" />
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-white/40 rounded-full blur-xl animate-pulse" />
      </div>

      {/* Chain/Hanger */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-gradient-to-b from-transparent to-white/40" />

      <style>{`
        @keyframes disco-rays {
          0% { opacity: 0; transform: translate(-50%, -50%) rotate(0deg) scale(0.5); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) rotate(180deg) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(360deg) scale(0.5); }
        }
      `}</style>
    </div>
  );
};

export default DiscoBall;
