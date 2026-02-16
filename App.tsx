
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Mic, 
  RotateCcw,
  Sparkles,
  Camera,
  X,
  Filter,
  Star,
  Music4,
  UserPlus,
  UserMinus,
  Music2,
  Disc,
  Crown,
  Heart,
  Search,
  CameraOff,
  Music,
  LogOut,
  Info,
  Maximize,
  Minimize
} from 'lucide-react';
import { Player, GameState, SongCard, SabotageType, GameSettings } from './types';
import { generatePlaylist, getTriviaForYear, validateCustomCategory } from './services/geminiService';
import MusicVisualizer from './components/MusicVisualizer';
import DiscoBall from './components/DiscoBall';
import IntroAnimation from './components/IntroAnimation';

// Voice Recognition Setup
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'da-DK';
}

const DECADES = ['Alle', '70erne', '80erne', '90erne', '00erne', '10erne', '20erne'];
const GENRES = ['Alle', 'Pop', 'Rock', 'Dansk', 'Hip Hop', 'Elektronisk', 'Eurovision'];

const RulesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="disco-glass max-w-2xl w-full rounded-[4rem] border-4 border-white/20 p-12 relative overflow-hidden shadow-[0_0_100px_rgba(255,0,255,0.2)]">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Music size={200} />
        </div>
        
        <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all">
          <X size={24} />
        </button>

        <div className="space-y-10 relative z-10">
          <div className="text-center space-y-4">
             <div className="inline-block p-4 bg-yellow-400/20 rounded-3xl border-2 border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
               <Crown className="text-yellow-400" size={40} />
             </div>
             <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white euro-font neon-gold">Regler for Euro Quiz</h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 border-2 border-fuchsia-400 flex items-center justify-center flex-shrink-0 text-fuchsia-400 font-black">1</div>
              <div className="space-y-1">
                <p className="font-black uppercase tracking-widest text-sm text-fuchsia-400 euro-font">Hør Sangen</p>
                <p className="text-white/70 text-sm italic">En sang fra den valgte kategori begynder at spille. Lyt godt efter!</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center flex-shrink-0 text-cyan-400 font-black">2</div>
              <div className="space-y-1">
                <p className="font-black uppercase tracking-widest text-sm text-cyan-400 euro-font">Buz Ind med Stemmen</p>
                <p className="text-white/70 text-sm italic">Vær den hurtigste til at sige dit holds navn højt. AI'en opfanger hvem der er først.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center flex-shrink-0 text-yellow-400 font-black">3</div>
              <div className="space-y-1">
                <p className="font-black uppercase tracking-widest text-sm text-yellow-400 euro-font">Gæt Året & Vind Point</p>
                <p className="text-white/70 text-sm italic">Gæt udgivelsesåret. Korrekt gæt giver 12 point og sangen føjes til jeres tidslinje.</p>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/20 py-6 rounded-3xl font-black uppercase tracking-[0.4em] transition-all euro-font">
            FORSTÅET!
          </button>
        </div>
      </div>
    </div>
  );
};

