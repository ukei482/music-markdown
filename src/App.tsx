import { useState } from 'react'
import type { Block } from './types'
import BlockEditor from './components/BlockEditor'
import { toXml } from './utils/toXml'

const initialBlocks: Block[] = [
  { id: '1', type: 'heading', level: 1, content: '第一章' },
  { id: '2', type: 'text', content: '今日は晴れていた。' },
  {
    id: '3', type: 'score', data: {
      staves: [
        {
          clef: 'treble',
          measures: [
            { chord: 'Am', degree: 'Ⅵm', timeSignature: '4/4', keySignature: 'C', notes: [{ pitches: ['C4'], duration: 4 }, { pitches: ['E4'], duration: 4 }, { pitches: ['A4'], duration: 4 }, { pitches: ['E4'], duration: 4 }] },
            { chord: 'F',  degree: 'Ⅳ',  notes: [{ pitches: ['F4'], duration: 4 }, { pitches: ['A4'], duration: 4 }, { pitches: ['C5'], duration: 4 }, { pitches: ['A4'], duration: 4 }] },
            { chord: 'C',  degree: 'Ⅰ',  notes: [{ pitches: ['C4'], duration: 4 }, { pitches: ['E4'], duration: 4 }, { pitches: ['G4'], duration: 4 }, { pitches: ['E4'], duration: 4 }] },
            { chord: 'G',  degree: 'Ⅴ',  notes: [{ pitches: ['G3'], duration: 4 }, { pitches: ['B3'], duration: 4 }, { pitches: ['D4'], duration: 4 }, { pitches: ['B3'], duration: 4 }] },
            { chord: 'Am', degree: 'Ⅵm', notes: [{ pitches: ['A3'], duration: 2 }, { pitches: ['C4'], duration: 2 }] },
            { chord: 'F',  degree: 'Ⅳ',  notes: [{ pitches: ['F3'], duration: 2 }, { pitches: ['A3'], duration: 2 }] },
            { chord: 'C',  degree: 'Ⅰ',  notes: [{ pitches: ['C4'], duration: 1 }] },
          ],
        },
        {
          clef: 'bass',
          measures: [
            { chord: 'Am', degree: 'Ⅵm', notes: [{ pitches: ['A3'], duration: 2 }, { pitches: ['E3'], duration: 2 }] },
            { chord: 'F',  degree: 'Ⅳ',  notes: [{ pitches: ['F3'], duration: 2 }, { pitches: ['C3'], duration: 2 }] },
            { chord: 'C',  degree: 'Ⅰ',  notes: [{ pitches: ['C3'], duration: 2 }, { pitches: ['G3'], duration: 2 }] },
            { chord: 'G',  degree: 'Ⅴ',  notes: [{ pitches: ['G3'], duration: 2 }, { pitches: ['D3'], duration: 2 }] },
            { chord: 'Am', degree: 'Ⅵm', notes: [{ pitches: ['A3'], duration: 1 }] },
            { chord: 'F',  degree: 'Ⅳ',  notes: [{ pitches: ['F3'], duration: 1 }] },
            { chord: 'C',  degree: 'Ⅰ',  notes: [{ pitches: ['C3'], duration: 1 }] },
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
