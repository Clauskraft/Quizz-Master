
export interface SongCard {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  fact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  youtubeId?: string;
}

export interface GameSettings {
  decade: string;
  genre: string;
  difficulty: 'easy' | 'medium' | 'hard';
  customCategory?: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  timeline: SongCard[];
  sabotages: SabotageType[];
}

export enum SabotageType {
  DISTORTION = 'Distortion',
  SPEED_UP = 'Speed Up',
  COVER_VERSION = 'Cover Version'
}

export interface GameState {
  players: Player[];
  settings: GameSettings;
  currentPlayerIndex: number;
  activePlayerIndex: number | null;
  currentRound: number;
  status: 'setup' | 'intro' | 'countdown' | 'playing' | 'placing' | 'result' | 'gameOver';
  currentActiveCard: null | SongCard;
  playlist: SongCard[];
  currentTrackIndex: number;
  activeSabotage: SabotageType | null;
  lastGuessCorrect: boolean | null;
  countdownValue: number;
}
