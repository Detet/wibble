
import { FC, useContext, useEffect } from 'react'
import { useActor } from '@xstate/react'

import Tile from '@/components/Tile'
import { GameStateMachineContext } from '@/stores/gameStateMachine'

import styles from './Game.module.scss'

const Game: FC = () => {
  const actor = useContext(GameStateMachineContext)
  const [state] = useActor(actor)

  // Timer tick every second
  useEffect(() => {
    if (!state.matches('play')) {
      return
    }

    const interval = setInterval(() => {
      actor.send('TIMER_TICK')

      // Auto-end turn when timer reaches 0
      if (state.context.turnTimeRemaining <= 0) {
        actor.send('END_TURN')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [state, actor])

  // Format timer as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const { context } = state
  const isPlaying = state.matches('play')
  const isRoundEnding = state.matches('play.roundEnding')
  const isGameOver = state.matches('gameOver')
  const isTitle = state.matches('title')

  return (
    <main className={styles.container}>
      {isPlaying && !isRoundEnding && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Round {context.currentRound} / {context.config.totalRounds}
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: context.turnTimeRemaining <= 10 ? 'red' : 'black'
          }}>
            {formatTime(context.turnTimeRemaining)}
          </div>
        </div>
      )}
      <div>
        {context.currentWord}
        {
          context.currentScore > 0
            ? ` +${context.currentScore}`
            : null
        }
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          border: '1px solid black',
          padding: '16px',

          position: 'relative'
        }}
        onPointerUp={
          (
            state.matches('play.chaining')
              ? () => {
                  actor.send('STOP_CHAINING')
                }
              : undefined
          )
        }
      >
        {
          context.board.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '16px'
              }}
            >
              {
                row.map((data, colIndex) => (
                  <Tile
                    key={colIndex}
                    location={[colIndex, rowIndex]}
                    {...data}
                  />
                ))
              }
            </div>
          ))
        }
      </div>
      {isTitle && (
        <button onClick={() => actor.send('START_GAME')}>
          Play
        </button>
      )}

      {isRoundEnding && (
        <div style={{ marginTop: '16px' }}>
          <h2>Round {context.currentRound} Complete!</h2>
          <div>Round Score: {context.totalScore}</div>
          <button onClick={() => actor.send('START_NEXT_ROUND')}>
            Next Round
          </button>
        </div>
      )}

      {isGameOver && (
        <div style={{ marginTop: '16px' }}>
          <h1>Game Over!</h1>
          <div>Final Score: {context.totalScore}</div>
          <div>Rounds Played: {context.config.totalRounds}</div>
          <h3>Round Scores:</h3>
          <ul>
            {context.roundScores.map((score, index) => (
              <li key={index}>Round {index + 1}: {score}</li>
            ))}
          </ul>
        </div>
      )}

      {isPlaying && !isRoundEnding && (
        <div>
          <div>SCORE: {context.totalScore}</div>
          <div>GEMS: {context.gems} / 10</div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => actor.send('USE_SHUFFLE')}
              disabled={context.gems < 1}
            >
              Shuffle (1 💎)
            </button>
            <button
              onClick={() => {
                const letter = prompt('Enter letter (A-Z):')
                if (letter && letter.length === 1) {
                  const col = parseInt(prompt('Enter column (0-4):') || '0')
                  const row = parseInt(prompt('Enter row (0-4):') || '0')
                  actor.send({ type: 'USE_WILDCARD', location: [col, row], letter })
                }
              }}
              disabled={context.gems < 3}
            >
              Wildcard (3 💎)
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default Game
