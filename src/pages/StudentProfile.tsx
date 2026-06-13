import { useParams, Link } from "react-router-dom";
import { Calendar, Phone, IdCard, Award, BookOpen, MessageSquare, TrendingUp, ChevronRight, Star, Clock } from "lucide-react";
import { useFeedbackStore } from "@/store/feedbackStore";
import { AreaChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from "recharts";
import { vipMap, feedbackTypeMap, statusMap, urgencyMap, formatDate, formatDateShort, satisfactionColor, cn } from "@/utils/format";
import type { Enrollment, Feedback, Satisfaction } from "@/types";

const satisfactionTrend = [
  { month: "1月", sat: 4.2, count: 3 },
  { month: "2月", sat: 4.5, count: 5 },
  { month: "3月", sat: 4.0, count: 4 },
  { month: "4月", sat: 4.7, count: 6 },
  { month: "5月", sat: 4.3, count: 8 },
  { month: "6月", sat: 4.8, count: 7 },
];

const enrollmentStatusMap: Record<Enrollment["status"], { label: string; color: string }> = {
  ongoing: { label: "进行中", color: "chip bg-moss-50 text-moss-700 border border-moss-200" },
  finished: { label: "已结课", color: "chip bg-ink-100 text-ink-600 border border-ink-200" },
  paused: { label: "暂停", color: "chip bg-ember-50 text-ember-700 border border-ember-200" },
};

const Stars = ({ s }: { s: number | Satisfaction }) => {
  const score = typeof s === "number" ? Math.round(s) : s;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("w-4 h-4", i <= score ? cn("fill-current", satisfactionColor(score as Satisfaction)) : "text-ink-200")} />
      ))}
    </div>
  );
};

