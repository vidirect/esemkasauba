export type ProjectStage = 'Orientation' | 'Design' | 'Development' | 'Publication';

export interface ProjectKit {
  id?: string;
  title: string;
  description: string;
  workflow: string[];
  rubric: string[];
  examples: string[];
  references: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  currentStage: ProjectStage;
  progress: number;
  status: 'active' | 'completed';
  team: string[];
  leaderId: string;
  memberRoles?: { [userId: string]: string }; // userId -> role name
  dueDate: any; // Firestore Timestamp
  stages: {
    [key in ProjectStage]: {
      status: 'pending' | 'active' | 'completed';
      tasks: string[];
      artifacts: string[]; // List of artifact IDs
      reflection?: string;
      feedback?: string[];
    };
  };
  kit: ProjectKit;
}

export interface Certificate {
  id: string;
  title: string;
  issuerId: string;
  issuerName: string;
  recipientId: string;
  projectId?: string;
  issuedAt: any;
  skills: string[];
  url?: string; // Optional link to a generated PDF or image
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  competence: {
    computationalThinking: number;
    ictLiteracy: number;
    projectManagement: number;
    collaboration: number;
    appUsage: number;
    programming: number;
  };
  projects: string[];
  teamIds: string[];
  portfolio: string[]; // List of artifact IDs
  certificates?: Certificate[];
  role?: 'student' | 'teacher' | 'admin';
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  bio?: string;
}

export interface DirectMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  message: string;
  mediaUrl?: string; // For photos, videos, or audio links
  mediaType?: 'image' | 'video' | 'audio' | 'link';
  timestamp: any; // Firestore Timestamp
}

export interface AllowedUser {
  id?: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  addedAt: any;
}

export interface Discussion {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: any; // Firestore Timestamp
  likes: number;
  replies: string[];
  tags: string[];
}

export interface Artifact {
  id: string;
  studentId: string;
  projectId?: string;
  title: string;
  type: 'document' | 'image' | 'video' | 'link';
  url: string;
  timestamp: any; // Firestore Timestamp
  tags: string[];
  description?: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  type: 'networking' | 'servers' | 'pjbl' | 'programming' | 'other';
  status: 'new' | 'active' | 'completed' | 'archived';
  createdAt: any; // Timestamp
  source: 'new' | 'completed_project';
  difficulty?: 'Mudah' | 'Sedang' | 'Tantang';
}
