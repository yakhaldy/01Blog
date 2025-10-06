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
  username: string;
  bio: string
  avatarFile?: File;
  removeCurrentImage?: boolean;
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
  sender: User;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  post: Post;
}