import { useMemo, useState } from 'react'
import { FunctionInputList, type FunctionInputItem } from '../../components/FunctionInputList'
import { GraphCanvas } from '../../components/GraphCanvas'
import { ModuleHeader } from '../../components/ModuleHeader'
import { QuizMode } from '../../components/QuizMode'
import { DEBOUNCE_MS, FUNCTION_COLORS } from '../../constants'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { parseExpression } from '../../lib/expression'
import { buildCurves } from '../../lib/graph'
import { generateRandomExpressions } from '../../lib/randomExpression'

interface GraphModuleProps {
  onBack: () => void
}

type GraphTab = 'draw' | 'quiz'

let nextItemId = 0

function createItem(expression = ''): FunctionInputItem {
  nextItemId += 1
  return {
    id: `fn-${nextItemId}`,
    expression,
  }
}

export function GraphModule({ onBack }: GraphModuleProps) {
  const [tab, setTab] = useState<GraphTab>('draw')
  const [items, setItems] = useState<FunctionInputItem[]>([
    createItem('y = 2x + 1'),
    createItem('x^2 - 2x + 1'),
  ])

  const debouncedItems = useDebouncedValue(items, DEBOUNCE_MS)

  const { curves, viewport, errors } = useMemo(() => {
    const nextErrors: Record<string, string> = {}
    const parsedEntries: Array<{
      id: string
      label: string
      color: string
      parsed: Extract<ReturnType<typeof parseExpression>, { ok: true }>
    }> = []

    debouncedItems.forEach((item, index) => {
      const trimmed = item.expression.trim()
      if (!trimmed) return

      const parsed = parseExpression(trimmed)

      if (!parsed.ok) {
        if (parsed.message) {
          nextErrors[item.id] = parsed.message
        }
        return
      }

      parsedEntries.push({
        id: item.id,
        label: trimmed,
        color: FUNCTION_COLORS[index] ?? FUNCTION_COLORS[0],
        parsed,
      })
    })

    const graph = buildCurves(parsedEntries)

    return { curves: graph.curves, viewport: graph.viewport, errors: nextErrors }
  }, [debouncedItems])

  const handleChange = (id: string, expression: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, expression } : item)),
    )
  }

  const handleRemove = (id: string) => {
    setItems((current) => {
      if (current.length === 1) {
        return [createItem('')]
      }

      return current.filter((item) => item.id !== id)
    })
  }

  const handleAdd = () => {
    setItems((current) => {
      if (current.length >= 3) return current
      return [...current, createItem('')]
    })
  }

  const handleClearAll = () => {
    setItems([createItem('')])
  }

  const handleRandomGenerate = () => {
    const count = Math.max(items.length, 1)
    const expressions = generateRandomExpressions(Math.min(count, 3))
    setItems(expressions.map((expression) => createItem(expression)))
  }

  return (
    <div className="module module-graph">
      <ModuleHeader
        title="函数图像"
        description="绘制函数图像，或通过闪卡练习识别抛物线图像与关键点"
        onBack={onBack}
      />

      <div className="graph-tabs-wrap">
        <div className="mode-tabs graph-tabs" role="tablist" aria-label="函数图像模式">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'draw'}
            className={`mode-tab graph-tab${tab === 'draw' ? ' is-active' : ''}`}
            onClick={() => setTab('draw')}
          >
            图像绘制
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'quiz'}
            className={`mode-tab graph-tab${tab === 'quiz' ? ' is-active' : ''}`}
            onClick={() => setTab('quiz')}
          >
            闪卡练习
          </button>
        </div>
      </div>

      {tab === 'draw' && (
        <main className="app-main">
          <FunctionInputList
            items={items}
            errors={errors}
            onChange={handleChange}
            onRemove={handleRemove}
            onAdd={handleAdd}
            onClearAll={handleClearAll}
            onRandomGenerate={handleRandomGenerate}
          />
          <GraphCanvas curves={curves} viewport={viewport} />
        </main>
      )}

      {tab === 'quiz' && (
        <main className="app-main app-main-quiz">
          <QuizMode />
        </main>
      )}
    </div>
  )
}
