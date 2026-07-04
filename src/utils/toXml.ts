import type { Block, Measure } from '../types'

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
  const stavesXml = block.data.staves.map(staff => {
    const measuresXml = staff.measures.map(m => measureToXml(m)).join('\n')
    return `      <staff clef="${staff.clef}">\n${measuresXml}\n      </staff>`
  }).join('\n')
  return `<block type="score">\n${stavesXml}\n    </block>`
}

function measureToXml(m: Measure): string {
  const attrs = [
    m.timeSignature ? ` timeSignature="${m.timeSignature}"` : '',
    m.keySignature  ? ` keySignature="${m.keySignature}"`  : '',
    m.chord  ? ` chord="${m.chord}"`   : '',
    m.degree ? ` degree="${m.degree}"` : '',
  ].join('')
  const notes = m.notes.map(n => {
    const pitchAttr = n.pitches.join(' ')
    return `          <note pitches="${pitchAttr}" duration="${n.duration}"/>`
  }).join('\n')
  return `        <measure${attrs}>\n${notes}\n        </measure>`
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
