import { useEffect, useRef, useState } from 'react'

interface InlineEditFieldProps {
  value: string
  placeholder?: string
  multiline?: boolean
  className?: string
  disabled?: boolean
  onSave: (next: string) => void
}

export function InlineEditField({
  value,
  placeholder = '点击编辑',
  multiline = false,
  className = '',
  disabled = false,
  onSave,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing) fieldRef.current?.focus()
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      setDraft(value)
      setEditing(false)
      return
    }
    if (trimmed !== value) onSave(trimmed)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (disabled) {
    return <span className={className}>{value}</span>
  }

  if (!editing) {
    return (
      <span
        className={`vocab-inline-editable${className ? ` ${className}` : ''}`}
        role="button"
        tabIndex={0}
        title="点击编辑"
        onClick={(event) => {
          event.stopPropagation()
          setEditing(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            setEditing(true)
          }
        }}
      >
        {value || placeholder}
      </span>
    )
  }

  if (multiline) {
    return (
      <textarea
        ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
        className={`vocab-inline-editor${className ? ` ${className}` : ''}`}
        value={draft}
        rows={3}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            cancel()
          }
        }}
      />
    )
  }

  return (
    <input
      ref={fieldRef as React.RefObject<HTMLInputElement>}
      className={`vocab-inline-editor${className ? ` ${className}` : ''}`}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          cancel()
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        }
      }}
    />
  )
}
