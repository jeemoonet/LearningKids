interface ModuleHeaderProps {
  title: string
  description: string
  onBack: () => void
}

export function ModuleHeader({ title, description, onBack }: ModuleHeaderProps) {
  return (
    <header className="module-header">
      <button type="button" className="module-back-button" onClick={onBack}>
        ← 返回首页
      </button>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  )
}
