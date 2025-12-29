import { FC, useState, useEffect, useCallback } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { TileData } from '../types'
import { Player } from '../server/types'
import Tile from './Tile'
import styles from './MultiplayerGame.module.scss'

interface MultiplayerGameProps {
  roomId: string
  onGameEnd: () => void
}

const MultiplayerGame: FC<MultiplayerGameProps> = ({ roomId, onGameEnd }) => {
  const { socket } = useSocket()
  const [board, setBoard] = useState<TileData[][]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [currentChain, setCurrentChain] = useState<Array<[number, number]>>([])
  const [currentWord, setCurrentWord] = useState('')
  const [currentScore, setCurrentScore] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(90)
  const [isChaining, setIsChaining] = useState(false)
  const [showReplaceTile, setShowReplaceTile] = useState(false)
  const [selectedTileForReplace, setSelectedTileForReplace] = useState<[number, number] | null>(null)

  const myPlayer = players.find(p => p.id === socket?.id)

  useEffect(() => {
    if (!socket) return

    socket.on('gameStarted', (gameState) => {
      setBoard(gameState.board)
      setTimeRemaining(gameState.duration)

      // Start countdown
      const startTime = gameState.startTime
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = gameState.duration - elapsed
        if (remaining <= 0) {
          setTimeRemaining(0)
          clearInterval(interval)
        } else {
          setTimeRemaining(remaining)
        }
      }, 100)

      return () => clearInterval(interval)
    })

    socket.on('gameUpdated', (gameState) => {
      setBoard(gameState.board)
      setPlayers(gameState.players)
    })

    socket.on('gameEnded', (results) => {
      const winner = results.winner
      const winnerName = winner ? winner.name : 'Nobody'
      alert(`Game Over! Winner: ${winnerName}`)
      onGameEnd()
    })

    socket.on('error', (message) => {
      alert(message)
    })

    return () => {
      socket.off('gameStarted')
      socket.off('gameUpdated')
      socket.off('gameEnded')
      socket.off('error')
    }
  }, [socket, onGameEnd])

  const addLetter = useCallback((location: [number, number]) => {
    const [col, row] = location

    // Don't allow during replace tile mode
    if (showReplaceTile) {
      setSelectedTileForReplace(location)
      return
    }

    // Check if already in chain
    const alreadySelected = currentChain.find(([c, r]) => c === col && r === row)
    if (alreadySelected) return

    // Check if adjacent to last tile (if chain exists)
    if (currentChain.length > 0) {
      const [lastCol, lastRow] = currentChain[currentChain.length - 1]
      const colDiff = Math.abs(col - lastCol)
      const rowDiff = Math.abs(row - lastRow)
      if (colDiff > 1 || rowDiff > 1) return
    }

    const newChain = [...currentChain, location]
    setCurrentChain(newChain)
    setIsChaining(true)

    // Update word and score
    const word = newChain.map(([c, r]) => board[r][c].letter).join('')
    const score = newChain.reduce((sum, [c, r]) => sum + board[r][c].score, 0)
    setCurrentWord(word)
    setCurrentScore(score)
  }, [currentChain, board, showReplaceTile])

  const removeLetter = useCallback(() => {
    if (currentChain.length === 0) return

    const newChain = currentChain.slice(0, -1)
    setCurrentChain(newChain)

    if (newChain.length === 0) {
      setCurrentWord('')
      setCurrentScore(0)
      setIsChaining(false)
    } else {
      const word = newChain.map(([c, r]) => board[r][c].letter).join('')
      const score = newChain.reduce((sum, [c, r]) => sum + board[r][c].score, 0)
      setCurrentWord(word)
      setCurrentScore(score)
    }
  }, [currentChain, board])

  const submitWord = useCallback(() => {
    if (currentChain.length < 2 || !socket) return

    socket.emit('submitWord')
    setCurrentChain([])
    setCurrentWord('')
    setCurrentScore(0)
    setIsChaining(false)
  }, [currentChain, socket])

  const handleShuffle = () => {
    if (!socket || !myPlayer || myPlayer.gems < 1) {
      alert('Not enough gems!')
      return
    }
    socket.emit('useShuffle')
  }

  const handleReplaceTile = () => {
    if (!myPlayer || myPlayer.gems < 2) {
      alert('Not enough gems!')
      return
    }
    setShowReplaceTile(true)
    setSelectedTileForReplace(null)
  }

  const confirmReplaceTile = (newLetter: string) => {
    if (!socket || !selectedTileForReplace) return

    socket.emit('useReplaceTile', selectedTileForReplace, newLetter)
    setShowReplaceTile(false)
    setSelectedTileForReplace(null)
  }

  const cancelReplaceTile = () => {
    setShowReplaceTile(false)
    setSelectedTileForReplace(null)
  }

  const isTileSelected = (location: [number, number]) => {
    return currentChain.some(([c, r]) => c === location[0] && r === location[1])
  }

  if (board.length === 0) {
    return <div className={styles.loading}>Loading game...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.timer}>
          <div className={styles.timerLabel}>Time</div>
          <div className={styles.timerValue}>{timeRemaining}s</div>
        </div>

        <div className={styles.playerList}>
          <h3>Players</h3>
          {players.map((player) => (
            <div key={player.id} className={styles.playerCard}>
              <div className={styles.playerName}>
                {player.name}
                {player.id === socket?.id && ' (You)'}
              </div>
              <div className={styles.playerStats}>
                <span>Score: {player.score}</span>
                <span>💎 {player.gems}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.abilities}>
          <h3>Abilities</h3>
          <button
            onClick={handleShuffle}
            disabled={!myPlayer || myPlayer.gems < 1}
            className={styles.abilityButton}
          >
            🔀 Shuffle (1 💎)
          </button>
          <button
            onClick={handleReplaceTile}
            disabled={!myPlayer || myPlayer.gems < 2}
            className={styles.abilityButton}
          >
            ✏️ Replace Tile (2 💎)
          </button>
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.currentWord}>
          {currentWord || '\u00A0'}
          {currentScore > 0 && ` +${currentScore}`}
        </div>

        <div
          className={styles.board}
          onPointerUp={submitWord}
        >
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((data, colIndex) => (
                <div
                  key={colIndex}
                  className={`${styles.tileWrapper} ${
                    isTileSelected([colIndex, rowIndex]) ? styles.selected : ''
                  } ${
                    selectedTileForReplace &&
                    selectedTileForReplace[0] === colIndex &&
                    selectedTileForReplace[1] === rowIndex
                      ? styles.selectedForReplace
                      : ''
                  }`}
                  onPointerDown={() => !isChaining && addLetter([colIndex, rowIndex])}
                  onPointerEnter={() => isChaining && addLetter([colIndex, rowIndex])}
                >
                  <Tile location={[colIndex, rowIndex]} {...data} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {showReplaceTile && (
          <div className={styles.replaceModal}>
            <div className={styles.modalContent}>
              <h3>Replace Tile</h3>
              <p>
                {selectedTileForReplace
                  ? 'Choose a letter:'
                  : 'Click a tile to replace'}
              </p>
              {selectedTileForReplace && (
                <div className={styles.letterGrid}>
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                    <button
                      key={letter}
                      onClick={() => confirmReplaceTile(letter)}
                      className={styles.letterButton}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={cancelReplaceTile} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MultiplayerGame
