export interface TileData {
  letter: string
  score: number
  doubleLetterMultiplier?: boolean // DL - doubles letter score
  tripleLetterMultiplier?: boolean // TL - triples letter score
  doubleWordMultiplier?: boolean // 2x - doubles entire word score (pink frame)
  hasGem?: boolean // Gem tile - awards gem when used
  isFrozen?: boolean // Frozen tile - cannot be used
}

export interface GameConfig {
  totalRounds: number // Total rounds in game (e.g., 5, 10, 15)
  turnsPerPlayer: number // Turns each player gets per round
  turnDuration: number // Seconds per turn (30, 60, 120, 180)
}

export interface GameData {
  config: GameConfig
  currentRound: number // Current round (1-indexed)
  turnTimeRemaining: number // Seconds remaining in turn
  board: TileData[][]
  currentChain: Array<[number, number]>
  currentWord: string
  currentScore: number
  totalScore: number
  roundScores: number[] // Scores for each completed round
  gems: number // Player's gem count (max 10)
}
