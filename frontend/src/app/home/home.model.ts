export interface User {
  id?: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  followingCount?: number;
  followersCount?: number;
}

export interface UpdatePostResult {
  description: string;
  mediaFile?: File;
  removeCurrentImage?: boolean;
}

export interface NewPost {
  description: string;
  mediaFile?: File;
}
