export type Block =
  | { id: string; type: 'text';    content: string }
  | { id: string; type: 'heading'; level: 1 | 2 | 3; content: string }
  | { id: string; type: 'score';   data: ScoreData }

export type ScoreData = {
  staves: Staff[]
}

export type Staff = {
  clef:     'treble' | 'bass' | 'alto'
  measures: Measure[]
}

export type Measure = {
  notes:          Note[]
  chord?:         string
  degree?:        string
  timeSignature?: string
  keySignature?:  string
}

export type Note = {
  pitches:  string[]  // 空配列 = 休符、複数 = 和音
  duration: number
}
