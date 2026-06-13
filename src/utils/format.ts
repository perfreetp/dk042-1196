import type { FeedbackType, TicketStatus, UrgencyLevel, VipLevel, FeedbackSource, Satisfaction } from "@/types";

export const feedbackTypeMap: Record<FeedbackType, { label: string; emoji: string; color: string }> = {
  course_content: { label: "课程内容", emoji: "📚", color: "bg-moss-100 text-moss-700 border-moss-200" },
  homework: { label: "作业批改", emoji: "📝", color: "bg-ember-50 text-ember-600 border-ember-200" },
  teacher_service: { label: "老师服务", emoji: "👩‍🏫", color: "bg-sky2-50 text-sky2-700 border-sky2-200" },
  platform: { label: "平台体验", emoji: "💻", color: "bg-ink-100 text-ink-700 border-ink-200" },
  other: { label: "其他建议", emoji: "💡", color: "bg-cream-200 text-ink-600 border-cream-300" },
};

export const urgencyMap: Record<UrgencyLevel, { label: string; color: string; dot: string }> = {
  low: { label: "低", color: "chip bg-ink-100 text-ink-600", dot: "bg-ink-400" },
  normal: { label: "普通", color: "chip bg-moss-50 text-moss-700", dot: "bg-moss-500" },
  high: { label: "高", color: "chip bg-ember-50 text-ember-700", dot: "bg-ember-500" },
  urgent: { label: "紧急", color: "chip bg-ember-500 text-white shadow-ember", dot: "bg-ember-500 animate-pulse" },
};

export const statusMap: Record<TicketStatus, { label: string; color: string; step: number }> = {
  pending: { label: "待处理", color: "chip bg-ink-100 text-ink-700 border border-ink-200", step: 1 },
  processing: { label: "处理中", color: "chip bg-sky2-50 text-sky2-700 border border-sky2-200", step: 2 },
  teaching: { label: "教研处理", color: "chip bg-moss-50 text-moss-700 border border-moss-200", step: 3 },
  replied: { label: "已回复", color: "chip bg-ember-50 text-ember-700 border border-ember-200", step: 4 },
  closed: { label: "已关闭", color: "chip bg-ink-100 text-ink-500 border border-ink-200", step: 5 },
};

export const sourceMap: Record<FeedbackSource, { label: string; icon: string }> = {
  app: { label: "APP", icon: "smartphone" },
  web: { label: "网页端", icon: "monitor" },
  wechat: { label: "微信", icon: "message-circle" },
  phone: { label: "电话", icon: "phone" },
};

export const vipMap: Record<VipLevel, { label: string; color: string; ring: string }> = {
  normal: { label: "普通", color: "text-ink-500", ring: "" },
  silver: { label: "白银", color: "text-slate-500", ring: "ring-2 ring-slate-300" },
  gold: { label: "黄金", color: "text-amber-600", ring: "ring-2 ring-amber-400" },
  diamond: { label: "钻石", color: "text-sky2-600", ring: "ring-2 ring-sky2-400" },
};

export const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDateShort = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export const satisfactionLabels: Record<Satisfaction, string> = {
  1: "非常不满意",
  2: "不满意",
  3: "一般",
  4: "满意",
  5: "非常满意",
};

export const satisfactionColor = (s: Satisfaction) => {
  if (s >= 4) return "text-moss-600";
  if (s === 3) return "text-amber-500";
  return "text-ember-500";
};

export const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

export const generateId = () => Math.random().toString(36).slice(2, 10);

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export type SlaStatus = "overdue" | "due_today" | "due_48h" | "due_soon" | "none";

export const getSlaStatus = (promisedAt?: string, status?: string): SlaStatus => {
  if (!promisedAt || status === "closed") return "none";
  const due = new Date(promisedAt);
  if (isNaN(due.getTime())) return "none";
  const now = new Date();
  due.setHours(23, 59, 59, 999);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / 3600000;
  if (diffHours < 0) return "overdue";
  if (isSameDay(due, now)) return "due_today";
  if (diffHours <= 48) return "due_48h";
  if (diffHours <= 72) return "due_soon";
  return "none";
};

export const getSlaLabel = (s: SlaStatus) => {
  switch (s) {
    case "overdue": return { label: "已超时", color: "chip bg-ember-500 text-white shadow-ember" };
    case "due_today": return { label: "今天到期", color: "chip bg-ember-100 text-ember-700 border border-ember-200" };
    case "due_48h": return { label: "48H内", color: "chip bg-amber-50 text-amber-700 border border-amber-200" };
    case "due_soon": return { label: "即将到期", color: "chip bg-sky2-50 text-sky2-700 border border-sky2-200" };
    default: return { label: "", color: "" };
  }
};

export const hasVisitToday = (visits: { createdAt: string }[]) => {
  const today = new Date();
  return visits.some((v) => isSameDay(new Date(v.createdAt), today));
};
