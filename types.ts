
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export type AttachmentType = 'image' | 'video' | 'audio';

export interface Attachment {
  type: AttachmentType;
  mimeType: string;
  data: string; // Base64
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string; placeAnswerSources?: { reviewSnippets?: { url: string }[] } };
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isError?: boolean;
  attachments?: Attachment[];
  groundingChunks?: GroundingChunk[];
  generatedImage?: string; // Base64 or URL
  generatedVideo?: string; // URL
}

export type AppMode = 'chat-flash' | 'chat-reasoning' | 'image-studio' | 'video-studio' | 'live' | 'admin-dashboard';

export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type ImageResolution = '1K' | '2K' | '4K';

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  mode: AppMode;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string; // URL or Initials
  isAdmin: boolean;
  role?: 'admin' | 'user';
  status: 'Active' | 'Disabled';
  lastActive: number;
}

export interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  method: 'Google' | 'Admin';
  status: 'Success' | 'Failed';
  ip: string; 
}

export interface SystemEvent {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  action: string;
  details: string;
  timestamp: number;
}

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'alert';
  isActive: boolean;
  createdAt: number;
}
