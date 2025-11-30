export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  followingCount?: number;
  followersCount?: number;
  isfollowing?: Boolean;
  role: string;
  isBanned: boolean;
  postsCount: number;
  reportsCount: number;
}

export interface UpdatePostResult {
  title: string;
  description: string;
  mediaFile?: File;
  removeCurrentImage?: boolean;
}

export interface UpdateProfileResult {
  user: User,
  avatarFile: File;
  removeCurrentImage: boolean;
  error?: string
}

export interface NewPost {
  title: string;
  description: string;
  mediaFile?: File;
}

export interface Post {
  id: number;
  title: string;
  description: string;
  mediaUrl?: string;
  user: {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
  };
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
  statue: string;
}

export interface Comment {
  id: number;
  content: string;
  user: User;
  createdAt: string;
}




export interface Report {
  id: string;
  reportedUser: User;
  reportedBy?: User;
  reportReason: string;
  reportedAt: string;
  status: 'pending' | 'resolved' ;
}

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  bannedUsers: number;
  activeReports: number;
}


export interface Notification {
  id: number;
  sender: User;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  post: Post;
}


export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;       
  size: number;          
}