const ARView: React.FC<{ 
  state: GameState, 
  onClose: () => void,
  yearTrivia: string
}> = ({ state, onClose, yearTrivia }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'denied'>('loading');
  const currentPlayer = state.activePlayerIndex !== null 
    ? state.players[state.activePlayerIndex] 
    : state.players[state.currentPlayerIndex];

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraStatus('active');
        }
      } catch (err) {
        setCameraStatus('denied');
      }
    }
    setupCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {cameraStatus === 'active' ? (
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-fuchsia-900 to-cyan-900 opacity-40 animate-pulse" />
      )}
      <div className="relative flex-1 flex flex-col p-8 z-20 pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="space-y-2">
            <span className="text-sm font-black tracking-widest text-fuchsia-400 euro-font uppercase">Stage_CAM_HUD_v1.0</span>
          </div>
          <button onClick={onClose} className="disco-glass p-5 rounded-full text-white/90 border-white/30 hover:bg-white/20">
            <X size={28} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
            {state.status === 'result' && state.currentActiveCard && (
               <div className="disco-glass p-12 rounded-[3rem] border-4 border-yellow-400 animate-in zoom-in duration-700 text-center">
                  <div className="text-[120px] font-black italic euro-font neon-gold">{state.currentActiveCard.year}</div>
                  <div className="text-3xl font-black text-white uppercase italic">{state.currentActiveCard.title}</div>
               </div>
            )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [state, setState] = useState<GameState>({
    players: [],
    settings: { decade: 'Alle', genre: 'Alle', difficulty: 'medium', customCategory: '' },
    currentPlayerIndex: 0,
    activePlayerIndex: null,
    currentRound: 1,
    status: 'setup',
    currentActiveCard: null,
    playlist: [],
    currentTrackIndex: 0,
    activeSabotage: null,
    lastGuessCorrect: null,
    countdownValue: 10
  });

  const [playerNames, setPlayerNames] = useState<string[]>(['Hold 1', 'Hold 2']);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [yearTrivia, setYearTrivia] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const appContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      appContainerRef.current?.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('yt-player', {
        height: '0', width: '0', videoId: '',
        playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1, 'fs': 0, 'modestbranding': 1 },
        events: { 'onReady': () => console.log('YT Ready') }
      });
    };
  }, []);

  const playCurrentTrack = useCallback(() => {
    const track = stateRef.current.playlist[stateRef.current.currentTrackIndex];
    if (track && playerRef.current?.loadVideoById) {
      const randomOffset = Math.floor(Math.random() * 60) + 30; 
      playerRef.current.loadVideoById({ videoId: track.youtubeId, startSeconds: randomOffset });
      playerRef.current.playVideo();
    }
  }, []);

  const stopPlayback = useCallback(() => {
    playerRef.current?.stopVideo?.();
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try { recognition.start(); setIsListening(true); } catch (e) {}
    }
  }, [isListening]);

  useEffect(() => {
    if (!recognition) return;
    recognition.onresult = (event: any) => {
      const resultTranscript = event.results[event.resultIndex][0].transcript.toLowerCase();
      setTranscript(resultTranscript);
      const currentState = stateRef.current;

      if (currentState.status === 'playing' && currentState.activePlayerIndex === null) {
        currentState.players.forEach((player, index) => {
          if (resultTranscript.includes(player.name.toLowerCase())) {
            stopPlayback();
            setState(prev => ({ ...prev, status: 'placing', activePlayerIndex: index }));
          }
        });
      }

      if (currentState.status === 'placing') {
        if (['korrekt', 'rigtigt', 'yes', 'tæt på'].some(v => resultTranscript.includes(v))) handleGuess(true);
        else if (['forkert', 'fejl', 'nej'].some(v => resultTranscript.includes(v))) handleGuess(false);
      }

      if (currentState.status === 'result' && (resultTranscript.includes('næste') || resultTranscript.includes('videre'))) nextRound();
      if (currentState.status === 'gameOver' && (resultTranscript.includes('nyt spil'))) resetGame();
    };
    recognition.onend = () => { if (stateRef.current.status !== 'setup') recognition.start(); };
  }, [stopPlayback]);

  useEffect(() => {
    let timer: any;
    if (state.status === 'countdown' && state.countdownValue > 0) {
      timer = setTimeout(() => setState(prev => ({ ...prev, countdownValue: prev.countdownValue - 1 })), 1000);
    } else if (state.status === 'countdown' && state.countdownValue === 0) {
      setState(prev => ({ ...prev, status: 'playing' }));
      playCurrentTrack();
    }
    return () => clearTimeout(timer);
  }, [state.status, state.countdownValue, playCurrentTrack]);

  const resetGame = () => {
    stopPlayback();
    setState({
      players: [],
      settings: { decade: 'Alle', genre: 'Alle', difficulty: 'medium', customCategory: '' },
      currentPlayerIndex: 0,
      activePlayerIndex: null,
      currentRound: 1,
      status: 'setup',
      currentActiveCard: null,
      playlist: [],
      currentTrackIndex: 0,
      activeSabotage: null,
      lastGuessCorrect: null,
      countdownValue: 10
    });
    setTranscript('');
    setYearTrivia('');
  };

  const startGame = async () => {
    setLoading(true);
    const players: Player[] = playerNames.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name, score: 0, timeline: [], sabotages: []
    }));
    try {
      const playlist = await generatePlaylist(state.settings, 12);
      setState(prev => ({ 
        ...prev, players, playlist, currentTrackIndex: 0, 
        currentActiveCard: playlist[0], status: 'intro' 
      }));
      startListening();
      setTimeout(() => setState(prev => ({ ...prev, status: 'countdown', countdownValue: 10 })), 4000);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleGuess = async (correct: boolean) => {
    const cs = stateRef.current;
    if (!cs.currentActiveCard || cs.activePlayerIndex === null) return;
    const playerIndex = cs.activePlayerIndex;
    let updatedPlayers = [...cs.players];
    if (correct) {
      updatedPlayers[playerIndex].score += 12;
      updatedPlayers[playerIndex].timeline = [...updatedPlayers[playerIndex].timeline, cs.currentActiveCard].sort((a, b) => a.year - b.year);
    }
    const trivia = await getTriviaForYear(cs.currentActiveCard.year);
    setYearTrivia(trivia);
    setState(prev => ({ ...prev, players: updatedPlayers, status: 'result', lastGuessCorrect: correct }));
  };

  const nextRound = () => {
    stopPlayback(); 
    setState(prev => {
      const nextIndex = prev.currentTrackIndex + 1;
      if (nextIndex >= prev.playlist.length) return { ...prev, status: 'gameOver' };
      return {
        ...prev, status: 'intro', currentTrackIndex: nextIndex,
        currentActiveCard: prev.playlist[nextIndex], activePlayerIndex: null,
        lastGuessCorrect: null, countdownValue: 5
      };
    });
    setYearTrivia('');
    setTimeout(() => setState(prev => ({ ...prev, status: 'countdown', countdownValue: 5 })), 2500);
  };

  if (showIntro) return <IntroAnimation onComplete={() => setShowIntro(false)} />;

  if (state.status === 'setup') {
    return (
      <div ref={appContainerRef} className="h-screen flex flex-col items-center justify-center p-6 bg-[#050505] relative overflow-hidden font-mono">
        <div className="absolute inset-0 glitter-bg opacity-10" />
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        <div className="w-full max-w-6xl space-y-12 relative z-10">
          <div className="flex flex-col items-center gap-4">
            <DiscoBall />
            <div className="flex gap-4">
              <button onClick={() => setShowRules(true)} className="px-5 py-2 disco-glass border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest euro-font">Hjælp</button>
              <button onClick={toggleFullscreen} className="px-5 py-2 disco-glass border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest euro-font">Full Screen</button>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 via-yellow-400 to-cyan-400 euro-font">EURO QUIZ</h1>
            <p className="text-yellow-400 font-black tracking-[0.8em] uppercase text-xs mt-2 euro-font">Grand Prix Battle</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="disco-glass p-8 rounded-[3rem] space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 euro-font">Landshold</span>
                <button onClick={() => setPlayerNames([...playerNames, `Hold ${playerNames.length + 1}`])} className="p-2 bg-fuchsia-500/10 rounded-full border border-fuchsia-500/30 text-fuchsia-400"><UserPlus size={16} /></button>
              </div>
              <div className="space-y-3">
                {playerNames.map((name, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={name} onChange={(e) => { const n = [...playerNames]; n[i] = e.target.value; setPlayerNames(n); }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold uppercase" />
                    <button onClick={() => { if(playerNames.length > 2) setPlayerNames(playerNames.filter((_, idx) => idx !== i)) }} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><UserMinus size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="disco-glass p-8 rounded-[3rem] space-y-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 euro-font block border-b border-white/10 pb-4">Genre Mix</span>
              <div className="flex flex-wrap gap-2">
                {DECADES.map(d => (
                  <button key={d} onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, decade: d }}))} className={`px-4 py-2 rounded-full text-[10px] font-black border transition-all ${state.settings.decade === d ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/50'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="disco-glass p-8 rounded-[3rem] space-y-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 euro-font block border-b border-white/10 pb-4">Tema</span>
              <input type="text" value={customInput} onChange={(e) => { setCustomInput(e.target.value); setState(prev => ({ ...prev, settings: { ...prev.settings, customCategory: e.target.value }})); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold uppercase" placeholder="Eks: Melodigrandprix" />
            </div>
          </div>
          <button onClick={startGame} disabled={loading} className="w-full btn-euro text-white font-black py-8 rounded-[3rem] uppercase tracking-[0.5em] text-xl disabled:opacity-50 border-4 border-white/20">
            {loading ? <Disc className="animate-spin mx-auto" /> : "START SHOWET"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={appContainerRef} className="h-screen bg-[#050505] text-white flex flex-col font-mono overflow-hidden relative">
      <div id="yt-player" className="hidden" />
      <div className="absolute inset-0 glitter-bg opacity-10 pointer-events-none" />
      {showAR && <ARView state={state} onClose={() => setShowAR(false)} yearTrivia={yearTrivia} />}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* COMPACT HEADER */}
      <header className="disco-glass px-10 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-3xl z-50">
        <div className="flex items-center gap-6">
          <DiscoBall />
          <div className={`p-3 rounded-2xl border ${isListening ? 'bg-fuchsia-600/50 border-fuchsia-400 animate-pulse' : 'bg-white/5 border-white/10'}`}><Mic size={20}/></div>
          <div className="space-y-0.5">
            <div className="text-[8px] text-cyan-400 font-black uppercase tracking-widest euro-font">Live Feedback</div>
            <div className="text-lg font-black italic uppercase max-w-[200px] truncate euro-font neon-cyan">{transcript || 'Klar...'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-white/5 px-6 py-2 rounded-full border border-white/10">
            <Crown size={18} className="text-yellow-400" />
            <div className="flex gap-2">
              {state.playlist.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === state.currentTrackIndex ? 'bg-yellow-400 scale-125 shadow-lg' : idx < state.currentTrackIndex ? 'bg-white/40' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={toggleFullscreen} className="p-3 bg-white/5 rounded-full border border-white/10 text-white/70">{isFullscreen ? <Minimize size={20}/> : <Maximize size={20}/>}</button>
             <button onClick={() => setShowRules(true)} className="p-3 bg-white/5 rounded-full border border-white/10 text-white/70"><Info size={20}/></button>
             <button onClick={() => setShowAR(true)} className="p-3 bg-white/5 rounded-full border border-white/10 text-white/70"><Camera size={20}/></button>
             <button onClick={resetGame} className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-500"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      {/* MAIN GAME AREA - FIXED HEIGHT & NO SCROLL */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden gap-6">
        
        {/* CENTER STAGE */}
        <section className="flex-1 relative disco-glass rounded-[3rem] p-8 flex flex-col items-center justify-center border border-white/10 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
             <Music size={300} className="absolute -top-20 -left-20 rotate-12 text-fuchsia-500 blur-sm" />
             <Music size={250} className="absolute -bottom-10 -right-10 -rotate-12 text-cyan-500 blur-sm" />
          </div>

          {state.status === 'intro' && (
            <div className="text-center space-y-6 animate-in zoom-in">
               <div className="p-6 bg-fuchsia-500/10 rounded-full border-2 border-fuchsia-400 animate-pulse inline-block">
                  <Crown size={40} className="text-fuchsia-400" />
               </div>
               <h2 className="text-6xl font-black italic euro-font neon-pink">ACT #{state.currentTrackIndex + 1}</h2>
               <div className="max-w-xs mx-auto h-2 bg-white/10 overflow-hidden rounded-full border border-white/10 mt-4">
                  <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 animate-[loading_3s_linear_infinite]" />
               </div>
            </div>
          )}

          {state.status === 'countdown' && (
            <div className="text-center animate-in fade-in">
               <div className="text-[180px] font-black italic text-white euro-font neon-cyan leading-none">
                 {state.countdownValue}
               </div>
            </div>
          )}

          {state.status === 'playing' && (
            <div className="text-center space-y-8 w-full animate-in zoom-in">
              <h2 className="text-5xl font-black italic euro-font neon-cyan">HVILKEN SANG?</h2>
              <MusicVisualizer isActive={true} sabotage={state.activeSabotage} />
              <div className="flex justify-center gap-10 pt-6">
                 {state.players.map(p => (
                   <div key={p.id} className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center bg-black/40 text-3xl font-black euro-font">
                        {p.name[0]}
                      </div>
                      <span className="text-[10px] font-black uppercase text-white/50 euro-font">{p.name}</span>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {state.status === 'placing' && state.activePlayerIndex !== null && (
            <div className="text-center space-y-8 animate-in slide-in-from-bottom-8">
               <h2 className="text-7xl font-black italic text-yellow-400 euro-font neon-gold">{state.players[state.activePlayerIndex].name}!</h2>
               <div className="disco-glass p-10 rounded-[3rem] border-2 border-fuchsia-500/30 bg-fuchsia-500/5 max-w-lg mx-auto space-y-4">
                  <div className="text-2xl font-black uppercase text-white euro-font">Hvilket årstal?</div>
                  <p className="text-xs text-white/50 font-bold italic tracking-widest">Sig: "Korrekt" eller "Forkert"</p>
               </div>
            </div>
          )}

          {state.status === 'result' && state.currentActiveCard && (
            <div className="w-full text-center space-y-6 animate-in zoom-in">
              <div className={`text-[120px] font-black italic leading-none euro-font ${state.lastGuessCorrect ? 'text-yellow-400 neon-gold' : 'text-red-400 neon-red'}`}>
                {state.currentActiveCard.year}
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-black italic text-white euro-font neon-cyan">{state.currentActiveCard.title}</h3>
                <div className="px-6 py-2 bg-fuchsia-600 rounded-full inline-block border-2 border-white/20">
                   <p className="text-white font-black uppercase tracking-widest text-xs euro-font">{state.currentActiveCard.artist}</p>
                </div>
              </div>
              <div className="disco-glass p-6 rounded-[2rem] border border-white/10 max-w-3xl mx-auto italic text-sm text-white/80 leading-relaxed shadow-lg">
                "{yearTrivia || state.currentActiveCard.fact}"
              </div>
              <button onClick={nextRound} className="p-6 rounded-full disco-glass border-2 border-white/20 hover:bg-white/10 transition-all">
                <RotateCcw size={32} />
              </button>
            </div>
          )}

          {state.status === 'gameOver' && (
            <div className="text-center space-y-8 animate-in zoom-in">
               <Crown size={80} className="text-yellow-400 mx-auto animate-bounce" />
               <h2 className="text-6xl font-black italic text-white euro-font neon-gold">VI HAR EN VINDER!</h2>
               <div className="text-4xl font-black text-yellow-400 euro-font uppercase">
                  {([...state.players].sort((a,b)=>b.score-a.score)[0]).name}
               </div>
               <button onClick={resetGame} className="btn-euro px-10 py-5 rounded-full text-white font-black uppercase tracking-widest border-2 border-white/20">SPIL IGEN</button>
            </div>
          )}
        </section>

        {/* COMPACT PLAYER GRID - ALWAYS VISIBLE */}
        <section className={`grid grid-cols-2 md:grid-cols-${state.players.length} gap-4`}>
           {state.players.map(player => (
             <div key={player.id} className={`disco-glass p-6 rounded-[2.5rem] border border-white/10 flex flex-col gap-4 relative overflow-hidden transition-all ${state.activePlayerIndex === state.players.indexOf(player) ? 'ring-2 ring-fuchsia-500 shadow-[0_0_30px_rgba(255,0,255,0.2)]' : ''}`}>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/30">
                        <Heart size={18} className="text-fuchsia-400 fill-fuchsia-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/80 uppercase truncate max-w-[80px] euro-font">{player.name}</span>
                        <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">{player.timeline.length} sange</span>
                      </div>
                   </div>
                   <div className="text-3xl font-black italic text-yellow-400 euro-font leading-none">{player.score}</div>
                </div>
                
                {/* COMPACT TIMELINE */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                   {player.timeline.length === 0 ? (
                      <div className="w-full h-12 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center">
                         <Music2 size={16} className="text-white/10" />
                      </div>
                   ) : (
                      player.timeline.map((card, i) => (
                        <div key={i} className="flex-shrink-0 w-16 h-12 disco-glass rounded-lg border border-white/10 flex flex-col items-center justify-center hover:border-yellow-400 transition-all">
                           <span className="text-[10px] font-black text-cyan-400 euro-font">{card.year}</span>
                        </div>
                      ))
                   )}
                </div>
             </div>
           ))}
        </section>
      </main>

      <footer className="disco-glass px-10 py-3 border-t border-white/10 flex items-center justify-between z-40">
         <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-fuchsia-500 animate-pulse shadow-lg" />
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest euro-font italic">"{transcript || 'Venter på vært...'}"</span>
         </div>
         <div className="text-[8px] text-white/20 font-black uppercase tracking-widest euro-font">Musikquizkampen: Eurovision Edition v2.0</div>
      </footer>
    </div>
  );
};

export default App;
