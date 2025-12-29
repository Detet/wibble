import { FC, useState, useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { Player } from '../server/types'
import styles from './Lobby.module.scss'

interface LobbyProps {
  playerName: string
  onEnterRoom: (roomId: string) => void
}

interface RoomInfo {
  id: string
  name: string
  playerCount: number
  maxPlayers: number
}

const Lobby: FC<LobbyProps> = ({ playerName, onEnterRoom }) => {
  const { socket } = useSocket()
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  useEffect(() => {
    if (!socket) return

    // Request room list on mount
    socket.emit('getRoomList')

    // Listen for room list updates
    socket.on('roomList', (roomList) => {
      setRooms(roomList)
    })

    // Listen for successful room join
    socket.on('roomJoined', (room) => {
      onEnterRoom(room.id)
    })

    // Listen for errors
    socket.on('error', (message) => {
      alert(message)
    })

    return () => {
      socket.off('roomList')
      socket.off('roomJoined')
      socket.off('error')
    }
  }, [socket, onEnterRoom])

  const handleCreateRoom = () => {
    if (newRoomName.trim() && socket) {
      socket.emit('createRoom', newRoomName.trim())
      setNewRoomName('')
      setShowCreateRoom(false)
    }
  }

  const handleJoinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('joinRoom', roomId)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.lobby}>
        <div className={styles.header}>
          <h1>Spellcast Lobby</h1>
          <p className={styles.welcome}>Welcome, {playerName}!</p>
        </div>

        <div className={styles.actions}>
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className={styles.createButton}
          >
            {showCreateRoom ? 'Cancel' : '+ Create Room'}
          </button>
        </div>

        {showCreateRoom && (
          <div className={styles.createRoomForm}>
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              maxLength={30}
              className={styles.input}
              autoFocus
            />
            <button onClick={handleCreateRoom} className={styles.button}>
              Create
            </button>
          </div>
        )}

        <div className={styles.roomList}>
          <h2>Available Rooms</h2>
          {rooms.length === 0 ? (
            <p className={styles.noRooms}>No rooms available. Create one!</p>
          ) : (
            <div className={styles.rooms}>
              {rooms.map((room) => (
                <div key={room.id} className={styles.roomCard}>
                  <div className={styles.roomInfo}>
                    <h3>{room.name}</h3>
                    <p className={styles.players}>
                      {room.playerCount}/{room.maxPlayers} players
                    </p>
                    <p className={styles.roomId}>Room: {room.id}</p>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={room.playerCount >= room.maxPlayers}
                    className={styles.joinButton}
                  >
                    {room.playerCount >= room.maxPlayers ? 'Full' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Lobby
