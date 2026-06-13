import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Feedback, Comment, VisitRecord, CoursewareLink, TicketStatus,
  UrgencyLevel, FeedbackSource, Student, Course, SavedView,
  VisitTemplate, NoteTemplate,
} from "@/types";
import { feedbacks as mockFeedbacks } from "@/mock/feedbacks";
import { students as mockStudents } from "@/mock/students";
import { courses as mockCourses } from "@/mock/courses";
import { analyticsData } from "@/mock/analytics";

export interface FilterState {
  status?: TicketStatus | "all";
  urgency?: UrgencyLevel | "all";
  type?: string | "all";
  keyword?: string;
  dateRange?: string;
  assignee?: string | "all";
  source?: FeedbackSource | "all";
  sla?: "all" | "overdue" | "due_48h" | "due_today" | "visit_today";
}

export interface AnalyticsFilters {
  course: string;
  teacher: string;
  className: string;
  type: string;
  sla: "all" | "overdue" | "due_48h" | "due_today" | "visit_today";
}

interface FeedbackState {
  feedbacks: Feedback[];
  students: Student[];
  courses: Course[];
  analytics: typeof analyticsData;
  filters: FilterState;
  analyticsFilters: AnalyticsFilters;
  selectedIds: string[];
  savedViews: SavedView[];
  visitTemplates: VisitTemplate[];
  noteTemplates: NoteTemplate[];

  setFilters: (patch: Partial<FilterState>) => void;
  resetFilters: () => void;
  setAnalyticsFilters: (patch: Partial<AnalyticsFilters>) => void;
  resetAnalyticsFilters: () => void;

  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  selectAllVisible: (ids: string[]) => void;
  selectAllFiltered: (ids: string[]) => void;

  getFeedback: (id: string) => Feedback | undefined;
  getStudent: (id: string) => Student | undefined;

  updateStatus: (id: string, status: TicketStatus) => void;
  assignTo: (id: string, assignee: string) => void;
  setUrgency: (id: string, urgency: UrgencyLevel) => void;
  setCategory: (id: string, category: string) => void;
  setPromisedAt: (id: string, date: string | undefined) => void;
  setInternalNote: (id: string, note: string) => void;

  batchUpdateStatus: (ids: string[], status: TicketStatus) => void;
  batchAssign: (ids: string[], assignee: string) => void;
  batchSetInternalNote: (ids: string[], note: string) => void;
  batchAddVisit: (ids: string[], visit: Omit<VisitRecord, "id" | "createdAt">) => void;

  addComment: (id: string, comment: Omit<Comment, "id" | "createdAt">) => void;
  addVisit: (id: string, visit: Omit<VisitRecord, "id" | "createdAt">) => void;
  removeVisit: (id: string, visitId: string) => void;
  addCourseware: (id: string, cw: Omit<CoursewareLink, "id" | "linkedAt">) => void;
  toggleCoursewareModify: (id: string, cwId: string) => void;
  removeCourseware: (id: string, cwId: string) => void;

  saveView: (view: Omit<SavedView, "id" | "createdAt">) => void;
  deleteView: (id: string) => void;
  applyViewToList: (view: SavedView) => void;
  applyViewToAnalytics: (view: SavedView) => void;

  addVisitTemplate: (tpl: Omit<VisitTemplate, "id">) => void;
  deleteVisitTemplate: (id: string) => void;
  addNoteTemplate: (tpl: Omit<NoteTemplate, "id">) => void;
  deleteNoteTemplate: (id: string) => void;

  submitFeedback: (payload: Partial<Feedback>) => Feedback;
}

const generateId = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const defaultFilters: FilterState = {
  status: "all", urgency: "all", type: "all", keyword: "",
  dateRange: "all", assignee: "all", source: "all", sla: "all",
};

const defaultAnalyticsFilters: AnalyticsFilters = {
  course: "全部", teacher: "全部", className: "全部", type: "全部", sla: "all",
};

const defaultVisitTemplates: VisitTemplate[] = [
  { id: "vt1", name: "首次回访-已接通", channel: "phone", result: "connected",
    summary: "已联系学员，确认问题已记录，预计24小时内给出解决方案，学员表示理解。" },
  { id: "vt2", name: "首次回访-未接听", channel: "phone", result: "no_answer",
    summary: "电话未接通，已发送微信留言，稍后再次联系。" },
  { id: "vt3", name: "跟进回访-问题解决", channel: "phone", result: "connected",
    summary: "问题已解决，学员表示满意，确认无其他问题。" },
  { id: "vt4", name: "跟进回访-约定回电", channel: "wechat", result: "scheduled",
    summary: "学员当前不方便，约定明天下午3点再次回电沟通。" },
];

