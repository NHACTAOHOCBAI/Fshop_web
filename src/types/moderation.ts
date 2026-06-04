export type ContentType = 'post' | 'review' | 'post_comment' | 'livestream_comment';
export type ModerationDecision = 'approved' | 'flagged';
export type ModerationPriority = 'NORMAL' | 'HIGH';
export type ModerationQueueStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

export interface ModerationLabel {
  label: string;
  score: number;
}

export interface ModerationLog {
  id: number;
  contentType: ContentType;
  contentId: number;
  contentText: string;
  ruleScore: number;
  mlScore: number;
  mlLabels: Record<string, number>;
  finalScore: number;
  decision: ModerationDecision;
  priority: ModerationPriority;
  confidence: number;
  signals: Record<string, unknown>;
  reviewedBy: number | null;
  reviewedAt: string | null;
  isOverridden: boolean;
  overrideDecision: 'approved' | 'rejected' | null;
  createdAt: string;
}

export interface ModerationQueueResponse {
  items: ModerationLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ModerationStats {
  totalFlagged: number;
  pendingReview: number;
  highPriority: number;
  rejected: number;
  autoApproved: number;
  autoApprovedRate: number;
  labelDistribution: Record<string, number>;
}

export interface ModerationRecentResponse {
  flagged: ModerationLog[];
  rejected: ModerationLog[];
}

export interface ModerationQueueQuery {
  status?: ModerationQueueStatus;
  contentType?: ContentType;
  priority?: ModerationPriority;
  page?: number;
  limit?: number;
}
