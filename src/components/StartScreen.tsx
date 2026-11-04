type StartScreenProps = {
  onStart: () => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <section className="scroll-panel cover-panel rise-in">
      <div className="cover-body">
        <p className="cover-ornament" aria-hidden>
          ◆
        </p>
        <h1 className="hero-title">
          你最像哪位
          <br />
          历史人物
        </h1>
        <p className="cover-line" aria-hidden />
        <p className="cover-caption">测一测你的历史镜像</p>
      </div>

      <button type="button" className="primary-btn" onClick={onStart}>
        开始测试
      </button>
    </section>
  )
}
