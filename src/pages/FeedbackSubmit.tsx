import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Image, Mic, X, CheckCircle2, ChevronRight, BookOpen, FileQuestion, Users, Monitor, Lightbulb, Check } from "lucide-react";
import { courses } from "@/mock/courses";
import { useFeedbackStore } from "@/store/feedbackStore";
import { feedbackTypeMap, satisfactionLabels } from "@/utils/format";
import type { FeedbackType, Satisfaction, Course, Chapter, Lesson, Recording } from "@/types";

const steps = ["选择课程", "选择类型", "满意度描述", "提交"];
const typeIcons: Record<FeedbackType, typeof BookOpen> = { course_content: BookOpen, homework: FileQuestion, teacher_service: Users, platform: Monitor, other: Lightbulb };
const defaultScreenshots = ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=150&fit=crop", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=150&fit=crop"];
const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function FeedbackSubmit() {
  const navigate = useNavigate();
  const submitFeedback = useFeedbackStore((s) => s.submitFeedback);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [satisfaction, setSatisfaction] = useState<Satisfaction>(4);
  const [hoverStar, setHoverStar] = useState(0);
  const [content, setContent] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>(defaultScreenshots);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const checks = [selectedCourse && selectedLesson, feedbackType !== null, satisfaction && content.length >= 200, true];
    const idx = checks.findIndex((x) => !x);
    setCurrentStep(idx !== -1 ? Math.min(idx, 3) : 3);
  }, [selectedCourse, selectedLesson, feedbackType, satisfaction, content]);

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordTime > 0) setRecordings((p) => [...p, { url: `mock://${Date.now()}`, duration: recordTime, name: `录音-${p.length + 1}.mp3` }]);
      setRecordTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  const removeShot = (u: string) => setScreenshots((p) => p.filter((s) => s !== u));
  const addShot = () => {
    if (screenshots.length >= 5) return;
    const urls = ["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=150&fit=crop", "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=200&h=150&fit=crop"];
    setScreenshots((p) => [...p, urls[Math.floor(Math.random() * urls.length)]]);
  };
  const resetForm = () => {
    setSelectedCourse(null); setSelectedChapter(null); setSelectedLesson(null);
    setFeedbackType(null); setSatisfaction(4); setContent("");
    setScreenshots([]); setRecordings([]); setCurrentStep(0);
  };
  const canSubmit = !!(selectedCourse && selectedLesson && feedbackType && satisfaction > 0 && content.length >= 200);
  const handleSubmit = () => {
    if (!canSubmit || !feedbackType) return;
    const r = submitFeedback({
      courseId: selectedCourse!.id, courseName: selectedCourse!.name, className: selectedCourse!.className, teacherName: selectedCourse!.teacherName,
      chapterId: selectedChapter?.id, chapterName: selectedChapter?.name, lessonId: selectedLesson!.id, lessonName: selectedLesson!.name,
      type: feedbackType, satisfaction, content, screenshots, recordings,
    });
    setTicketNo(r.ticketNo); setShowSuccess(true);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-10 w-96 h-96 rounded-full bg-cream-100/10 blur-3xl" />
        </div>
        <div className="container py-10 relative">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold ring-4 ring-white/15 shadow-pop">LS</div>
            <div className="flex-1">
              <div className="text-sm text-moss-100/90 mb-1">当前学员</div>
              <div className="text-2xl font-display font-bold mb-1">林思语</div>
              <div className="inline-flex items-center gap-1 chip bg-white/15 text-white/90 border-white/20 backdrop-blur"><span className="w-1.5 h-1.5 rounded-full bg-ember-300" />让每一个声音都被听见</div>
            </div>
            <div className="hidden md:block text-right"><div className="text-xs text-moss-100/80 mb-1">今日反馈</div><div className="text-3xl font-display font-bold">02</div></div>
          </div>
          <div className="mt-10 flex items-center justify-between">
            {steps.map((label, idx) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`step-dot ${idx < currentStep ? "bg-white text-moss-700 shadow-pop" : idx === currentStep ? "bg-ember-400 text-white scale-110 shadow-ember ring-4 ring-ember-300/40 animate-popIn" : "bg-white/15 text-moss-100/70 border border-white/20"}`}>
                    {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className={`text-xs mt-2 font-medium transition-colors ${idx <= currentStep ? "text-white" : "text-moss-100/60"}`}>{label}</div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-2 mt-[-24px]"><div className={`h-0.5 rounded-full transition-all duration-500 ${idx < currentStep ? "bg-white" : "bg-white/15"}`} /></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mt-8 space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div><div className="field-label mb-0">1. 选择相关课程章节</div><div className="text-xs text-ink-400">请选择您要反馈的课程、章节和具体课时</div></div>
            {selectedCourse && selectedLesson && <div className="chip bg-moss-50 text-moss-700 border border-moss-200"><CheckCircle2 className="w-3.5 h-3.5" />已选择</div>}
          </div>
          <div className="grid gap-4">
            {courses.map((c) => {
              const sel = selectedCourse?.id === c.id;
              return (
                <div key={c.id} className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${sel ? "border-moss-400 shadow-pop bg-moss-50/30" : "border-cream-200 hover:border-moss-200 hover:shadow-card bg-white"}`}>
                  <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => { setSelectedCourse(sel ? null : c); setSelectedChapter(null); setSelectedLesson(null); }}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition ${sel ? "bg-moss-600 text-white" : "bg-cream-100 text-moss-600"}`}><BookOpen className="w-6 h-6" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-800 truncate">{c.name}</div>
                      <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2 flex-wrap"><span>{c.className}</span><span className="w-1 h-1 rounded-full bg-ink-300" /><span>{c.teacherName} 老师</span><span className="w-1 h-1 rounded-full bg-ink-300" /><span>{c.chapters.length} 章</span></div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-ink-400 transition-transform duration-300 flex-shrink-0 ${sel ? "rotate-90 text-moss-600" : ""}`} />
                  </div>
                  {sel && (
                    <div className="border-t border-cream-200 bg-cream-50/50 px-4 py-4 space-y-4 animate-popIn">
                      {c.chapters.map((ch) => {
                        const chSel = selectedChapter?.id === ch.id;
                        return (
                          <div key={ch.id}>
                            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${chSel ? "bg-moss-100 text-moss-800 font-medium" : "hover:bg-white text-ink-600"}`}
                              onClick={() => { setSelectedChapter(chSel ? null : ch); setSelectedLesson(null); }}>
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0 ${chSel ? "bg-moss-600 text-white" : "bg-ink-100 text-ink-500"}`}>{chSel ? <Check className="w-3 h-3" /> : "§"}</span>
                              <span className="text-sm flex-1 truncate">{ch.name}</span><span className="text-xs text-ink-400">{ch.lessons.length}课时</span>
                            </div>
                            {chSel && (
                              <div className="mt-2 ml-7 space-y-1.5 animate-popIn">
                                {ch.lessons.map((l) => {
                                  const lSel = selectedLesson?.id === l.id;
                                  return (
                                    <div key={l.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${lSel ? "bg-ember-500 text-white shadow-ember" : "bg-white hover:bg-ember-50 text-ink-600 border border-cream-200"}`}
                                      onClick={() => setSelectedLesson(l)}>
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${lSel ? "border-white" : "border-ink-300"}`}>{lSel && <div className="w-2 h-2 rounded-full bg-white" />}</div>
                                      <span className="flex-1 truncate">{l.name}</span>
                                      {l.duration && <span className={`text-xs ${lSel ? "text-white/80" : "text-ink-400"}`}>{l.duration}</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4"><div><div className="field-label mb-0">2. 选择反馈类型</div><div className="text-xs text-ink-400">让我们更快地将问题转给对应的处理团队</div></div></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(feedbackTypeMap) as FeedbackType[]).map((t) => {
              const cfg = feedbackTypeMap[t], Icon = typeIcons[t], sel = feedbackType === t;
              return (
                <button key={t} type="button" onClick={() => setFeedbackType(t)}
                  className={`group relative rounded-2xl p-5 text-left transition-all duration-300 border-2 ${sel ? "border-moss-500 bg-moss-50 shadow-pop -translate-y-1" : "border-cream-200 bg-white hover:border-moss-300 hover:shadow-card hover:-translate-y-0.5"}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${sel ? "bg-moss-600 text-white scale-110" : "bg-cream-100 text-ink-500 group-hover:bg-moss-100 group-hover:text-moss-700 group-hover:scale-105"}`}><Icon className="w-6 h-6" /></div>
                  <div className={`font-semibold text-sm mb-0.5 ${sel ? "text-moss-800" : "text-ink-700"}`}>{cfg.label}</div>
                  <div className="text-lg">{cfg.emoji}</div>
                  {sel && <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-moss-500 text-white flex items-center justify-center shadow-card animate-popIn"><Check className="w-4 h-4" /></div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-6"><div className="field-label mb-1">3. 满意度评分</div><div className="text-xs text-ink-400">请为本次体验打分</div></div>
          <div className="flex flex-col items-center py-4 bg-cream-50/60 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (hoverStar || satisfaction) >= n;
                return (
                  <button key={n} type="button" onClick={() => setSatisfaction(n as Satisfaction)} onMouseEnter={() => setHoverStar(n)} onMouseLeave={() => setHoverStar(0)} className="transition-all duration-200 hover:scale-125 active:scale-95">
                    <Star className={`w-12 h-12 transition-all duration-200 ${active ? "text-ember-500 fill-ember-400 drop-shadow-[0_2px_8px_rgba(255,138,61,0.35)]" : "text-ink-200"}`} />
                  </button>
                );
              })}
            </div>
            <div className={`font-display text-2xl font-bold mb-1 transition-colors duration-300 ${satisfaction >= 4 ? "text-moss-600" : satisfaction === 3 ? "text-amber-500" : "text-ember-500"}`}>
              {satisfactionLabels[(hoverStar as Satisfaction) || satisfaction]}
            </div>
            <div className="text-xs text-ink-400">{hoverStar || satisfaction} / 5 星</div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="field-label mb-0">详细描述</label>
              <span className={`text-xs font-medium ${content.length >= 1000 ? "text-ember-500" : content.length >= 200 ? "text-moss-600" : "text-ink-400"}`}>
                {content.length} / 1000 字 {content.length < 200 && `（还需 ${200 - content.length} 字）`}
              </span>
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, 1000))}
              placeholder="请详细描述您遇到的问题或建议（不少于200字），包括问题发生的场景、具体表现、您的期望等..."
              className="field-input min-h-[140px] resize-none" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4"><div><div className="field-label mb-0">4. 上传凭证（可选）</div><div className="text-xs text-ink-400">支持截图或录音，帮助我们更准确地定位问题</div></div></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-ink-600 mb-2.5 flex items-center gap-2"><Image className="w-4 h-4" />截图上传</div>
              <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); addShot(); }} onClick={addShot}
                className={`relative border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-all ${isDragOver ? "border-moss-500 bg-moss-50" : screenshots.length >= 5 ? "border-ink-200 bg-ink-50 opacity-60 cursor-not-allowed" : "border-ink-200 hover:border-moss-400 hover:bg-moss-50/30"}`}>
                {screenshots.length === 0 ? (
                  <div className="text-center py-8"><div className="w-12 h-12 mx-auto rounded-xl bg-cream-100 flex items-center justify-center mb-3"><Image className="w-6 h-6 text-moss-500" /></div>
                    <div className="text-sm text-ink-600 font-medium">拖拽图片到此处</div><div className="text-xs text-ink-400 mt-1">或点击选择上传，最多 5 张</div></div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    {screenshots.map((u, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden group shadow-card">
                        <img src={u} alt={`截图-${i + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeShot(u); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink-900/70 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {screenshots.length < 5 && (
                      <div className="aspect-video rounded-lg border-2 border-dashed border-ink-200 flex items-center justify-center bg-white/60 hover:border-moss-400 hover:bg-moss-50/30 transition">
                        <div className="text-center"><Image className="w-5 h-5 mx-auto text-ink-400 mb-1" /><div className="text-xs text-ink-400">添加</div></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-ink-600 mb-2.5 flex items-center gap-2"><Mic className="w-4 h-4" />语音描述</div>
              <div className="rounded-2xl border-2 border-cream-200 bg-cream-50/50 p-4">
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setRecording((r) => !r)}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${recording ? "bg-ember-500 text-white shadow-ember animate-pulse" : "bg-white text-ink-600 shadow-card hover:shadow-pop hover:-translate-y-0.5 hover:text-moss-700 border border-cream-200"}`}>
                    {recording ? <div className="w-5 h-5 rounded-sm bg-white" /> : <Mic className="w-7 h-7" />}
                    {recording && <><span className="absolute inset-0 rounded-full bg-ember-500/30 animate-ping" /><span className="absolute inset-[-6px] rounded-full border-2 border-ember-300" /></>}
                  </button>
                  <div className="flex-1 min-w-0">
                    {recording ? (
                      <><div className="flex items-center gap-3 mb-1.5">
                        <div className="flex items-end gap-1 h-8">{[...Array(5)].map((_, i) => (<div key={i} className="w-1.5 bg-ember-400 rounded-full animate-pulse" style={{ height: `${20 + ((i + (recordTime % 5)) % 5) * 10}%`, animationDelay: `${i * 0.1}s` }} />))}</div>
                        <div className="font-mono text-xl font-bold text-ember-600 tabular-nums">{fmtTime(recordTime)}</div>
                      </div><div className="text-xs text-ember-600 font-medium">正在录音... 再次点击停止</div></>
                    ) : (
                      <><div className="font-medium text-ink-700 mb-1">点击开始录音</div><div className="text-xs text-ink-400">{recordings.length > 0 ? `已录制 ${recordings.length} 条语音` : "用语音快速描述问题，节省打字时间"}</div></>
                    )}
                  </div>
                </div>
                {recordings.length > 0 && !recording && (
                  <div className="mt-4 space-y-2 pt-4 border-t border-cream-200">
                    {recordings.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-cream-200">
                        <div className="w-9 h-9 rounded-lg bg-moss-100 text-moss-600 flex items-center justify-center flex-shrink-0"><Mic className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0"><div className="text-sm font-medium text-ink-700 truncate">{r.name}</div><div className="text-xs text-ink-400">时长 {fmtTime(r.duration)}</div></div>
                        <button type="button" onClick={() => setRecordings((p) => p.filter((_, j) => j !== i))} className="w-7 h-7 rounded-lg text-ink-400 hover:bg-ember-50 hover:text-ember-500 flex items-center justify-center"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-6 z-20">
          <div className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              {!canSubmit ? (
                <div className="text-xs text-ink-500">还需要完成以下内容：<span className="ml-2 space-x-2">
                  {!selectedCourse && <span className="chip bg-ink-100 text-ink-600">选择课程</span>}
                  {selectedCourse && !selectedLesson && <span className="chip bg-ink-100 text-ink-600">选择课时</span>}
                  {!feedbackType && <span className="chip bg-ink-100 text-ink-600">选择类型</span>}
                  {content.length < 200 && <span className="chip bg-ink-100 text-ink-600">描述（{content.length}/200）</span>}
                </span></div>
              ) : (<div className="flex items-center gap-2 text-sm text-moss-700 font-medium"><CheckCircle2 className="w-5 h-5" />所有必填项已完成，可以提交反馈</div>)}
            </div>
            <button type="button" onClick={() => navigate(-1)} className="btn-ghost">取消</button>
            <button type="button" onClick={handleSubmit} disabled={!canSubmit} className="btn-ember px-6"><CheckCircle2 className="w-4 h-4" />提交反馈</button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-8 text-center animate-popIn">
            <div className="w-20 h-20 mx-auto rounded-full bg-moss-100 flex items-center justify-center mb-5"><CheckCircle2 className="w-12 h-12 text-moss-600" /></div>
            <div className="font-display text-2xl font-bold text-ink-800 mb-1.5">提交成功！</div>
            <div className="text-sm text-ink-500 mb-6">您的反馈工单已创建，我们将尽快处理并回复</div>
            <div className="rounded-xl bg-cream-50 border border-cream-200 p-4 mb-6"><div className="text-xs text-ink-400 mb-1">工单编号</div><div className="font-mono text-lg font-bold text-moss-700 tracking-wide">{ticketNo}</div></div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => { setShowSuccess(false); navigate("/tickets"); }} className="btn-ghost">查看工单列表</button>
              <button type="button" onClick={() => { setShowSuccess(false); resetForm(); }} className="btn-primary">继续提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
