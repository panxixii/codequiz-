import type { TraitVector } from './traits'

export type QuestionOption = {
  id: string
  label: string
  hint?: string
  weights: Partial<TraitVector>
}

export type Question = {
  id: string
  text: string
  options: QuestionOption[]
}

/**
 * 题集策略：
 * - 小红书直觉选择题：题干短、选项短、少解释多画面
 * - 选项累加特质向量，再与历史人物做相似度匹配
 */
export const QUESTIONS: Question[] = [
  {
    id: 'q01',
    text: '难得睡个懒觉，你醒来先做什么？',
    options: [
      {
        id: 'a',
        label: '泡杯咖啡，随手写点灵感',
        weights: { creativity: 3, expression: 1 },
      },
      {
        id: 'b',
        label: '刷刷手机，看看新鲜事',
        weights: { exploration: 3, pragmatism: 1 },
      },
      {
        id: 'c',
        label: '收拾房间，整理生活',
        weights: { discipline: 3, pragmatism: 1 },
      },
      {
        id: 'd',
        label: '约上朋友，一起出门玩',
        weights: { courage: 3, empathy: 1 },
      },
    ],
  },
  {
    id: 'q02',
    text: '突然下雨又没带伞，你会？',
    options: [
      {
        id: 'a',
        label: '淋着雨走，享受此刻',
        weights: { resilience: 3, courage: 1 },
      },
      {
        id: 'b',
        label: '找家咖啡店，看看雨景',
        weights: { aesthetics: 3, wisdom: 1 },
      },
      {
        id: 'c',
        label: '买把伞，继续赶路',
        weights: { pragmatism: 3, discipline: 1 },
      },
      {
        id: 'd',
        label: '拍张雨景，发个朋友圈',
        weights: { expression: 3, creativity: 1 },
      },
    ],
  },
  {
    id: 'q03',
    text: '朋友深夜找你倾诉，你会？',
    options: [
      {
        id: 'a',
        label: '认真倾听，陪他慢慢说',
        weights: { empathy: 3, wisdom: 1 },
      },
      {
        id: 'b',
        label: '讲个故事，逗他开心',
        weights: { expression: 3, empathy: 1 },
      },
      {
        id: 'c',
        label: '帮他分析，理清思路',
        weights: { wisdom: 3, pragmatism: 1 },
      },
      {
        id: 'd',
        label: '约顿夜宵，见面再聊',
        weights: { resilience: 3, empathy: 1 },
      },
    ],
  },
  {
    id: 'q04',
    text: '突然收到一笔意外之财？',
    options: [
      {
        id: 'a',
        label: '买设备，解锁新爱好',
        weights: { creativity: 3, exploration: 1 },
      },
      {
        id: 'b',
        label: '订机票，去远方看看',
        weights: { exploration: 3, courage: 1 },
      },
      {
        id: 'c',
        label: '存起来，为以后做打算',
        weights: { discipline: 3, wisdom: 1 },
      },
      {
        id: 'd',
        label: '请朋友吃饭，买点漂亮东西',
        weights: { aesthetics: 3, empathy: 1 },
      },
    ],
  },
  {
    id: 'q05',
    text: '路过一家漂亮的小店，你会？',
    options: [
      {
        id: 'a',
        label: '被装修吸引，进去拍照',
        weights: { aesthetics: 3, expression: 1 },
      },
      {
        id: 'b',
        label: '和老板聊天，听听故事',
        weights: { wisdom: 3, empathy: 1 },
      },
      {
        id: 'c',
        label: '看看商品，有没有实用好物',
        weights: { pragmatism: 3, discipline: 1 },
      },
      {
        id: 'd',
        label: '没什么目的，就是想逛逛',
        weights: { exploration: 3, resilience: 1 },
      },
    ],
  },
  {
    id: 'q06',
    text: '旅行结束，相册里全是照片，你会？',
    options: [
      {
        id: 'a',
        label: '做成手账，留下美好回忆',
        weights: { creativity: 3, aesthetics: 1 },
      },
      {
        id: 'b',
        label: '一张张翻，重温快乐时光',
        weights: { empathy: 3, resilience: 1 },
      },
      {
        id: 'c',
        label: '分类整理，顺手备份',
        weights: { discipline: 3, pragmatism: 1 },
      },
      {
        id: 'd',
        label: '挑几张发圈，分享快乐',
        weights: { expression: 3, empathy: 1 },
      },
    ],
  },
  {
    id: 'q07',
    text: '计划突然取消，多出半天空闲？',
    options: [
      {
        id: 'a',
        label: '背上包，去陌生街区逛逛',
        weights: { courage: 3, exploration: 1 },
      },
      {
        id: 'b',
        label: '动手创作，试试新点子',
        weights: { creativity: 3, pragmatism: 1 },
      },
      {
        id: 'c',
        label: '泡杯茶，安静看看书',
        weights: { wisdom: 3, aesthetics: 1 },
      },
      {
        id: 'd',
        label: '处理琐事，给下周腾空间',
        weights: { discipline: 3, resilience: 1 },
      },
    ],
  },
  {
    id: 'q08',
    text: '菜单上有道从没吃过的菜，你会？',
    options: [
      {
        id: 'a',
        label: '直接点，尝尝新鲜味道',
        weights: { courage: 3, exploration: 1 },
      },
      {
        id: 'b',
        label: '先看摆盘，颜值很重要',
        weights: { aesthetics: 3, expression: 1 },
      },
      {
        id: 'c',
        label: '问问大家，照顾所有人口味',
        weights: { empathy: 3, resilience: 1 },
      },
      {
        id: 'd',
        label: '研究做法，回家自己复刻',
        weights: { pragmatism: 3, creativity: 1 },
      },
    ],
  },
  {
    id: 'q09',
    text: '如果一天不用回消息，你想做什么？',
    options: [
      {
        id: 'a',
        label: '关掉通知，沉浸自己的爱好',
        weights: { resilience: 3, creativity: 1 },
      },
      {
        id: 'b',
        label: '一个人出发，随便走走看看',
        weights: { exploration: 3, courage: 1 },
      },
      {
        id: 'c',
        label: '找个角落，写下脑海里的想法',
        weights: { expression: 3, wisdom: 1 },
      },
      {
        id: 'd',
        label: '列个清单，完成一直想做的事',
        weights: { discipline: 3, pragmatism: 1 },
      },
    ],
  },
  {
    id: 'q10',
    text: '夜晚散步，路过熟悉的老街，你会？',
    options: [
      {
        id: 'a',
        label: '想起旧友，怀念那些温暖时光',
        weights: { empathy: 3, aesthetics: 1 },
      },
      {
        id: 'b',
        label: '灵感突然出现，赶紧记下来',
        weights: { creativity: 3, expression: 1 },
      },
      {
        id: 'c',
        label: '慢慢回味，想通最近的一些事',
        weights: { wisdom: 3, resilience: 1 },
      },
      {
        id: 'd',
        label: '盘算明天，规划接下来的生活',
        weights: { pragmatism: 3, discipline: 1 },
      },
    ],
  },
]
