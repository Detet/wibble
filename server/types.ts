import { TileData } from '../types'

export interface Player {
  id: string
  name: string
  score: number
  gems: number
  isReady: boolean
}

export interface Room {
  id: string
  name: string
  players: Map<string, Player>
  gameState: GameState | null
  maxPlayers: number
  createdAt: number
}

export interface GameState {
  board: TileData[][]
  startTime: number
  duration: number // in seconds
  isActive: boolean
  currentChains: Map<string, Array<[number, number]>> // playerId -> chain
}

export interface ServerToClientEvents {
  roomList: (rooms: Array<{ id: string; name: string; playerCount: number; maxPlayers: number }>) => void
  roomJoined: (room: { id: string; name: string; players: Player[] }) => void
  roomUpdated: (room: { id: string; name: string; players: Player[] }) => void
  playerJoined: (player: Player) => void
  playerLeft: (playerId: string) => void
  gameStarted: (gameState: { board: TileData[][]; duration: number; startTime: number }) => void
  gameUpdated: (gameState: { board: TileData[][]; players: Player[] }) => void
  gameEnded: (results: { players: Player[]; winner: Player | null }) => void
  error: (message: string) => void
}

export interface ClientToServerEvents {
  setPlayerName: (name: string) => void
  getRoomList: () => void
  createRoom: (roomName: string) => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  toggleReady: () => void
  startGame: () => void
  addLetter: (location: [number, number]) => void
  removeLetter: () => void
  submitWord: () => void
  useShuffle: () => void
  useReplaceTile: (location: [number, number], newLetter: string) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  playerId: string
  playerName: string
  roomId: string | null
}