export default function StudentProfile() {
  const { id = "s001" } = useParams<{ id: string }>();
  const { getStudent, feedbacks } = useFeedbackStore();
  const student = getStudent(id);

  const studentFeedbacks = feedbacks
    .filter((f) => f.studentId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!student) {
    return (
      <div className="card p-12 text-center">
        <p className="text-ink-500">未找到该学员信息</p>
      </div>
    );
  }

  const vipInfo = vipMap[student.vipLevel];
  const avgSatRounded = Math.round(student.avgSatisfaction);
  const displayEnrollments = student.enrollments.slice(0, 4);

  const maxSat = Math.max(...satisfactionTrend.map((d) => d.sat));
  const minSat = Math.min(...satisfactionTrend.map((d) => d.sat));
  const maxSatMonth = satisfactionTrend.find((d) => d.sat === maxSat)?.month;
  const minSatMonth = satisfactionTrend.find((d) => d.sat === minSat)?.month;
  const avgSat = satisfactionTrend.reduce((s, d) => s + d.sat, 0) / satisfactionTrend.length;

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="relative shrink-0">
            <div className={cn("w-24 h-24 rounded-full bg-gradient-to-br from-moss-400 to-moss-600 text-white text-2xl font-display font-bold flex items-center justify-center", vipInfo.ring)}>
              {student.avatar}
            </div>
            {student.vipLevel !== "normal" && (
              <div className={cn("absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-card", student.vipLevel === "diamond" ? "bg-sky2-500 text-white" : student.vipLevel === "gold" ? "bg-amber-400 text-white" : "bg-slate-400 text-white")}>
                <Award className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-display font-bold text-ink-800">{student.name}</h1>
              {student.vipLevel !== "normal" && (
                <span className={cn("chip !py-1 !px-3 !text-sm font-semibold", vipInfo.color.replace("text-", "bg-").replace("-600", "-100 text-").replace("-500", "-100 text-"))}>
                  <Award className="w-3.5 h-3.5 mr-0.5" />
                  {vipInfo.label}VIP
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-ink-600">
                <IdCard className="w-4 h-4 text-ink-400 shrink-0" />
                <span className="text-ink-500">ID：</span>
                <span className="font-mono font-medium">{student.id.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-600">
                <Phone className="w-4 h-4 text-ink-400 shrink-0" />
                <span className="text-ink-500">手机号：</span>
                <span className="font-medium">{student.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-600">
                <Calendar className="w-4 h-4 text-ink-400 shrink-0" />
                <span className="text-ink-500">注册：</span>
                <span className="font-medium">{formatDateShort(student.registerDate)}</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[320px] space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {student.tags.map((t) => (
                <span key={t} className="chip bg-cream-200 text-ink-600 border border-cream-300">
                  #{t}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-moss-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-moss-600 mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-medium">报名课程</span>
                </div>
                <p className="text-2xl font-display font-bold text-moss-700">{student.enrollmentCount}</p>
              </div>
              <div className="bg-sky2-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-sky2-600 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-medium">累计反馈</span>
                </div>
                <p className="text-2xl font-display font-bold text-sky2-700">{studentFeedbacks.length}</p>
              </div>
            </div>
            <div className="bg-ember-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-ember-600 font-medium mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  平均满意度
                </p>
                <p className="text-3xl font-display font-bold text-ember-600">{student.avgSatisfaction.toFixed(1)}</p>
              </div>
              <Stars s={avgSatRounded} />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-display font-semibold text-ink-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-moss-600" />
              满意度趋势
            </h2>
            <p className="text-xs text-ink-500 mt-1">近 6 个月满意度与反馈量变化</p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={satisfactionTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="satGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F806B" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2F806B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEA" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5A6B6E" }} axisLine={{ stroke: "#CCD3D4" }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#5A6B6E" }} domain={[0, 5]} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#5A6B6E" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #EAE2D2", boxShadow: "0 4px 16px rgba(15, 26, 28, 0.08)" }}
                labelStyle={{ fontWeight: 600, color: "#1A2B2E", marginBottom: 4 }}
              />
              <ReferenceLine yAxisId="left" y={avgSat} stroke="#F56E17" strokeDasharray="4 4" label={{ value: `均值 ${avgSat.toFixed(1)}`, position: "right", fontSize: 11, fill: "#F56E17" }} />
              <Bar yAxisId="right" dataKey="count" fill="#BCE1FF" radius={[4, 4, 0, 0]} barSize={28} name="反馈数" />
              <Area yAxisId="left" type="monotone" dataKey="sat" stroke="none" fill="url(#satGradient)" />
              <Line yAxisId="left" type="monotone" dataKey="sat" stroke="#2F806B" strokeWidth={2.5} dot={{ r: 4, fill: "#2F806B", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} name="满意度" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-cream-200">
          <div className="text-center">
            <p className="text-xs text-ink-500 mb-1">最高满意度</p>
            <p className="text-lg font-display font-bold text-moss-600">{maxSat.toFixed(1)} <span className="text-sm font-normal text-ink-500 ml-1">({maxSatMonth})</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs text-ink-500 mb-1">最低满意度</p>
            <p className="text-lg font-display font-bold text-ember-600">{minSat.toFixed(1)} <span className="text-sm font-normal text-ink-500 ml-1">({minSatMonth})</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs text-ink-500 mb-1">波动差值</p>
            <p className="text-lg font-display font-bold text-sky2-600">{(maxSat - minSat).toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-display font-semibold text-ink-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-moss-600" />
              历史报名课程
            </h2>
            <p className="text-xs text-ink-500 mt-1">共 {student.enrollments.length} 门课程</p>
          </div>
        </div>

        <div className="space-y-3">
          {displayEnrollments.map((en) => {
            const es = enrollmentStatusMap[en.status];
            return (
              <div key={en.id} className="group flex items-center gap-4 p-4 rounded-xl bg-cream-100/50 hover:bg-moss-50/60 transition-colors border border-cream-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to="#" className="font-medium text-ink-800 hover:text-moss-700 truncate max-w-[280px]">
                      {en.courseName}
                    </Link>
                    <span className={es.color}>{es.label}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-ink-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {en.className}
                    </span>
                    <span>授课老师：{en.teacherName}</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateShort(en.enrolledAt)}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden max-w-xs">
                      <div
                        className={cn("h-full rounded-full transition-all", en.progress === 100 ? "bg-moss-500" : en.status === "paused" ? "bg-ember-400" : "bg-moss-400")}
                        style={{ width: `${en.progress}%` }}
                      />
                    </div>
                    <span className={cn("text-xs font-semibold shrink-0", en.progress === 100 ? "text-moss-600" : en.status === "paused" ? "text-ember-600" : "text-moss-500")}>
                      {en.progress}%
                    </span>
                  </div>
                </div>
                <Link to="#" className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-ink-400 hover:bg-moss-600 hover:text-white transition-all group-hover:scale-105">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-display font-semibold text-ink-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-moss-600" />
              反馈历史时间线
            </h2>
            <p className="text-xs text-ink-500 mt-1">共 {studentFeedbacks.length} 条反馈记录</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-[15px] top-1 bottom-1 w-px bg-cream-300" />
          <div className="space-y-0">
            {studentFeedbacks.length === 0 ? (
              <div className="py-12 text-center text-ink-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-ink-300" />
                <p className="text-sm">暂无反馈记录</p>
              </div>
            ) : (
              studentFeedbacks.map((fb: Feedback, idx: number) => {
                const ti = feedbackTypeMap[fb.type];
                const si = statusMap[fb.status];
                const isUrgent = fb.urgency === "urgent" || fb.urgency === "high";
                const last = idx === studentFeedbacks.length - 1;
                return (
                  <div key={fb.id} className={cn("relative pl-12 py-4", !last && "border-b border-cream-100")}>
                    <div
                      className={cn(
                        "absolute left-0 top-5 w-[30px] h-[30px] rounded-full flex items-center justify-center border-4 border-white shadow-card",
                        isUrgent ? "bg-ember-500" : "bg-moss-500"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", isUrgent ? "animate-pulse bg-white" : "bg-white")} />
                    </div>
                    {isUrgent && (
                      <div className="absolute left-[11px] top-[22px] w-1 h-[calc(100%-30px)] bg-ember-200 rounded-full" />
                    )}

                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <span className={cn("chip", ti.color, "border")}>
                        {ti.emoji} {ti.label}
                      </span>
                      <Stars s={fb.satisfaction} />
                      <span className={si.color}>{si.label}</span>
                      {isUrgent && (
                        <span className={urgencyMap[fb.urgency].color}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", urgencyMap[fb.urgency].dot)} />
                          {urgencyMap[fb.urgency].label}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-ink-700 line-clamp-2 mb-2 leading-relaxed">
                      {fb.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <Link
                        to={`/tickets/${fb.id}`}
                        className="font-mono font-semibold text-moss-700 hover:text-moss-800 hover:underline underline-offset-2"
                      >
                        {fb.ticketNo}
                      </Link>
                      <span className="inline-flex items-center gap-1 text-ink-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(fb.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
