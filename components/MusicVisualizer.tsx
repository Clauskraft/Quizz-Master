
import React, { useEffect, useState } from 'react';
import { SabotageType } from '../types';

interface Props {
  isActive: boolean;
  sabotage: SabotageType | null;
}

const MusicVisualizer: React.FC<Props> = ({ isActive, sabotage }) => {
  const [bars, setBars] = useState<number[]>(new Array(30).fill(0));

  useEffect(() => {
    if (!isActive) {
      setBars(new Array(30).fill(5));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * (sabotage === SabotageType.DISTORTION ? 100 : 70) + 15));
    }, 80);

    return () => clearInterval(interval);
  }, [isActive, sabotage]);

  return (
    <div className={`flex items-end justify-center gap-1.5 h-48 w-full max-w-2xl mx-auto transition-all duration-500 ${sabotage === SabotageType.DISTORTION ? 'sabotage-distortion blur-sm' : ''}`}>
      {bars.map((height, i) => {
        // Determine color based on index for a rainbow/gradient stage look
        const colorClass = i % 3 === 0 ? 'bg-[#ff00ff]' : i % 3 === 1 ? 'bg-[#00ffff]' : 'bg-[#ffd700]';
        const shadowClass = i % 3 === 0 ? 'shadow-[0_0_15px_#ff00ff]' : i % 3 === 1 ? 'shadow-[0_0_15px_#00ffff]' : 'shadow-[0_0_15px_#ffd700]';
        
        return (
          <div
            key={i}
            className={`w-3 rounded-t-full transition-all duration-100 ${colorClass} ${shadowClass} opacity-80`}
            style={{ 
              height: `${height}%`,
              transitionDuration: sabotage === SabotageType.SPEED_UP ? '40ms' : '100ms'
            }}
          />
        );
      })}
    </div>
  );
};

export default MusicVisualizer;
