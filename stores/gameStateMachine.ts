import { createContext } from 'react'
import { createMachine, assign, ActorRefFrom } from 'xstate'

import { generateTitleBoard, generateRandomBoard, randomLetter, tiles } from '@/utils/board'
import { isValidWord } from '@/utils/dictionary'
import { GameData, TileData } from '@/types'

/**
 * Check if two tiles are adjacent on a toroidal (wrapping) 5x5 board
 */
const isAdjacentWithWrapping = (pos1: [number, number], pos2: [number, number]): boolean => {
  const [x1, y1] = pos1
  const [x2, y2] = pos2
  const boardSize = 5

  // Calculate horizontal and vertical distances with wrapping
  const dx = Math.min(
    Math.abs(x2 - x1),
    boardSize - Math.abs(x2 - x1)
  )
  const dy = Math.min(
    Math.abs(y2 - y1),
    boardSize - Math.abs(y2 - y1)
  )

  // Adjacent if within 1 step horizontally, vertically, or diagonally (including wrapping)
  return dx <= 1 && dy <= 1 && (dx + dy) > 0
}

const addLetterActions = [
  'addLetter',
  'updateCurrentWord'
]

export const gameStateMachine = createMachine(
  {
    id: 'gameStateMachine',
    initial: 'mainMenu',
    states: {
      mainMenu: {
        on: {
          HOST_GAME: 'hostLobby',
          JOIN_GAME: 'joinLobby',
          PLAY_SOLO: 'title'
        }
      },
      hostLobby: {
        entry: 'setupHost',
        on: {
          PLAYER_JOINED: {
            actions: 'addPlayer'
          },
          PLAYER_LEFT: {
            actions: 'removePlayer'
          },
          PLAYER_READY_TOGGLE: {
            actions: 'togglePlayerReady'
          },
          START_MULTIPLAYER: {
            target: 'play',
            cond: 'allPlayersReady'
          },
          LEAVE_LOBBY: 'mainMenu'
        }
      },
      joinLobby: {
        entry: 'setupGuest',
        on: {
          LOBBY_JOINED: {
            target: 'waitingRoom',
            actions: 'initializePlayers'
          },
          JOIN_FAILED: 'mainMenu',
          LEAVE_LOBBY: 'mainMenu'
        }
      },
      waitingRoom: {
        on: {
          PLAYER_JOINED: {
            actions: 'addPlayer'
          },
          PLAYER_LEFT: {
            actions: 'removePlayer'
          },
          PLAYER_READY_TOGGLE: {
            actions: 'togglePlayerReady'
          },
          GAME_STARTING: 'play',
          LEAVE_LOBBY: 'mainMenu'
        }
      },
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
            entry: ['clearCurrentWord', 'clearMessage'],
            on: {
              ADD_LETTER: {
                target: 'chaining',
                actions: addLetterActions,
                cond: 'canAddTile'
              },
              USE_SHUFFLE: {
                cond: 'hasEnoughGemsForShuffle',
                actions: ['shuffleBoard', 'spendGemsForShuffle']
              },
              USE_WILDCARD: {
                cond: 'hasEnoughGemsForWildcard',
                actions: ['setWildcardLetter', 'spendGemsForWildcard']
              },
              TIMER_TICK: {
                actions: 'decrementTimer'
              },
              END_TURN: {
                target: 'turnEnding'
              }
            }
          },
          chaining: {
            on: {
              ADD_LETTER: {
                actions: addLetterActions,
                cond: 'canAddTile'
              },
              REMOVE_LETTER: {
                actions: [
                  'removeLetter',
                  'updateCurrentWord'
                ]
              },
              STOP_CHAINING: [
                { target: 'cleanup', cond: 'isValidWordSubmission', actions: 'clearMessage' },
                { target: 'idle', actions: 'setInvalidWordMessage' }
              ],
              TIMER_TICK: {
                actions: 'decrementTimer'
              },
              END_TURN: {
                target: 'turnEnding'
              }
            }
          },
          cleanup: {
            always: {
              target: 'idle',
              actions: [
                'collectGems',
                'updateTotalScore',
                'replaceUsedLetters',
                'saveRoundScore'
              ]
            }
          },
          turnEnding: {
            entry: 'clearCurrentWord',
            always: [
              { target: 'roundEnding', cond: 'isLastRound' },
              { target: 'idle', actions: 'startNextTurn' }
            ]
          },
          roundEnding: {
            on: {
              START_NEXT_ROUND: [
                { target: '#gameStateMachine.gameOver', cond: 'isGameOver' },
                { target: 'idle', actions: 'setupNextRound' }
              ]
            }
          }
        }
      },
      gameOver: {
        type: 'final'
      }
    },
    context: {
      config: {
        totalRounds: 5,
        turnsPerPlayer: 1,
        turnDuration: 60 // 1 minute default
      },
      currentRound: 1,
      currentPlayerIndex: 0,
      turnTimeRemaining: 60,
      currentChain: [],
      currentWord: '',
      currentScore: 0,
      totalScore: 0,
      roundScores: [],
      gems: 0,
      board: [],
      players: [],
      localPlayerId: '',
      roomCode: null,
      message: null
    },
    /* eslint-disable @typescript-eslint/consistent-type-assertions */
    schema: {
      context: {} as GameData,
      events: {} as
        | { type: 'HOST_GAME', playerName: string }
        | { type: 'JOIN_GAME', roomCode: string, playerName: string }
        | { type: 'PLAY_SOLO' }
        | { type: 'LOBBY_JOINED', players: any[] }
        | { type: 'JOIN_FAILED' }
        | { type: 'PLAYER_JOINED', player: any }
        | { type: 'PLAYER_LEFT', playerId: string }
        | { type: 'PLAYER_READY_TOGGLE', playerId: string }
        | { type: 'START_MULTIPLAYER' }
        | { type: 'GAME_STARTING' }
        | { type: 'LEAVE_LOBBY' }
        | { type: 'START_GAME' }
        | { type: 'ADD_LETTER', location: [number, number] }
        | { type: 'REMOVE_LETTER' }
        | { type: 'STOP_CHAINING' }
        | { type: 'USE_SHUFFLE' }
        | { type: 'USE_WILDCARD', location: [number, number], letter: string }
        | { type: 'TIMER_TICK' }
        | { type: 'END_TURN' }
        | { type: 'START_NEXT_ROUND' }
    }
    /* eslint-enable @typescript-eslint/consistent-type-assertions */
  },
  {
    actions: {
      setupHost: assign({
        localPlayerId: (_, event: { type: 'HOST_GAME', playerName: string }) => `host-${Date.now()}`,
        players: (_, event: { type: 'HOST_GAME', playerName: string }) => [{
          id: `host-${Date.now()}`,
          name: event.playerName,
          gems: 0,
          totalScore: 0,
          roundScores: [],
          isHost: true,
          isReady: true
        }]
      }),
      setupGuest: assign((context, event: { type: 'JOIN_GAME', roomCode: string, playerName: string }) => {
        const guestId = `guest-${Date.now()}`
        return {
          localPlayerId: guestId,
          roomCode: event.roomCode,
          players: [{
            id: guestId,
            name: event.playerName,
            gems: 0,
            totalScore: 0,
            roundScores: [],
            isHost: false,
            isReady: false
          }]
        }
      }),
      initializePlayers: assign({
        players: (_, event: { type: 'LOBBY_JOINED', players: any[] }) => event.players
      }),
      addPlayer: assign({
        players: (context, event: { type: 'PLAYER_JOINED', player: any }) => [
          ...context.players,
          event.player
        ]
      }),
      removePlayer: assign({
        players: (context, event: { type: 'PLAYER_LEFT', playerId: string }) =>
          context.players.filter(p => p.id !== event.playerId)
      }),
      togglePlayerReady: assign({
        players: (context, event: { type: 'PLAYER_READY_TOGGLE', playerId: string }) =>
          context.players.map(p =>
            p.id === event.playerId
              ? { ...p, isReady: !p.isReady }
              : p
          )
      }),
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
      clearMessage: assign({
        message: null
      }),
      setInvalidWordMessage: assign({
        message: (context) => {
          if (context.currentChain.length < 2) {
            return 'Word must be at least 2 letters'
          }
          if (context.currentChain.some(([col, row]) => context.board[row][col].isFrozen)) {
            return 'Cannot use frozen tiles'
          }
          return `"${context.currentWord}" is not a valid word`
        }
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
      }),
      decrementTimer: assign({
        turnTimeRemaining: (context) => Math.max(0, context.turnTimeRemaining - 1)
      }),
      saveRoundScore: assign({
        roundScores: (context) => {
          // Only save if we haven't already saved this round
          if (context.roundScores.length < context.currentRound) {
            return [...context.roundScores, context.totalScore]
          }
          return context.roundScores
        }
      }),
      startNextTurn: assign({
        turnTimeRemaining: (context) => context.config.turnDuration
      }),
      setupNextRound: assign({
        currentRound: (context) => context.currentRound + 1,
        turnTimeRemaining: (context) => context.config.turnDuration,
        board: (_) => generateRandomBoard()
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
      canAddTile: (context, event) => {
        // Type guard to ensure event is ADD_LETTER
        if (event.type !== 'ADD_LETTER') {
          return false
        }
        const { location } = event

        // Don't allow selecting the same tile twice
        const alreadySelected = context.currentChain.some(
          ([col, row]) => col === location[0] && row === location[1]
        )
        if (alreadySelected) {
          return false
        }

        // Don't allow selecting frozen tiles
        const [col, row] = location
        if (context.board[row][col].isFrozen === true) {
          return false
        }

        // First tile can always be added
        if (context.currentChain.length === 0) {
          return true
        }

        // Check if adjacent to last tile (with wrapping)
        const lastTile = context.currentChain[context.currentChain.length - 1]
        return isAdjacentWithWrapping(lastTile, location)
      },
      hasEnoughGemsForShuffle: (context) => {
        return context.gems >= 1
      },
      hasEnoughGemsForWildcard: (context) => {
        return context.gems >= 3
      },
      isLastRound: (context) => {
        return context.currentRound >= context.config.totalRounds
      },
      isGameOver: (context) => {
        return context.currentRound >= context.config.totalRounds
      },
      allPlayersReady: (context) => {
        return context.players.length >= 2 && context.players.every(p => p.isReady)
      }
    }
  }
)

export const GameStateMachineContext =
  createContext<ActorRefFrom<typeof gameStateMachine>>(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as ActorRefFrom<typeof gameStateMachine>
  )
