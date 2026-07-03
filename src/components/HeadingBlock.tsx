type Props = {
  level: 1 | 2 | 3
  content: string
  onChange: (content: string) => void
}

const styles: Record<1 | 2 | 3, string> = {
  1: 'text-2xl font-bold text-gray-900',
  2: 'text-xl font-semibold text-gray-800',
  3: 'text-lg font-medium text-gray-700',
}

export default function HeadingBlock({ level, content, onChange }: Props) {
  return (
    <input
      type="text"
      value={content}
      onChange={e => onChange(e.target.value)}
      placeholder={`見出し ${level}`}
      className={`w-full outline-none bg-transparent placeholder:text-gray-300 py-1 ${styles[level]}`}
    />
  )
}
