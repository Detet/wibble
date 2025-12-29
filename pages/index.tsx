import type { NextPage } from 'next'
import { useState } from 'react'
import Login from '../components/Login'
import Lobby from '../components/Lobby'
import Room from '../components/Room'
import MultiplayerGame from '../components/MultiplayerGame'

type View = 'login' | 'lobby' | 'room' | 'game'

const Home: NextPage = () => {
  const [view, setView] = useState<View>('login')
  const [playerName, setPlayerName] = useState('')
  const [roomId, setRoomId] = useState('')

  const handleLogin = (name: string) => {
    setPlayerName(name)
    setView('lobby')
  }

  const handleEnterRoom = (id: string) => {
    setRoomId(id)
    setView('room')
  }

  const handleLeaveRoom = () => {
    setRoomId('')
    setView('lobby')
  }

  const handleGameStart = () => {
    setView('game')
  }

  const handleGameEnd = () => {
    setView('room')
  }

  return (
    <>
      {view === 'login' && <Login onLogin={handleLogin} />}
      {view === 'lobby' && (
        <Lobby playerName={playerName} onEnterRoom={handleEnterRoom} />
      )}
      {view === 'room' && (
        <Room
          roomId={roomId}
          playerName={playerName}
          onGameStart={handleGameStart}
          onLeave={handleLeaveRoom}
        />
      )}
      {view === 'game' && (
        <MultiplayerGame roomId={roomId} onGameEnd={handleGameEnd} />
      )}
    </>
  )
}

export default Home
