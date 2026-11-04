import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { getEchoLine } from '../data/echoLines'
import type { QuizResult } from '../lib/score'
import { saveImagesToAlbum, type SaveImageItem } from '../lib/saveImage'
import { SaveImageSheet } from './SaveImageSheet'

type ResultScreenProps = {
  result: QuizResult
  backgroundUrl: string
  onRetake: () => void
}

type RevealPhase = 'quote-in' | 'quote-out' | 'name-in' | 'name-out' | 'card'

const CHAR_STAGGER_MS = 140
const CHAR_ANIM_MS = 480

/** 标点不显示：按标点断成多列竖排文 */
function splitQuoteColumns(text: string): string[] {
  return text
    .split(/[，。！？；：、…—～·｡,.!?;:\s"'“”‘’《》〈〉【】（）()\[\]{}]+/u)
    .map((part) => part.trim())
    .filter(Boolean)
}

async function waitForImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true })
              img.addEventListener('error', () => resolve(), { once: true })
            }),
    ),
  )
}

async function renderNodePng(node: HTMLElement, backgroundColor: string): Promise<string> {
  await waitForImages(node)
  return toPng(node, {
    cacheBust: true,
    pixelRatio: Math.min(window.devicePixelRatio || 2, 3),
    backgroundColor,
  })
}

