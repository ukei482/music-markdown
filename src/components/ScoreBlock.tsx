import { useState, useEffect, useRef, useCallback } from 'react'
import type { ScoreData, Note } from '../types'
import { renderScore } from '../utils/renderScore'

type Props = {
  data: ScoreData
  onChange?: (data: ScoreData) => void
}

// ---- キーボード → ピッチ変換 ----
// ホームロウ(A行) = C4〜、QWERTYの上段 = 黒鍵
const KEY_NOTE: Record<string, string> = {
  a: 'C', w: 'C#', s: 'D', e: 'D#', d: 'E',
  f: 'F', t: 'F#', g: 'G', y: 'G#', h: 'A', u: 'A#', j: 'B',
  k: 'C', o: 'C#', l: 'D', p: 'D#', ';': 'E',
}
// k行以降は1オクターブ上
const KEY_OCTAVE_OFFSET: Record<string, number> = {
  k: 1, o: 1, l: 1, p: 1, ';': 1,
}

function keyToPitch(key: string, octave: number): string | null {
  const note = KEY_NOTE[key]
  if (!note) return null
  return `${note}${octave + (KEY_OCTAVE_OFFSET[key] ?? 0)}`
}

// ---- ピアノ鍵盤コンポーネント ----
const WHITES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const BLACKS: { note: string; afterIdx: number; keyLabel: string }[] = [
  { note: 'C#', afterIdx: 0, keyLabel: 'W' },
  { note: 'D#', afterIdx: 1, keyLabel: 'E' },
  { note: 'F#', afterIdx: 3, keyLabel: 'T' },
  { note: 'G#', afterIdx: 4, keyLabel: 'Y' },
  { note: 'A#', afterIdx: 5, keyLabel: 'U' },
]
const WHITE_KEY_LABELS: Record<string, string> = { C:'A', D:'S', E:'D', F:'F', G:'G', A:'H', B:'J' }

