import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BookOpen, Clock, UserCheck, Calendar, Plus, Trash2, Send, ChevronDown,
  MessageSquare, Phone, MessageCircle, Smartphone, Shield, Star, ArrowLeft,
  X, AtSign, Paperclip, PencilLine, Wand2, Play, Pause, AlertTriangle,
} from "lucide-react";
import { useFeedbackStore } from "@/store/feedbackStore";
import {
  statusMap, urgencyMap, feedbackTypeMap, sourceMap, vipMap,
  formatDate, formatDateShort, formatDuration, satisfactionLabels, cn,
} from "@/utils/format";
import type {
  TicketStatus, UrgencyLevel, Comment, VisitRecord, CoursewareLink,
} from "@/types";

const assignees = [
  { name: "张客服", avatar: "ZK", role: "客服" },
  { name: "李教研", avatar: "LJ", role: "教研" },
  { name: "王客服", avatar: "WK", role: "客服" },
  { name: "陈教研", avatar: "CJ", role: "教研组长" },
  { name: "赵客服", avatar: "ZK", role: "客服" },
];
const mockCoursewarePool = [
  { kind: "课件" as const, name: "2.3 导数与函数极值·课堂讲义", link: "#/cw/1" },
  { kind: "题目" as const, name: "极值判别专项练习（10 题）", link: "#/hw/2" },
  { kind: "直播回放" as const, name: "第 3 讲·导数综合应用（回放）", link: "#/rp/3" },
  { kind: "课件" as const, name: "第一章总复习 PPT", link: "#/cw/4" },
];
const urgencyLevels: UrgencyLevel[] = ["low", "normal", "high", "urgent"];
const statuses: TicketStatus[] = ["pending", "processing", "teaching", "replied", "closed"];
const commentTabs = [
  { key: "all", label: "全部评论" },
  { key: "internal", label: "仅内部" },
  { key: "visits", label: "回访记录" },
] as const;
const visitChannels = [
  { key: "phone", label: "电话", Icon: Phone },
  { key: "wechat", label: "微信", Icon: MessageCircle },
  { key: "in_app", label: "站内信", Icon: Smartphone },
] as const;
const visitResults = [
  { key: "connected", label: "已接通" },
  { key: "no_answer", label: "未接通" },
  { key: "scheduled", label: "已预约" },
] as const;
const coursewareKindColor: Record<CoursewareLink["kind"], string> = {
  "课件": "chip bg-moss-50 text-moss-700 border border-moss-200",
  "题目": "chip bg-ember-50 text-ember-700 border border-ember-200",
  "直播回放": "chip bg-sky2-50 text-sky2-700 border border-sky2-200",
};
const visitResultColor: Record<VisitRecord["result"], string> = {
  connected: "chip bg-moss-50 text-moss-700 border border-moss-200",
  no_answer: "chip bg-ember-50 text-ember-700 border border-ember-200",
  scheduled: "chip bg-sky2-50 text-sky2-700 border border-sky2-200",
};
const visitChannelColor: Record<VisitRecord["channel"], typeof Smartphone> = {
  phone: Phone, wechat: MessageCircle, in_app: Smartphone,
};