export function ResultScreen({ result, backgroundUrl, onRetake }: ResultScreenProps) {
  const cardRef = useRef<HTMLElement>(null)
  const quoteExportRef = useRef<HTMLDivElement>(null)
  const nameExportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [previewImages, setPreviewImages] = useState<{ url: string; label: string }[] | null>(null)
  const [savedItems, setSavedItems] = useState<SaveImageItem[] | null>(null)
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('quote-in')
  const { primary, secondary, matchPercent, encouragement } = result
  const echoLine = getEchoLine(primary.id)
  const quoteColumns = splitQuoteColumns(echoLine)
  const quoteChars = quoteColumns.flatMap((column) => Array.from(column))

  useEffect(() => {
    const quoteHoldMs = 700
    const quoteReadyAt = quoteChars.length * CHAR_STAGGER_MS + CHAR_ANIM_MS + quoteHoldMs
    const quoteOutAt = quoteReadyAt
    const nameInAt = quoteOutAt + 450
    const nameOutAt = nameInAt + 1050
    const cardAt = nameOutAt + 450

    const timers = [
      window.setTimeout(() => setRevealPhase('quote-out'), quoteOutAt),
      window.setTimeout(() => setRevealPhase('name-in'), nameInAt),
      window.setTimeout(() => setRevealPhase('name-out'), nameOutAt),
      window.setTimeout(() => setRevealPhase('card'), cardAt),
    ]
    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [quoteChars.length])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2200)
  }

  async function renderThreeShots(): Promise<SaveImageItem[]> {
    if (!quoteExportRef.current || !nameExportRef.current || !cardRef.current) {
      throw new Error('export nodes missing')
    }

    const [quoteUrl, nameUrl, cardUrl] = await Promise.all([
      renderNodePng(quoteExportRef.current, '#0a0a0a'),
      renderNodePng(nameExportRef.current, '#0a0a0a'),
      renderNodePng(cardRef.current, '#e8d7b5'),
    ])

    return [
      { dataUrl: quoteUrl, filename: `${primary.name}-名言.png` },
      { dataUrl: nameUrl, filename: `${primary.name}-你像谁.png` },
      { dataUrl: cardUrl, filename: `我最像${primary.name}.png` },
    ]
  }

  async function handleSaveToAlbum() {
    if (exporting) return
    setExporting(true)
    try {
      const items = await renderThreeShots()
      setSavedItems(items)
      const outcome = await saveImagesToAlbum(items)
      if (outcome === 'shared') {
        showToast('已打开系统分享，可一次保存三张图')
      } else if (outcome === 'downloaded') {
        showToast('已下载三张结果图')
      } else if (outcome === 'cancelled') {
        showToast('已取消保存')
      } else {
        setPreviewImages([
          { url: items[0].dataUrl, label: '1 · 背景 + 名言' },
          { url: items[1].dataUrl, label: '2 · 背景 + 你像谁' },
          { url: items[2].dataUrl, label: '3 · 结果卡片' },
        ])
        if (outcome === 'failed') {
          showToast('请长按图片保存到相册')
        }
      }
    } catch {
      showToast('生成失败，可先截图保存')
    } finally {
      setExporting(false)
    }
  }

  async function handleRetryShare() {
    if (!savedItems || exporting) return
    setExporting(true)
    try {
      const outcome = await saveImagesToAlbum(savedItems)
      if (outcome === 'shared') {
        showToast('已打开系统分享')
      } else if (outcome === 'cancelled') {
        showToast('已取消')
      } else if (outcome === 'downloaded') {
        showToast('已下载三张结果图')
      }
    } finally {
      setExporting(false)
    }
  }

  async function handleCopyShareLine() {
    const text = `${primary.shareLine} 匹配度 ${matchPercent}%`
    try {
      await navigator.clipboard.writeText(text)
      showToast('分享文案已复制')
    } catch {
      window.prompt('复制下面文案', text)
    }
  }

  const showQuote = revealPhase === 'quote-in' || revealPhase === 'quote-out'
  const showName = revealPhase === 'name-in' || revealPhase === 'name-out'
  const showCard = revealPhase === 'card'

  return (
    <div className="result-stage pb-[env(safe-area-inset-bottom)]">
      {showQuote ? (
        <div
          className={`quote-reveal ${revealPhase === 'quote-out' ? 'is-out' : ''}`}
          aria-live="polite"
          aria-label={echoLine}
        >
          <p className="quote-reveal-mark">昔人有言</p>
          <div className="quote-reveal-columns">
            {quoteColumns.map((column, columnIndex) => {
              const charOffset = quoteColumns
                .slice(0, columnIndex)
                .reduce((sum, part) => sum + Array.from(part).length, 0)
              return (
                <p key={`${column}-${columnIndex}`} className="quote-reveal-vertical">
                  {Array.from(column).map((char, charIndex) => (
                    <span
                      key={`${columnIndex}-${charIndex}-${char}`}
                      className="quote-char"
                      style={{ animationDelay: `${(charOffset + charIndex) * CHAR_STAGGER_MS}ms` }}
                    >
                      {char}
                    </span>
                  ))}
                </p>
              )
            })}
          </div>
        </div>
      ) : null}

      {showName ? (
        <div
          className={`name-reveal ${revealPhase === 'name-out' ? 'is-out' : 'is-in'}`}
          aria-live="polite"
        >
          <p className="name-reveal-kicker">你最像</p>
          <h2 className="name-reveal-title">{primary.name}</h2>
          <p className="name-reveal-sub">{primary.era}</p>
          <span className="name-reveal-seal" aria-hidden>
            悟
          </span>
        </div>
      ) : null}

      {showCard ? (
        <div className="result-card-enter space-y-4">
          <section ref={cardRef} className="scroll-panel result-sheet">
            <div className="result-hero">
              <p className="cover-ornament" aria-hidden>
                ◆
              </p>
              <h2 className="result-hero-name">{primary.name}</h2>
              <p className="cover-line" aria-hidden />
              <p className="result-hero-sub">
                {primary.era} · {primary.title}
              </p>
              <div className="result-match-seal" aria-label={`气质契合 ${matchPercent}%`}>
                <span className="result-match-seal-label">气质契合</span>
                <span className="result-match-percent">{matchPercent}%</span>
              </div>
            </div>

            <p className="result-tagline">{primary.tagline}</p>

            <div className="result-block">
              <div className="result-section-label">
                <span className="cover-ornament" aria-hidden>
                  ◆
                </span>
                <span>闪光点</span>
                <span className="cover-ornament" aria-hidden>
                  ◆
                </span>
              </div>
              <ul className="result-tags">
                {primary.strengths.map((item) => (
                  <li key={item} className="result-tag">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="result-advice">{primary.advice}</p>

            {secondary ? (
              <p className="result-also">
                也很像 {secondary.name}：{secondary.title}
              </p>
            ) : null}

            <div className="result-encourage">
              <p className="result-encourage-kicker">历史人物是镜子</p>
              <p className="result-encourage-text">{encouragement}</p>
            </div>

            <p className="result-foot">CODEQUIZ · 仅供娱乐</p>
          </section>

          <div className="action-dock">
            <button type="button" className="primary-btn" onClick={handleSaveToAlbum} disabled={exporting}>
              {exporting ? '生成三张图…' : '保存到相册'}
            </button>
            <div className="action-grid">
              <button type="button" className="ghost-btn on-dark" onClick={handleCopyShareLine}>
                复制文案
              </button>
              <button type="button" className="ghost-btn on-dark" onClick={onRetake}>
                再测一次
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 离屏导出：背景+名言 / 背景+你像谁 */}
      <div className="export-stage" aria-hidden>
        <div ref={quoteExportRef} className="export-shot">
          <img className="export-shot-bg" src={backgroundUrl} alt="" />
          <div className="export-shot-mask" />
          <div className="export-shot-body">
            <p className="quote-reveal-mark">昔人有言</p>
            <div className="quote-reveal-columns">
              {quoteColumns.map((column, columnIndex) => (
                <p key={`export-q-${columnIndex}`} className="quote-reveal-vertical">
                  {Array.from(column).map((char, charIndex) => (
                    <span key={`export-q-${columnIndex}-${charIndex}`} className="quote-char is-static">
                      {char}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div ref={nameExportRef} className="export-shot">
          <img className="export-shot-bg" src={backgroundUrl} alt="" />
          <div className="export-shot-mask" />
          <div className="export-shot-body">
            <p className="name-reveal-kicker">你最像</p>
            <h2 className="name-reveal-title">{primary.name}</h2>
            <p className="name-reveal-sub">{primary.era}</p>
            <span className="name-reveal-seal">悟</span>
          </div>
        </div>
      </div>

      {toast ? <div className="toast-pill">{toast}</div> : null}

      {previewImages ? (
        <SaveImageSheet
          images={previewImages}
          onClose={() => setPreviewImages(null)}
          onRetryShare={handleRetryShare}
        />
      ) : null}
    </div>
  )
}
