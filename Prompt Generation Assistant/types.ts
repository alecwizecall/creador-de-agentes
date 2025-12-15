export interface BusinessInfo {
  name: string;
  industry: string;
  description: string;
  tone: string;
  language: string;
}

export interface DataSource {
  id: string;
  type: 'text' | 'file' | 'url';
  name: string;
  content: string;
  status?: 'pending' | 'processing' | 'ready' | 'error';
}

export interface GeneratedPrompt {
  content: string;
  timestamp: number;
}

export enum ProcessingStatus {
  IDLE = 'idle',
  SEARCHING = 'searching',
  GENERATING = 'generating',
  SUCCESS = 'success',
  ERROR = 'error'
}