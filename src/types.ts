export interface User {
  id: string;
  name: string;
  role: 'student' | 'specialist';
  avatar: string;
  email?: string; // Populated by backend

  // Template-only display fields (optional)
  profession?: string;
  expertise?: string[];
  verified?: boolean;
}




export interface Answer {
  id: string;
  userId: string;
  user?: User; // Populated by backend
  content: string;
  upvotes: number;
  createdAt: string;
  isBest: boolean;
}

export interface Question {
  id: string;
  userId: string;
  user?: User; // Populated by backend
  title: string;
  description: string;
  tags: string[];
  answers?: Answer[]; // Optional in list view, populated in detail view
  answerCount?: number;
  views: number;
  createdAt: string;
  status: 'answered' | 'pending';
}

export type Tag = {
  name: string;
  category: 'psychology' | 'corporate' | 'industry';
};
