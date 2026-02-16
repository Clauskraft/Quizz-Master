
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
  Minimize,
  Volume2,
  VolumeX,
  Save,
  History,
  Trash2
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
        <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"><X size={24} /></button>
        <div className="space-y-10 relative z-10">
          <div className="text-center space-y-4">
             <div className="inline-block p-4 bg-yellow-400/20 rounded-3xl border-2 border-yellow-400"><Crown className="text-yellow-400" size={40} /></div>
             <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white euro-font neon-gold">Euro Quiz Regler</h2>
          </div>
          <div className="space-y-6 text-white/80">
            <p>1. <b>Hør sangen:</b> En tilfældig sang fra kategorien spiller.</p>
            <p>2. <b>Buz ind:</b> Sig dit holds navn højt for at stoppe musikken.</p>
            <p>3. <b>Gæt året:</b> Gæt hvornår sangen udkom (+/- 12 point).</p>
            <p>4. <b>Stemmestyring:</b> Brug "Korrekt", "Forkert" og "Næste runde".</p>
          </div>
          <button onClick={onClose} className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/20 py-6 rounded-3xl font-black uppercase tracking-[0.4em] transition-all euro-font text-white">FORSTÅET!</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  
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
  const [showRules, setShowRules] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const appContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Load saved categories from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('euro-quiz-categories');
    if (saved) setSavedCategories(JSON.parse(saved));
  }, []);

  const saveCategory = (cat: string) => {
    if (!cat || savedCategories.includes(cat)) return;
    const newSaved = [cat, ...savedCategories].slice(0, 5);
    setSavedCategories(newSaved);
    localStorage.setItem('euro-quiz-categories', JSON.stringify(newSaved));
  };

  const deleteCategory = (cat: string) => {
    const newSaved = savedCategories.filter(c => c !== cat);
    setSavedCategories(newSaved);
    localStorage.setItem('euro-quiz-categories', JSON.stringify(newSaved));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      appContainerRef.current?.requestFullscreen().catch(err => alert(`Fuldskærm fejl: ${err.message}`));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('yt-player', {
        height: '10', width: '10', videoId: '',
        playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1, 'fs': 0, 'modestbranding': 1, 'origin': window.location.origin },
        events: { 
          'onReady': (event: any) => {
            console.log('YouTube Player Ready');
            event.target.unMute();
            event.target.setVolume(100);
          }
        }
      });
    };
  }, []);

  const playCurrentTrack = useCallback(() => {
    const track = stateRef.current.playlist[stateRef.current.currentTrackIndex];
    if (track && playerRef.current?.loadVideoById) {
      const randomOffset = Math.floor(Math.random() * 60) + 20; 
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      playerRef.current.loadVideoById({ videoId: track.youtubeId, startSeconds: randomOffset });
      playerRef.current.playVideo();
      console.log('Playing:', track.title);
    }
  }, []);

  const stopPlayback = useCallback(() => {
    playerRef.current?.pauseVideo?.();
    playerRef.current?.stopVideo?.();
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try { recognition.start(); setIsListening(true); } catch (e) { console.error('Voice start error:', e); }
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
        if (['korrekt', 'rigtigt', 'ja', 'yes'].some(v => resultTranscript.includes(v))) handleGuess(true);
        else if (['forkert', 'fejl', 'nej'].some(v => resultTranscript.includes(v))) handleGuess(false);
      }

      if (currentState.status === 'result' && (['næste', 'videre', 'næste runde', 'næste sang'].some(v => resultTranscript.includes(v)))) {
        nextRound();
      }

      if (currentState.status === 'gameOver' && resultTranscript.includes('nyt spil')) resetGame();
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
    setState(prev => ({
      ...prev, players: [], currentPlayerIndex: 0, activePlayerIndex: null, status: 'setup', playlist: [], currentTrackIndex: 0
    }));
    setTranscript('');
    setYearTrivia('');
  };

  const startGame = async () => {
    // Vigtigt: Unmute YouTube player ved første klik
    if (playerRef.current) {
      playerRef.current.playVideo();
      setTimeout(() => playerRef.current.stopVideo(), 50);
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
    }

    setLoading(true);
    if (customInput) saveCategory(customInput);
    
    const players: Player[] = playerNames.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name, score: 0, timeline: [], sabotages: []
    }));

    try {
      const playlist = await generatePlaylist(state.settings, 10);
      setState(prev => ({ ...prev, players, playlist, currentTrackIndex: 0, currentActiveCard: playlist[0], status: 'intro' }));
      startListening();
      setTimeout(() => setState(prev => ({ ...prev, status: 'countdown', countdownValue: 5 })), 3000);
    } catch (e) {
      alert("Fejl ved indlæsning af sange. Tjek internet eller API nøgle.");
    }
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
        ...prev, status: 'intro', currentTrackIndex: nextIndex, currentActiveCard: prev.playlist[nextIndex], 
        activePlayerIndex: null, lastGuessCorrect: null, countdownValue: 5
      };
    });
    setYearTrivia('');
    setTimeout(() => setState(prev => ({ ...prev, status: 'countdown', countdownValue: 5 })), 2500);
  };

  if (showIntro) return <IntroAnimation onComplete={() => setShowIntro(false)} />;

  if (state.status === 'setup') {
    return (
      <div ref={appContainerRef} className="h-screen w-full flex flex-col items-center justify-center p-4 bg-[#050505] relative overflow-hidden font-mono">
        <div className="absolute inset-0 glitter-bg opacity-10" />
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        
        <div className="w-full max-w-5xl space-y-6 relative z-10 flex flex-col items-center">
          <DiscoBall />
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-yellow-400 to-cyan-400 euro-font">EURO QUIZ</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-[60vh] overflow-hidden">
            {/* Hold */}
            <div className="disco-glass p-6 rounded-[2.5rem] flex flex-col gap-4 overflow-y-auto no-scrollbar border border-white/10">
               <div className="flex justify-between items-center border-b border-white/10 pb-2">
                 <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest euro-font">Hold / Lande</span>
                 <button onClick={() => setPlayerNames([...playerNames, `Hold ${playerNames.length + 1}`])} className="p-1 bg-white/5 rounded-lg border border-white/20 text-fuchsia-400"><UserPlus size={16}/></button>
               </div>
               {playerNames.map((n, i) => (
                 <div key={i} className="flex gap-2">
                   <input type="text" value={n} onChange={(e) => { const x = [...playerNames]; x[i] = e.target.value; setPlayerNames(x); }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-bold uppercase" />
                   <button onClick={() => playerNames.length > 2 && setPlayerNames(playerNames.filter((_, idx) => idx !== i))} className="p-2 text-red-500"><UserMinus size={16}/></button>
                 </div>
               ))}
            </div>

            {/* Kategorier */}
            <div className="disco-glass p-6 rounded-[2.5rem] flex flex-col gap-4 overflow-y-auto no-scrollbar border border-white/10">
               <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest euro-font border-b border-white/10 pb-2">Hurtig Mix</span>
               <div className="flex flex-wrap gap-2">
                 {DECADES.map(d => (
                   <button key={d} onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, decade: d }}))} className={`px-3 py-1.5 rounded-full text-[9px] font-black border transition-all ${state.settings.decade === d ? 'bg-fuchsia-600 border-fuchsia-400' : 'bg-white/5 border-white/10 text-white/40'}`}>{d}</button>
                 ))}
               </div>
               <div className="flex flex-wrap gap-2 pt-2">
                 {GENRES.map(g => (
                   <button key={g} onClick={() => setState(prev => ({ ...prev, settings: { ...prev.settings, genre: g }}))} className={`px-3 py-1.5 rounded-full text-[9px] font-black border transition-all ${state.settings.genre === g ? 'bg-cyan-600 border-cyan-400' : 'bg-white/5 border-white/10 text-white/40'}`}>{g}</button>
                 ))}
               </div>
            </div>

            {/* Custom Tema & Gemt */}
            <div className="disco-glass p-6 rounded-[2.5rem] flex flex-col gap-4 overflow-y-auto no-scrollbar border border-white/10">
               <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest euro-font border-b border-white/10 pb-2">Brugerdefineret</span>
               <div className="space-y-2">
                 <input type="text" value={customInput} onChange={(e) => { setCustomInput(e.target.value); setState(prev => ({ ...prev, settings: { ...prev.settings, customCategory: e.target.value }})); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-bold uppercase" placeholder="Indtast tema..." />
                 <div className="space-y-1.5 pt-2">
                    <span className="text-[8px] text-white/30 uppercase flex items-center gap-1"><History size={10}/> Gemte kategorier</span>
                    {savedCategories.map((cat, i) => (
                      <div key={i} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/5 group">
                        <button onClick={() => { setCustomInput(cat); setState(prev => ({ ...prev, settings: { ...prev.settings, customCategory: cat }})); }} className="flex-1 text-[10px] text-white/70 uppercase font-black text-left truncate">{cat}</button>
                        <button onClick={() => deleteCategory(cat)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>

          <button onClick={startGame} disabled={loading} className="w-full btn-euro text-white font-black py-6 rounded-[2.5rem] uppercase tracking-[0.5em] text-xl border-4 border-white/20 shadow-2xl">
            {loading ? "INDLÆSER..." : "START GRAND PRIX"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={appContainerRef} className="h-screen w-full bg-[#050505] text-white flex flex-col font-mono overflow-hidden relative">
      <div id="yt-player" className="absolute top-0 left-0 opacity-[0.01] pointer-events-none" style={{ width: '1px', height: '1px' }} />
      <div className="absolute inset-0 glitter-bg opacity-10 pointer-events-none" />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <header className="disco-glass px-6 py-3 flex items-center justify-between border-b border-white/10 backdrop-blur-3xl z-50 h-[10vh]">
        <div className="flex items-center gap-4">
          <DiscoBall />
          <div className="space-y-0.5">
            <div className="text-[8px] text-cyan-400 font-black uppercase tracking-widest euro-font">Broadcast Feed</div>
            <div className="text-sm font-black italic uppercase truncate max-w-[150px] euro-font neon-cyan">{transcript || 'Signal klar...'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
            {state.playlist.map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === state.currentTrackIndex ? 'bg-yellow-400 scale-125' : idx < state.currentTrackIndex ? 'bg-white/40' : 'bg-white/10'}`} />
            ))}
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="p-2.5 bg-white/5 rounded-full border border-white/10 text-white/70">{isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>
          <button onClick={toggleFullscreen} className="p-2.5 bg-white/5 rounded-full border border-white/10 text-white/70">{isFullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}</button>
          <button onClick={resetGame} className="p-2.5 bg-red-500/10 rounded-full border border-red-500/20 text-red-500"><LogOut size={18}/></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 overflow-hidden gap-4 h-[90vh]">
        
        {/* Stage Container */}
        <section className="flex-[3] relative disco-glass rounded-[3rem] p-6 flex flex-col items-center justify-center border border-white/10 overflow-hidden shadow-2xl">
          {state.status === 'intro' && (
             <div className="text-center space-y-4 animate-in zoom-in">
                <Crown size={40} className="text-fuchsia-400 mx-auto animate-bounce" />
                <h2 className="text-4xl font-black italic euro-font neon-pink">ACT #{state.currentTrackIndex + 1}</h2>
                <div className="w-40 h-1 bg-white/10 rounded-full mx-auto"><div className="h-full bg-cyan-400 animate-[loading_3s_linear_infinite]" /></div>
             </div>
          )}

          {state.status === 'countdown' && (
            <div className="text-[120px] font-black italic euro-font neon-cyan leading-none animate-pulse">
              {state.countdownValue}
            </div>
          )}

          {state.status === 'playing' && (
            <div className="text-center space-y-6 w-full animate-in zoom-in h-full flex flex-col justify-center">
              <h2 className="text-4xl font-black italic euro-font neon-cyan">HVILKEN SANG?</h2>
              <MusicVisualizer isActive={true} sabotage={state.activeSabotage} />
              <div className="flex justify-center gap-6 pt-4">
                 {state.players.map(p => (
                   <div key={p.id} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => { stopPlayback(); setState(prev => ({ ...prev, status: 'placing', activePlayerIndex: state.players.indexOf(p) })); }}>
                      <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center bg-black/40 text-2xl font-black euro-font group-hover:scale-110 transition-transform">
                        {p.name[0]}
                      </div>
                      <span className="text-[8px] font-black uppercase text-white/50 euro-font">{p.name}</span>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {state.status === 'placing' && state.activePlayerIndex !== null && (
            <div className="text-center space-y-6 animate-in slide-in-from-bottom-8">
               <h2 className="text-5xl font-black italic text-yellow-400 euro-font neon-gold">{state.players[state.activePlayerIndex].name}!</h2>
               <div className="disco-glass px-10 py-6 rounded-[2rem] border-2 border-fuchsia-500/30 bg-fuchsia-500/5 space-y-2">
                  <div className="text-xl font-black uppercase text-white euro-font">Gæt årstallet</div>
                  <p className="text-[10px] text-white/50 font-bold italic">Sig: "Korrekt" eller "Forkert"</p>
               </div>
               <div className="flex gap-4 justify-center">
                  <button onClick={() => handleGuess(true)} className="px-6 py-2 bg-green-500/20 border border-green-500 rounded-full text-[10px] font-black uppercase tracking-widest text-green-400">Korrekt</button>
                  <button onClick={() => handleGuess(false)} className="px-6 py-2 bg-red-500/20 border border-red-500 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400">Forkert</button>
               </div>
            </div>
          )}

          {state.status === 'result' && state.currentActiveCard && (
            <div className="w-full text-center space-y-4 animate-in zoom-in max-h-full overflow-y-auto no-scrollbar">
              <div className={`text-[80px] font-black italic leading-none euro-font ${state.lastGuessCorrect ? 'text-yellow-400 neon-gold' : 'text-red-400 neon-red'}`}>
                {state.currentActiveCard.year}
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black italic text-white euro-font neon-cyan">{state.currentActiveCard.title}</h3>
                <div className="px-4 py-1.5 bg-fuchsia-600 rounded-full inline-block border border-white/20"><p className="text-white font-black uppercase tracking-widest text-[9px] euro-font">{state.currentActiveCard.artist}</p></div>
              </div>
              <div className="disco-glass p-4 rounded-[1.5rem] border border-white/10 max-w-lg mx-auto italic text-xs text-white/80 leading-relaxed shadow-lg">
                "{yearTrivia || state.currentActiveCard.fact}"
              </div>
              <button onClick={nextRound} className="p-4 rounded-full disco-glass border border-white/20 hover:bg-white/10 group">
                <RotateCcw size={24} className="group-hover:rotate-180 transition-transform duration-500" />
              </button>
              <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Sig "Næste runde"</p>
            </div>
          )}

          {state.status === 'gameOver' && (
            <div className="text-center space-y-6 animate-in zoom-in">
               <Crown size={60} className="text-yellow-400 mx-auto animate-bounce" />
               <h2 className="text-4xl font-black italic text-white euro-font neon-gold">VI HAR EN VINDER!</h2>
               <div className="text-2xl font-black text-yellow-400 euro-font uppercase bg-white/5 px-8 py-3 rounded-2xl border border-white/10">
                  {([...state.players].sort((a,b)=>b.score-a.score)[0]).name}
               </div>
               <button onClick={resetGame} className="btn-euro px-8 py-4 rounded-full text-white font-black uppercase tracking-widest text-sm">NYT SPIL</button>
            </div>
          )}
        </section>

        {/* Players Area */}
        <section className={`flex-1 grid grid-cols-${state.players.length} gap-4`}>
           {state.players.map((player, idx) => (
             <div key={player.id} className={`disco-glass p-4 rounded-[2rem] border border-white/10 flex flex-col gap-2 relative overflow-hidden transition-all ${state.activePlayerIndex === idx ? 'ring-2 ring-fuchsia-500' : ''}`}>
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/80 uppercase truncate max-w-[100px] euro-font">{player.name}</span>
                      <span className="text-[7px] font-bold text-cyan-400 uppercase tracking-widest">{player.timeline.length} Acts</span>
                   </div>
                   <div className="text-2xl font-black italic text-yellow-400 euro-font">{player.score}</div>
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                   {player.timeline.map((card, i) => (
                      <div key={i} className="flex-shrink-0 w-10 h-8 disco-glass rounded-lg border border-white/10 flex items-center justify-center">
                         <span className="text-[8px] font-black text-cyan-300 euro-font">{card.year}</span>
                      </div>
                   ))}
                </div>
             </div>
           ))}
        </section>
      </main>

      <footer className="h-[4vh] disco-glass px-6 flex items-center justify-between border-t border-white/10 z-40 text-[7px] font-black uppercase text-white/20 tracking-widest euro-font">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
            <span>MIC: {isListening ? 'ACTIVE' : 'OFFLINE'}</span>
         </div>
         <span>EURO QUIZ v2.5 - SINGLE SCREEN BROADCAST MODE</span>
      </footer>
    </div>
  );
};

export default App;
