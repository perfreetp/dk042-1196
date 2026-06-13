import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Clock, Star, Inbox, CheckCircle,
  Gauge, MessageSquare, Users, BookOpen,
} from "lucide-react";
import { useFeedbackStore } from "@/store/feedbackStore";
import { cn } from "@/utils/format";

const courseOptions = ["全部", "高中数学·函数与导数强化班", "高中英语·阅读与写作提升营", "大学计算机·Python 数据分析实战", "初三物理·力学冲刺课程", "高考语文·作文提分"];
const teacherOptions = ["全部", "陈明远", "李思雨", "王浩然", "赵文博", "周老师"];
const classOptions = ["全部", "2026暑期·数学A班", "2026暑期·英语B班", "Python 数据分析 01班", "中考物理冲刺班"];
const typeOptions = ["全部", "课程内容", "作业批改", "老师服务", "平台体验", "其他建议"];
const keywordTabs = ["全部", "课程内容", "作业批改", "老师服务"];

const PIE_COLORS = ["#2F806B", "#F56E17", "#55B2FF", "#5A6B6E", "#F59E0B"];

const renderGradientId = (id: string, colorStart: string, colorEnd: string) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={colorStart} />
      <stop offset="100%" stopColor={colorEnd} />
    </linearGradient>
  </defs>
);

const Stars = ({ rating, size = 14 }: { rating: number; size?: number }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= full;
        const isHalf = !filled && half && i === full + 1;
        return (
          <Star
            key={i}
            className={cn(
              filled || isHalf ? "fill-current text-ember-500" : "text-ink-200",
            )}
            style={{ width: size, height: size }}
          />
        );
      })}
    </div>
  );
};

const TrendChip = ({ up, value, good }: { up?: "up" | "down" | "flat"; value: string; good?: boolean }) => {
  const Icon = up === "up" ? TrendingUp : up === "down" ? TrendingDown : Minus;
  const colorClass = up === "flat"
    ? "text-ink-500 bg-ink-100"
    : (good ?? up === "up")
      ? "text-moss-600 bg-moss-50"
      : "text-ember-500 bg-ember-50";
  return (
    <span className={cn("chip gap-1", colorClass)}>
      <Icon className="w-3 h-3" />
      {value}
    </span>
  );
};

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
};

const Dropdown = ({ label, value, options, onChange, icon: Icon }: DropdownProps) => (
  <div className="flex-1 min-w-[160px]">
    <label className="block text-[11px] font-medium text-ink-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "field-input appearance-none pr-9",
          Icon && "pl-9",
        )}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

const TypeCapsule = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-[11px] font-medium text-ink-400 mb-1.5 uppercase tracking-wider">问题类型</label>
    <div className="flex flex-wrap gap-1.5">
      {typeOptions.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border",
            value === t
              ? "bg-moss-600 text-white border-moss-600 shadow-card"
              : "bg-white text-ink-600 border-ink-200 hover:border-moss-300 hover:text-moss-700",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  </div>
);

type OverviewCardProps = {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  chip?: React.ReactNode;
  subValue?: React.ReactNode;
};

const OverviewCard = ({ label, value, icon: Icon, iconBg, iconColor, chip, subValue }: OverviewCardProps) => (
  <div className="card p-5 relative overflow-hidden">
    <div className="flex items-start justify-between mb-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      {chip}
    </div>
    <p className="text-xs font-medium text-ink-500">{label}</p>
    <div className="mt-2 flex items-end gap-2">
      <p className="text-3xl font-display font-bold text-ink-800 leading-none">{value}</p>
      {subValue}
    </div>
  </div>
);

const CardHeader = ({ title, desc, icon: Icon }: { title: string; desc?: string; icon?: React.ComponentType<{ className?: string }> }) => (
  <div className="flex items-center gap-2.5 mb-4">
    {Icon && (
      <div className="w-8 h-8 rounded-lg bg-moss-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-moss-600" />
      </div>
    )}
    <div>
      <h3 className="font-display text-base font-bold text-ink-800 leading-tight">{title}</h3>
      {desc && <p className="text-xs text-ink-400 mt-0.5">{desc}</p>}
    </div>
  </div>
);

