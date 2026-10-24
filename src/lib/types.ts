// File: nesora-app/src/lib/types.ts
// Shapes returned by the Nesora API (see nesora-mobile-api.md).
// Storage (µMB) and money (kobo) arrive as strings; use the `label` fields to display them.

export type Me = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
    isAdmin: boolean;
    channel: { id: string; handle: string; name: string } | null;
  };
  showInterestsPicker: boolean;
  storage: { balanceMicroMb: string; label: string };
  unreadNotifications: number;
  links: { buyStorage: string; studio: string };
};

export type Channel = { id: string; handle: string; name: string; avatarUrl: string | null };

export type FeedVideo = {
  id: string;
  title: string;
  durationSec: number | null;
  viewCount: number;
  publishedAt: string;
  thumbnailUrl: string | null;
  channel: Channel;
};

export type ShortCard = { id: string; title: string; viewCount: number; thumbnailUrl: string | null };

export type Page<T> = { items: T[]; nextOffset: number | null };

export type Category = { id: string; slug: string; name: string; emoji: string | null };

export type ShortItem = ShortCard & {
  playbackId: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  subscribed: boolean;
  isOwn: boolean;
  channel: Channel;
  fullVideo: { id: string; title: string } | null;
};

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
  isOwn: boolean;
};

export type CommentsPage = { items: CommentItem[]; nextCursor: string | null; total: number };

export type HomeResponse = { videos: Page<FeedVideo>; shorts: ShortCard[] | null };

// ---- Watch / playback (same shapes as the website's lib/playback-types.ts) ----

export type PlaybackSource =
  | { kind: "video"; playbackId: string; token: string; tokenExpiresAt: number }
  | { kind: "trailer"; playbackId: string };

export type StartResult =
  | { stage: "free"; source: PlaybackSource }
  | { stage: "preview"; mode: "FIRST_MINUTE"; sessionId: string; source: PlaybackSource; freeSec: number }
  | { stage: "preview"; mode: "TRAILER"; sessionId: string; source: PlaybackSource }
  | { stage: "unavailable" };

export type ConsentResult =
  | { state: "ok"; source: PlaybackSource; startAt: number; balanceMicroMb: string; heartbeatSec: number }
  | { state: "insufficient"; balanceMicroMb: string }
  | { state: "ended" };

export type HeartbeatResult =
  | { state: "ok"; balanceMicroMb: string; source?: PlaybackSource }
  | { state: "insufficient"; balanceMicroMb: string }
  | { state: "ended" };

export type WatchVideo = FeedVideo & {
  description: string | null;
  likeCount: number;
  liked: boolean;
  commentCount: number;
  categoryId: string | null;
  subscriberCount: number;
  subscribed: boolean;
  isOwn: boolean;
  hasTrailer: boolean;
};

export type WatchResponse = {
  video: WatchVideo;
  pricing: { isFree: boolean; freePreviewSec: number; ratePerMinLabel: string; pricePerHourLabel: string };
  storage: { balanceMicroMb: string; label: string };
};

// ---- Subscriptions, channels, notifications, storage ----

export type SubscriptionsResponse = { videos: Page<FeedVideo>; channels: Channel[] | null; shorts: ShortCard[] | null };

export type SearchResponse = { videos: Page<FeedVideo>; shorts: ShortCard[] | null };

export type ChannelPage = {
  id: string;
  handle: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  subscriberCount: number;
  createdAt: string;
  isOwn: boolean;
  blocked: boolean;
  subscribed: boolean;
  longCount: number;
  shortCount: number;
  ownerUserId: string;
};

export type ChannelResponse = { channel: ChannelPage; videos: Page<FeedVideo> | null; shorts: ShortCard[] | null };

export type NotificationItem = {
  id: string;
  unread: boolean;
  createdAt: string;
  channel: { name: string; avatarUrl: string | null };
  video: { id: string; title: string; href: string; thumbnailUrl: string | null };
};

export type StorageResponse = {
  balanceMicroMb: string;
  label: string;
  spending: {
    id: string;
    storage: string;
    minutes: number | null;
    date: string;
    video: { id: string; title: string; channel: string; available: boolean } | null;
  }[];
  purchases: { id: string; naira: number; storage: string; status: "SUCCESS" | "FAILED"; date: string }[];
  buyUrl: string;
};

export type BlockedUser = { userId: string; name: string; handle: string | null; avatarUrl: string | null; blockedAt: string };