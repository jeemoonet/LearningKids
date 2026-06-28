interface CampLevelDetailHeadingProps {
  backLabel: string
  onBack: () => void
  title: string
  summary: string
  ruleSummary: string
}

/** 训练营关卡页统一顶栏：标题 + 说明（一行）+ 语法说明 */
export function CampLevelDetailHeading({
  backLabel,
  onBack,
  title,
  summary,
  ruleSummary,
}: CampLevelDetailHeadingProps) {
  return (
    <div className="prep-spirit-detail-heading">
      <button type="button" className="prep-spirit-detail-back-link" onClick={onBack}>
        ← {backLabel}
      </button>
      <h1>{title}</h1>
      <p className="prep-spirit-detail-intro">{summary}</p>
      <p className="prep-spirit-detail-rule">{ruleSummary}</p>
    </div>
  )
}
