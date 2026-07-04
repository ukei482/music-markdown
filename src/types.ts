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
  chord:          string
  degree:         string
  timeSignature?: string   // 変化するときだけ設定 例: "4/4" → "3/4"
  keySignature?:  string   // 変化するときだけ設定 例: "C" → "G"
}

export type Note = {
  pitch:    string
  duration: number
}
