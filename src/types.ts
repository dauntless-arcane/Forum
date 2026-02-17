export interface User {
  id: string;
  name: string;
  role: 'student' | 'specialist' | 'admin';
  avatar: string;
  email?: string; // Populated by backend

  // Template-only display fields (optional)
  profession?: string;
  expertise?: string[];
  verified?: boolean;
  upvotedAnswers?: string[];
  banned?: boolean;
  createdAt?: string;
  password?: string;
}

export interface Report {
  id: string;
  targetType: string;
  reason: string;
  targetId: string;
}




export interface Answer {
  id: string;
  userId: string;
  user?: User; // Populated by backend
  content: string;
  upvotes: number;
  upvotedBy?: string[]; // List of user IDs who upvoted
  createdAt: string;
  isBest: boolean;
  isLikedByMe: boolean;

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

export interface AuthResponse {
  token: string;
  user: User;
}
