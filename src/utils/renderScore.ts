import { Renderer, Stave, StaveNote, Voice, Formatter, StaveConnector } from 'vexflow'
import type { ScoreData, Staff } from '../types'

// Layout constants
const PAD          = 30   // horizontal padding (brace extends ~15px left of stave x)
const FIRST_EXTRA  = 68   // width for clef + time sig (first system)
const CLEF_EXTRA   = 28   // width for clef only (subsequent systems)
const SYS_TOP      = 35   // Y offset of first stave in a system
const SYS_SPACING  = 105  // vertical distance between system tops (single staff)
const GRAND_OFFSET = 85   // Y from treble top to bass top
const GRAND_SPACING = 210 // vertical distance between system tops (grand staff)

function pitchToVex(pitch: string): string {
  const m = pitch.match(/^([A-G][#b]?)(\d)$/)
  return m ? `${m[1].toLowerCase()}/${m[2]}` : 'b/4'
}

function durationToVex(d: number): string {
  return ({ 1: 'w', 2: 'h', 4: 'q', 8: '8', 16: '16' } as Record<number, string>)[d] ?? 'q'
}

// Heuristic: estimate natural pixel width of a measure from its note durations
function estimateWidth(staff: Staff, mi: number): number {
  const m = staff.measures[mi]
  if (!m || m.notes.length === 0) return 55
  let w = 15
  for (const n of m.notes) w += (4 / n.duration) * 20 + 8
  return Math.max(w, 55)
}

// Group measure indices into systems that fit within `usable` pixels
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
  beats: number,
  beatValue: number,
  noteWidth: number,
) {
  const measure = staff.measures[mi]
  if (!measure || measure.notes.length === 0) return
  try {
    const notes = measure.notes.map(n =>
      new StaveNote({ keys: [pitchToVex(n.pitch)], duration: durationToVex(n.duration) }),
    )
    const voice = new Voice({ numBeats: beats, beatValue: beatValue }).setStrict(false)
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

  const [beats, beatValue] = data.timeSignature.split('/').map(Number)
  const sysSpacing  = isGrand ? GRAND_SPACING : SYS_SPACING
  const systems     = computeSystems(primary, usable)

  // Handle empty score
  const numSystems = Math.max(systems.length, 1)
  const totalHeight = SYS_TOP + numSystems * sysSpacing + 70

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(totalWidth, totalHeight)
  const ctx = renderer.getContext()

  if (systems.length === 0) {
    // Empty: render one stave with clef + time sig only
    const s = new Stave(PAD, SYS_TOP, usable)
    s.addClef(primary.clef).addTimeSignature(data.timeSignature).setContext(ctx).draw()
    if (isGrand && data.staves[1]) {
      const b = new Stave(PAD, SYS_TOP + GRAND_OFFSET, usable)
      b.addClef(data.staves[1].clef).addTimeSignature(data.timeSignature).setContext(ctx).draw()
    }
    return
  }

  systems.forEach((system, sysIdx) => {
    const isFirst = sysIdx === 0
    const isLast  = sysIdx === systems.length - 1
    const sysY    = SYS_TOP + sysIdx * sysSpacing
    const headerW = isFirst ? FIRST_EXTRA : CLEF_EXTRA

    // Calculate natural widths and justify (stretch) for non-last systems
    const natWidths   = system.map(mi => estimateWidth(primary, mi))
    const totalNat    = natWidths.reduce((a, b) => a + b, 0)
    const remaining   = usable - headerW
    const scale       = (!isLast && system.length > 0) ? remaining / totalNat : 1
    const measWidths  = natWidths.map(w => w * scale)

    let x = PAD
    system.forEach((mi, li) => {
      const showClef    = li === 0
      const showTimeSig = li === 0 && isFirst
      const extra = showClef ? (showTimeSig ? FIRST_EXTRA : CLEF_EXTRA) : 0
      const mw    = measWidths[li] + extra
      const noteW = measWidths[li] - 12

      // Build stave objects
      const treble = new Stave(x, sysY, mw)
      if (showClef)    treble.addClef(primary.clef)
      if (showTimeSig) treble.addTimeSignature(data.timeSignature)
      treble.setContext(ctx)

      let bass: Stave | undefined
      if (isGrand && data.staves[1]) {
        bass = new Stave(x, sysY + GRAND_OFFSET, mw)
        if (showClef)    bass.addClef(data.staves[1].clef)
        if (showTimeSig) bass.addTimeSignature(data.timeSignature)
        bass.setContext(ctx)
      }

      // Draw bracket + brace connectors at start of each system
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

      // Draw staves and notes
      treble.draw()
      drawNotes(ctx, treble, primary, mi, beats, beatValue, noteW)

      if (bass && data.staves[1]) {
        bass.draw()
        drawNotes(ctx, bass, data.staves[1], mi, beats, beatValue, noteW)
      }

      x += mw
    })
  })
}
