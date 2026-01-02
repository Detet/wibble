import { FC, useContext, useCallback } from 'react'
import { useSelector } from '@xstate/react'

import { TileData } from '@/types'
import { GameStateMachineContext } from '@/stores/gameStateMachine'

import style from './Tile.module.scss'

interface TypeProps extends TileData {
  location: [number, number]
}

const Tile: FC<TypeProps> = ({
  letter,
  score,
  location,
  doubleLetterMultiplier,
  tripleLetterMultiplier,
  doubleWordMultiplier,
  hasGem,
  isFrozen
}) => {
  const actor = useContext(GameStateMachineContext)
  const {
    isChaining,
    tailOfChain,
    isSelected,
    isMyTurn
  } = useSelector(actor, (state) => {
    // In solo mode (no multiplayer), it's always the player's turn
    const isSoloMode = state.context.players.length <= 1
    const currentPlayer = state.context.players[state.context.currentPlayerIndex]
    const isLocalPlayerTurn = currentPlayer?.id === state.context.localPlayerId

    return {
      isChaining: state.matches('play.chaining'),
      tailOfChain: state.context.currentChain.slice(-2),
      isSelected: state.context.currentChain.find((l) => l.toString() === location.toString()),
      isMyTurn: isSoloMode || isLocalPlayerTurn
    }
  })

  const addLetter = useCallback(() => {
    // Don't allow interaction if not player's turn
    if (!isMyTurn) {
      return
    }
    actor.send({ type: 'ADD_LETTER', location })
  }, [actor, location, isMyTurn])

  const removeLetter = useCallback(() => {
    // Don't allow interaction if not player's turn
    if (!isMyTurn) {
      return
    }
    if (tailOfChain[0]?.toString() === location.toString()) {
      actor.send('REMOVE_LETTER')
    }
  }, [actor, location, tailOfChain, isMyTurn])

  // Determine tile style based on multipliers
  let tileStyle = style.tile
  if (isSelected != null) {
    tileStyle = style.tileSelected
  } else if (doubleWordMultiplier === true) {
    tileStyle = style.tileDoubleWord
  } else if (tripleLetterMultiplier === true) {
    tileStyle = style.tileTripleLetter
  } else if (doubleLetterMultiplier === true) {
    tileStyle = style.tileDoubleLetter
  }

  return (
    <div
      className={tileStyle}
      {
        ...(
          !isChaining
            ? { onPointerDown: addLetter }
            : (
                { onPointerEnter: ((isSelected != null) ? removeLetter : addLetter) }
              )
        )
      }
    >
      {letter}
      {hasGem === true && <div className={style.tileGem}>💎</div>}
      {doubleLetterMultiplier === true && <div className={style.tileMultiplier}>DL</div>}
      {tripleLetterMultiplier === true && <div className={style.tileMultiplier}>TL</div>}
      {doubleWordMultiplier === true && <div className={style.tileMultiplier}>2x</div>}
      <div className={style.tileScore}>
        {score}
      </div>
    </div>
  )
}

export default Tile
