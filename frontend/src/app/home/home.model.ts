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
}

export interface UpdatePostResult {
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
  description: string;
  mediaFile?: File;
}

export interface Post {
  id: number;
  description: string;
  mediaUrl?: string;
  user: {
    id: number;
    username: string;
    email: string;
    avatar?: string;
  };
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
}