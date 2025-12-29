import { createContext } from 'react'
import { createMachine, assign, ActorRefFrom } from 'xstate'

import { generateTitleBoard, generateRandomBoard, randomLetter, tiles } from '@/utils/board'
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
              },
              USE_SHUFFLE: {
                cond: 'hasEnoughGemsForShuffle',
                actions: ['shuffleBoard', 'spendGemsForShuffle']
              },
              USE_WILDCARD: {
                cond: 'hasEnoughGemsForWildcard',
                actions: ['setWildcardLetter', 'spendGemsForWildcard']
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
        | { type: 'USE_SHUFFLE' }
        | { type: 'USE_WILDCARD', location: [number, number], letter: string }
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
      }),
      shuffleBoard: assign({
        board: (context) => {
          // Collect all letters from the board
          const letters: TileData[] = []
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              letters.push(context.board[r][c])
            }
          }

          // Fisher-Yates shuffle
          for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]]
          }

          // Rebuild the board with shuffled letters
          const newBoard: TileData[][] = []
          let index = 0
          for (let r = 0; r < 5; r++) {
            newBoard[r] = []
            for (let c = 0; c < 5; c++) {
              newBoard[r][c] = letters[index++]
            }
          }

          return newBoard
        }
      }),
      spendGemsForShuffle: assign({
        gems: (context) => context.gems - 1
      }),
      setWildcardLetter: assign({
        board: (context, event: { type: 'USE_WILDCARD', location: [number, number], letter: string }) => {
          const [col, row] = event.location
          const newBoard = context.board.map(r => [...r])
          const tile = newBoard[row][col]

          // Find the score for the new letter
          const newTile = tiles.find(t => t.letter === event.letter.toUpperCase())

          if (newTile !== undefined) {
            newBoard[row][col] = {
              ...tile,
              letter: newTile.letter,
              score: newTile.score
            }
          }

          return newBoard
        }
      }),
      spendGemsForWildcard: assign({
        gems: (context) => context.gems - 3
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
      },
      hasEnoughGemsForShuffle: (context) => {
        return context.gems >= 1
      },
      hasEnoughGemsForWildcard: (context) => {
        return context.gems >= 3
      }
    }
  }
)

export const GameStateMachineContext =
  createContext<ActorRefFrom<typeof gameStateMachine>>(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as ActorRefFrom<typeof gameStateMachine>
  )
