import type { Block } from '../types'

export function toXml(blocks: Block[]): string {
  const inner = blocks.map(blockToXml).join('\n  ')
  return `<document>\n  ${inner}\n</document>`
}

function blockToXml(block: Block): string {
  if (block.type === 'text') {
    return `<block type="text">${esc(block.content)}</block>`
  }
  if (block.type === 'heading') {
    return `<block type="heading" level="${block.level}">${esc(block.content)}</block>`
  }
  const { timeSignature, keySignature, measures } = block.data
  const measuresXml = measures.map(m => {
    const notes = m.notes.map(n => `        <note pitch="${n.pitch}" duration="${n.duration}"/>`).join('\n')
    return `      <measure chord="${m.chord}" degree="${m.degree}">\n${notes}\n      </measure>`
  }).join('\n')
  return `<block type="score" timeSignature="${timeSignature}" keySignature="${keySignature}">\n${measuresXml}\n    </block>`
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
