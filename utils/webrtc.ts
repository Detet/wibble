import Peer, { DataConnection } from 'peerjs'
import { customAlphabet } from 'nanoid'
import { WebRTCMessage, PlayerData } from '@/types'

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

export interface RoomConnection {
  peer: Peer
  roomCode: string
  isHost: boolean
  connections: DataConnection[]
  localPlayerId: string
}

export class WebRTCManager {
  private peer: Peer | null = null
  private connections: Map<string, DataConnection> = new Map()
  private roomCode: string = ''
  private isHost: boolean = false
  private localPlayerId: string = ''
  private messageHandlers: Array<(message: WebRTCMessage, fromPlayerId: string) => void> = []
  private connectionHandlers: Array<(playerId: string) => void> = []
  private disconnectionHandlers: Array<(playerId: string) => void> = []

  /**
   * Create a new room (host)
   */
  async createRoom(playerName: string): Promise<string> {
    // Generate uppercase-only room code for easier sharing
    this.roomCode = nanoid(6).toUpperCase()
    this.isHost = true
    this.localPlayerId = `host-${Date.now()}`

    return new Promise((resolve, reject) => {
      // Add timeout for peer initialization
      const initTimeout = setTimeout(() => {
        reject(new Error('Failed to connect to signaling server. Check your internet connection and firewall settings.'))
      }, 15000) // 15 second timeout

      console.log('🔄 Initializing host peer with ID:', this.roomCode)

      this.peer = new Peer(this.roomCode, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' }
          ]
        },
        debug: 2 // Enable debug logging
      })

      this.peer.on('open', (id) => {
        clearTimeout(initTimeout)
        console.log('✅ HOST CONNECTED! Room code:', this.roomCode, 'Peer ID:', id)
        resolve(this.roomCode)
      })

      this.peer.on('error', (error) => {
        clearTimeout(initTimeout)
        console.error('❌ PeerJS host error:', error)
        const errorMsg = error.type === 'unavailable-id'
          ? 'Room code already in use. Please try again.'
          : error.type === 'network'
          ? 'Network error. Check your internet connection.'
          : error.type === 'server-error'
          ? 'Server error. Please try again later.'
          : `Connection failed: ${error.type || error.message}`
        reject(new Error(errorMsg))
      })

      this.peer.on('disconnected', () => {
        console.warn('⚠️ Peer disconnected from signaling server')
      })

