export interface IReportFilters {
  authorId?: string | null;
  orgId?: string | null;
  status?: 'draft' | 'under_review' | 'approved' | 'published' | null;
}
