type SaveImageSheetProps = {
  images: { url: string; label: string }[]
  onClose: () => void
  onRetryShare: () => void
}

/** 移动端保存兜底：预览图 + 长按存相册说明 */
export function SaveImageSheet({ images, onClose, onRetryShare }: SaveImageSheetProps) {
  return (
    <div className="sheet-mask" role="dialog" aria-modal="true" aria-label="保存结果图">
      <div className="sheet-panel rise-in">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-[#1f170f]">保存到相册</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#5a4a36]">
              共 {images.length} 张。若未自动保存，请<strong>长按下方图片</strong>，选择「存储图像 /
              保存到照片」。
            </p>
          </div>
          <button
            type="button"
            className="ghost-btn"
            style={{ minHeight: '2.4rem', padding: '0.4rem 0.75rem' }}
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <div className="save-preview-list">
          {images.map((image) => (
            <div key={image.label} className="save-preview-item">
              <p className="save-preview-label">{image.label}</p>
              <div className="save-preview-wrap">
                <img src={image.url} alt={image.label} className="save-preview-img" draggable={false} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button type="button" className="primary-btn" onClick={onRetryShare}>
            再次唤起系统分享
          </button>
          <button type="button" className="ghost-btn" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
