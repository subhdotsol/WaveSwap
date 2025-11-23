import { FastifyInstance, FastifyRequest } from 'fastify'
import { WebSocket } from 'ws'
import { logger } from '@/lib/logger'

interface Client {
  id: string
  ws: WebSocket
  userId?: string
  subscriptions: Set<string>
  lastPing: number
}

export class WebSocketService {
  private clients = new Map<string, Client>()
  private swapSubscriptions = new Map<string, Set<string>>() // swapId -> Set of clientIds

  constructor(private server: FastifyInstance) {
    // Clean up inactive connections every 30 seconds
    setInterval(() => {
      this.cleanupInactiveConnections()
    }, 30000)
  }

  handleConnection(connection: WebSocket, request: FastifyRequest) {
    const clientId = this.generateClientId()
    const client: Client = {
      id: clientId,
      ws: connection,
      subscriptions: new Set(),
      lastPing: Date.now(),
    }

    this.clients.set(clientId, client)

    logger.info('WebSocket client connected', { clientId })

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      clientId,
      timestamp: Date.now(),
    })

    // Set up message handlers
    connection.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleMessage(clientId, message)
      } catch (error) {
        logger.error('Invalid WebSocket message', { clientId, error })
        this.sendError(clientId, 'Invalid message format')
      }
    })

    connection.on('close', () => {
      this.handleDisconnect(clientId)
    })

    connection.on('error', (error) => {
      logger.error('WebSocket client error', { clientId, error })
      this.handleDisconnect(clientId)
    })

    // Set up ping/pong for keepalive
    connection.on('pong', () => {
      client.lastPing = Date.now()
    })

    // Start ping interval
    const pingInterval = setInterval(() => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping()
      } else {
        clearInterval(pingInterval)
      }
    }, 30000)
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId)
    if (!client) return

    switch (message.type) {
      case 'ping':
        this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() })
        break

      case 'subscribe_swap_status':
        this.handleSwapSubscription(clientId, message.intentId)
        break

      case 'unsubscribe_swap_status':
        this.handleSwapUnsubscription(clientId, message.intentId)
        break

      case 'authenticate':
        this.handleAuthentication(clientId, message.token)
        break

      default:
        logger.warn('Unknown WebSocket message type', { clientId, type: message.type })
        this.sendError(clientId, 'Unknown message type')
    }
  }

  private handleSwapSubscription(clientId: string, intentId: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.add(`swap:${intentId}`)

    // Add to swap subscriptions
    if (!this.swapSubscriptions.has(intentId)) {
      this.swapSubscriptions.set(intentId, new Set())
    }
    this.swapSubscriptions.get(intentId)!.add(clientId)

    this.sendToClient(clientId, {
      type: 'subscribed',
      topic: 'swap_status',
      intentId,
      timestamp: Date.now(),
    })

    logger.debug('Client subscribed to swap updates', { clientId, intentId })
  }

  private handleSwapUnsubscription(clientId: string, intentId: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.delete(`swap:${intentId}`)

    // Remove from swap subscriptions
    const swapClients = this.swapSubscriptions.get(intentId)
    if (swapClients) {
      swapClients.delete(clientId)
      if (swapClients.size === 0) {
        this.swapSubscriptions.delete(intentId)
      }
    }

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      topic: 'swap_status',
      intentId,
      timestamp: Date.now(),
    })

    logger.debug('Client unsubscribed from swap updates', { clientId, intentId })
  }

  private handleAuthentication(clientId: string, token: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    // TODO: Implement JWT authentication
    // For now, just acknowledge
    this.sendToClient(clientId, {
      type: 'authenticated',
      timestamp: Date.now(),
    })

    logger.debug('Client authenticated', { clientId })
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    // Remove from all subscriptions
    client.subscriptions.forEach(subscription => {
      if (subscription.startsWith('swap:')) {
        const intentId = subscription.replace('swap:', '')
        const swapClients = this.swapSubscriptions.get(intentId)
        if (swapClients) {
          swapClients.delete(clientId)
          if (swapClients.size === 0) {
            this.swapSubscriptions.delete(intentId)
          }
        }
      }
    })

    this.clients.delete(clientId)

    logger.info('WebSocket client disconnected', { clientId })
  }

  private cleanupInactiveConnections() {
    const now = Date.now()
    const timeout = 60000 // 1 minute timeout

    for (const [clientId, client] of this.clients) {
      if (now - client.lastPing > timeout) {
        logger.info('Closing inactive WebSocket connection', { clientId })
        client.ws.close()
        this.handleDisconnect(clientId)
      }
    }
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId)
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      client.ws.send(JSON.stringify(data))
    } catch (error) {
      logger.error('Failed to send WebSocket message', { clientId, error })
      this.handleDisconnect(clientId)
    }
  }

  private sendError(clientId: string, message: string) {
    this.sendToClient(clientId, {
      type: 'error',
      message,
      timestamp: Date.now(),
    })
  }

  // Public methods for broadcasting updates
  broadcastSwapStatus(intentId: string, status: any) {
    const clients = this.swapSubscriptions.get(intentId)
    if (!clients) return

    const message = {
      type: 'swap_status_update',
      intentId,
      status,
      timestamp: Date.now(),
    }

    for (const clientId of clients) {
      this.sendToClient(clientId, message)
    }

    logger.debug('Broadcasted swap status update', { intentId, clientCount: clients.size })
  }

  broadcastToAll(data: any) {
    const message = {
      ...data,
      timestamp: Date.now(),
    }

    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, message)
    }
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      swapSubscriptions: this.swapSubscriptions.size,
      activeConnections: Array.from(this.clients.values()).filter(
        client => client.ws.readyState === WebSocket.OPEN
      ).length,
    }
  }
}