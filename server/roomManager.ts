import { Room, Player, GameState } from './types'
import { TileData } from '../types'
import { generateRandomBoard } from '../utils/board'

export class RoomManager {
  private rooms: Map<string, Room> = new Map()

  createRoom(roomName: string): Room {
    const roomId = this.generateRoomId()
    const room: Room = {
      id: roomId,
      name: roomName,
      players: new Map(),
      gameState: null,
      maxPlayers: 8,
      createdAt: Date.now()
    }
    this.rooms.set(roomId, room)
    return room
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  getRoomList(): Array<{ id: string; name: string; playerCount: number; maxPlayers: number }> {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers
    }))
  }

  addPlayerToRoom(roomId: string, player: Player): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false
    if (room.players.size >= room.maxPlayers) return false
    if (room.gameState?.isActive) return false

    room.players.set(player.id, player)
    return true
  }

  removePlayerFromRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false

    const removed = room.players.delete(playerId)

    // Clean up empty rooms
    if (room.players.size === 0) {
      this.rooms.delete(roomId)
    }

    return removed
  }

  getPlayer(roomId: string, playerId: string): Player | undefined {
    const room = this.rooms.get(roomId)
    return room?.players.get(playerId)
  }

  updatePlayerScore(roomId: string, playerId: string, score: number): void {
    const player = this.getPlayer(roomId, playerId)
    if (player) {
      player.score = score
    }
  }

  updatePlayerGems(roomId: string, playerId: string, gems: number): void {
    const player = this.getPlayer(roomId, playerId)
    if (player) {
      player.gems = gems
    }
  }

  togglePlayerReady(roomId: string, playerId: string): boolean {
    const player = this.getPlayer(roomId, playerId)
    if (player) {
      player.isReady = !player.isReady
      return player.isReady
    }
    return false
  }

  canStartGame(roomId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room || room.players.size < 2) return false

    // All players must be ready
    return Array.from(room.players.values()).every(p => p.isReady)
  }

  startGame(roomId: string, duration: number = 90): GameState | null {
    const room = this.rooms.get(roomId)
    if (!room || !this.canStartGame(roomId)) return null

    const gameState: GameState = {
      board: generateRandomBoard(),
      startTime: Date.now(),
      duration,
      isActive: true,
      currentChains: new Map()
    }

    // Reset player scores and ready status
    room.players.forEach(player => {
      player.score = 0
      player.gems = 3 // Start with 3 gems
      player.isReady = false
    })

    room.gameState = gameState
    return gameState
  }

  endGame(roomId: string): { players: Player[]; winner: Player | null } | null {
    const room = this.rooms.get(roomId)
    if (!room || !room.gameState) return null

    room.gameState.isActive = false

    const players = Array.from(room.players.values())
    const winner = players.reduce((prev, current) =>
      (prev.score > current.score) ? prev : current
    , players[0]) || null

    return { players, winner }
  }

  updateBoard(roomId: string, board: TileData[][]): void {
    const room = this.rooms.get(roomId)
    if (room?.gameState) {
      room.gameState.board = board
    }
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }
}

export const roomManager = new RoomManager()
