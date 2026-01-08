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

export interface PlayerData {
  id: string
  name: string
  gems: number
  totalScore: number
  roundScores: number[]
  isHost: boolean
  isReady: boolean
}

export interface GameData {
  config: GameConfig
  currentRound: number // Current round (1-indexed)
  currentPlayerIndex: number // Which player's turn it is
  turnTimeRemaining: number // Seconds remaining in turn
  board: TileData[][]
  players: PlayerData[] // All players in the game
  currentChain: Array<[number, number]>
  currentWord: string
  currentScore: number
  totalScore: number // Local player's score
  roundScores: number[] // Local player's round scores
  gems: number // Local player's gem count (max 10)
  localPlayerId: string // ID of the local player
  roomCode: string | null // WebRTC room code for multiplayer
  message: string | null // Feedback message (invalid word, etc.)
}

export type WebRTCMessage =
  | { type: 'PLAYER_JOINED', player: PlayerData }
  | { type: 'PLAYER_LEFT', playerId: string }
  | { type: 'GAME_CONFIG', config: GameConfig }
  | { type: 'ROUND_START', round: number, board: TileData[][] }
  | { type: 'TURN_START', playerId: string, playerIndex: number }
  | { type: 'TIMER_UPDATE', timeRemaining: number }
  | { type: 'BOARD_UPDATE', board: TileData[][] }
  | { type: 'WORD_SUBMITTED', playerId: string, word: string, score: number, gemsEarned: number }
  | { type: 'TURN_END', playerId: string, newBoard: TileData[][] }
  | { type: 'POWER_UP_USED', playerId: string, powerUp: 'shuffle' | 'wildcard', newBoard: TileData[][] }
  | { type: 'ROUND_END', scores: Record<string, number> }
  | { type: 'GAME_END', finalScores: Record<string, number> }
  | { type: 'PLAYER_READY', playerId: string, ready: boolean }
