interface ModuleHeaderProps {
  title: string
  description: string
  onBack: () => void
  backLabel?: string
}

export function ModuleHeader({ title, description, onBack, backLabel = '← 返回首页' }: ModuleHeaderProps) {
  return (
    <header className="module-header">
      <button type="button" className="module-back-button" onClick={onBack}>
        {backLabel}
      </button>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  )
}
