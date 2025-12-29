export interface TileData {
  letter: string
  score: number
  doubleLetterMultiplier?: boolean // DL - doubles letter score
  tripleLetterMultiplier?: boolean // TL - triples letter score
  doubleWordMultiplier?: boolean // 2x - doubles entire word score (pink frame)
  hasGem?: boolean // Gem tile - awards gem when used
  isFrozen?: boolean // Frozen tile - cannot be used
}

export interface GameData {
  board: TileData[][]
  currentChain: Array<[number, number]>
  currentWord: string
  currentScore: number
  totalScore: number
  gems: number // Player's gem count (max 10)
}
