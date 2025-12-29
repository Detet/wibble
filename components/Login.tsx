import { FC, useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import styles from './Login.module.scss'

interface LoginProps {
  onLogin: (name: string) => void
}

const Login: FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('')
  const { socket, isConnected } = useSocket()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && socket) {
      socket.emit('setPlayerName', name.trim())
      onLogin(name.trim())
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1>Spellcast</h1>
        <p className={styles.status}>
          {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className={styles.input}
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim() || !isConnected}
            className={styles.button}
          >
            Play as Guest
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
