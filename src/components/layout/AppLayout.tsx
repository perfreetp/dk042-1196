import { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquarePlus,
  Inbox,
  UserCircle2,
  BarChart3,
  Sparkles,
  Bell,
  Search,
  X,
  ChevronRight,
} from "lucide-react";
import { useFeedbackStore } from "@/store/feedbackStore";
import { feedbackTypeMap, statusMap, cn } from "@/utils/format";

const navItems = [
  { to: "/submit", label: "反馈入口", icon: MessageSquarePlus, desc: "学员提交反馈" },
  { to: "/tickets", label: "反馈列表", icon: Inbox, desc: "客服处理工单" },
  { to: "/students/s001", label: "学员画像", icon: UserCircle2, desc: "查看学员档案" },
  { to: "/analytics", label: "趋势分析", icon: BarChart3, desc: "数据与洞察" },
];

export default function AppLayout() {
  const { feedbacks } = useFeedbackStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<typeof feedbacks>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const pendingCount = feedbacks.filter((f) => f.status === "pending").length;

  const pageTitle =
    navItems.find((n) => location.pathname.startsWith(n.to))?.label ?? "反馈管理";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) { setSearchResults([]); setShowResults(false); return; }
    const lower = trimmed.toLowerCase();
    const matches = feedbacks.filter(
      (f) =>
        f.ticketNo.toLowerCase().includes(lower) ||
        f.studentName.includes(trimmed) ||
        f.courseName.includes(trimmed)
    );
    setSearchResults(matches);
    setShowResults(true);
  };

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    if (val.trim().length >= 2) {
      doSearch(val);
    } else {
      setShowResults(false);
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = () => {
    const kw = searchText.trim();
    if (!kw) return;
    doSearch(kw);
  };

  const goToResult = (id: string) => {
    navigate(`/tickets/${id}`);
    setShowResults(false);
    setSearchText("");
  };

  const goToTicketList = () => {
    navigate("/tickets");
    useFeedbackStore.getState().setFilters({ keyword: searchText.trim() });
    setShowResults(false);
    setSearchText("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 h-screen sticky top-0 bg-gradient-to-b from-moss-700 via-moss-800 to-moss-900 text-white/90 flex flex-col">
        <Link
          to="/submit"
          className="flex items-center gap-3 px-6 pt-7 pb-6 border-b border-white/10"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center shadow-ember">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-lg font-bold text-white leading-none">声·课</div>
            <div className="text-[11px] text-white/60 mt-1 tracking-wider">
              FEEDBACK · INSIGHT
            </div>
          </div>
        </Link>

        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-widest text-white/40 uppercase">
            工作台
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white text-moss-800 shadow-pop"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon
                className={`h-[18px] w-[18px] ${
                  location.pathname.startsWith(item.to) ? "text-moss-600" : "text-white/60 group-hover:text-white"
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {item.to === "/tickets" && pendingCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-ember-500 text-white text-[11px] font-bold">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-4 mb-5 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-xs text-white/50 mb-1.5">本周处理量</div>
          <div className="flex items-end gap-2">
            <span className="font-display text-3xl font-bold text-white leading-none">67</span>
            <span className="text-xs text-moss-300 mb-1">↑ 12%</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-4/5 bg-gradient-to-r from-ember-400 to-ember-500 rounded-full" />
          </div>
        </div>

        <div className="mx-4 mb-6 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky2-400 to-moss-500 flex items-center justify-center text-xs font-bold">
            管
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">管理员·周老师</div>
            <div className="text-[11px] text-white/50">运营管理组</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 px-8 flex items-center gap-6 sticky top-0 z-20 backdrop-blur-md bg-cream-100/80 border-b border-cream-200">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-ink-400">
              EDU · FEEDBACK SYSTEM
            </div>
            <h1 className="font-display text-xl font-bold text-ink-800 leading-tight">
              {pageTitle}
            </h1>
          </div>

          <div className="flex-1 max-w-md ml-8" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                placeholder="搜索工单编号、学员姓名、课程名…"
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); }}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 border border-ink-100 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:ring-4 focus:ring-moss-500/10 focus:border-moss-300 transition"
              />
              {searchText && (
                <button type="button" onClick={() => { setSearchText(""); setShowResults(false); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-ink-200 hover:bg-ink-300 flex items-center justify-center text-white transition">
                  <X className="w-3 h-3" />
                </button>
              )}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 card shadow-pop z-50 max-h-[360px] overflow-y-auto animate-popIn">
                  <div className="p-3 border-b border-cream-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-500">
                      {searchResults.length > 0 ? `找到 ${searchResults.length} 条结果` : "未找到匹配结果"}
                    </span>
                    {searchResults.length > 0 && (
                      <button type="button" onClick={goToTicketList}
                        className="text-xs font-medium text-moss-600 hover:text-moss-700 transition">
                        在列表中查看全部 →
                      </button>
                    )}
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center">
                      <Inbox className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                      <p className="text-sm text-ink-400">试试其他关键词</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {searchResults.slice(0, 8).map((fb) => {
                        const ti = feedbackTypeMap[fb.type], si = statusMap[fb.status];
                        return (
                          <button key={fb.id} type="button" onClick={() => goToResult(fb.id)}
                            className="w-full text-left px-4 py-3 hover:bg-moss-50/60 transition-colors flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-cream-200 text-ink-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
                              {fb.studentAvatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono text-xs font-semibold text-moss-700">{fb.ticketNo}</span>
                                <span className={cn("chip !py-0 !text-[10px]", ti.color, "border")}>{ti.label}</span>
                                <span className={si.color}>{si.label}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-ink-500">
                                <span>{fb.studentName}</span>
                                <span className="text-ink-300">·</span>
                                <span className="truncate max-w-[180px]">{fb.courseName}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-moss-600 transition shrink-0" />
                          </button>
                        );
                      })}
                      {searchResults.length > 8 && (
                        <button type="button" onClick={goToTicketList}
                          className="w-full text-center py-2.5 text-xs font-medium text-moss-600 hover:text-moss-700 hover:bg-moss-50/40 transition">
                          还有 {searchResults.length - 8} 条结果，在列表中查看 →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative h-10 w-10 rounded-xl bg-white border border-cream-200 flex items-center justify-center text-ink-500 hover:text-moss-600 hover:border-moss-200 transition shadow-sm">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-ember-500 ring-2 ring-cream-100" />
            </button>
            <div className="h-10 px-4 rounded-xl bg-gradient-to-br from-moss-600 to-moss-700 text-white text-sm font-medium flex items-center gap-2 shadow-card hover:shadow-pop transition-all hover:-translate-y-0.5 cursor-pointer">
              <MessageSquarePlus className="h-4 w-4" />
              <Link to="/submit">新建反馈</Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-8 py-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
