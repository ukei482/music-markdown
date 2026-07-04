import { Renderer, Stave, StaveNote, Voice, Formatter, StaveConnector } from 'vexflow'
import type { ScoreData, Staff } from '../types'

// Layout constants
const PAD           = 30
const FIRST_EXTRA   = 68
const CLEF_EXTRA    = 28
const SYS_TOP       = 35
const SYS_SPACING   = 105
const GRAND_OFFSET  = 85
const GRAND_SPACING = 210

export type RenderCursor = { measureIndex: number; beat: number }

function pitchToVex(pitch: string): string {
  const m = pitch.match(/^([A-G][#b]?)(\d)$/)
  return m ? `${m[1].toLowerCase()}/${m[2]}` : 'b/4'
}

function durationToVex(d: number): string {
  return ({ 1: 'w', 2: 'h', 4: 'q', 8: '8', 16: '16' } as Record<number, string>)[d] ?? 'q'
}

function estimateWidth(staff: Staff, mi: number): number {
  const m = staff.measures[mi]
  if (!m || m.notes.length === 0) return 55
  let w = 15
  for (const n of m.notes) w += (4 / n.duration) * 20 + 8
  return Math.max(w, 55)
}

function computeSystems(primary: Staff, usable: number): number[][] {
  const n = primary.measures.length
  if (n === 0) return []

  const systems: number[][] = []
  let sys: number[] = []
  let used = 0

  for (let i = 0; i < n; i++) {
    const header = sys.length === 0
      ? (systems.length === 0 ? FIRST_EXTRA : CLEF_EXTRA)
      : 0
    const mw = estimateWidth(primary, i)

    if (sys.length > 0 && used + mw > usable) {
      systems.push(sys)
      sys = [i]
      used = CLEF_EXTRA + mw
    } else {
      sys.push(i)
      used += header + mw
    }
  }

  if (sys.length > 0) systems.push(sys)
  return systems
}

function drawNotes(
  ctx: ReturnType<InstanceType<typeof Renderer>['getContext']>,
  stave: Stave,
  staff: Staff,
  mi: number,
  timeSig: string,
  noteWidth: number,
) {
  const measure = staff.measures[mi]
  if (!measure || measure.notes.length === 0) return
  const [beats, beatValue] = timeSig.split('/').map(Number)
  try {
    const notes = measure.notes.map(n => {
      const dur = durationToVex(n.duration)
      if (!n.pitches || n.pitches.length === 0) {
        return new StaveNote({ keys: ['b/4'], duration: `${dur}r` })
      }
      return new StaveNote({ keys: n.pitches.map(pitchToVex), duration: dur })
    })
    const voice = new Voice({ numBeats: beats, beatValue }).setStrict(false)
    voice.addTickables(notes)
    new Formatter().joinVoices([voice]).format([voice], noteWidth)
    voice.draw(ctx, stave)
  } catch (e) {
    console.warn('VexFlow note render error:', e)
  }
}

export function renderScore(
  container: HTMLDivElement,
  data: ScoreData,
  cursor?: RenderCursor,
) {
  container.innerHTML = ''

  const totalWidth = container.clientWidth || 600
  const usable     = totalWidth - PAD * 2
  const isGrand    = data.staves.length >= 2
  const primary    = data.staves[0]
  if (!primary) return

  let currentTimeSig = primary.measures[0]?.timeSignature ?? '4/4'

  const sysSpacing = isGrand ? GRAND_SPACING : SYS_SPACING
  const systems    = computeSystems(primary, usable)

  const numSystems  = Math.max(systems.length, 1)
  const totalHeight = SYS_TOP + numSystems * sysSpacing + 70

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(totalWidth, totalHeight)
  const ctx = renderer.getContext()

  // カーソルSVGRect情報を収集してから最後に描画する
  let cursorRect: { x: number; y: number; w: number; h: number } | null = null

  if (systems.length === 0) {
    const s = new Stave(PAD, SYS_TOP, usable)
    s.addClef(primary.clef).addTimeSignature(currentTimeSig).setContext(ctx).draw()
    if (isGrand && data.staves[1]) {
      const b = new Stave(PAD, SYS_TOP + GRAND_OFFSET, usable)
      b.addClef(data.staves[1].clef).addTimeSignature(currentTimeSig).setContext(ctx).draw()
    }
    if (cursor?.measureIndex === 0) {
      const noteW = usable - FIRST_EXTRA - 12
      const beatsPerMeasure = parseInt(currentTimeSig.split('/')[0]) || 4
      const beatW = noteW / beatsPerMeasure
      cursorRect = {
        x: PAD + FIRST_EXTRA + cursor.beat * beatW,
        y: SYS_TOP - 5,
        w: beatW - 2,
        h: isGrand ? GRAND_OFFSET + 65 : 65,
      }
    }
  } else {
    systems.forEach((system, sysIdx) => {
      const isFirst = sysIdx === 0
      const isLast  = sysIdx === systems.length - 1
      const sysY    = SYS_TOP + sysIdx * sysSpacing
      const headerW = isFirst ? FIRST_EXTRA : CLEF_EXTRA

      const natWidths  = system.map(mi => estimateWidth(primary, mi))
      const totalNat   = natWidths.reduce((a, b) => a + b, 0)
      const remaining  = usable - headerW
      const scale      = (!isLast && system.length > 0) ? remaining / totalNat : 1
      const measWidths = natWidths.map(w => w * scale)

      let x = PAD
      system.forEach((mi, li) => {
        const pm = primary.measures[mi]
        if (pm?.timeSignature) currentTimeSig = pm.timeSignature

        const showClef    = li === 0
        const showTimeSig = li === 0 && isFirst
        const sigChanged  = !showTimeSig && !!pm?.timeSignature
        const extra = showClef ? (showTimeSig ? FIRST_EXTRA : CLEF_EXTRA) : 0
        const mw    = measWidths[li] + extra
        const noteW = measWidths[li] - 12

        const treble = new Stave(x, sysY, mw)
        if (showClef)                  treble.addClef(primary.clef)
        if (showTimeSig || sigChanged) treble.addTimeSignature(currentTimeSig)
        treble.setContext(ctx)

        let bass: Stave | undefined
        if (isGrand && data.staves[1]) {
          bass = new Stave(x, sysY + GRAND_OFFSET, mw)
          if (showClef)                  bass.addClef(data.staves[1].clef)
          if (showTimeSig || sigChanged) bass.addTimeSignature(currentTimeSig)
          bass.setContext(ctx)
        }

        if (showClef && bass) {
          try {
            new StaveConnector(treble, bass)
              .setType(StaveConnector.type.BRACE)
              .setContext(ctx).draw()
            new StaveConnector(treble, bass)
              .setType(StaveConnector.type.SINGLE_LEFT)
              .setContext(ctx).draw()
          } catch (e) {
            console.warn('StaveConnector error:', e)
          }
        }

        treble.draw()
        drawNotes(ctx, treble, primary, mi, currentTimeSig, noteW)

        if (bass && data.staves[1]) {
          bass.draw()
          drawNotes(ctx, bass, data.staves[1], mi, currentTimeSig, noteW)
        }

        // カーソル位置を計算
        if (cursor?.measureIndex === mi) {
          const beatsPerMeasure = parseInt(currentTimeSig.split('/')[0]) || 4
          const beatW = noteW / beatsPerMeasure
          cursorRect = {
            x: x + extra + cursor.beat * beatW,
            y: sysY - 5,
            w: Math.max(beatW - 2, 10),
            h: isGrand ? GRAND_OFFSET + 65 : 65,
          }
        }

        x += mw
      })
    })
  }

  // カーソル矩形をSVGに追加
  if (cursorRect) {
    const svgEl = container.querySelector('svg')
    if (svgEl) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x',      String(cursorRect.x))
      rect.setAttribute('y',      String(cursorRect.y))
      rect.setAttribute('width',  String(cursorRect.w))
      rect.setAttribute('height', String(cursorRect.h))
      rect.setAttribute('fill',   'rgba(59,130,246,0.18)')
      rect.setAttribute('rx',     '4')
      rect.setAttribute('pointer-events', 'none')
      svgEl.appendChild(rect)
    }
  }
}
