import { useEffect, useRef } from 'react'
import type { Block } from '../types'

type Props = {
  onSelect: (type: Block['type'], level?: 1 | 2 | 3) => void
  onClose: () => void
}

const ITEMS = [
  { label: 'テキスト',  type: 'text'    as const },
  { label: '見出し 1', type: 'heading' as const, level: 1 as const },
  { label: '見出し 2', type: 'heading' as const, level: 2 as const },
  { label: '見出し 3', type: 'heading' as const, level: 3 as const },
  { label: '楽譜',     type: 'score'   as const },
]

export default function AddBlockMenu({ onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-36"
    >
      {ITEMS.map(item => (
        <button
          key={item.label}
          onClick={() => onSelect(item.type, 'level' in item ? item.level : undefined)}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
