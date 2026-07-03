import { useState } from 'react'
import type { ScoreData } from '../types'

type Props = {
  data: ScoreData
  onEdit?: () => void
}

export default function ScoreBlock({ data, onEdit }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden my-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors"
        >
          <PencilIcon />
          編集
        </button>
        <button
          onClick={() => setSettingsOpen(v => !v)}
          className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors"
        >
          <GearIcon />
          設定
        </button>
        <span className="ml-auto text-xs text-gray-400">
          {data.keySignature} / {data.timeSignature}
        </span>
      </div>

      {/* Settings panel (dummy) */}
      {settingsOpen && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-sm text-amber-800">
          設定パネル（未実装）
        </div>
      )}

      {/* Score canvas placeholder */}
      <div className="px-4 py-6 flex flex-col gap-4">
        {/* Chord / degree row */}
        <div className="flex gap-6">
          {data.measures.map((m, i) => (
            <div key={i} className="flex flex-col items-center text-sm">
              <span className="font-semibold text-gray-800">{m.chord}</span>
              <span className="text-gray-400 text-xs">{m.degree}</span>
            </div>
          ))}
        </div>

        {/* VexFlow will render here */}
        <div className="w-full h-28 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          楽譜レンダリングエリア（VexFlow）
        </div>
      </div>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
