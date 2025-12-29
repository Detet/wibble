import { FC, useState, useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { Player } from '../server/types'
import styles from './Room.module.scss'

interface RoomProps {
  roomId: string
  playerName: string
  onGameStart: () => void
  onLeave: () => void
}

interface RoomData {
  id: string
  name: string
  players: Player[]
}

const Room: FC<RoomProps> = ({ roomId, playerName, onGameStart, onLeave }) => {
  const { socket } = useSocket()
  const [room, setRoom] = useState<RoomData | null>(null)
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)

  useEffect(() => {
    if (!socket) return

    // Listen for room updates
    socket.on('roomJoined', (roomData) => {
      setRoom(roomData)
      const me = roomData.players.find(p => p.id === socket.id)
      setMyPlayer(me || null)
    })

    socket.on('roomUpdated', (roomData) => {
      setRoom(roomData)
      const me = roomData.players.find(p => p.id === socket.id)
      setMyPlayer(me || null)
    })

    socket.on('playerJoined', (player) => {
      // Will be handled by roomUpdated
    })

    socket.on('playerLeft', (playerId) => {
      // Will be handled by roomUpdated
    })

    socket.on('gameStarted', (gameState) => {
      onGameStart()
    })

    socket.on('error', (message) => {
      alert(message)
    })

    return () => {
      socket.off('roomJoined')
      socket.off('roomUpdated')
      socket.off('playerJoined')
      socket.off('playerLeft')
      socket.off('gameStarted')
      socket.off('error')
    }
  }, [socket, onGameStart])

  const handleToggleReady = () => {
    if (socket) {
      socket.emit('toggleReady')
    }
  }

  const handleStartGame = () => {
    if (socket) {
      socket.emit('startGame')
    }
  }

  const handleLeave = () => {
    if (socket) {
      socket.emit('leaveRoom')
      onLeave()
    }
  }

  if (!room) {
    return <div className={styles.loading}>Loading room...</div>
  }

  const allReady = room.players.every(p => p.isReady)
  const canStart = room.players.length >= 2 && allReady

  return (
    <div className={styles.container}>
      <div className={styles.room}>
        <div className={styles.header}>
          <div>
            <h1>{room.name}</h1>
            <p className={styles.roomId}>Room Code: {room.id}</p>
          </div>
          <button onClick={handleLeave} className={styles.leaveButton}>
            Leave Room
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.playerList}>
            <h2>Players ({room.players.length}/8)</h2>
            <div className={styles.players}>
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className={`${styles.playerCard} ${player.isReady ? styles.ready : ''}`}
                >
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>
                      {player.name}
                      {player.id === socket?.id && ' (You)'}
                    </span>
                    <span className={styles.status}>
                      {player.isReady ? '✓ Ready' : 'Not Ready'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleToggleReady}
              className={`${styles.readyButton} ${myPlayer?.isReady ? styles.readyActive : ''}`}
            >
              {myPlayer?.isReady ? 'Not Ready' : 'Ready'}
            </button>

            {canStart && (
              <button onClick={handleStartGame} className={styles.startButton}>
                Start Game
              </button>
            )}

            {!canStart && room.players.length < 2 && (
              <p className={styles.waitMessage}>Waiting for more players...</p>
            )}

            {!canStart && room.players.length >= 2 && !allReady && (
              <p className={styles.waitMessage}>Waiting for all players to be ready...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Room
