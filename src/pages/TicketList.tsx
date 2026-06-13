import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Inbox, Clock, CheckCircle, AlertTriangle, Download, UserPlus,
  ChevronLeft, ChevronRight, Filter, MoreHorizontal, Eye,
  UserCheck, XCircle, Smartphone, Monitor, MessageCircle, Phone, Star, X,
  Save, BookOpen, Users, MessageSquare, Trash2, FileText, StickyNote,
} from "lucide-react";
import { useFeedbackStore } from "@/store/feedbackStore";
import {
  urgencyMap, statusMap, feedbackTypeMap, sourceMap,
  formatDate, satisfactionColor, vipMap, cn, getSlaStatus, getSlaLabel, isSameDay,
} from "@/utils/format";
import type {
  TicketStatus, UrgencyLevel, FeedbackType, Feedback, FeedbackSource,
  Satisfaction, SavedView, VisitRecord,
} from "@/types";

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
  { key: "overdue", label: "已超时", icon: AlertTriangle, color: "bg-ember-50 text-ember-600", trend: "需关注", up: false },
  { key: "due48h", label: "48H内需跟进", icon: Clock, color: "bg-amber-50 text-amber-600", trend: "待处理", up: false },
];

const assigneeList = [
  { name: "张客服", avatar: "ZK", role: "客服组" },
  { name: "李教研", avatar: "LJ", role: "教研组" },
  { name: "王客服", avatar: "WK", role: "客服组" },
  { name: "赵客服", avatar: "ZK", role: "客服组" },
  { name: "孙客服", avatar: "SK", role: "客服组" },
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
  const {
    feedbacks, students, filters, setFilters, resetFilters, selectedIds, toggleSelected, clearSelected,
    selectAllVisible, selectAllFiltered, updateStatus, assignTo, setUrgency, setInternalNote,
    batchUpdateStatus, batchAssign, batchSetInternalNote, batchAddVisit,
    savedViews, saveView, deleteView, applyViewToList, visitTemplates, noteTemplates,
  } = useFeedbackStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [assignModal, setAssignModal] = useState<"batch" | "single" | null>(null);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [viewMenu, setViewMenu] = useState(false);
  const [saveViewModal, setSaveViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewScope, setNewViewScope] = useState<SavedView["scope"]>("both");
  const [newViewOwner, setNewViewOwner] = useState<SavedView["owner"]>("all");
  const [batchNoteModal, setBatchNoteModal] = useState(false);
  const [batchVisitModal, setBatchVisitModal] = useState(false);
  const [batchNote, setBatchNote] = useState("");
  const [batchVisit, setBatchVisit] = useState<{
    channel: VisitRecord["channel"]; summary: string; result: VisitRecord["result"];
  }>({ channel: "phone", summary: "", result: "connected" });
  const pageSize = 8;

  const stats = useMemo(() => {
    let overdue = 0, due48h = 0;
    feedbacks.forEach((f) => {
      const s = getSlaStatus(f.promisedAt, f.status);
      if (s === "overdue") overdue++;
      if (s === "due_48h" || s === "due_today") due48h++;
    });
    return {
      total: feedbacks.length,
      processing: feedbacks.filter((f) => ["pending", "processing", "teaching"].includes(f.status)).length,
      closed: feedbacks.filter((f) => f.status === "closed").length,
      urgent: feedbacks.filter((f) => (f.urgency === "urgent" || f.urgency === "high") && f.status !== "closed").length,
      overdue, due48h,
    };
  }, [feedbacks]);

  const filtered = useMemo(() => feedbacks.filter((f) => {
    if (filters.status !== "all" && f.status !== filters.status) return false;
    if (filters.urgency !== "all" && f.urgency !== filters.urgency) return false;
    if (filters.type !== "all" && f.type !== filters.type) return false;
    if (filters.source !== "all" && filters.source && f.source !== filters.source) return false;
    if (filters.keyword?.trim()) {
      const kw = filters.keyword.trim().toLowerCase();
      if (!f.ticketNo.toLowerCase().includes(kw) && !f.studentName.toLowerCase().includes(kw) && !f.courseName.toLowerCase().includes(kw)) return false;
    }
    if (filters.dateRange !== "all" && !isInDateRange(f.createdAt, filters.dateRange!)) return false;
    if (filters.sla && filters.sla !== "all") {
      const s = getSlaStatus(f.promisedAt, f.status);
      if (filters.sla === "overdue" && s !== "overdue") return false;
      if (filters.sla === "due_today" && s !== "due_today" && s !== "overdue") return false;
      if (filters.sla === "due_48h" && s !== "due_48h" && s !== "due_today" && s !== "overdue") return false;
      if (filters.sla === "visit_today") {
        const hasToday = (f.visits || []).some((v) => isSameDay(new Date(v.createdAt), new Date()));
        if (!hasToday) return false;
      }
    }
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

  const applicableViews = useMemo(() =>
    savedViews.filter((v) => v.scope === "both" || v.scope === "list"),
  [savedViews]);

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

  const handleBatchAssign = (name: string) => {
    selectedIds.forEach((id) => assignTo(id, name));
    clearSelected();
    setAssignModal(null);
  };

  const handleSingleAssign = (name: string) => {
    if (assignTarget) assignTo(assignTarget, name);
    setAssignModal(null);
    setAssignTarget(null);
  };

  const handleBatchUrgent = () => {
    selectedIds.forEach((id) => setUrgency(id, "urgent"));
    clearSelected();
  };

  const handleExport = () => {
    const data = filtered.map((f) => ({
      工单编号: f.ticketNo, 学员: f.studentName, 课程: f.courseName,
      类型: feedbackTypeMap[f.type].label, 满意度: f.satisfaction,
      紧急度: urgencyMap[f.urgency].label, 状态: statusMap[f.status].label,
      处理人: f.assignee || "-", 来源: sourceMap[f.source].label,
      创建时间: formatDate(f.createdAt),
    }));
    const headers = Object.keys(data[0] || {});
    const csv = [headers.join(","), ...data.map((r) => headers.map((h) => `"${(r as any)[h]}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `feedback_export_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    saveView({
      name: newViewName.trim(),
      scope: newViewScope,
      owner: newViewOwner,
      filters: {
        status: filters.status,
        urgency: filters.urgency,
        type: filters.type,
        keyword: filters.keyword,
        dateRange: filters.dateRange,
        assignee: filters.assignee,
        source: filters.source,
        sla: filters.sla,
      },
    });
    setSaveViewModal(false);
    setNewViewName("");
  };

  const handleApplyView = (view: SavedView) => {
    applyViewToList(view);
    setCurrentPage(1);
    setViewMenu(false);
  };

  const handleBatchNoteApply = (content?: string) => {
    const note = content || batchNote.trim();
    if (!note || selectedIds.length === 0) return;
    batchSetInternalNote(selectedIds, note);
    setBatchNote("");
    setBatchNoteModal(false);
    clearSelected();
  };

  const handleBatchVisitApply = (tpl?: typeof batchVisit) => {
    const v = tpl || batchVisit;
    if (!v.summary.trim() || selectedIds.length === 0) return;
    batchAddVisit(selectedIds, {
      channel: v.channel,
      summary: v.summary,
      result: v.result,
      operator: "当前客服",
      operatorAvatar: "DQ",
    });
    setBatchVisit({ channel: "phone", summary: "", result: "connected" });
    setBatchVisitModal(false);
    clearSelected();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-800">客服反馈列表</h1>
          <p className="text-sm text-ink-500 mt-1">统一管理学员反馈工单，高效跟进处理进度</p>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setViewMenu(!viewMenu)}
            className="btn-soft !px-4 !py-2 !text-sm inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4" />常用视图
            <ChevronRight className={cn("w-4 h-4 transition-transform", viewMenu && "rotate-90")} />
          </button>
          {viewMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 card !p-2 z-20 animate-popIn" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-cream-200">
                <span className="text-xs font-medium text-ink-500">我的视图</span>
                <button type="button" onClick={() => { setViewMenu(false); setSaveViewModal(true); }}
                  className="text-xs text-moss-600 hover:text-moss-700 font-medium inline-flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" />保存当前
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {applicableViews.length === 0 ? (
                  <p className="text-sm text-ink-400 py-6 text-center">暂无保存的视图</p>
                ) : applicableViews.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-3 py-2 hover:bg-moss-50/50 rounded-lg group">
                    <button type="button" onClick={() => handleApplyView(v)} className="flex-1 text-left">
                      <p className="text-sm font-medium text-ink-700">{v.name}</p>
                      <p className="text-xs text-ink-400">
                        {v.owner === "service" ? "客服组" : v.owner === "teaching" ? "教研组" : "全部"} · {v.scope === "both" ? "列表+分析" : "仅列表"}
                      </p>
                    </button>
                    <button type="button" onClick={() => deleteView(v.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-ember-50 text-ink-400 hover:text-ember-500 flex items-center justify-center transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((sc) => {
          const Icon = sc.icon;
          const isActive =
            (sc.key === "overdue" && filters.sla === "overdue") ||
            (sc.key === "due48h" && filters.sla === "due_48h");
          return (
            <div key={sc.key} className={cn(
              "card p-5 flex items-center gap-4 cursor-pointer transition-all duration-200",
              isActive ? "ring-2 ring-moss-500 ring-offset-2" : "hover:shadow-card"
            )} onClick={() => {
              if (sc.key === "overdue") {
                setFilters({ sla: filters.sla === "overdue" ? "all" : "overdue" });
                setCurrentPage(1);
              } else if (sc.key === "due48h") {
                setFilters({ sla: filters.sla === "due_48h" ? "all" : "due_48h" });
                setCurrentPage(1);
              }
            }}>
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
            <Clock className="w-4 h-4 text-ink-400 shrink-0" />
            <span className="text-xs font-medium text-ink-500">SLA 跟进</span>
          </div>
          <Chip active={filters.sla === "all" || !filters.sla}
            onClick={() => { setFilters({ sla: "all" }); setCurrentPage(1); }}>
            全部
          </Chip>
          <Chip active={filters.sla === "overdue"}
            onClick={() => { setFilters({ sla: filters.sla === "overdue" ? "all" : "overdue" }); setCurrentPage(1); }}
            ac="bg-ember-500 text-white border-ember-500 shadow-ember">
            <AlertTriangle className="w-3.5 h-3.5" />已超时
          </Chip>
          <Chip active={filters.sla === "due_today"}
            onClick={() => { setFilters({ sla: filters.sla === "due_today" ? "all" : "due_today" }); setCurrentPage(1); }}
            ac="bg-ember-400 text-white border-ember-400">
            <Clock className="w-3.5 h-3.5" />今天到期
          </Chip>
          <Chip active={filters.sla === "due_48h"}
            onClick={() => { setFilters({ sla: filters.sla === "due_48h" ? "all" : "due_48h" }); setCurrentPage(1); }}
            ac="bg-amber-500 text-white border-amber-500">
            <Clock className="w-3.5 h-3.5" />48H内需跟进
          </Chip>
          <Chip active={filters.sla === "visit_today"}
            onClick={() => { setFilters({ sla: filters.sla === "visit_today" ? "all" : "visit_today" }); setCurrentPage(1); }}
            ac="bg-sky2-500 text-white border-sky2-500">
            <Phone className="w-3.5 h-3.5" />今日回访
          </Chip>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 mr-2">
            <Filter className="w-4 h-4 text-ink-400 shrink-0" />
            <span className="text-xs font-medium text-ink-500">状态</span>
          </div>
          {statusOptions.map((o) => (
            <Chip key={o.value} active={filters.status === o.value}
              onClick={() => { setFilters({ status: o.value }); setCurrentPage(1); }}
              ac={o.value === "closed" && filters.status === o.value ? "bg-ink-600 text-white border-ink-600" : undefined}>
              {o.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-ink-500 w-10 shrink-0">紧急度</span>
          {urgencyOptions.map((o) => (
            <Chip key={o.value} active={filters.urgency === o.value}
              onClick={() => { setFilters({ urgency: o.value }); setCurrentPage(1); }}
              ac={o.value === "urgent" && filters.urgency === o.value ? "bg-ember-500 text-white border-ember-500" : undefined}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", urgencyMap[o.value === "all" ? "normal" : (o.value as UrgencyLevel)].dot)} />
              {o.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-ink-500 w-10 shrink-0">类型</span>
          {feedbackTypeOptions.map((o) => (
            <Chip key={o.value} active={filters.type === o.value} onClick={() => { setFilters({ type: o.value }); setCurrentPage(1); }}>
              {o.emoji} {o.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-ink-500 w-10 shrink-0">来源</span>
            {sourceOptions.map((o) => (
              <Chip key={o.value} active={filters.source === o.value || (!filters.source && o.value === "all")}
                onClick={() => { setFilters({ source: o.value }); setCurrentPage(1); }}>
                {o.label}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {dateRangeOptions.map((o) => (
              <Chip key={o.value} active={filters.dateRange === o.value} onClick={() => { setFilters({ dateRange: o.value }); setCurrentPage(1); }}>
                {o.label}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={() => { resetFilters(); setCurrentPage(1); }}
              className="text-xs text-ink-500 hover:text-ink-700 font-medium">
              重置筛选
            </button>
            <div className="relative">
              <input type="text" placeholder="搜索工单号、学员、课程..."
                value={filters.keyword || ""}
                onChange={(e) => { setFilters({ keyword: e.target.value }); setCurrentPage(1); }}
                className="field-input w-64 pl-9" />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="card px-4 py-3 flex items-center gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={allSelected} onChange={() => selectAllVisible(visibleIds)}
            className="w-4 h-4 rounded border-ink-300 text-moss-600 focus:ring-moss-500/20" />
          <span className="text-sm text-ink-600 font-medium">
            全选 <span className="text-ink-400">({selectedIds.length}/{filtered.length} 已选)</span>
          </span>
        </label>
        <button type="button" onClick={() => selectAllFiltered(filtered.map((f) => f.id))}
          className="text-xs text-ink-500 hover:text-ink-700 font-medium">
          全选当前筛选
        </button>
        <div className="h-5 w-px bg-ink-200 mx-1" />
        <button type="button" disabled={selectedIds.length === 0}
          className="btn-soft !px-3 !py-1.5 !text-xs" onClick={() => setAssignModal("batch")}>
          <UserPlus className="w-3.5 h-3.5" />批量指派
        </button>
        <button type="button" disabled={selectedIds.length === 0}
          className="btn-soft !px-3 !py-1.5 !text-xs" onClick={handleBatchUrgent}>
          <AlertTriangle className="w-3.5 h-3.5" />批量紧急
        </button>
        <button type="button" disabled={selectedIds.length === 0}
          className="btn-soft !px-3 !py-1.5 !text-xs" onClick={() => setBatchNoteModal(true)}>
          <StickyNote className="w-3.5 h-3.5" />批量备注
        </button>
        <button type="button" disabled={selectedIds.length === 0}
          className="btn-soft !px-3 !py-1.5 !text-xs" onClick={() => setBatchVisitModal(true)}>
          <Phone className="w-3.5 h-3.5" />批量回访
        </button>
        <button type="button" disabled={selectedIds.length === 0}
          className="btn-soft !px-3 !py-1.5 !text-xs" onClick={() => { batchUpdateStatus(selectedIds, "closed"); clearSelected(); }}>
          <CheckCircle className="w-3.5 h-3.5" />批量关闭
        </button>
        <button type="button" className="btn-soft !px-3 !py-1.5 !text-xs" onClick={handleExport}>
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
                <th className="w-12 py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider"></th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">工单编号</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">学员</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">课程</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">类型</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">满意度</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">紧急度</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">SLA</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">状态</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">处理人</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">来源</th>
                <th className="py-3 px-4 text-left font-medium text-ink-500 text-xs uppercase tracking-wider">创建时间</th>
                <th className="w-24 py-3 px-4 text-right font-medium text-ink-500 text-xs uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-ink-400">
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
                  const sla = getSlaStatus(fb.promisedAt, fb.status);
                  const slaLabel = getSlaLabel(sla);
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
                      <td className="py-3 px-4">
                        {slaLabel.label ? <span className={slaLabel.color}>{slaLabel.label}</span> : <span className="text-xs text-ink-300">—</span>}
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
                          <button type="button" className="btn-soft !p-1.5" title="指派"
                            onClick={() => { setAssignTarget(fb.id); setAssignModal("single"); }}>
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" className="btn-soft !p-1.5" title="关闭"
                            onClick={() => updateStatus(fb.id, "closed")}
                            disabled={fb.status === "closed"}>
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
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
              disabled={currentPage === totalPages}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-ink-500 hover:bg-moss-50 hover:text-moss-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {assignModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setAssignModal(null); setAssignTarget(null); }}>
          <div className="card p-6 w-full max-w-md animate-popIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink-800">
                {assignModal === "batch" ? `批量指派 (${selectedIds.length} 条)` : "指派处理人"}
              </h3>
              <button type="button" onClick={() => { setAssignModal(null); setAssignTarget(null); }}
                className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center text-ink-400 hover:text-ink-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {assigneeList.map((a) => (
                <button key={a.name} type="button" onClick={() => assignModal === "batch" ? handleBatchAssign(a.name) : handleSingleAssign(a.name)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:border-moss-300 hover:bg-moss-50/50 transition text-left">
                  <div className="w-10 h-10 rounded-full bg-sky2-100 text-sky2-700 text-sm font-semibold flex items-center justify-center">
                    {a.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-700">{a.name}</p>
                    <p className="text-xs text-ink-400">{a.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {saveViewModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSaveViewModal(false)}>
          <div className="card p-6 w-full max-w-md animate-popIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink-800">保存当前视图</h3>
              <button type="button" onClick={() => setSaveViewModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center text-ink-400 hover:text-ink-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-2">视图名称</label>
                <input type="text" value={newViewName} onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="请输入视图名称" className="field-input w-full" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-2">适用范围</label>
                <div className="flex gap-2">
                  {[
                    { value: "list", label: "仅列表" },
                    { value: "analytics", label: "仅分析" },
                    { value: "both", label: "列表+分析" },
                  ].map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setNewViewScope(opt.value as any)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition",
                        newViewScope === opt.value
                          ? "bg-moss-50 border-moss-300 text-moss-700"
                          : "bg-white border-ink-200 text-ink-500 hover:border-moss-200"
                      )}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-2">可见范围</label>
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "全部" },
                    { value: "service", label: "客服组" },
                    { value: "teaching", label: "教研组" },
                  ].map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setNewViewOwner(opt.value as any)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition",
                        newViewOwner === opt.value
                          ? "bg-moss-50 border-moss-300 text-moss-700"
                          : "bg-white border-ink-200 text-ink-500 hover:border-moss-200"
                      )}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setSaveViewModal(false)}
                className="btn-soft !px-4 !py-2 !text-sm">
                取消
              </button>
              <button type="button" onClick={handleSaveView} disabled={!newViewName.trim()}
                className="btn-primary !px-4 !py-2 !text-sm">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {batchNoteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setBatchNoteModal(false)}>
          <div className="card p-6 w-full max-w-lg animate-popIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink-800">批量设置内部备注 ({selectedIds.length} 条)</h3>
              <button type="button" onClick={() => setBatchNoteModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center text-ink-400 hover:text-ink-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            {noteTemplates.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-ink-500 mb-2">使用模板</label>
                <div className="flex flex-wrap gap-2">
                  {noteTemplates.map((tpl) => (
                    <button key={tpl.id} type="button" onClick={() => setBatchNote(tpl.content)}
                      className="chip bg-cream-50 text-ink-600 border border-cream-200 hover:bg-moss-50 hover:border-moss-200">
                      <FileText className="w-3.5 h-3.5" />{tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-2">备注内容</label>
              <textarea value={batchNote} onChange={(e) => setBatchNote(e.target.value)}
                rows={4} placeholder="请输入备注内容，将应用到所有选中工单..."
                className="field-input w-full resize-none" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setBatchNoteModal(false)}
                className="btn-soft !px-4 !py-2 !text-sm">
                取消
              </button>
              <button type="button" onClick={() => handleBatchNoteApply()} disabled={!batchNote.trim() || selectedIds.length === 0}
                className="btn-primary !px-4 !py-2 !text-sm">
                应用到 {selectedIds.length} 条
              </button>
            </div>
          </div>
        </div>
      )}

      {batchVisitModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setBatchVisitModal(false)}>
          <div className="card p-6 w-full max-w-lg animate-popIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink-800">批量补回访记录 ({selectedIds.length} 条)</h3>
              <button type="button" onClick={() => setBatchVisitModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center text-ink-400 hover:text-ink-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            {visitTemplates.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-ink-500 mb-2">使用模板</label>
                <div className="flex flex-wrap gap-2">
                  {visitTemplates.map((tpl) => (
                    <button key={tpl.id} type="button" onClick={() => handleBatchVisitApply({
                      channel: tpl.channel, summary: tpl.summary, result: tpl.result,
                    })}
                      className="chip bg-cream-50 text-ink-600 border border-cream-200 hover:bg-moss-50 hover:border-moss-200">
                      <Phone className="w-3.5 h-3.5" />{tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-2">回访方式</label>
                <div className="flex gap-2">
                  {visitChannelOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.value} type="button" onClick={() => setBatchVisit((v) => ({ ...v, channel: opt.value }))}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all",
                          batchVisit.channel === opt.value
                            ? "bg-moss-50 border-moss-300 text-moss-700"
                            : "bg-white border-ink-200 text-ink-500 hover:border-moss-200"
                        )}>
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-2">回访结果</label>
                <select value={batchVisit.result}
                  onChange={(e) => setBatchVisit((v) => ({ ...v, result: e.target.value as VisitRecord["result"] }))}
                  className="field-input w-full">
                  <option value="connected">已接通</option>
                  <option value="no_answer">未接听</option>
                  <option value="scheduled">已约定回访</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-2">回访内容</label>
                <textarea value={batchVisit.summary}
                  onChange={(e) => setBatchVisit((v) => ({ ...v, summary: e.target.value }))}
                  rows={4} placeholder="请输入回访沟通内容..."
                  className="field-input w-full resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setBatchVisitModal(false)}
                className="btn-soft !px-4 !py-2 !text-sm">
                取消
              </button>
              <button type="button" onClick={() => handleBatchVisitApply()}
                disabled={!batchVisit.summary.trim() || selectedIds.length === 0}
                className="btn-primary !px-4 !py-2 !text-sm">
                应用到 {selectedIds.length} 条
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const visitChannelOptions: Array<{ value: VisitRecord["channel"]; label: string; icon: any }> = [
  { value: "phone", label: "电话", icon: Phone },
  { value: "wechat", label: "微信", icon: MessageSquare },
  { value: "in_app", label: "站内信", icon: MessageSquare },
];
