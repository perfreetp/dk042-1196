import type { Course } from "@/types";

export const courses: Course[] = [
  {
    id: "c001",
    name: "高中数学·函数与导数强化班",
    teacherName: "陈明远",
    className: "2026暑期·数学A班",
    chapters: [
      {
        id: "ch1",
        name: "第一章 函数的基本性质",
        lessons: [
          { id: "l1", name: "1.1 函数的定义域与值域", duration: "45min" },
          { id: "l2", name: "1.2 单调性与奇偶性", duration: "50min" },
          { id: "l3", name: "1.3 周期性与对称性", duration: "48min" },
        ],
      },
      {
        id: "ch2",
        name: "第二章 导数及其应用",
        lessons: [
          { id: "l4", name: "2.1 导数的概念与几何意义", duration: "52min" },
          { id: "l5", name: "2.2 求导法则与复合函数", duration: "55min" },
          { id: "l6", name: "2.3 导数与函数极值", duration: "60min" },
        ],
      },
    ],
  },
  {
    id: "c002",
    name: "高中英语·阅读与写作提升营",
    teacherName: "李思雨",
    className: "2026暑期·英语B班",
    chapters: [
      {
        id: "ch3",
        name: "第一章 深度阅读技巧",
        lessons: [
          { id: "l7", name: "1.1 主旨题解题策略", duration: "42min" },
          { id: "l8", name: "1.2 推断题与态度题", duration: "46min" },
        ],
      },
      {
        id: "ch4",
        name: "第二章 议论文写作",
        lessons: [
          { id: "l9", name: "2.1 段落结构与逻辑链", duration: "50min" },
          { id: "l10", name: "2.2 高级句式与替换词", duration: "48min" },
        ],
      },
    ],
  },
  {
    id: "c003",
    name: "大学计算机·Python 数据分析实战",
    teacherName: "王浩然",
    className: "Python 数据分析 01班",
    chapters: [
      {
        id: "ch5",
        name: "第一章 Pandas 核心操作",
        lessons: [
          { id: "l11", name: "1.1 DataFrame 入门", duration: "40min" },
          { id: "l12", name: "1.2 数据清洗实战", duration: "55min" },
        ],
      },
    ],
  },
  {
    id: "c004",
    name: "初三物理·力学冲刺课程",
    teacherName: "赵文博",
    className: "中考物理冲刺班",
    chapters: [
      {
        id: "ch6",
        name: "第一章 牛顿运动定律",
        lessons: [
          { id: "l13", name: "1.1 牛顿三定律辨析", duration: "45min" },
          { id: "l14", name: "1.2 连接体与临界问题", duration: "58min" },
        ],
      },
    ],
  },
];
