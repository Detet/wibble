
import { FC, useContext, useEffect } from 'react'
import { useActor } from '@xstate/react'

import Tile from '@/components/Tile'
import { GameStateMachineContext } from '@/stores/gameStateMachine'
import { useWebRTC } from '@/utils/useWebRTC'

import styles from './Game.module.scss'

const Game: FC = () => {
  const actor = useContext(GameStateMachineContext)
  const [state] = useActor(actor)
  const { roomCode, connectionStatus, error } = useWebRTC(actor)

  // Auto-join if invite link is used
  useEffect(() => {
    if (typeof window !== 'undefined' && state.matches('mainMenu')) {
      const urlParams = new URLSearchParams(window.location.search)
      const joinCode = urlParams.get('join')
      if (joinCode != null && joinCode.trim() !== '') {
        const name = prompt('Enter your name:') || 'Player'
        // Normalize room code: trim whitespace and convert to uppercase
        actor.send({ type: 'JOIN_GAME', roomCode: joinCode.trim().toUpperCase(), playerName: name })
        // Clear URL parameter
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [state, actor])

  // Timer tick every second (multiplayer only)
  useEffect(() => {
    if (!state.matches('play')) {
      return
    }

    // Only run timer in multiplayer mode
    const isSoloMode = state.context.players.length <= 1
    if (isSoloMode) {
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
  const isMainMenu = state.matches('mainMenu')
  const isHostLobby = state.matches('hostLobby')
  const isJoinLobby = state.matches('joinLobby')
  const isWaitingRoom = state.matches('waitingRoom')
  const isPlaying = state.matches('play')
  const isRoundEnding = state.matches('play.roundEnding')
  const isGameOver = state.matches('gameOver')
  const isTitle = state.matches('title')

  const localPlayer = context.players.find(p => p.id === context.localPlayerId)
  const isHost = localPlayer?.isHost === true

  return (
    <main className={styles.container}>
      {isMainMenu && (
        <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
          <h1>Wibble - Multiplayer Word Game</h1>
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              style={{ padding: '16px 32px', fontSize: '18px' }}
              onClick={() => {
                const name = prompt('Enter your name:') || 'Player'
                actor.send({ type: 'HOST_GAME', playerName: name })
              }}
            >
              Host Game
            </button>
            <button
              style={{ padding: '16px 32px', fontSize: '18px' }}
              onClick={() => {
                const name = prompt('Enter your name:') || 'Player'
                const code = prompt('Enter room code:')
                if (code != null && code.trim() !== '') {
                  // Normalize: trim whitespace and convert to uppercase for case-insensitive matching
                  actor.send({ type: 'JOIN_GAME', roomCode: code.trim().toUpperCase(), playerName: name })
                }
              }}
            >
              Join Game
            </button>
            <button
              style={{ padding: '16px 32px', fontSize: '18px' }}
              onClick={() => actor.send('PLAY_SOLO')}
            >
              Play Solo
            </button>
          </div>
        </div>
      )}

      {isHostLobby && (
        <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
          <h1>Host Lobby</h1>

          {/* Room Code Display */}
          <div style={{ marginTop: '24px', padding: '24px', border: '2px solid #000', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 12px 0', color: '#666' }}>ROOM CODE</h2>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              letterSpacing: '8px',
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '2px solid #ddd'
            }}>
              {roomCode ?? 'LOADING...'}
            </div>
            <div style={{ fontSize: '14px', color: '#888', marginTop: '8px', textAlign: 'center' }}>
              Share this code with friends
            </div>
          </div>

          {/* Invite Link Display */}
          <div style={{ marginTop: '16px', padding: '24px', border: '2px solid #000', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>INVITE LINK</h2>
            {roomCode != null ? (
              <>
                <div style={{
                  fontSize: '16px',
                  wordBreak: 'break-all',
                  padding: '16px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  fontFamily: 'monospace'
                }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/?join=${roomCode}` : 'Loading...'}
                </div>
                <button
                  style={{ padding: '12px 24px', fontSize: '16px', width: '100%', cursor: 'pointer' }}
                  onClick={() => {
                    const inviteLink = `${window.location.origin}/?join=${roomCode}`
                    navigator.clipboard.writeText(inviteLink)
                      .then(() => alert('Invite link copied to clipboard!'))
                      .catch(() => alert('Failed to copy'))
                  }}
                >
                  📋 Copy Invite Link
                </button>
              </>
            ) : (
              <div style={{ fontSize: '16px', color: '#666' }}>
                {connectionStatus === 'connecting' ? 'Generating...' : 'LOADING...'}
              </div>
            )}
            {connectionStatus === 'error' && error != null && (
              <div style={{ fontSize: '14px', color: 'red', marginTop: '8px' }}>
                Error: {error}
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3>Players ({context.players.length})</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {context.players.map(player => (
                <li key={player.id} style={{
                  padding: '12px',
                  marginBottom: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    {player.name} {player.isHost && '(Host)'}
                  </span>
                  <span style={{
                    color: player.isReady ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {player.isReady ? '✓ Ready' : '✗ Not Ready'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
            <button
              style={{ flex: 1, padding: '16px', fontSize: '18px' }}
              onClick={() => actor.send('START_MULTIPLAYER')}
              disabled={context.players.length < 2 || !context.players.every(p => p.isReady)}
            >
              Start Game
            </button>
            <button
              style={{ padding: '16px 32px', fontSize: '18px' }}
              onClick={() => actor.send('LEAVE_LOBBY')}
            >
              Leave
            </button>
          </div>
        </div>
      )}

      {(isJoinLobby || isWaitingRoom) && (
        <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
          <h1>{isJoinLobby ? 'Joining Game...' : 'Waiting Room'}</h1>

          {isJoinLobby && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <div style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>
                {connectionStatus === 'connecting' ? 'Connecting to host...' : 'Initializing...'}
              </div>
              <div style={{ fontSize: '14px', color: '#888', fontFamily: 'monospace' }}>
                Room: {context.roomCode}
              </div>
              {connectionStatus === 'error' && error != null && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: '#fee',
                  border: '2px solid #fcc',
                  borderRadius: '8px',
                  color: '#c00',
                  textAlign: 'left'
                }}>
                  <strong style={{ fontSize: '18px' }}>❌ Connection Failed</strong>
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    {error}
                  </div>
                  <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
                    <strong>Troubleshooting:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>Make sure the host created the game first</li>
                      <li>Check that the room code is correct</li>
                      <li>Try refreshing and joining again</li>
                    </ul>
                  </div>
                  <button
                    style={{ marginTop: '16px', padding: '12px 24px', cursor: 'pointer' }}
                    onClick={() => window.location.reload()}
                  >
                    Back to Menu
                  </button>
                </div>
              )}
            </div>
          )}

          {isWaitingRoom && (
            <>
              <div style={{ marginTop: '24px' }}>
                <h3>Players ({context.players.length})</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {context.players.map(player => (
                    <li key={player.id} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>
                        {player.name} {player.isHost && '(Host)'}
                      </span>
                      <span style={{
                        color: player.isReady ? 'green' : 'red',
                        fontWeight: 'bold'
                      }}>
                        {player.isReady ? '✓ Ready' : '✗ Not Ready'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                <button
                  style={{ flex: 1, padding: '16px', fontSize: '18px' }}
                  onClick={() => actor.send({ type: 'PLAYER_READY_TOGGLE', playerId: context.localPlayerId })}
                >
                  {localPlayer?.isReady ? 'Not Ready' : 'Ready'}
                </button>
                <button
                  style={{ padding: '16px 32px', fontSize: '18px' }}
                  onClick={() => actor.send('LEAVE_LOBBY')}
                >
                  Leave
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {isPlaying && !isRoundEnding && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Round {context.currentRound} / {context.config.totalRounds}
          </div>
          {context.players.length > 1 && (
            <>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: context.turnTimeRemaining <= 10 ? 'red' : 'black'
              }}>
                {formatTime(context.turnTimeRemaining)}
              </div>
              <div style={{ fontSize: '18px', marginTop: '8px' }}>
                {context.players[context.currentPlayerIndex]?.id === context.localPlayerId
                  ? "Your Turn"
                  : `${context.players[context.currentPlayerIndex]?.name}'s Turn`}
              </div>
            </>
          )}
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
      {context.message != null && (
        <div style={{
          color: 'red',
          fontWeight: 'bold',
          fontSize: '18px',
          marginTop: '8px',
          marginBottom: '8px'
        }}>
          {context.message}
        </div>
      )}
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
