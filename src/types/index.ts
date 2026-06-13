export type FeedbackType =
  | "course_content"
  | "homework"
  | "teacher_service"
  | "platform"
  | "other";

export type UrgencyLevel = "low" | "normal" | "high" | "urgent";

export type TicketStatus =
  | "pending"
  | "processing"
  | "teaching"
  | "replied"
  | "closed";

export type Satisfaction = 1 | 2 | 3 | 4 | 5;

export type FeedbackSource = "app" | "web" | "wechat" | "phone";

export type VipLevel = "normal" | "silver" | "gold" | "diamond";

export interface Lesson {
  id: string;
  name: string;
  duration?: string;
}

export interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  name: string;
  teacherName: string;
  className: string;
  chapters: Chapter[];
}

export interface Recording {
  url: string;
  duration: number;
  name: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  className: string;
  teacherName: string;
  enrolledAt: string;
  progress: number;
  status: "ongoing" | "finished" | "paused";
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  role: "customer_service" | "teaching" | "student" | "system";
  content: string;
  internal: boolean;
  createdAt: string;
}

export interface VisitRecord {
  id: string;
  operator: string;
  operatorAvatar: string;
  channel: "phone" | "wechat" | "in_app";
  summary: string;
  result: "connected" | "no_answer" | "scheduled";
  createdAt: string;
}

export interface CoursewareLink {
  id: string;
  kind: "课件" | "题目" | "直播回放";
  name: string;
  link: string;
  needModify: boolean;
  note?: string;
  linkedAt: string;
  linkedBy: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  registerDate: string;
  vipLevel: VipLevel;
  enrollmentCount: number;
  avgSatisfaction: number;
  enrollments: Enrollment[];
  tags: string[];
}

export interface Feedback {
  id: string;
  ticketNo: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  courseId: string;
  courseName: string;
  className?: string;
  teacherName?: string;
  chapterId?: string;
  chapterName?: string;
  lessonId?: string;
  lessonName?: string;
  type: FeedbackType;
  satisfaction: Satisfaction;
  content: string;
  screenshots: string[];
  recordings: Recording[];
  source: FeedbackSource;
  urgency: UrgencyLevel;
  status: TicketStatus;
  assignee?: string;
  assigneeAvatar?: string;
  category?: string;
  promisedAt?: string;
  createdAt: string;
  closedAt?: string;
  comments: Comment[];
  visits: VisitRecord[];
  coursewares: CoursewareLink[];
  internalNote?: string;
}

export interface AnalyticsOverview {
  total: number;
  processing: number;
  closed: number;
  avgHandleHours: number;
  avgSatisfaction: number;
  trends: Array<{
    date: string;
    count: number;
    satisfaction: number;
  }>;
  byType: Array<{ type: string; count: number }>;
  bySatisfaction: Array<{ score: number; count: number }>;
  handleDuration: Array<{ bucket: string; count: number }>;
  topCourses: Array<{ name: string; count: number; avgSat: number }>;
  topTeachers: Array<{ name: string; count: number; avgSat: number }>;
  keywords: Array<{ word: string; weight: number }>;
}

export interface SavedView {
  id: string;
  name: string;
  scope: "list" | "analytics" | "both";
  owner: "service" | "teaching" | "all";
  filters: {
    status?: string;
    urgency?: string;
    type?: string;
    keyword?: string;
    dateRange?: string;
    assignee?: string;
    source?: string;
    sla?: string;
    course?: string;
    teacher?: string;
    className?: string;
  };
  createdAt: string;
}

export interface VisitTemplate {
  id: string;
  name: string;
  channel: "phone" | "wechat" | "in_app";
  summary: string;
  result: "connected" | "no_answer" | "scheduled";
}

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
}
