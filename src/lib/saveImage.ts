/** 将结果图尽量引导到系统「存储/相册」能力：优先系统分享，其次下载，再预览长按 */

export type SaveImageOutcome = 'shared' | 'downloaded' | 'preview' | 'cancelled' | 'failed'

export type SaveImageItem = {
  dataUrl: string
  filename: string
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? 'image/png'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

function isLikelyMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1
}

function canShareFiles(files: File[]): boolean {
  if (typeof navigator.share !== 'function') return false
  if (typeof navigator.canShare !== 'function') return true
  try {
    return navigator.canShare({ files })
  } catch {
    return false
  }
}

function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function toFiles(items: SaveImageItem[]): File[] {
  return items.map((item) => {
    const blob = dataUrlToBlob(item.dataUrl)
    return new File([blob], item.filename, { type: blob.type || 'image/png' })
  })
}

/**
 * 移动端优先走系统分享（可选「存储到照片」）；
 * 桌面走下载；都不可靠时返回 preview，由 UI 展示长按保存。
 */
export async function saveImageToAlbum(
  dataUrl: string,
  filename: string,
): Promise<SaveImageOutcome> {
  return saveImagesToAlbum([{ dataUrl, filename }])
}

/** 一次保存多张结果图 */
export async function saveImagesToAlbum(items: SaveImageItem[]): Promise<SaveImageOutcome> {
  if (items.length === 0) return 'failed'

  try {
    const files = toFiles(items)

    if (canShareFiles(files)) {
      try {
        await navigator.share({
          files,
          title: '我的历史人物测试结果',
          text: '保存名言页、像谁页与结果卡',
        })
        return 'shared'
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'cancelled'
        }
      }
    }

    if (!isLikelyMobile()) {
      for (const item of items) {
        triggerDownload(item.dataUrl, item.filename)
        await new Promise((resolve) => window.setTimeout(resolve, 180))
      }
      return 'downloaded'
    }

    try {
      for (const item of items) {
        triggerDownload(item.dataUrl, item.filename)
        await new Promise((resolve) => window.setTimeout(resolve, 180))
      }
    } catch {
      // ignore and show preview
    }
    return 'preview'
  } catch {
    return 'failed'
  }
}
