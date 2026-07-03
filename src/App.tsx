import { useState } from 'react'
import type { Block } from './types'
import BlockEditor from './components/BlockEditor'
import { toXml } from './utils/toXml'

const initialBlocks: Block[] = [
  { id: '1', type: 'heading', level: 1, content: '第一章' },
  { id: '2', type: 'text', content: '今日は晴れていた。' },
  {
    id: '3', type: 'score', data: {
      timeSignature: '4/4',
      keySignature: 'C',
      staves: [
        {
          clef: 'treble',
          measures: [
            { chord: 'Am', degree: 'Ⅵm', notes: [{ pitch: 'C4', duration: 4 }, { pitch: 'E4', duration: 4 }, { pitch: 'A4', duration: 4 }, { pitch: 'E4', duration: 4 }] },
            { chord: 'F',  degree: 'Ⅳ',  notes: [{ pitch: 'F4', duration: 4 }, { pitch: 'A4', duration: 4 }, { pitch: 'C5', duration: 4 }, { pitch: 'A4', duration: 4 }] },
            { chord: 'C',  degree: 'Ⅰ',  notes: [{ pitch: 'C4', duration: 4 }, { pitch: 'E4', duration: 4 }, { pitch: 'G4', duration: 4 }, { pitch: 'E4', duration: 4 }] },
            { chord: 'G',  degree: 'Ⅴ',  notes: [{ pitch: 'G3', duration: 4 }, { pitch: 'B3', duration: 4 }, { pitch: 'D4', duration: 4 }, { pitch: 'B3', duration: 4 }] },
            { chord: 'Am', degree: 'Ⅵm', notes: [{ pitch: 'A3', duration: 2 }, { pitch: 'C4', duration: 2 }] },
            { chord: 'F',  degree: 'Ⅳ',  notes: [{ pitch: 'F3', duration: 2 }, { pitch: 'A3', duration: 2 }] },
            { chord: 'C',  degree: 'Ⅰ',  notes: [{ pitch: 'C4', duration: 1 }] },
          ],
        },
        {
          clef: 'bass',
          measures: [
            { chord: 'Am', degree: 'Ⅵm', notes: [{ pitch: 'A3', duration: 2 }, { pitch: 'E3', duration: 2 }] },
            { chord: 'F',  degree: 'Ⅳ',  notes: [{ pitch: 'F3', duration: 2 }, { pitch: 'C3', duration: 2 }] },
            { chord: 'C',  degree: 'Ⅰ',  notes: [{ pitch: 'C3', duration: 2 }, { pitch: 'G3', duration: 2 }] },
            { chord: 'G',  degree: 'Ⅴ',  notes: [{ pitch: 'G3', duration: 2 }, { pitch: 'D3', duration: 2 }] },
            { chord: 'Am', degree: 'Ⅵm', notes: [{ pitch: 'A3', duration: 1 }] },
            { chord: 'F',  degree: 'Ⅳ',  notes: [{ pitch: 'F3', duration: 1 }] },
            { chord: 'C',  degree: 'Ⅰ',  notes: [{ pitch: 'C3', duration: 1 }] },
          ],
        },
      ],
    },
  },
  { id: '4', type: 'text', content: 'サビはここから盛り上がる。' },
]

type View = 'edit' | 'source'

export default function App() {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [view, setView] = useState<View>('edit')

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <span className="text-lg font-semibold text-gray-800">music-markdown</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setView('edit')}
            className={`px-4 py-1.5 transition-colors ${view === 'edit' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            編集
          </button>
          <button
            onClick={() => setView('source')}
            className={`px-4 py-1.5 transition-colors ${view === 'source' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            XML
          </button>
        </div>
      </div>

      {view === 'edit' ? (
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      ) : (
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 overflow-x-auto font-mono leading-relaxed">
          {toXml(blocks)}
        </pre>
      )}
    </div>
  )
}
