
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
            </div>
            )
      }
    </main>
  )
}

export default Game