export default function TicketDetail() {
  const { id = "" } = useParams();
  const fb = useFeedbackStore((s) => s.getFeedback(id));
  const student = useFeedbackStore((s) => s.getStudent(fb?.studentId ?? ""));
  const {
    updateStatus, assignTo, setUrgency, setCategory, setPromisedAt,
    setInternalNote, addComment, addVisit, addCourseware,
    toggleCoursewareModify, removeCourseware,
  } = useFeedbackStore();

  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState(fb?.category ?? "");
  const [promisedDraft, setPromisedDraft] = useState(fb?.promisedAt ?? "");
  const [noteDraft, setNoteDraft] = useState(fb?.internalNote ?? "");
  const [cwSearch, setCwSearch] = useState("");
  const [cwSearchOpen, setCwSearchOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [commentTab, setCommentTab] = useState<typeof commentTabs[number]["key"]>("all");
  const [visitModal, setVisitModal] = useState(false);
  const [newVisit, setNewVisit] = useState<{ channel: VisitRecord["channel"]; summary: string; result: VisitRecord["result"] }>({
    channel: "phone", summary: "", result: "connected",
  });
  const [playingRec, setPlayingRec] = useState<number | null>(null);
  const [enlargedImg, setEnlargedImg] = useState<string | null>(null);

  useEffect(() => {
    setCategoryDraft(fb?.category ?? "");
    setPromisedDraft(fb?.promisedAt ?? "");
    setNoteDraft(fb?.internalNote ?? "");
    setCwSearch("");
    setCwSearchOpen(false);
    setCommentDraft("");
    setStatusOpen(false);
    setAssigneeOpen(false);
    setNewVisit({ channel: "phone", summary: "", result: "connected" });
  }, [fb?.id]);

  if (!fb) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-ink-400">
        <Shield className="w-14 h-14 mb-3" />
        <p className="text-lg font-medium">工单不存在</p>
        <Link to="/tickets" className="btn-soft mt-6"><ArrowLeft className="w-4 h-4" />返回列表</Link>
      </div>
    );
  }

  const ti = feedbackTypeMap[fb.type];
  const si = statusMap[fb.status];
  const ui = urgencyMap[fb.urgency];
  const vi = vipMap[student?.vipLevel ?? "normal"];

  const filteredComments = useMemo(() => {
    if (commentTab === "internal") return fb.comments.filter((c) => c.internal);
    if (commentTab === "visits") return [];
    return fb.comments;
  }, [commentTab, fb.comments]);

  const filteredPool = mockCoursewarePool.filter((c) =>
    c.name.toLowerCase().includes(cwSearch.trim().toLowerCase())
  );

  const handleStatusChange = (st: TicketStatus) => { updateStatus(fb.id, st); setStatusOpen(false); };
  const handleAssign = (a: string) => { assignTo(fb.id, a); setAssigneeOpen(false); };
  const handleSaveCategory = () => setCategory(fb.id, categoryDraft);
  const handleSavePromised = () => setPromisedAt(fb.id, promisedDraft || undefined);
  const handleSaveNote = () => setInternalNote(fb.id, noteDraft);
  const handleSendComment = () => {
    if (!commentDraft.trim()) return;
    addComment(fb.id, {
      author: "我", avatar: "WO", role: "customer_service",
      content: commentDraft.trim(), internal: isInternal,
    });
    setCommentDraft("");
  };
  const handleAddVisit = () => {
    if (!newVisit.summary.trim()) return;
    addVisit(fb.id, { operator: "我", operatorAvatar: "WO", ...newVisit });
    setNewVisit({ channel: "phone", summary: "", result: "connected" });
    setVisitModal(false);
  };
  const handleAddCourseware = (c: typeof mockCoursewarePool[number]) => {
    addCourseware(fb.id, { ...c, needModify: false, linkedBy: "我" });
    setCwSearchOpen(false);
    setCwSearch("");
  };

  const Stars = ({ s }: { s: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("w-4 h-4",
          i <= s ? "fill-current text-ember-500" : "text-ink-200")} />
      ))}
      <span className="ml-1 text-xs text-ink-500">{satisfactionLabels[s as 1 | 2 | 3 | 4 | 5]}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-moss-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />返回工单列表
        </Link>
      </div>

      <div className="grid grid-cols-10 gap-5">
        <div className="col-span-10 lg:col-span-7 space-y-5">
          {/* 1. 工单头卡片 */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-lg font-bold text-ink-800">{fb.ticketNo}</span>
                  <span className="chip bg-ink-100 text-ink-700 border border-ink-200">
                    {sourceMap[fb.source].icon === "smartphone" && <Smartphone className="w-3 h-3" />}
                    {sourceMap[fb.source].icon === "monitor" && <Wand2 className="w-3 h-3" />}
                    {sourceMap[fb.source].icon === "message-circle" && <MessageCircle className="w-3 h-3" />}
                    {sourceMap[fb.source].icon === "phone" && <Phone className="w-3 h-3" />}
                    {sourceMap[fb.source].label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                    <Clock className="w-3.5 h-3.5" />{formatDate(fb.createdAt)}
                  </span>
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setStatusOpen((o) => !o)}
                    className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition", si.color)}>
                    {si.label}
                    <ChevronDown className={cn("w-4 h-4 transition-transform", statusOpen && "rotate-180")} />
                  </button>
                  {statusOpen && (
                    <div className="absolute left-0 top-full mt-2 z-20 card py-1 w-40 animate-popIn shadow-pop">
                      {statuses.map((st) => (
                        <button key={st} onClick={() => handleStatusChange(st)}
                          className={cn("w-full text-left px-4 py-2 text-sm transition-colors",
                            st === fb.status ? "bg-moss-50 text-moss-700 font-medium" : "text-ink-700 hover:bg-cream-100")}>
                          {statusMap[st].label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-end">
                  {urgencyLevels.map((u) => {
                    const m = urgencyMap[u];
                    return (
                      <button key={u} onClick={() => setUrgency(fb.id, u)}
                        className={cn("chip cursor-pointer px-3 py-1.5 border transition-all",
                          fb.urgency === u ? m.color + " shadow-card" : "bg-white text-ink-500 border-ink-200 hover:border-moss-300")}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", m.dot)} />{m.label}
                      </button>
                    );
                  })}
                </div>
                <Stars s={fb.satisfaction} />
              </div>
            </div>
          </div>

          {/* 2. 反馈详情卡片 */}
          <div className="card p-5 space-y-4">
            <h3 className="font-display font-semibold text-ink-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-moss-600" />反馈详情
            </h3>
            <nav className="flex items-center gap-1.5 text-sm flex-wrap">
              <BookOpen className="w-4 h-4 text-moss-600 shrink-0" />
              <span className="text-ink-700 font-medium">{fb.courseName}</span>
              {fb.chapterName && (<><span className="text-ink-300">/</span><span className="text-ink-600">{fb.chapterName}</span></>)}
              {fb.lessonName && (<><span className="text-ink-300">/</span><span className="text-ink-600">{fb.lessonName}</span></>)}
            </nav>
            <div>
              <span className={cn("chip !text-sm !px-3.5 !py-1.5 border", ti.color)}>{ti.emoji} {ti.label}</span>
            </div>
            <div className="bg-cream-100/80 rounded-xl p-4 border border-cream-200">
              <p className="text-sm leading-relaxed text-ink-700 whitespace-pre-wrap">{fb.content}</p>
            </div>
            {fb.screenshots.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {fb.screenshots.map((src, i) => (
                  <img key={i} src={src} alt={`截图 ${i + 1}`}
                    onClick={() => setEnlargedImg(src)}
                    className="w-full h-40 object-cover rounded-xl border border-cream-200 cursor-pointer hover:shadow-pop transition-all" />
                ))}
              </div>
            )}
            {fb.recordings.length > 0 && (
              <div className="space-y-2">
                {fb.recordings.map((rec, i) => {
                  const playing = playingRec === i;
                  return (
                    <div key={i} className="flex items-center gap-3 bg-white border border-ink-200 rounded-xl px-3 py-2.5">
                      <button onClick={() => setPlayingRec(playing ? null : i)}
                        className="w-9 h-9 rounded-full bg-moss-600 text-white flex items-center justify-center shrink-0 hover:bg-moss-700 transition">
                        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-700 truncate">{rec.name}</p>
                        <div className="h-1.5 bg-cream-200 rounded-full mt-1.5 overflow-hidden flex items-center gap-0.5">
                          {Array.from({ length: 24 }).map((_, k) => (
                            <span key={k} className={cn("flex-1 rounded-full",
                              (playing && k < 12 + (i % 6)) || (!playing && k < 10) ? "bg-moss-400" : "bg-moss-100")}
                              style={{ height: `${20 + ((k + i * 3) % 70) + 10}%` }} />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-ink-500 shrink-0 font-mono">{formatDuration(rec.duration)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. 处理操作卡片 */}
          <div className="card p-5 space-y-4">
            <h3 className="font-display font-semibold text-ink-800 flex items-center gap-2">
              <PencilLine className="w-4 h-4 text-moss-600" />处理操作
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="field-label">分类标签</label>
                <div className="flex gap-2">
                  <input type="text" className="field-input" placeholder="如：知识点讲解速度"
                    value={categoryDraft} onChange={(e) => setCategoryDraft(e.target.value)} />
                  <button onClick={handleSaveCategory} className="btn-soft">保存</button>
                </div>
              </div>
              <div>
                <label className="field-label">承诺完成时间</label>
                <div className="flex gap-2">
                  <input type="date" className="field-input" value={promisedDraft}
                    onChange={(e) => setPromisedDraft(e.target.value)} />
                  <button onClick={handleSavePromised} className="btn-soft flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />保存
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="field-label">指派处理人</label>
              <div className="relative">
                <button type="button" onClick={() => setAssigneeOpen((o) => !o)}
                  className="field-input text-left flex items-center justify-between">
                  {fb.assignee ? (
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sky2-100 text-sky2-700 text-[10px] font-semibold flex items-center justify-center">
                        {fb.assigneeAvatar || fb.assignee.slice(0, 2)}
                      </span>
                      <span className="text-sm text-ink-700">{fb.assignee}</span>
                    </span>
                  ) : <span className="text-ink-400">选择处理人…</span>}
                  <ChevronDown className={cn("w-4 h-4 text-ink-400 transition-transform", assigneeOpen && "rotate-180")} />
                </button>
                {assigneeOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-20 card py-1 animate-popIn shadow-pop">
                    {assignees.map((a) => (
                      <button key={a.name} onClick={() => handleAssign(a.name)}
                        className={cn("w-full flex items-center gap-3 px-4 py-2.5 transition-colors",
                          a.name === fb.assignee ? "bg-moss-50" : "hover:bg-cream-100")}>
                        <span className="w-8 h-8 rounded-full bg-moss-100 text-moss-700 text-xs font-semibold flex items-center justify-center">
                          {a.avatar}
                        </span>
                        <span className="flex-1 text-left">
                          <p className="text-sm font-medium text-ink-800">{a.name}</p>
                          <p className="text-xs text-ink-400">{a.role}</p>
                        </span>
                        <UserCheck className={cn("w-4 h-4", a.name === fb.assignee ? "text-moss-600" : "text-transparent")} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. 教研关联卡片 */}
          <div className="card p-5 space-y-4">
            <h3 className="font-display font-semibold text-ink-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-moss-600" />教研关联
            </h3>
            <div className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input type="text" className="field-input pl-9" placeholder="搜索课件/题目/直播回放…"
                    value={cwSearch} onChange={(e) => { setCwSearch(e.target.value); setCwSearchOpen(true); }}
                    onFocus={() => setCwSearchOpen(true)} />
                  <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                </div>
                <button className="btn-primary"><Plus className="w-4 h-4" />添加</button>
              </div>
              {cwSearchOpen && filteredPool.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-20 card py-1 animate-popIn shadow-pop max-h-60 overflow-auto">
                  {filteredPool.map((c, i) => (
                    <button key={i} onClick={() => handleAddCourseware(c)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cream-100 transition-colors text-left">
                      <span className={coursewareKindColor[c.kind]}>{c.kind}</span>
                      <span className="flex-1 text-sm text-ink-700 truncate">{c.name}</span>
                      <Plus className="w-4 h-4 text-moss-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {fb.coursewares.length === 0 && (
                <p className="text-sm text-ink-400 py-4 text-center border border-dashed border-ink-200 rounded-xl">
                  暂无关联教研资料
                </p>
              )}
              {fb.coursewares.map((cw) => (
                <div key={cw.id} className="flex items-center gap-3 p-3 rounded-xl border border-cream-200 hover:bg-cream-50/60 transition-colors">
                  <span className={coursewareKindColor[cw.kind]}>{cw.kind}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{cw.name}</p>
                    {cw.note && <p className="text-xs text-ink-500 mt-0.5 truncate">备注：{cw.note}</p>}
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-xs text-ink-500 cursor-pointer shrink-0">
                    <span className="whitespace-nowrap">需修改</span>
                    <input type="checkbox" checked={cw.needModify}
                      onChange={() => toggleCoursewareModify(fb.id, cw.id)}
                      className="w-4 h-4 rounded border-ink-300 text-ember-500 focus:ring-ember-500/20" />
                  </label>
                  <button onClick={() => removeCourseware(fb.id, cw.id)}
                    className="w-7 h-7 rounded-lg text-ink-400 hover:bg-ember-50 hover:text-ember-600 flex items-center justify-center shrink-0 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 5. 内部备注卡片 */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-ink-800 flex items-center gap-2">
                <AtSign className="w-4 h-4 text-moss-600" />内部备注
              </h3>
              <button onClick={handleSaveNote} className="btn-primary"><PencilLine className="w-4 h-4" />保存</button>
            </div>
            <textarea rows={4} className="field-input resize-none" placeholder="@ 提及同组同事…"
              value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
          </div>

          {/* 6. 沟通时间线卡片 */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-display font-semibold text-ink-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-moss-600" />沟通时间线
              </h3>
              <div className="flex items-center gap-1 bg-cream-100 rounded-lg p-1">
                {commentTabs.map((t) => (
                  <button key={t.key} onClick={() => setCommentTab(t.key)}
                    className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      commentTab === t.key ? "bg-white text-moss-700 shadow-card" : "text-ink-500 hover:text-ink-700")}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {commentTab !== "visits" ? (
              <div className="space-y-4 max-h-80 overflow-auto pr-2">
                {filteredComments.length === 0 && (
                  <p className="text-sm text-ink-400 py-8 text-center">暂无评论</p>
                )}
                {filteredComments.map((c) => (
                  <CommentItem key={c.id} c={c} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-auto pr-2">
                {fb.visits.length === 0 && (
                  <p className="text-sm text-ink-400 py-8 text-center">暂无回访记录</p>
                )}
                {fb.visits.map((v) => (
                  <VisitItem key={v.id} v={v} />
                ))}
              </div>
            )}

            <div className="border-t border-cream-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <span className={cn("text-xs font-medium", isInternal ? "text-moss-700" : "text-ember-700")}>
                    {isInternal ? "内部评论" : "对外回复"}
                  </span>
                  <button type="button" onClick={() => setIsInternal((v) => !v)}
                    className={cn("relative w-11 h-6 rounded-full transition-colors",
                      isInternal ? "bg-moss-500" : "bg-ember-500")}>
                    <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                      isInternal ? "left-0.5" : "left-[22px]")} />
                  </button>
                </label>
                <div className="flex items-center gap-1 text-ink-400">
                  <button className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center"><AtSign className="w-4 h-4" /></button>
                  <button className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center"><Paperclip className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <textarea rows={2} className="field-input resize-none"
                  placeholder={isInternal ? "输入内部评论，@ 可提及同事…" : "输入回复内容，发送后学员可见…"}
                  value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} />
                <button onClick={handleSendComment} disabled={!commentDraft.trim()}
                  className="btn-primary !px-4 !py-2.5"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧栏 */}
        <div className="col-span-10 lg:col-span-3 space-y-5">
          <div className="card p-5 space-y-5">
            <div className="text-center space-y-2">
              <div className="relative inline-block">
                <div className={cn("w-20 h-20 rounded-full bg-cream-200 text-ink-700 text-xl font-bold flex items-center justify-center",
                  vi.ring, student?.vipLevel === "diamond" && "ring-offset-2")}
                  style={student?.vipLevel === "diamond" ? { background: "linear-gradient(135deg,#EFF8FF,#D9EEFF)" } : undefined}>
                  {fb.studentAvatar}
                </div>
                {student?.vipLevel !== "normal" && (
                  <span className={cn("absolute -bottom-1 left-1/2 -translate-x-1/2 chip !px-2 !py-0.5 border shadow-card bg-white", vi.color)}>
                    {vi.label} VIP
                  </span>
                )}
              </div>
              <div>
                <p className="font-display text-lg font-bold text-ink-800">{fb.studentName}</p>
                <p className="text-xs text-ink-400 font-mono">ID: {fb.studentId}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center">
              {student?.tags.map((t) => (
                <span key={t} className="chip bg-cream-200 text-ink-600 border border-cream-300">{t}</span>
              ))}
              {!student?.tags?.length && <span className="text-xs text-ink-400">暂无标签</span>}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center py-3 border-y border-cream-200">
              <div>
                <p className="text-xl font-display font-bold text-moss-700">{student?.enrollmentCount ?? 0}</p>
                <p className="text-xs text-ink-500 mt-0.5">报名课程</p>
              </div>
              <div>
                <p className="text-xl font-display font-bold text-ember-600">{student?.avgSatisfaction?.toFixed(1) ?? "-"}</p>
                <p className="text-xs text-ink-500 mt-0.5">平均满意度</p>
              </div>
              <div>
                <p className="text-xl font-display font-bold text-sky2-600">
                  {useFeedbackStore.getState().feedbacks.filter((f) => f.studentId === fb.studentId).length}
                </p>
                <p className="text-xs text-ink-500 mt-0.5">累计反馈</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">历史报名</p>
              {(student?.enrollments ?? []).slice(0, 3).map((e) => (
                <div key={e.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-ink-700 font-medium truncate flex-1 mr-2">{e.courseName}</p>
                    <span className="text-ink-500 shrink-0 font-mono">{e.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                    <div className="h-full bg-moss-500 rounded-full transition-all" style={{ width: `${e.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <Link to={`/students/${fb.studentId}`}
              className="btn-ghost w-full justify-center text-sm">
              <UserCheck className="w-4 h-4" />查看学员画像
            </Link>
          </div>

          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-ink-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-moss-600" />回访记录
              </h3>
              <button onClick={() => setVisitModal(true)} className="btn-soft !px-3 !py-1.5 !text-xs">
                <Plus className="w-3.5 h-3.5" />新增回访
              </button>
            </div>
            <div className="space-y-3 max-h-72 overflow-auto">
              {fb.visits.length === 0 && (
                <p className="text-sm text-ink-400 py-6 text-center">暂无回访记录</p>
              )}
              {fb.visits.map((v) => <VisitItem key={v.id} v={v} compact />)}
            </div>
          </div>
        </div>
      </div>

      {/* 放大截图 */}
      {enlargedImg && (
        <div className="fixed inset-0 bg-ink-900/80 z-50 flex items-center justify-center p-6 animate-popIn"
          onClick={() => setEnlargedImg(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <img src={enlargedImg} alt="放大" className="max-w-full max-h-full rounded-2xl shadow-pop" />
        </div>
      )}

      {/* 新增回访弹窗 */}
      {visitModal && (
        <div className="fixed inset-0 bg-ink-900/60 z-50 flex items-center justify-center p-6" onClick={() => setVisitModal(false)}>
          <div className="card p-6 w-full max-w-md animate-popIn shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink-800">新增回访记录</h3>
              <button onClick={() => setVisitModal(false)} className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center text-ink-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="field-label">回访渠道</label>
                <div className="grid grid-cols-3 gap-2">
                  {visitChannels.map((c) => (
                    <button key={c.key} onClick={() => setNewVisit({ ...newVisit, channel: c.key as VisitRecord["channel"] })}
                      className={cn("field-input flex items-center justify-center gap-1.5 !py-2.5 cursor-pointer",
                        newVisit.channel === c.key ? "border-moss-400 bg-moss-50 text-moss-700 ring-4 ring-moss-500/10" : "")}>
                      <c.Icon className="w-4 h-4" />{c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">回访结果</label>
                <div className="grid grid-cols-3 gap-2">
                  {visitResults.map((r) => (
                    <button key={r.key} onClick={() => setNewVisit({ ...newVisit, result: r.key as VisitRecord["result"] })}
                      className={cn("field-input !py-2.5 text-sm cursor-pointer",
                        newVisit.result === r.key ? "border-moss-400 bg-moss-50 text-moss-700 ring-4 ring-moss-500/10" : "")}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">沟通概要</label>
                <textarea rows={3} className="field-input resize-none" placeholder="记录本次沟通要点…"
                  value={newVisit.summary} onChange={(e) => setNewVisit({ ...newVisit, summary: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setVisitModal(false)} className="btn-ghost">取消</button>
              <button onClick={handleAddVisit} disabled={!newVisit.summary.trim()} className="btn-primary">
                <Plus className="w-4 h-4" />保存记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentItem({ c }: { c: Comment }) {
  const isInternal = c.internal;
  const mine = c.author === "我";
  const wrap = isInternal
    ? "bg-moss-50/70 border border-moss-100"
    : "bg-ember-50/60 border border-ember-100";
  return (
    <div className={cn("flex gap-3", (mine || !isInternal) && "flex-row-reverse")}>
      <div className={cn("w-8 h-8 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0",
        isInternal ? "bg-moss-100 text-moss-700" : "bg-ember-100 text-ember-700")}>
        {c.avatar}
      </div>
      <div className={cn("flex-1 min-w-0 max-w-[85%]", (mine || !isInternal) && "items-end")}>
        <div className={cn("flex items-center gap-2 mb-1 text-xs", (mine || !isInternal) && "justify-end")}>
          <span className={cn("font-medium", isInternal ? "text-moss-700" : "text-ember-700")}>{c.author}</span>
          <span className={cn("chip", isInternal ? "bg-moss-100 text-moss-600" : "bg-ember-100 text-ember-600")}>
            {isInternal ? "内部" : "对外"}
          </span>
          <span className="text-ink-400">{formatDate(c.createdAt)}</span>
        </div>
        <div className={cn("rounded-2xl px-4 py-2.5", wrap)}>
          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
        </div>
      </div>
    </div>
  );
}

function VisitItem({ v, compact }: { v: VisitRecord; compact?: boolean }) {
  const CI = visitChannelColor[v.channel];
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-cream-50/70 border border-cream-200">
      <div className="w-8 h-8 rounded-full bg-sky2-100 text-sky2-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
        {v.operatorAvatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-medium text-ink-700">{v.operator}</span>
          <span className="chip bg-sky2-50 text-sky2-700 border border-sky2-200 flex items-center gap-1">
            <CI className="w-3 h-3" />
            {visitChannels.find((c) => c.key === v.channel)?.label}
          </span>
          <span className={visitResultColor[v.result]}>
            {visitResults.find((r) => r.key === v.result)?.label}
          </span>
          {!compact && <span className="text-xs text-ink-400 ml-auto">{formatDate(v.createdAt)}</span>}
        </div>
        <p className={cn("text-sm text-ink-600", compact ? "line-clamp-2" : "")}>{v.summary}</p>
        {compact && <p className="text-xs text-ink-400 mt-1">{formatDateShort(v.createdAt)}</p>}
      </div>
    </div>
  );
}