function PianoKeyboard({ octave, pressed }: { octave: number; pressed: string[] }) {
  const WW = 30   // white key width px
  const WH = 72   // white key height px
  const BW = 20   // black key width px
  const BH = 44   // black key height px
  const totalW = WHITES.length * WW

  return (
    <div className="relative select-none" style={{ width: totalW, height: WH }}>
      {WHITES.map((note, i) => {
        const pitch = `${note}${octave}`
        const isPressed = pressed.includes(pitch)
        return (
          <div
            key={note}
            style={{ position: 'absolute', left: i * WW, width: WW - 1, height: WH }}
            className={`border border-gray-300 rounded-b flex flex-col items-center justify-end pb-1 text-[10px] ${isPressed ? 'bg-blue-100 border-blue-400' : 'bg-white'}`}
          >
            <span className="text-gray-400">{note}</span>
            <span className="font-mono text-gray-500">{WHITE_KEY_LABELS[note]}</span>
          </div>
        )
      })}
      {BLACKS.map(({ note, afterIdx, keyLabel }) => {
        const pitch = `${note}${octave}`
        const isPressed = pressed.includes(pitch)
        const left = (afterIdx + 0.65) * WW - BW / 2
        return (
          <div
            key={note}
            style={{ position: 'absolute', left, width: BW, height: BH, zIndex: 10 }}
            className={`rounded-b flex flex-col items-center justify-end pb-0.5 text-[9px] ${isPressed ? 'bg-blue-500' : 'bg-gray-800'} text-white`}
          >
            <span className="text-gray-300">{note.replace('#', '♯')}</span>
            <span className="font-mono">{keyLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

// ---- ScoreBlock 本体 ----
export default function ScoreBlock({ data, onChange }: Props) {
  const [settingsOpen, setSettingsOpen]     = useState(false)
  const [isEditing,   setIsEditing]         = useState(false)
  const [cursor,      setCursor]            = useState({ measureIndex: 0, beat: 0 })
  const [pending,     setPending]           = useState<string[]>([])
  const [octave,      setOctave]            = useState(4)
  const containerRef = useRef<HTMLDivElement>(null)

  // スコア描画（カーソル付き）
  useEffect(() => {
    if (containerRef.current) {
      renderScore(containerRef.current, data, isEditing ? cursor : undefined)
    }
  }, [data, isEditing, cursor])

  // ---- ステップ入力ロジック ----
  const beatsPerMeasure = useCallback(() => {
    const ts = data.staves[0]?.measures[0]?.timeSignature ?? '4/4'
    return parseInt(ts.split('/')[0]) || 4
  }, [data])

  const moveCursor = useCallback((delta: number) => {
    setCursor(prev => {
      const bpm     = parseInt((data.staves[0]?.measures[0]?.timeSignature ?? '4/4').split('/')[0]) || 4
      const totalM  = data.staves[0]?.measures.length ?? 1
      let newBeat   = prev.beat + delta
      let newM      = prev.measureIndex

      if (newBeat >= bpm) {
        newBeat = 0
        newM++
        if (newM >= totalM) {
          // 最終小節の次 → 新しい小節を追加
          const newData = structuredClone(data)
          newData.staves.forEach(s => s.measures.push({ notes: [] }))
          onChange?.(newData)
          return { measureIndex: newM, beat: 0 }
        }
      } else if (newBeat < 0) {
        newM--
        if (newM < 0) return { measureIndex: 0, beat: 0 }
        newBeat = bpm - 1
      }
      return { measureIndex: newM, beat: newBeat }
    })
    setPending([])
  }, [data, onChange])

  const confirmPending = useCallback(() => {
    const newData = structuredClone(data)
    const measure = newData.staves[0]?.measures[cursor.measureIndex]
    if (measure) {
      while (measure.notes.length <= cursor.beat) {
        measure.notes.push({ pitches: [], duration: 4 })
      }
      const note: Note = { pitches: [...pending], duration: 4 }
      measure.notes[cursor.beat] = note
      onChange?.(newData)
    }
    setPending([])
    moveCursor(1)
  }, [data, cursor, pending, onChange, moveCursor])

  const clearBeat = useCallback(() => {
    if (pending.length > 0) {
      setPending([])
      return
    }
    const newData = structuredClone(data)
    const measure = newData.staves[0]?.measures[cursor.measureIndex]
    if (measure && cursor.beat < measure.notes.length) {
      measure.notes[cursor.beat] = { pitches: [], duration: 4 }
      onChange?.(newData)
    }
  }, [data, cursor, pending, onChange])

  const togglePitch = useCallback((pitch: string) => {
    setPending(prev =>
      prev.includes(pitch) ? prev.filter(p => p !== pitch) : [...prev, pitch]
    )
  }, [])

  // ---- キーボードイベント ----
  useEffect(() => {
    if (!isEditing) return

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          setIsEditing(false)
          setPending([])
          break
        case 'ArrowRight':
          e.preventDefault()
          moveCursor(1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          moveCursor(-1)
          break
        case 'Enter':
          e.preventDefault()
          confirmPending()
          break
        case 'Backspace':
          e.preventDefault()
          clearBeat()
          break
        case 'z':
          e.preventDefault()
          setOctave(o => Math.max(1, o - 1))
          break
        case 'x':
          e.preventDefault()
          setOctave(o => Math.min(8, o + 1))
          break
        default: {
          const pitch = keyToPitch(e.key, octave)
          if (pitch) {
            e.preventDefault()
            togglePitch(pitch)
          }
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isEditing, octave, moveCursor, confirmPending, clearBeat, togglePitch])

  const startEditing = () => {
    setCursor({ measureIndex: 0, beat: 0 })
    setPending([])
    setIsEditing(true)
  }

  const totalMeasures = data.staves[0]?.measures.length ?? 1
  const bpm = beatsPerMeasure()

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden my-3">
      {/* ツールバー */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <button
          onClick={isEditing ? () => { setIsEditing(false); setPending([]) } : startEditing}
          title={isEditing ? '編集終了' : '編集'}
          className={`p-1.5 rounded transition-colors ${isEditing ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`}
        >
          <PencilIcon />
        </button>
        <button
          onClick={() => setSettingsOpen(v => !v)}
          title="設定"
          className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <GearIcon />
        </button>
      </div>

      {settingsOpen && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-sm text-amber-800">
          設定パネル（未実装）
        </div>
      )}

      {/* 楽譜表示 */}
      <div ref={containerRef} className="w-full bg-white" />

      {/* 編集パネル */}
      {isEditing && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 space-y-3">
          {/* ステータスバー */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="font-medium text-blue-600">編集中</span>
              <span className="text-gray-500">
                小節 {cursor.measureIndex + 1} / {totalMeasures}
                拍 {cursor.beat + 1} / {bpm}
              </span>
              <span className="text-gray-400 text-xs">
                オクターブ {octave}
                <span className="font-mono">Z↓ X↑</span>
              </span>
            </div>
            <button
              onClick={() => { setIsEditing(false); setPending([]) }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
            >
              完了 (Esc)
            </button>
          </div>

          {/* 入力中の音 */}
          <div className="flex items-center gap-2 min-h-[24px]">
            <span className="text-xs text-gray-400">入力中:</span>
            {pending.length === 0 ? (
              <span className="text-xs text-gray-300">（なし — Enter で休符）</span>
            ) : (
              <div className="flex gap-1">
                {pending.map(p => (
                  <span key={p} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-mono">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ピアノ鍵盤 */}
          <PianoKeyboard octave={octave} pressed={pending} />

          {/* ショートカットガイド */}
          <div className="text-xs text-gray-400 flex gap-4 flex-wrap">
            <span><kbd className="font-mono bg-white border border-gray-300 px-1 rounded">←→</kbd> 移動</span>
            <span><kbd className="font-mono bg-white border border-gray-300 px-1 rounded">Enter</kbd> 確定・次へ</span>
            <span><kbd className="font-mono bg-white border border-gray-300 px-1 rounded">Backspace</kbd> 消去</span>
            <span><kbd className="font-mono bg-white border border-gray-300 px-1 rounded">Esc</kbd> 終了</span>
          </div>
        </div>
      )}
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