const defaultNoteTemplates: NoteTemplate[] = [
  { id: "nt1", name: "常规跟进", content: "按正常流程跟进处理，保持与学员沟通。" },
  { id: "nt2", name: "VIP 优先", content: "VIP 学员，优先处理，随时同步进度。" },
  { id: "nt3", name: "需教研介入", content: "涉及课程内容问题，已同步教研团队评估。" },
  { id: "nt4", name: "需技术排查", content: "涉及平台功能问题，已同步技术团队排查。" },
];

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      feedbacks: [...mockFeedbacks],
      students: [...mockStudents],
      courses: [...mockCourses],
      analytics: analyticsData,
      filters: { ...defaultFilters },
      analyticsFilters: { ...defaultAnalyticsFilters },
      selectedIds: [],
      savedViews: [
        {
          id: "sv1", name: "客服日常工单", scope: "both", owner: "service",
          filters: { status: "all", urgency: "all", type: "all", sla: "all" },
          createdAt: new Date().toISOString(),
        },
        {
          id: "sv2", name: "教研待处理", scope: "both", owner: "teaching",
          filters: { status: "teaching", type: "course_content" },
          createdAt: new Date().toISOString(),
        },
        {
          id: "sv3", name: "今日待回访", scope: "list", owner: "service",
          filters: { sla: "visit_today" },
          createdAt: new Date().toISOString(),
        },
      ],
      visitTemplates: [...defaultVisitTemplates],
      noteTemplates: [...defaultNoteTemplates],

      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: { ...defaultFilters } }),
      setAnalyticsFilters: (patch) => set((s) => ({
        analyticsFilters: { ...s.analyticsFilters, ...patch },
      })),
      resetAnalyticsFilters: () => set({ analyticsFilters: { ...defaultAnalyticsFilters } }),

      toggleSelected: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id],
        })),
      clearSelected: () => set({ selectedIds: [] }),
      selectAllVisible: (ids) =>
        set((s) => ({
          selectedIds: ids.every((id) => s.selectedIds.includes(id))
            ? s.selectedIds.filter((x) => !ids.includes(x))
            : Array.from(new Set([...s.selectedIds, ...ids])),
        })),
      selectAllFiltered: (ids) => set({ selectedIds: ids }),

      getFeedback: (id) => get().feedbacks.find((f) => f.id === id),
      getStudent: (id) => get().students.find((s) => s.id === id),

      updateStatus: (id, status) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            f.id === id ? { ...f, status, closedAt: status === "closed" ? now() : f.closedAt } : f
          ),
        })),
      assignTo: (id, assignee) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            f.id === id ? { ...f, assignee, assigneeAvatar: assignee.slice(0, 2).toUpperCase() } : f
          ),
        })),
      setUrgency: (id, urgency) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) => (f.id === id ? { ...f, urgency } : f)),
        })),
      setCategory: (id, category) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) => (f.id === id ? { ...f, category } : f)),
        })),
      setPromisedAt: (id, date) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) => (f.id === id ? { ...f, promisedAt: date } : f)),
        })),
      setInternalNote: (id, note) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) => (f.id === id ? { ...f, internalNote: note } : f)),
        })),

      batchUpdateStatus: (ids, status) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            ids.includes(f.id) ? { ...f, status, closedAt: status === "closed" ? now() : f.closedAt } : f
          ),
        })),
      batchAssign: (ids, assignee) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            ids.includes(f.id) ? { ...f, assignee, assigneeAvatar: assignee.slice(0, 2).toUpperCase() } : f
          ),
        })),
      batchSetInternalNote: (ids, note) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            ids.includes(f.id) ? { ...f, internalNote: note } : f
          ),
        })),
      batchAddVisit: (ids, visit) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            ids.includes(f.id) ? { ...f, visits: [...f.visits, { ...visit, id: generateId(), createdAt: now() }] } : f
          ),
        })),

      addComment: (id, comment) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            f.id === id
              ? { ...f, comments: [...f.comments, { ...comment, id: generateId(), createdAt: now() }] }
              : f
          ),
        })),
      addVisit: (id, visit) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            f.id === id ? { ...f, visits: [...f.visits, { ...visit, id: generateId(), createdAt: now() }] } : f
          ),
        })),
      removeVisit: (id, visitId) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            f.id === id ? { ...f, visits: f.visits.filter((v) => v.id !== visitId) } : f
          ),
        })),
      addCourseware: (id, cw) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            f.id === id
              ? { ...f, coursewares: [...f.coursewares, { ...cw, id: generateId(), linkedAt: now() }] }
              : f
          ),
        })),
      toggleCoursewareModify: (id, cwId) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            f.id === id
              ? {
                  ...f,
                  coursewares: f.coursewares.map((c) => (c.id === cwId ? { ...c, needModify: !c.needModify } : c)),
                }
              : f
          ),
        })),
      removeCourseware: (id, cwId) =>
        set((s) => ({
          feedbacks: s.feedbacks.map((f) =>
            f.id === id ? { ...f, coursewares: f.coursewares.filter((c) => c.id !== cwId) } : f
          ),
        })),

      saveView: (view) =>
        set((s) => ({
          savedViews: [...s.savedViews, { ...view, id: generateId(), createdAt: now() }],
        })),
      deleteView: (id) =>
        set((s) => ({
          savedViews: s.savedViews.filter((v) => v.id !== id),
        })),
      applyViewToList: (view) => {
        const f = view.filters;
        set((s) => ({
          filters: {
            ...s.filters,
            status: (f.status as any) ?? s.filters.status,
            urgency: (f.urgency as any) ?? s.filters.urgency,
            type: f.type ?? s.filters.type,
            keyword: f.keyword ?? s.filters.keyword,
            dateRange: f.dateRange ?? s.filters.dateRange,
            assignee: f.assignee ?? s.filters.assignee,
            source: (f.source as any) ?? s.filters.source,
            sla: (f.sla as any) ?? s.filters.sla,
          },
        }));
      },
      applyViewToAnalytics: (view) => {
        const f = view.filters;
        set((s) => ({
          analyticsFilters: {
            ...s.analyticsFilters,
            course: f.course ?? s.analyticsFilters.course,
            teacher: f.teacher ?? s.analyticsFilters.teacher,
            className: f.className ?? s.analyticsFilters.className,
            type: f.type ?? s.analyticsFilters.type,
            sla: (f.sla as any) ?? s.analyticsFilters.sla,
          },
        }));
      },

      addVisitTemplate: (tpl) =>
        set((s) => ({
          visitTemplates: [...s.visitTemplates, { ...tpl, id: generateId() }],
        })),
      deleteVisitTemplate: (id) =>
        set((s) => ({
          visitTemplates: s.visitTemplates.filter((t) => t.id !== id),
        })),
      addNoteTemplate: (tpl) =>
        set((s) => ({
          noteTemplates: [...s.noteTemplates, { ...tpl, id: generateId() }],
        })),
      deleteNoteTemplate: (id) =>
        set((s) => ({
          noteTemplates: s.noteTemplates.filter((t) => t.id !== id),
        })),

      submitFeedback: (payload) => {
        const newItem: Feedback = {
          id: generateId(),
          ticketNo: `FB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(get().feedbacks.length + 1).padStart(4, "0")}`,
          studentId: "s001",
          studentName: "林思语",
          studentAvatar: "LS",
          courseId: payload.courseId ?? "",
          courseName: payload.courseName ?? "",
          className: payload.className,
          teacherName: payload.teacherName,
          chapterId: payload.chapterId,
          chapterName: payload.chapterName,
          lessonId: payload.lessonId,
          lessonName: payload.lessonName,
          type: payload.type ?? "other",
          satisfaction: payload.satisfaction ?? 4,
          content: payload.content ?? "",
          screenshots: payload.screenshots ?? [],
          recordings: payload.recordings ?? [],
          source: "web",
          urgency: "normal",
          status: "pending",
          createdAt: now(),
          comments: [],
          visits: [],
          coursewares: [],
        } as Feedback;
        set((s) => ({ feedbacks: [newItem, ...s.feedbacks] }));
        return newItem;
      },
    }),
    {
      name: "feedback-store",
      partialize: (state) => ({
        feedbacks: state.feedbacks,
        savedViews: state.savedViews,
        visitTemplates: state.visitTemplates,
        noteTemplates: state.noteTemplates,
      }),
    }
  )
);
