import { FUNCTION_COLORS, MAX_FUNCTIONS } from '../constants'

export interface FunctionInputItem {
  id: string
  expression: string
}

interface FunctionInputListProps {
  items: FunctionInputItem[]
  errors: Record<string, string>
  onChange: (id: string, expression: string) => void
  onRemove: (id: string) => void
  onAdd: () => void
  onClearAll: () => void
  onRandomGenerate: () => void
}

export function FunctionInputList({
  items,
  errors,
  onChange,
  onRemove,
  onAdd,
  onClearAll,
  onRandomGenerate,
}: FunctionInputListProps) {
  return (
    <section className="input-panel">
      <div className="input-panel-header">
        <h2>函数输入</h2>
        <div className="input-panel-actions">
          <button type="button" className="text-button" onClick={onRandomGenerate}>
            随机生成
          </button>
          <button type="button" className="text-button" onClick={onClearAll}>
            清空全部
          </button>
        </div>
      </div>

      <div className="input-list">
        {items.map((item, index) => (
          <div key={item.id} className="input-row">
            <span
              className="color-dot"
              style={{ backgroundColor: FUNCTION_COLORS[index] }}
              aria-hidden="true"
            />
            <label className="input-label" htmlFor={`function-${item.id}`}>
              函数 {index + 1}
            </label>
            <div className="input-field-wrap">
              <input
                id={`function-${item.id}`}
                type="text"
                className={`function-input${errors[item.id] ? ' has-error' : ''}`}
                placeholder={index === 0 ? 'y = 2x + 1' : index === 1 ? 'x^2 - 2x + 1' : '6/x'}
                value={item.expression}
                onChange={(event) => onChange(item.id, event.target.value)}
                spellCheck={false}
              />
              {errors[item.id] && <p className="input-error">{errors[item.id]}</p>}
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => onRemove(item.id)}
              disabled={items.length === 1}
              aria-label={`删除函数 ${index + 1}`}
            >
              删除
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="add-button"
        onClick={onAdd}
        disabled={items.length >= MAX_FUNCTIONS}
      >
        + 添加函数
      </button>

      <p className="input-hint">
        支持写法：y = 2x + 1、x^2 - 3x + 2、6/x、y = -2/x（最多 {MAX_FUNCTIONS} 条）
      </p>
    </section>
  )
}
