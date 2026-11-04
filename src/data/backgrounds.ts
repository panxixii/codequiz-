/** 页面氛围背景：仅保留图三 */
// 带上 Vite base，部署到子路径时也能取到 public 资源
export const PAGE_BACKGROUND = `${import.meta.env.BASE_URL}art/bg/03.jpg`

export function pickRandomBackground(): string {
  return PAGE_BACKGROUND
}
