import { useEffect, useState } from 'react'
import { ActorRefFrom } from 'xstate'
import { gameStateMachine } from '@/stores/gameStateMachine'
import { getWebRTCManager } from './webrtc'
import { WebRTCMessage } from '@/types'

/**
 * Custom hook to integrate WebRTC with the game state machine
 * Handles connection lifecycle, message routing, and room management
 */
export const useWebRTC = (actor: ActorRefFrom<typeof gameStateMachine>) => {
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Track previous state for detecting changes
  const [prevState, setPrevState] = useState<any>(null)

  useEffect(() => {
    const subscription = actor.subscribe((state) => {
      const manager = getWebRTCManager()

      // Broadcast state changes to other players
      if (prevState != null && connectionStatus === 'connected') {
        // Player ready status changed
        if (state.context.players !== prevState.context.players) {
          const localPlayer = state.context.players.find(p => p.id === state.context.localPlayerId)
          const prevLocalPlayer = prevState.context.players.find((p: any) => p.id === state.context.localPlayerId)

          if (localPlayer != null && prevLocalPlayer != null && localPlayer.isReady !== prevLocalPlayer.isReady) {
            manager.broadcast({
              type: 'PLAYER_READY',
              playerId: localPlayer.id,
              ready: localPlayer.isReady
            })
          }
        }

        // Board updated (power-ups used)
        if (state.context.board !== prevState.context.board && !state.matches('play.cleanup')) {
          manager.broadcast({
            type: 'BOARD_UPDATE',
            board: state.context.board
          })
        }
      }

      setPrevState(state)

      // Host lobby: Create room
      if (state.matches('hostLobby') && roomCode == null) {
        setConnectionStatus('connecting')
        const localPlayer = state.context.players.find(p => p.id === state.context.localPlayerId)

        if (localPlayer != null) {
          manager.createRoom(localPlayer.name)
            .then(code => {
              setRoomCode(code)
              setConnectionStatus('connected')
              setError(null)
            })
            .catch(err => {
              setConnectionStatus('error')
              setError(err.message)
              console.error('Failed to create room:', err)
            })
        }
      }

      // Join lobby: Connect to room
      if (state.matches('joinLobby') && connectionStatus === 'idle' && state.context.roomCode != null) {
        setConnectionStatus('connecting')
        const localPlayer = state.context.players.find(p => p.id === state.context.localPlayerId)
        const targetRoomCode = state.context.roomCode

        if (localPlayer != null) {
          manager.joinRoom(targetRoomCode, localPlayer.name)
            .then(() => {
              setRoomCode(targetRoomCode)
              setConnectionStatus('connected')
              setError(null)
              // Transition to waiting room after successful connection
              actor.send({ type: 'LOBBY_JOINED', players: [] })
            })
            .catch(err => {
              setConnectionStatus('error')
              setError(err.message)
              console.error('Failed to join room:', err)
              actor.send('JOIN_FAILED')
            })
        }
      }

      // Cleanup when leaving lobbies
      if (state.matches('mainMenu') && roomCode != null) {
        manager.disconnect()
        setRoomCode(null)
        setConnectionStatus('idle')
        setError(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [actor, roomCode, connectionStatus])

  // Set up connection/disconnection handlers
  useEffect(() => {
    const manager = getWebRTCManager()

    const handleConnection = (peerId: string): void => {
      console.log('Player connected:', peerId)
      // When a new player connects, send them current player list if we're the host
      // This will be handled through PLAYER_JOINED messages
    }

    const handleDisconnection = (peerId: string): void => {
      console.log('Player disconnected:', peerId)
      actor.send({ type: 'PLAYER_LEFT', playerId: peerId })
    }

    manager.onConnection(handleConnection)
    manager.onDisconnection(handleDisconnection)
  }, [actor])

  // Set up message handler
  useEffect(() => {
    const manager = getWebRTCManager()

    const handleMessage = (message: WebRTCMessage, fromPlayerId: string): void => {
      console.log('Received WebRTC message:', message, 'from:', fromPlayerId)

      // Route WebRTC messages to state machine
      switch (message.type) {
        case 'PLAYER_JOINED':
          actor.send({ type: 'PLAYER_JOINED', player: message.player })
          break

        case 'PLAYER_LEFT':
          actor.send({ type: 'PLAYER_LEFT', playerId: message.playerId })
          break

        case 'PLAYER_READY':
          actor.send({ type: 'PLAYER_READY_TOGGLE', playerId: message.playerId })
          break

        case 'GAME_CONFIG':
          // Host sends config to guests when starting game
          console.log('Received game config:', message.config)
          break

        case 'ROUND_START':
          // Sync board state at round start
          console.log('Round starting:', message.round)
          break

        case 'TURN_START':
          // Update current player
          console.log('Turn started for player:', message.playerId)
          break

        case 'BOARD_UPDATE':
          // Sync board state
          console.log('Board updated')
          break

        case 'WORD_SUBMITTED':
          console.log('Word submitted:', message.word, message.score)
          break

        case 'POWER_UP_USED':
          console.log('Power-up used:', message.powerUp)
          break

        case 'ROUND_END':
          console.log('Round ended, scores:', message.scores)
          break

        case 'GAME_END':
          console.log('Game ended, final scores:', message.finalScores)
          break

        default:
          console.warn('Unhandled WebRTC message type:', message)
      }
    }

    manager.onMessage(handleMessage)

    // No cleanup needed - manager persists for session
  }, [actor])

  return {
    roomCode,
    connectionStatus,
    error
  }
}
