export interface User {
  id: string;
  name: string;
  role: 'student' | 'specialist';
  avatar: string;
}

export interface Answer {
  id: string;
  userId: string;
  content: string;
  upvotes: number;
  createdAt: string;
  isBest: boolean;
}

export interface Question {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  answers: Answer[];
  views: number;
  createdAt: string;
  status: 'answered' | 'pending';
}

export type Tag = {
  name: string;
  category: 'psychology' | 'corporate' | 'industry';
};
