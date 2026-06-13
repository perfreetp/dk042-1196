import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Feedback, Comment, VisitRecord, CoursewareLink, TicketStatus, UrgencyLevel, FeedbackSource, Student, Course } from "@/types";
import { feedbacks as mockFeedbacks } from "@/mock/feedbacks";
import { students as mockStudents } from "@/mock/students";
import { courses as mockCourses } from "@/mock/courses";
import { analyticsData } from "@/mock/analytics";

interface FilterState {
  status?: TicketStatus | "all";
  urgency?: UrgencyLevel | "all";
  type?: string | "all";
  keyword?: string;
  dateRange?: string;
  assignee?: string | "all";
  source?: FeedbackSource | "all";
  sla?: "all" | "overdue" | "due_today" | "visit_today";
}

interface FeedbackState {
  feedbacks: Feedback[];
  students: Student[];
  courses: Course[];
  analytics: typeof analyticsData;
  filters: FilterState;
  selectedIds: string[];

  setFilters: (patch: Partial<FilterState>) => void;
  resetFilters: () => void;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  selectAllVisible: (ids: string[]) => void;

  getFeedback: (id: string) => Feedback | undefined;
  getStudent: (id: string) => Student | undefined;

  updateStatus: (id: string, status: TicketStatus) => void;
  assignTo: (id: string, assignee: string) => void;
  setUrgency: (id: string, urgency: UrgencyLevel) => void;
  setCategory: (id: string, category: string) => void;
  setPromisedAt: (id: string, date: string | undefined) => void;
  setInternalNote: (id: string, note: string) => void;

  addComment: (id: string, comment: Omit<Comment, "id" | "createdAt">) => void;
  addVisit: (id: string, visit: Omit<VisitRecord, "id" | "createdAt">) => void;
  removeVisit: (id: string, visitId: string) => void;
  addCourseware: (id: string, cw: Omit<CoursewareLink, "id" | "linkedAt">) => void;
  toggleCoursewareModify: (id: string, cwId: string) => void;
  removeCourseware: (id: string, cwId: string) => void;

  submitFeedback: (payload: Partial<Feedback>) => Feedback;
}

const generateId = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const defaultFilters: FilterState = { status: "all", urgency: "all", type: "all", keyword: "", dateRange: "all", assignee: "all", source: "all", sla: "all" };

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      feedbacks: [...mockFeedbacks],
      students: [...mockStudents],
      courses: [...mockCourses],
      analytics: analyticsData,
      filters: { ...defaultFilters },
      selectedIds: [],

      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: { ...defaultFilters } }),
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
      }),
    }
  )
);
