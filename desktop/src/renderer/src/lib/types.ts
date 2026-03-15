export interface Link {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  author: string | null;
  tweetUrl: string | null;
  savedAt: number;
  isRead: number | null;
}

export interface Collection {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  isPublic: number;
}

export interface ShareItem {
  share: {
    id: number;
    message: string | null;
    seen: number;
    createdAt: number;
  };
  fromUser: {
    id: number;
    email: string;
    name: string | null;
  } | null;
  link: Link | null;
  collection: Collection | null;
}

export interface UserMeta {
  email: string;
  name: string | null;
  image: string | null;
  tokenExpiresAt: number | null;
}
