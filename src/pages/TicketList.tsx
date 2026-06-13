import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Inbox, Clock, CheckCircle, AlertTriangle, Download, UserPlus,
  ChevronLeft, ChevronRight, Filter, MoreHorizontal, Eye,
  UserCheck, XCircle, Smartphone, Monitor, MessageCircle, Phone, Star,
} from "lucide-react";
import { useFeedbackStore } from "@/store/feedbackStore";
import {
  urgencyMap, statusMap, feedbackTypeMap, sourceMap,
  formatDate, satisfactionColor, vipMap, cn,
} from "@/utils/format";
import type { TicketStatus, UrgencyLevel, FeedbackType, Feedback, FeedbackSource, Satisfaction } from "@/types";

const statusOptions: Array<{ value: TicketStatus | "all"; label: string }> = [
  { value: "all", label: "全部" }, { value: "pending", label: "待处理" },
  { value: "processing", label: "处理中" }, { value: "teaching", label: "教研" },
  { value: "replied", label: "已回复" }, { value: "closed", label: "关闭" },
];
const urgencyOptions: Array<{ value: UrgencyLevel | "all"; label: string }> = [
  { value: "all", label: "全部" }, { value: "low", label: "低" },
  { value: "normal", label: "普通" }, { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
];
const feedbackTypeOptions: Array<{ value: FeedbackType | "all"; label: string; emoji: string }> = [
  { value: "all", label: "全部", emoji: "📋" },
  { value: "course_content", label: "课程内容", emoji: "📚" },
  { value: "homework", label: "作业批改", emoji: "📝" },
  { value: "teacher_service", label: "老师服务", emoji: "👩‍🏫" },
  { value: "platform", label: "平台体验", emoji: "💻" },
  { value: "other", label: "其他建议", emoji: "💡" },
];
const sourceOptions: Array<{ value: FeedbackSource | "all"; label: string }> = [
  { value: "all", label: "全部" }, { value: "app", label: "APP" },
  { value: "web", label: "网页" }, { value: "wechat", label: "微信" },
  { value: "phone", label: "电话" },
];
const dateRangeOptions = [
  { value: "today", label: "今日" }, { value: "week", label: "本周" },
  { value: "month", label: "本月" }, { value: "all", label: "全部" },
];
const sourceIconMap: Record<FeedbackSource, typeof Smartphone> = {
  app: Smartphone, web: Monitor, wechat: MessageCircle, phone: Phone,
};
const statCards = [
  { key: "total", label: "总反馈", icon: Inbox, color: "bg-moss-50 text-moss-600", trend: "↑ 12% 较上周", up: true },
  { key: "processing", label: "处理中", icon: Clock, color: "bg-sky2-50 text-sky2-600", trend: "↑ 8% 较上周", up: true },
  { key: "closed", label: "已关闭", icon: CheckCircle, color: "bg-cream-200 text-ink-600", trend: "↑ 15% 较上周", up: true },
  { key: "urgent", label: "紧急待办", icon: AlertTriangle, color: "bg-ember-50 text-ember-600", trend: "↓ 3% 较上周", up: false },
];

function isInDateRange(iso: string, range: string) {
  const d = new Date(iso), now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "today") return d >= start;
  if (range === "week") { const w = new Date(start); w.setDate(w.getDate() - w.getDay()); return d >= w; }
  if (range === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return true;
}

export default function TicketList() {
  const { feedbacks, students, filters, setFilters, selectedIds, toggleSelected, clearSelected, selectAllVisible } = useFeedbackStore();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const stats = useMemo(() => ({
    total: feedbacks.length,
    processing: feedbacks.filter((f) => ["pending", "processing", "teaching"].includes(f.status)).length,
    closed: feedbacks.filter((f) => f.status === "closed").length,
    urgent: feedbacks.filter((f) => (f.urgency === "urgent" || f.urgency === "high") && f.status !== "closed").length,
  }), [feedbacks]);

  const filtered = useMemo(() => feedbacks.filter((f) => {
    if (filters.status !== "all" && f.status !== filters.status) return false;
    if (filters.urgency !== "all" && f.urgency !== filters.urgency) return false;
    if (filters.type !== "all" && f.type !== filters.type) return false;
    if (filters.keyword?.trim()) {
      const kw = filters.keyword.trim().toLowerCase();
      if (!f.ticketNo.toLowerCase().includes(kw) && !f.studentName.toLowerCase().includes(kw) && !f.courseName.toLowerCase().includes(kw)) return false;
    }
    if (filters.dateRange !== "all" && !isInDateRange(f.createdAt, filters.dateRange!)) return false;
    return true;
  }), [feedbacks, filters]);

  const studentMap = useMemo(() => {
    const m: Record<string, (typeof students)[number]> = {};
    students.forEach((s) => (m[s.id] = s));
    return m;
  }, [students]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visibleIds = pageData.map((f) => f.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const Chip = ({ active, onClick, children, ac }: { active: boolean; onClick: () => void; children: React.ReactNode; ac?: string }) => (
    <button type="button" onClick={onClick}
      className={cn(
        "filter-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border",
        active ? (ac || "bg-moss-600 text-white border-moss-600 shadow-card") : "bg-white text-ink-600 border-ink-200 hover:border-moss-300 hover:text-moss-700"
      )}>{children}</button>
  );

  const Stars = ({ s }: { s: Satisfaction }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("w-3.5 h-3.5", i <= s ? cn("fill-current", satisfactionColor(s)) : "text-ink-200")} />
      ))}
    </div>
  );

  const Avatar = ({ fb }: { fb: Feedback }) => {
    const vip = studentMap[fb.studentId]?.vipLevel ?? "normal", vi = vipMap[vip];
    return (
      <div className="flex items-center gap-2.5">
        <div className={cn("w-8 h-8 rounded-full bg-cream-200 text-ink-700 text-xs font-semibold flex items-center justify-center shrink-0", vi.ring)}>
          {fb.studentAvatar}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-800 truncate max-w-[100px]">
            {fb.studentName}
            {vip !== "normal" && <span className={cn("ml-1 text-xs font-medium", vi.color)}>{vi.label}</span>}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-800">客服反馈列表</h1>
        <p className="text-sm text-ink-500 mt-1">统一管理学员反馈工单，高效跟进处理进度</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((sc) => {
          const Icon = sc.icon;
          return (
            <div key={sc.key} className="card p-5 flex items-center gap-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", sc.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-500 font-medium">{sc.label}</p>
                <p className="text-2xl font-display font-semibold text-ink-800 mt-0.5">{stats[sc.key as keyof typeof stats]}</p>
                <p className={cn("text-xs mt-0.5 font-medium", sc.up ? "text-moss-600" : "text-ember-500")}>{sc.trend}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 mr-2">
            <Filter className="w-4 h-4 text-ink-400 shrink-0" />
            <span className="text-xs font-medium text-ink-500">状态</span>
          </div>
          {statusOptions.map((o) => (
            <Chip key={o.value} active={filters.status === o.value}
              onClick={() => setFilters({ status: o.value })}
              ac={o.value === "closed" && filters.status === o.value ? "bg-ink-600 text-white border-ink-600" : undefined}>
              {o.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-ink-500 w-10 shrink-0">紧急度</span>
          {urgencyOptions.map((o) => (
            <Chip key={o.value} active={filters.urgency === o.value}
              onClick={() => setFilters({ urgency: o.value })}
              ac={o.value === "urgent" && filters.urgency === o.value ? "bg-ember-500 text-white border-ember-500" : undefined}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", urgencyMap[o.value === "all" ? "normal" : (o.value as UrgencyLevel)].dot)} />
              {o.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-ink-500 w-10 shrink-0">类型</span>
          {feedbackTypeOptions.map((o) => (
            <Chip key={o.value} active={filters.type === o.value} onClick={() => setFilters({ type: o.value })}>
              {o.emoji} {o.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-ink-500 w-10 shrink-0">来源</span>
            {sourceOptions.map((o) => {
              const cur = (filters as any).source;
              const active = cur === o.value || (o.value === "all" && !cur);
              return (
                <Chip key={o.value} active={active}
                  onClick={() => setFilters({ ...filters, ...(o.value === "all" ? { source: undefined } : { source: o.value as FeedbackSource }) })}>
                  {o.label}
                </Chip>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {dateRangeOptions.map((o) => (
              <Chip key={o.value} active={filters.dateRange === o.value} onClick={() => setFilters({ dateRange: o.value })}>
                {o.label}
              </Chip>
            ))}
          </div>
          <div className="ml-auto">
            <div className="relative">
              <input type="text" placeholder="搜索工单号、学员、课程..."
                value={filters.keyword || ""}
                onChange={(e) => setFilters({ keyword: e.target.value })}
                className="field-input w-64 pl-9" />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="card px-4 py-3 flex items-center gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={allSelected} onChange={() => selectAllVisible(visibleIds)}
            className="w-4 h-4 rounded border-ink-300 text-moss-600 focus:ring-moss-500/20" />
          <span className="text-sm text-ink-600 font-medium">
            全选 <span className="text-ink-400">({selectedIds.length}/{filtered.length} 已选</span>
          </span>
        </label>
        <div className="h-5 w-px bg-ink-200 mx-1" />
        <button type="button" disabled={selectedIds.length === 0}
          className="btn-soft !px-3 !py-1.5 !text-xs" onClick={clearSelected}>
          <UserPlus className="w-3.5 h-3.5" />批量指派
        </button>
        <button type="button" disabled={selectedIds.length === 0} className="btn-soft !px-3 !py-1.5 !text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />批量紧急
        </button>
        <button type="button" className="btn-soft !px-3 !py-1.5 !text-xs">
          <Download className="w-3.5 h-3.5" />导出
        </button>
        <div className="ml-auto text-xs text-ink-500">
          共 <span className="font-semibold text-ink-700">{filtered.length}</span> 条工单
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-100/60 border-b border-cream-200">
                {["", "工单编号", "学员", "课程", "类型", "满意度", "紧急度", "状态", "处理人", "来源", "创建时间"].map((h, i) => (
                  <th key={i} className={cn("py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider", i === 0 && "w-12")}>
                    {h || "\u00a0"}
                  </th>
                ))}
                <th className="w-24 py-3 px-4 text-right font-medium text-ink-500 text-xs uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-ink-400">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-10 h-10 text-ink-300" />
                      <p className="text-sm">暂无符合条件的工单</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((fb, idx) => {
                  const ti = feedbackTypeMap[fb.type], si = statusMap[fb.status], ui = urgencyMap[fb.urgency];
                  const SI = sourceIconMap[fb.source], urgent = fb.urgency === "urgent", sel = selectedIds.includes(fb.id);
                  return (
                    <tr key={fb.id} className={cn(
                      "group border-b border-cream-200/60 transition-colors",
                      idx % 2 === 1 ? "bg-moss-50/30" : "bg-white",
                      sel ? "bg-moss-50" : "hover:bg-moss-50/60", urgent && "left-urgent-bar"
                    )}>
                      <td className="py-3 px-4">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelected(fb.id)}
                          className="w-4 h-4 rounded border-ink-300 text-moss-600 focus:ring-moss-500/20 cursor-pointer" />
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/tickets/${fb.id}`} className="font-mono text-xs font-semibold text-moss-700 hover:text-moss-800 hover:underline underline-offset-2">
                          {fb.ticketNo}
                        </Link>
                      </td>
                      <td className="py-3 px-4"><Avatar fb={fb} /></td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-ink-700 truncate max-w-[180px]" title={fb.courseName}>{fb.courseName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn("chip", ti.color, "border")}>{ti.emoji} {ti.label}</span>
                      </td>
                      <td className="py-3 px-4"><Stars s={fb.satisfaction} /></td>
                      <td className="py-3 px-4">
                        <span className={ui.color}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", ui.dot)} />{ui.label}
                        </span>
                      </td>
                      <td className="py-3 px-4"><span className={si.color}>{si.label}</span></td>
                      <td className="py-3 px-4">
                        {fb.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-sky2-100 text-sky2-700 text-[10px] font-semibold flex items-center justify-center">
                              {fb.assigneeAvatar || fb.assignee.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs text-ink-600">{fb.assignee}</span>
                          </div>
                        ) : <span className="text-xs text-ink-400">未分配</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5" title={sourceMap[fb.source].label}>
                          <SI className="w-3.5 h-3.5 text-ink-500" />
                          <span className="text-xs text-ink-500">{sourceMap[fb.source].label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-500">{formatDate(fb.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/tickets/${fb.id}`} className="btn-soft !p-1.5" title="查看"><Eye className="w-3.5 h-3.5" /></Link>
                          <button type="button" className="btn-soft !p-1.5" title="指派"><UserCheck className="w-3.5 h-3.5" /></button>
                          <button type="button" className="btn-soft !p-1.5" title="关闭"><XCircle className="w-3.5 h-3.5" /></button>
                          <button type="button" className="btn-soft !p-1.5" title="更多"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-cream-200">
          <p className="text-xs text-ink-500">
            第 <span className="font-semibold text-ink-700">{(currentPage - 1) * pageSize + 1}</span>-
            <span className="font-semibold text-ink-700">{Math.min(currentPage * pageSize, filtered.length)}</span>
            {" "}条，共 {filtered.length} 条
          </p>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:bg-moss-50 hover:text-moss-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => setCurrentPage(p)}
                className={cn("w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors",
                  currentPage === p ? "bg-moss-600 text-white shadow-card" : "text-ink-600 hover:bg-moss-50 hover:text-moss-700")}>
                {p}
              </button>
            ))}
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:bg-moss-50 hover:text-moss-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
