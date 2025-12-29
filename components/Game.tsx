
import { FC, useContext } from 'react'
import { useActor } from '@xstate/react'

import Tile from '@/components/Tile'
import { GameStateMachineContext } from '@/stores/gameStateMachine'

import styles from './Game.module.scss'

const Game: FC = () => {
  const actor = useContext(GameStateMachineContext)
  const [state] = useActor(actor)

  return (
    <main className={styles.container}>
      <div>
        {state.context.currentWord}
        {
          state.context.currentScore > 0
            ? ` +${state.context.currentScore}`
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
          state.context.board.map((row, rowIndex) => (
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
      {
        state.matches('title')
          ? (
            <button onClick={() => actor.send('START_GAME')}>
              Play
            </button>
            )
          : (
            <div>
              <div>SCORE: {state.context.totalScore}</div>
              <div>GEMS: {state.context.gems} / 10</div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => actor.send('USE_SHUFFLE')}
                  disabled={state.context.gems < 1}
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
                  disabled={state.context.gems < 3}
                >
                  Wildcard (3 💎)
                </button>
              </div>
            </div>
            )
      }
    </main>
  )
}

export default Game
