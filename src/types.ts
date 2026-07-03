export type Block =
  | { id: string; type: 'text';    content: string }
  | { id: string; type: 'heading'; level: 1 | 2 | 3; content: string }
  | { id: string; type: 'score';   data: ScoreData }

export type ScoreData = {
  timeSignature: string
  keySignature:  string
  measures:      Measure[]
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
