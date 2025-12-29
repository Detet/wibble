import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData, Player } from './types'
import { roomManager } from './roomManager'
import { randomLetter } from '../utils/board'

const app = express()
const httpServer = createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Set player name
  socket.on('setPlayerName', (name) => {
    socket.data.playerId = socket.id
    socket.data.playerName = name
    console.log(`Player ${socket.id} set name to: ${name}`)
  })

  // Get room list
  socket.on('getRoomList', () => {
    socket.emit('roomList', roomManager.getRoomList())
  })

  // Create room
  socket.on('createRoom', (roomName) => {
    if (!socket.data.playerName) {
      socket.emit('error', 'Please set your name first')
      return
    }

    const room = roomManager.createRoom(roomName)
    const player: Player = {
      id: socket.id,
      name: socket.data.playerName,
      score: 0,
      gems: 3,
      isReady: false
    }

    roomManager.addPlayerToRoom(room.id, player)
    socket.data.roomId = room.id
    socket.join(room.id)

    const players = Array.from(room.players.values())
    socket.emit('roomJoined', { id: room.id, name: room.name, players })
    io.emit('roomList', roomManager.getRoomList())

    console.log(`Player ${socket.data.playerName} created room ${room.name}`)
  })

  // Join room
  socket.on('joinRoom', (roomId) => {
    if (!socket.data.playerName) {
      socket.emit('error', 'Please set your name first')
      return
    }

    const room = roomManager.getRoom(roomId)
    if (!room) {
      socket.emit('error', 'Room not found')
      return
    }

    const player: Player = {
      id: socket.id,
      name: socket.data.playerName,
      score: 0,
      gems: 3,
      isReady: false
    }

    const success = roomManager.addPlayerToRoom(roomId, player)
    if (!success) {
      socket.emit('error', 'Cannot join room (full or game in progress)')
      return
    }

    socket.data.roomId = roomId
    socket.join(roomId)

    const players = Array.from(room.players.values())
    socket.emit('roomJoined', { id: room.id, name: room.name, players })
    socket.to(roomId).emit('playerJoined', player)
    socket.to(roomId).emit('roomUpdated', { id: room.id, name: room.name, players })
    io.emit('roomList', roomManager.getRoomList())

    console.log(`Player ${socket.data.playerName} joined room ${room.name}`)
  })

  // Leave room
  socket.on('leaveRoom', () => {
    handlePlayerLeave(socket)
  })

  // Toggle ready
  socket.on('toggleReady', () => {
    const roomId = socket.data.roomId
    if (!roomId) return

    const room = roomManager.getRoom(roomId)
    if (!room) return

    const isReady = roomManager.togglePlayerReady(roomId, socket.id)
    const players = Array.from(room.players.values())

    io.to(roomId).emit('roomUpdated', { id: room.id, name: room.name, players })
    console.log(`Player ${socket.data.playerName} is ${isReady ? 'ready' : 'not ready'}`)
  })

  // Start game
  socket.on('startGame', () => {
    const roomId = socket.data.roomId
    if (!roomId) return

    const room = roomManager.getRoom(roomId)
    if (!room) return

    if (!roomManager.canStartGame(roomId)) {
      socket.emit('error', 'Not all players are ready or not enough players')
      return
    }

    const gameState = roomManager.startGame(roomId, 90)
    if (!gameState) {
      socket.emit('error', 'Failed to start game')
      return
    }

    io.to(roomId).emit('gameStarted', {
      board: gameState.board,
      duration: gameState.duration,
      startTime: gameState.startTime
    })

    // Set timer to end game
    setTimeout(() => {
      const results = roomManager.endGame(roomId)
      if (results) {
        io.to(roomId).emit('gameEnded', results)
      }
    }, gameState.duration * 1000)

    console.log(`Game started in room ${room.name}`)
  })

  // Submit word
  socket.on('submitWord', () => {
    const roomId = socket.data.roomId
    if (!roomId) return

    const room = roomManager.getRoom(roomId)
    if (!room || !room.gameState) return

    const player = roomManager.getPlayer(roomId, socket.id)
    if (!player) return

    const chain = room.gameState.currentChains.get(socket.id)
    if (!chain || chain.length < 2) return

    // Calculate score
    let wordScore = 0
    const board = room.gameState.board
    for (const [col, row] of chain) {
      wordScore += board[row][col].score
    }

    // Update player score
    player.score += wordScore

    // Award gems based on word length
    if (chain.length >= 5) {
      player.gems += 1
    }

    // Replace used letters
    for (const [col, row] of chain) {
      board[row][col] = randomLetter()
    }

    // Clear chain
    room.gameState.currentChains.delete(socket.id)

    // Update all clients
    const players = Array.from(room.players.values())
    io.to(roomId).emit('gameUpdated', {
      board: room.gameState.board,
      players
    })
  })

  // Use shuffle ability
  socket.on('useShuffle', () => {
    const roomId = socket.data.roomId
    if (!roomId) return

    const room = roomManager.getRoom(roomId)
    const player = roomManager.getPlayer(roomId, socket.id)
    if (!room || !room.gameState || !player) return

    if (player.gems < 1) {
      socket.emit('error', 'Not enough gems')
      return
    }

    // Deduct gem
    player.gems -= 1

    // Shuffle board (keep same letters, randomize positions)
    const flatBoard = room.gameState.board.flat()
    for (let i = flatBoard.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flatBoard[i], flatBoard[j]] = [flatBoard[j], flatBoard[i]]
    }

    // Rebuild 5x5 board
    const newBoard = []
    for (let r = 0; r < 5; r++) {
      newBoard[r] = flatBoard.slice(r * 5, (r + 1) * 5)
    }
    room.gameState.board = newBoard

    // Update all clients
    const players = Array.from(room.players.values())
    io.to(roomId).emit('gameUpdated', {
      board: room.gameState.board,
      players
    })

    console.log(`Player ${socket.data.playerName} used shuffle`)
  })

  // Use replace tile ability
  socket.on('useReplaceTile', (location, newLetter) => {
    const roomId = socket.data.roomId
    if (!roomId) return

    const room = roomManager.getRoom(roomId)
    const player = roomManager.getPlayer(roomId, socket.id)
    if (!room || !room.gameState || !player) return

    if (player.gems < 2) {
      socket.emit('error', 'Not enough gems')
      return
    }

    const [col, row] = location
    if (row < 0 || row >= 5 || col < 0 || col >= 5) {
      socket.emit('error', 'Invalid tile location')
      return
    }

    // Deduct gems
    player.gems -= 2

    // Find the tile with the new letter
    const tiles = require('../utils/board').tiles
    const newTile = tiles.find((t: any) => t.letter === newLetter.toUpperCase())
    if (!newTile) {
      socket.emit('error', 'Invalid letter')
      return
    }

    // Replace tile
    room.gameState.board[row][col] = newTile

    // Update all clients
    const players = Array.from(room.players.values())
    io.to(roomId).emit('gameUpdated', {
      board: room.gameState.board,
      players
    })

    console.log(`Player ${socket.data.playerName} replaced tile at [${col},${row}] with ${newLetter}`)
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    handlePlayerLeave(socket)
  })
})

function handlePlayerLeave(socket: any): void {
  const roomId = socket.data.roomId
  if (!roomId) return

  const room = roomManager.getRoom(roomId)
  if (!room) return

  roomManager.removePlayerFromRoom(roomId, socket.id)
  socket.leave(roomId)
  socket.data.roomId = null

  const players = Array.from(room.players.values())
  if (players.length > 0) {
    socket.to(roomId).emit('playerLeft', socket.id)
    socket.to(roomId).emit('roomUpdated', { id: room.id, name: room.name, players })
  }

  io.emit('roomList', roomManager.getRoomList())
  console.log(`Player ${socket.data.playerName} left room ${room.name}`)
}

const PORT = process.env.SERVER_PORT || 4000

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