export default function Analytics() {
  const { analytics } = useFeedbackStore();
  const [course, setCourse] = useState("全部");
  const [teacher, setTeacher] = useState("全部");
  const [cls, setCls] = useState("全部");
  const [type, setType] = useState("全部");
  const [keywordTab, setKeywordTab] = useState("全部");

  const closeRate = useMemo(() => Math.round((analytics.closed / analytics.total) * 100), [analytics.closed, analytics.total]);

  const filteredKeywords = useMemo(() => {
    if (keywordTab === "全部") return analytics.keywords;
    const map: Record<string, number[]> = {
      "课程内容": [98, 78, 65, 62, 55, 38, 35, 22, 18, 14],
      "作业批改": [86, 42, 32, 20, 12],
      "老师服务": [60, 25, 28],
    };
    const weights = map[keywordTab] || [];
    return analytics.keywords.filter((k) => weights.includes(k.weight));
  }, [keywordTab, analytics.keywords]);

  const wordColor = (weight: number) => {
    if (weight >= 70) return "#F56E17";
    if (weight >= 40) return "#2F806B";
    return "#5A6B6E";
  };
  const wordSize = (weight: number) => 14 + (weight / 100) * 26;

  const topCourseMax = Math.max(...analytics.topCourses.map((c) => c.count));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-800">趋势分析</h1>
        <p className="text-sm text-ink-500 mt-1">洞察反馈数据变化，发现服务改进方向</p>
      </div>

      {/* Row 1: Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <OverviewCard
          label="总反馈量"
          value={analytics.total}
          icon={Inbox}
          iconBg="bg-moss-50"
          iconColor="text-moss-600"
          chip={<TrendChip up="up" value="+18% 周趋势" good />}
        />
        <OverviewCard
          label="处理中"
          value={analytics.processing}
          icon={Gauge}
          iconBg="bg-sky2-50"
          iconColor="text-sky2-600"
          chip={<span className="chip bg-sky2-50 text-sky2-600">进行中</span>}
        />
        <OverviewCard
          label="已关闭"
          value={analytics.closed}
          icon={CheckCircle}
          iconBg="bg-cream-200"
          iconColor="text-ink-700"
          subValue={<span className="chip bg-moss-100 text-moss-700 mb-1">关闭率 {closeRate}%</span>}
        />
        <OverviewCard
          label="平均处理时长"
          value={`${analytics.avgHandleHours}h`}
          icon={Clock}
          iconBg="bg-cream-200"
          iconColor="text-ink-700"
          chip={<TrendChip up="down" value="-2.3h 周同比" good />}
        />
        <OverviewCard
          label="平均满意度"
          value={analytics.avgSatisfaction}
          icon={Star}
          iconBg="bg-ember-50"
          iconColor="text-ember-500"
          subValue={<div className="mb-1"><Stars rating={analytics.avgSatisfaction} /></div>}
        />
      </div>

      {/* Row 2: Filters + Main Charts */}
      <div className="card p-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
          <div className="lg:col-span-4 flex flex-wrap gap-4 items-start">
            <Dropdown label="课程" value={course} options={courseOptions} onChange={setCourse} icon={BookOpen} />
            <Dropdown label="老师" value={teacher} options={teacherOptions} onChange={setTeacher} icon={Users} />
            <Dropdown label="班级" value={cls} options={classOptions} onChange={setCls} icon={MessageSquare} />
            <div className="flex-1 min-w-[360px]">
              <TypeCapsule value={type} onChange={setType} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <CardHeader title="反馈量 & 满意度趋势" desc="近 8 周双轴对比" icon={TrendingUp} />
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analytics.trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  {renderGradientId("barMoss", "#4E9C86", "#B0D8CA")}
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEA" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#5A6B6E", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#CCD3D4" }} />
                  <YAxis yAxisId="left" tick={{ fill: "#5A6B6E", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[3, 5]} tick={{ fill: "#5A6B6E", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #EAE2D2", backgroundColor: "#FAF8F5", boxShadow: "0 4px 16px rgba(15,26,28,0.08)" }}
                    cursor={{ fill: "rgba(47,128,107,0.05)" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="count" name="反馈量" fill="url(#barMoss)" radius={[6, 6, 0, 0]} barSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="satisfaction" name="满意度" stroke="#F56E17" strokeWidth={3} dot={{ r: 4, fill: "#F56E17", strokeWidth: 2, stroke: "#FFF3EB" }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <CardHeader title="反馈类型分布" desc="按问题类型统计占比" icon={MessageSquare} />
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={100}
                    paddingAngle={3}
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "#CCD3D4" }}
                  >
                    {analytics.byType.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke="#FAF8F5" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #EAE2D2", backgroundColor: "#FAF8F5" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Three Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <CardHeader title="满意度分布" desc="按星级统计数量" icon={Star} />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.bySatisfaction} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                {renderGradientId("satGrad", "#FFBC91", "#FFF3EB")}
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEA" vertical={false} />
                <XAxis dataKey="score" tick={{ fill: "#5A6B6E", fontSize: 12 }} tickFormatter={(v) => `${v}★`} tickLine={false} axisLine={{ stroke: "#CCD3D4" }} />
                <YAxis tick={{ fill: "#5A6B6E", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EAE2D2", backgroundColor: "#FAF8F5" }} cursor={{ fill: "rgba(245,110,23,0.05)" }} />
                <Bar dataKey="count" name="数量" fill="url(#satGrad)" radius={[8, 8, 0, 0]} barSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <CardHeader title="处理时长分布" desc="按时间段统计工单" icon={Clock} />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.handleDuration} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                {renderGradientId("durGrad", "#55B2FF", "#D9EEFF")}
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEA" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#5A6B6E", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#CCD3D4" }} />
                <YAxis type="category" dataKey="bucket" tick={{ fill: "#5A6B6E", fontSize: 12 }} tickLine={false} axisLine={false} width={64} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EAE2D2", backgroundColor: "#FAF8F5" }} cursor={{ fill: "rgba(61,165,255,0.05)" }} />
                <Bar dataKey="count" name="工单量" fill="url(#durGrad)" radius={[0, 8, 8, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <CardHeader title="Top 5 课程" desc="反馈量最多的课程" icon={BookOpen} />
          <div className="space-y-4 pt-1">
            {analytics.topCourses.map((c, idx) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      "w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0",
                      idx === 0 ? "bg-ember-500 text-white" : idx === 1 ? "bg-ember-400 text-white" : idx === 2 ? "bg-amber-500 text-white" : "bg-ink-200 text-ink-600",
                    )}>{idx + 1}</span>
                    <span className="text-sm font-medium text-ink-700 truncate">{c.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-ink-500 shrink-0 ml-2">{c.count} 条</span>
                </div>
                <div className="flex items-center gap-2 pl-7">
                  <div className="flex-1 h-2 rounded-full bg-cream-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-moss-400 to-moss-600"
                      style={{ width: `${(c.count / topCourseMax) * 100}%` }}
                    />
                  </div>
                  <Stars rating={c.avgSat} size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Word Cloud */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <CardHeader title="高频词云" desc="学员反馈中出现频次最高的关键词" icon={MessageSquare} />
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-cream-100">
            {keywordTabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setKeywordTab(t)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  keywordTab === t
                    ? "bg-white text-moss-700 shadow-card"
                    : "text-ink-500 hover:text-ink-700",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[260px] rounded-2xl bg-gradient-to-br from-cream-50 via-cream-100 to-moss-50/40 p-6 border border-cream-200">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
            {filteredKeywords.map((k, i) => {
              const rot = (i * 37) % 7 - 3;
              const size = wordSize(k.weight);
              const color = wordColor(k.weight);
              return (
                <span
                  key={k.word}
                  className="inline-block px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-1 select-none font-medium"
                  style={{
                    fontSize: size,
                    color,
                    transform: `rotate(${rot}deg)`,
                    textShadow: "0 1px 2px rgba(15,26,28,0.06)",
                  }}
                >
                  {k.word}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
