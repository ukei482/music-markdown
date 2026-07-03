export type Block =
  | { id: string; type: 'text';    content: string }
  | { id: string; type: 'heading'; level: 1 | 2 | 3; content: string }
  | { id: string; type: 'score';   data: ScoreData }

export type ScoreData = {
  timeSignature: string
  keySignature:  string
  staves:        Staff[]
}

export type Staff = {
  clef:     'treble' | 'bass' | 'alto'
  measures: Measure[]
}

export type Measure = {
  notes:  Note[]
  chord:  string
  degree: string
}

export type Note = {
  pitch:    string
  duration: number
}
