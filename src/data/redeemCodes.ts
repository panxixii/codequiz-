/**
 * 本地兑换码表（演示用）。
 * 正式环境请改为云函数核销，勿把有效码写死在前端。
 */
export const REDEEM_CODES = [
  'CODEQUIZ01',
  'CODEQUIZ02',
  'CODEQUIZ03',
  'HISTORY01',
  'MIRROR2026',
] as const

export type RedeemCode = (typeof REDEEM_CODES)[number]