      // Handle incoming connections (guests joining)
      this.peer.on('connection', (conn) => {
        console.log('📥 Incoming connection from:', conn.peer)
        this.handleIncomingConnection(conn)
      })
    })
  }

  /**
   * Join an existing room (guest)
   */
  async joinRoom(roomCode: string, playerName: string): Promise<void> {
    this.roomCode = roomCode
    this.isHost = false
    this.localPlayerId = `guest-${Date.now()}`

    return new Promise((resolve, reject) => {
      // Add 15 second timeout
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout - could not reach host. Make sure host created the game first.'))
      }, 15000)

      console.log('🔄 Initializing guest peer...')

      this.peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' }
          ]
        },
        debug: 2 // Enable debug logging
      })

      this.peer.on('open', (id) => {
        console.log('✅ GUEST CONNECTED to signaling server! Peer ID:', id)
        console.log('🔗 Attempting to connect to host room:', roomCode)

        // Connect to the host
        const conn = this.peer!.connect(roomCode, {
          reliable: true
        })

        this.handleOutgoingConnection(conn)

        conn.on('open', () => {
          clearTimeout(timeout)
          console.log('✅ Successfully connected to host!')
          resolve()
        })

        conn.on('error', (error) => {
          clearTimeout(timeout)
          console.error('❌ Connection to host failed:', error)
          reject(new Error(`Failed to connect to host: ${error.type || 'Unknown error'}. Check room code.`))
        })
      })

      this.peer.on('error', (error) => {
        clearTimeout(timeout)
        console.error('❌ PeerJS guest error:', error)
        const errorMsg = error.type === 'peer-unavailable'
          ? 'Host not found. Check the room code or make sure host created the game first.'
          : error.type === 'network'
          ? 'Network error. Check your internet connection.'
          : error.type === 'server-error'
          ? 'Server error. Please try again later.'
          : `Connection failed: ${error.type || error.message}`
        reject(new Error(errorMsg))
      })

      // Handle incoming connections from other guests (relayed through host)
      this.peer.on('connection', (conn) => {
        console.log('📥 Incoming peer connection from:', conn.peer)
        this.handleIncomingConnection(conn)
      })
    })
  }

  /**
   * Handle incoming connection
   */
  private handleIncomingConnection(conn: DataConnection): void {
    console.log('Incoming connection from:', conn.peer)

    conn.on('open', () => {
      this.connections.set(conn.peer, conn)
      this.connectionHandlers.forEach(handler => handler(conn.peer))
    })

    conn.on('data', (data) => {
      const message = data as WebRTCMessage
      this.messageHandlers.forEach(handler => handler(message, conn.peer))
    })

    conn.on('close', () => {
      this.connections.delete(conn.peer)
      this.disconnectionHandlers.forEach(handler => handler(conn.peer))
    })

    conn.on('error', (error) => {
      console.error('Connection error:', error)
      this.connections.delete(conn.peer)
      this.disconnectionHandlers.forEach(handler => handler(conn.peer))
    })
  }

  /**
   * Handle outgoing connection
   */
  private handleOutgoingConnection(conn: DataConnection): void {
    console.log('Outgoing connection to:', conn.peer)

    conn.on('open', () => {
      this.connections.set(conn.peer, conn)
      this.connectionHandlers.forEach(handler => handler(conn.peer))
    })

    conn.on('data', (data) => {
      const message = data as WebRTCMessage
      this.messageHandlers.forEach(handler => handler(message, conn.peer))
    })

    conn.on('close', () => {
      this.connections.delete(conn.peer)
      this.disconnectionHandlers.forEach(handler => handler(conn.peer))
    })

    conn.on('error', (error) => {
      console.error('Connection error:', error)
      this.connections.delete(conn.peer)
      this.disconnectionHandlers.forEach(handler => handler(conn.peer))
    })
  }

  /**
   * Send message to all connected peers
   */
  broadcast(message: WebRTCMessage): void {
    this.connections.forEach((conn) => {
      try {
        conn.send(message)
      } catch (error) {
        console.error('Error sending message to', conn.peer, error)
      }
    })
  }

  /**
   * Send message to specific peer
   */
  sendTo(peerId: string, message: WebRTCMessage): void {
    const conn = this.connections.get(peerId)
    if (conn != null) {
      try {
        conn.send(message)
      } catch (error) {
        console.error('Error sending message to', peerId, error)
      }
    }
  }

  /**
   * Register message handler
   */
  onMessage(handler: (message: WebRTCMessage, fromPlayerId: string) => void): void {
    this.messageHandlers.push(handler)
  }

  /**
   * Register connection handler
   */
  onConnection(handler: (playerId: string) => void): void {
    this.connectionHandlers.push(handler)
  }

  /**
   * Register disconnection handler
   */
  onDisconnection(handler: (playerId: string) => void): void {
    this.disconnectionHandlers.push(handler)
  }

  /**
   * Get room info
   */
  getRoomInfo(): { roomCode: string, isHost: boolean, localPlayerId: string } {
    return {
      roomCode: this.roomCode,
      isHost: this.isHost,
      localPlayerId: this.localPlayerId
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.connections.forEach((conn) => {
      conn.close()
    })
    this.connections.clear()

    if (this.peer != null) {
      this.peer.destroy()
      this.peer = null
    }

    this.messageHandlers = []
    this.connectionHandlers = []
    this.disconnectionHandlers = []
  }

  /**
   * Get number of connected peers
   */
  getConnectionCount(): number {
    return this.connections.size
  }
}

// Singleton instance
let webrtcManager: WebRTCManager | null = null

export function getWebRTCManager(): WebRTCManager {
  if (webrtcManager == null) {
    webrtcManager = new WebRTCManager()
  }
  return webrtcManager
}

export function resetWebRTCManager(): void {
  if (webrtcManager != null) {
    webrtcManager.disconnect()
    webrtcManager = null
  }
}
