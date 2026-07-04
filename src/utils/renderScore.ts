import { Renderer, Stave, StaveNote, Voice, Formatter, StaveConnector } from 'vexflow'
import type { ScoreData, Staff } from '../types'

// Layout constants
const PAD           = 30   // horizontal padding (brace extends ~15px left of stave x)
const FIRST_EXTRA   = 68   // width for clef + time sig (first system)
const CLEF_EXTRA    = 28   // width for clef only (subsequent systems)
const SYS_TOP       = 35   // Y offset of first stave in a system
const SYS_SPACING   = 105  // vertical distance between system tops (single staff)
const GRAND_OFFSET  = 85   // Y from treble top to bass top
const GRAND_SPACING = 210  // vertical distance between system tops (grand staff)

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
    const notes = measure.notes.map(n =>
      new StaveNote({ keys: [pitchToVex(n.pitch)], duration: durationToVex(n.duration) }),
    )
    const voice = new Voice({ numBeats: beats, beatValue }).setStrict(false)
    voice.addTickables(notes)
    new Formatter().joinVoices([voice]).format([voice], noteWidth)
    voice.draw(ctx, stave)
  } catch (e) {
    console.warn('VexFlow note render error:', e)
  }
}

export function renderScore(container: HTMLDivElement, data: ScoreData) {
  container.innerHTML = ''

  const totalWidth = container.clientWidth || 600
  const usable     = totalWidth - PAD * 2
  const isGrand    = data.staves.length >= 2
  const primary    = data.staves[0]
  if (!primary) return

  // Running time/key signature — carried forward across measures
  let currentTimeSig = primary.measures[0]?.timeSignature ?? '4/4'

  const sysSpacing = isGrand ? GRAND_SPACING : SYS_SPACING
  const systems    = computeSystems(primary, usable)

  const numSystems  = Math.max(systems.length, 1)
  const totalHeight = SYS_TOP + numSystems * sysSpacing + 70

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(totalWidth, totalHeight)
  const ctx = renderer.getContext()

  if (systems.length === 0) {
    const s = new Stave(PAD, SYS_TOP, usable)
    s.addClef(primary.clef).addTimeSignature(currentTimeSig).setContext(ctx).draw()
    if (isGrand && data.staves[1]) {
      const b = new Stave(PAD, SYS_TOP + GRAND_OFFSET, usable)
      b.addClef(data.staves[1].clef).addTimeSignature(currentTimeSig).setContext(ctx).draw()
    }
    return
  }

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
      // Update running signatures if this measure changes them
      const pm = primary.measures[mi]
      if (pm?.timeSignature) currentTimeSig = pm.timeSignature

      const showClef    = li === 0
      const showTimeSig = li === 0 && isFirst
      // Also show when time sig changes mid-score (not at start)
      const sigChanged  = !showTimeSig && !!pm?.timeSignature
      const extra = showClef ? (showTimeSig ? FIRST_EXTRA : CLEF_EXTRA) : 0
      const mw    = measWidths[li] + extra
      const noteW = measWidths[li] - 12

      const treble = new Stave(x, sysY, mw)
      if (showClef)               treble.addClef(primary.clef)
      if (showTimeSig || sigChanged) treble.addTimeSignature(currentTimeSig)
      treble.setContext(ctx)

      let bass: Stave | undefined
      if (isGrand && data.staves[1]) {
        bass = new Stave(x, sysY + GRAND_OFFSET, mw)
        if (showClef)               bass.addClef(data.staves[1].clef)
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

      x += mw
    })
  })
}
