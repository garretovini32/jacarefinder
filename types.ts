export interface Song {
  id: string;
  titulo: string;
  artista: string;
  matchType: 'Texto' | 'Melodia' | 'Contexto';
  confidence: number;
  description?: string;
}

export interface SearchState {
  isLoading: boolean;
  error: string | null;
  results: Song[];
}

export enum RecorderStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  FINISHED = 'finished',
}