import { useState } from 'react'
import type { Block, ScoreData } from '../types'
import TextBlock from './TextBlock'
import HeadingBlock from './HeadingBlock'
import ScoreBlock from './ScoreBlock'
import AddBlockMenu from './AddBlockMenu'

type Props = {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
}

const DEFAULT_SCORE: ScoreData = {
  staves: [
    {
      clef: 'treble',
      measures: [
        { chord: 'C', degree: 'Ⅰ', timeSignature: '4/4', keySignature: 'C', notes: [{ pitch: 'C4', duration: 4 }, { pitch: 'E4', duration: 4 }, { pitch: 'G4', duration: 4 }, { pitch: 'E4', duration: 4 }] },
      ],
    },
  ],
}

function createBlock(type: Block['type'], level?: 1 | 2 | 3): Block {
  const id = crypto.randomUUID()
  if (type === 'text') return { id, type: 'text', content: '' }
  if (type === 'heading') return { id, type: 'heading', level: level ?? 2, content: '' }
  return { id, type: 'score', data: structuredClone(DEFAULT_SCORE) }
}

function InsertSlot({ onAdd }: { onAdd: (type: Block['type'], level?: 1 | 2 | 3) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative h-5 group/slot flex items-center my-0.5">
      <div className="absolute inset-x-0 top-1/2 h-px bg-transparent group-hover/slot:bg-blue-200 transition-colors" />
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="w-5 h-5 rounded-full bg-white border border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center transition-all opacity-0 group-hover/slot:opacity-100 text-base leading-none"
        >
          +
        </button>
        {open && (
          <AddBlockMenu
            onSelect={(type, level) => { onAdd(type, level); setOpen(false) }}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default function BlockEditor({ blocks, onChange }: Props) {
  function insertBlock(afterIndex: number, type: Block['type'], level?: 1 | 2 | 3) {
    const newBlock = createBlock(type, level)
    const updated = [...blocks]
    updated.splice(afterIndex + 1, 0, newBlock)
    onChange(updated)
  }

  function patchBlock(id: string, patch: Partial<Block>) {
    onChange(blocks.map(b => b.id === id ? { ...b, ...patch } as Block : b))
  }

  function removeBlock(id: string) {
    onChange(blocks.filter(b => b.id !== id))
  }

  return (
    <div>
      <InsertSlot onAdd={(t, l) => insertBlock(-1, t, l)} />
      {blocks.map((block, i) => (
        <div key={block.id}>
          <div className="group/block relative pl-7">
            <button
              onClick={() => removeBlock(block.id)}
              title="削除"
              className="absolute left-0 top-1.5 opacity-0 group-hover/block:opacity-100 text-gray-300 hover:text-red-400 transition-opacity text-lg leading-none select-none"
            >
              ×
            </button>

            {block.type === 'text' && (
              <TextBlock
                content={block.content}
                onChange={content => patchBlock(block.id, { content })}
              />
            )}
            {block.type === 'heading' && (
              <HeadingBlock
                level={block.level}
                content={block.content}
                onChange={content => patchBlock(block.id, { content })}
              />
            )}
            {block.type === 'score' && (
              <ScoreBlock data={block.data} onEdit={() => {}} />
            )}
          </div>
          <InsertSlot onAdd={(t, l) => insertBlock(i, t, l)} />
        </div>
      ))}
    </div>
  )
}
