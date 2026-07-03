import { useEffect, useRef } from 'react'

type Props = {
  content: string
  onChange: (content: string) => void
}

export default function TextBlock({ content, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [content])

  return (
    <textarea
      ref={ref}
      value={content}
      onChange={e => onChange(e.target.value)}
      placeholder="テキストを入力..."
      rows={1}
      className="w-full resize-none outline-none text-gray-700 leading-relaxed placeholder:text-gray-300 bg-transparent py-1 overflow-hidden"
    />
  )
}
