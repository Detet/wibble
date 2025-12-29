import { createContext } from 'react'
import { createMachine, assign, ActorRefFrom } from 'xstate'

import { generateTitleBoard, generateRandomBoard, randomLetter } from '@/utils/board'
import { isValidWord } from '@/utils/dictionary'
import { GameData, TileData } from '@/types'

const addLetterActions = [
  'addLetter',
  'updateCurrentWord'
]

export const gameStateMachine = createMachine(
  {
    initial: 'title',
    states: {
      title: {
        entry: 'setupTitle',
        on: {
          START_GAME: 'play'
        }
      },
      play: {
        entry: 'setupGame',
        initial: 'idle',
        states: {
          idle: {
            entry: 'clearCurrentWord',
            on: {
              ADD_LETTER: {
                target: 'chaining',
                actions: addLetterActions
              }
            }
          },
          chaining: {
            on: {
              ADD_LETTER: {
                actions: addLetterActions
              },
              REMOVE_LETTER: {
                actions: [
                  'removeLetter',
                  'updateCurrentWord'
                ]
              },
              STOP_CHAINING: [
                { target: 'cleanup', cond: 'isValidWordSubmission' },
                { target: 'idle' }
              ]
            }
          },
          cleanup: {
            always: {
              target: 'idle',
              actions: [
                'collectGems',
                'updateTotalScore',
                'replaceUsedLetters'
              ]
            }
          }
        }
      }
    },
    context: {
      currentChain: [],
      currentWord: '',
      currentScore: 0,
      totalScore: 0,
      gems: 0,
      board: []
    },
    /* eslint-disable @typescript-eslint/consistent-type-assertions */
    schema: {
      context: {} as GameData,
      events: {} as
        | { type: 'START_GAME' }
        | { type: 'ADD_LETTER', location: [number, number] }
        | { type: 'REMOVE_LETTER' }
        | { type: 'STOP_CHAINING' }
    }
    /* eslint-enable @typescript-eslint/consistent-type-assertions */
  },
  {
    actions: {
      setupTitle: assign({
        currentWord: (_) => '',
        board: (_) => generateTitleBoard()
      }),
      setupGame: assign({
        board: (_) => generateRandomBoard()
      }),
      addLetter: assign({
        currentChain: (context, { location }: { type: 'ADD_LETTER', location: [number, number] }) =>
          context.currentChain.concat([location])
      }),
      removeLetter: assign({
        currentChain: (context) =>
          context.currentChain.slice(0, -1)
      }),
      updateCurrentWord: assign({
        currentWord: (context) => context.currentChain.reduce(
          (word, [col, row]) => word + context.board[row][col].letter,
          ''
        ),
        currentScore: (context) => {
          let score = 0
          let wordMultiplier = 1
          let hasDoubleWord = false

          // Calculate score with letter multipliers
          context.currentChain.forEach(([col, row]) => {
            const tile = context.board[row][col]
            let letterScore = tile.score

            // Apply letter multipliers
            if (tile.doubleLetterMultiplier === true) {
              letterScore *= 2
            } else if (tile.tripleLetterMultiplier === true) {
              letterScore *= 3
            }

            // Check for word multiplier
            if (tile.doubleWordMultiplier === true) {
              hasDoubleWord = true
            }

            score += letterScore
          })

          // Apply word multiplier if any tile had it
          if (hasDoubleWord) {
            score *= 2
          }

          // Add long word bonus (6+ letters)
          if (context.currentChain.length >= 6) {
            score += 10
          }

          return score
        }
      }),
      collectGems: assign({
        gems: (context) => {
          // Count gems in the current chain
          let gemsEarned = 0
          context.currentChain.forEach(([col, row]) => {
            const tile = context.board[row][col]
            if (tile.hasGem === true) {
              gemsEarned++
            }
          })

          // Cap gems at 10
          return Math.min(context.gems + gemsEarned, 10)
        }
      }),
      updateTotalScore: assign({
        totalScore: (context) => context.totalScore + context.currentScore
      }),
      replaceUsedLetters: assign({
        board: (context) => {
          const board = context.board

          for (const [col, row] of context.currentChain) {
            board[row][col] = randomLetter()
          }

          return board
        }
      }),
      clearCurrentWord: assign({
        currentChain: [],
        currentWord: '',
        currentScore: 0
      })
    },
    guards: {
      isValidWordSubmission: (context) => {
        // Must have at least 2 letters
        if (context.currentChain.length < 2) {
          return false
        }

        // Check if word is in dictionary
        if (!isValidWord(context.currentWord)) {
          return false
        }

        // Check if any frozen tiles were used
        const usesFrozenTile = context.currentChain.some(([col, row]) => {
          return context.board[row][col].isFrozen === true
        })

        if (usesFrozenTile) {
          return false
        }

        return true
      }
    }
  }
)

export const GameStateMachineContext =
  createContext<ActorRefFrom<typeof gameStateMachine>>(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as ActorRefFrom<typeof gameStateMachine>
  )
