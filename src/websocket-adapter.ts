import {
	NetworkAdapter,
	PeerId,
	PeerMetadata,
	cbor,
} from "@automerge/automerge-repo/slim"
import WebSocket from "isomorphic-ws"

import {
	FromClientMessage,
	FromServerMessage,
	JoinMessage,
} from "@automerge/automerge-repo-network-websocket"
import {ProtocolV1} from "@automerge/automerge-repo-network-websocket"

export const isJoinMessage = (
	message: FromClientMessage
): message is JoinMessage => message.type === "join"

export const isPeerMessage = (
	message: FromServerMessage
): message is PeerMessage => message.type === "peer"

export const isErrorMessage = (
	message: FromServerMessage
): message is ErrorMessage => message.type === "error"

/** Sent by the server in response to a "join" message to advertise the servers PeerID */
export type PeerMessage = {
	type: "peer"
	/** The PeerID of the server */
	senderId: PeerId

	/** Metadata presented by the peer  */
	peerMetadata: PeerMetadata

	/** The protocol version the server selected for this connection */
	selectedProtocolVersion: ProtocolVersion
	/** The PeerID of the client */
	targetId: PeerId
}

/** An error occurred. The other end will terminate the connection after sending this message */
export type ErrorMessage = {
	type: "error"
	/** The peer sending the message */
	senderId: PeerId
	/** A description of the error*/
	message: string
	/** The PeerID of the client */
	targetId: PeerId
}

abstract class WebSocketNetworkAdapter extends NetworkAdapter {
	socket?: WebSocket
}

export class WebSocketClientAdapter extends WebSocketNetworkAdapter {
	#ready = false
	#readyResolver?: () => void
	#readyPromise: Promise<void> = new Promise<void>(resolve => {
		this.#readyResolver = resolve
	})

	isReady() {
		return this.#ready
	}

	whenReady() {
		return this.#readyPromise
	}

	#forceReady() {
		if (!this.#ready) {
			this.#ready = true
			this.#readyResolver?.()
		}
	}

	retryIntervalId?: TimeoutId

	remotePeerId?: PeerId // this adapter only connects to one remote client at a time

	constructor(
		public readonly url: string,
		public readonly retryInterval = 5000
	) {
		super()
	}

	connect(peerId: PeerId, peerMetadata?: PeerMetadata) {
		if (!this.socket || !this.peerId) {
			// first time connecting

			this.peerId = peerId
			this.peerMetadata = peerMetadata ?? {}
		} else {
			// Remove the old event listeners before creating a new connection.
			this.socket.removeEventListener("open", this.onOpen)
			this.socket.removeEventListener("close", this.onClose)
			this.socket.removeEventListener("message", this.onMessage)
			this.socket.removeEventListener("error", this.onError)
		}
		// Wire up retries
		if (!this.retryIntervalId)
			this.retryIntervalId = setInterval(() => {
				this.connect(peerId, peerMetadata)
			}, this.retryInterval)

		this.socket = new WebSocket(this.url)

		this.socket.binaryType = "arraybuffer"

		this.socket.addEventListener("open", this.onOpen)
		this.socket.addEventListener("close", this.onClose)
		this.socket.addEventListener("message", this.onMessage)
		this.socket.addEventListener("error", this.onError)

		// Mark this adapter as ready if we haven't received an ack in 1 second.
		// We might hear back from the other end at some point but we shouldn't
		// hold up marking things as unavailable for any longer
		setTimeout(() => this.#forceReady(), 1000)
		this.join()
	}

	onOpen = () => {
		clearInterval(this.retryIntervalId)
		this.retryIntervalId = undefined
		this.join()
	}

	// When a socket closes, or disconnects, remove it from the array.
	onClose = () => {
		if (this.remotePeerId)
			this.emit("peer-disconnected", {peerId: this.remotePeerId})

		if (this.retryInterval > 0 && !this.retryIntervalId)
			// try to reconnect
			setTimeout(() => {
				return this.connect(this.peerId, this.peerMetadata)
			}, this.retryInterval)
	}

	onMessage = (event: WebSocket.MessageEvent) => {
		this.receiveMessage(event.data as Uint8Array)
	}

	/** The websocket error handler signature is different on node and the browser.  */
	onError = (
		event:
			| Event // browser
			| WebSocket.ErrorEvent // node
	) => {
		if ("error" in event) {
			// (node)
			if (event.error.code !== "ECONNREFUSED") {
				/* c8 ignore next */
				throw event.error
			}
		} else {
			// (browser) We get no information about errors. https://stackoverflow.com/a/31003057/239663
			// There will be an error logged in the console (`WebSocket connection to 'wss://foo.com/'
			// failed`), but by design the error is unavailable to scripts. We'll just assume this is a
			// failed connection.
		}
	}

	join() {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.send(joinMessage(this.peerId!, this.peerMetadata!))
		} else {
			// We'll try again in the `onOpen` handler
		}
	}

	disconnect() {
		const socket = this.socket
		if (socket) {
			socket.removeEventListener("open", this.onOpen)
			socket.removeEventListener("close", this.onClose)
			socket.removeEventListener("message", this.onMessage)
			socket.removeEventListener("error", this.onError)
			socket.close()
		}
		clearInterval(this.retryIntervalId)
		if (this.remotePeerId)
			this.emit("peer-disconnected", {peerId: this.remotePeerId})
		this.socket = undefined
	}

	send(message: FromClientMessage) {
		if ("data" in message && message.data?.byteLength === 0)
			throw new Error("Tried to send a zero-length message")

		if (!this.socket) {
			return
		}
		if (this.socket.readyState !== WebSocket.OPEN)
			throw new Error(`Websocket not ready (${this.socket.readyState})`)

		const encoded = cbor.encode(message)
		this.socket.send(toArrayBuffer(encoded))
	}

	peerCandidate(remotePeerId: PeerId, peerMetadata: PeerMetadata) {
		this.#forceReady()
		this.remotePeerId = remotePeerId
		this.emit("peer-candidate", {
			peerId: remotePeerId,
			peerMetadata,
		})
	}

	receiveMessage(messageBytes: Uint8Array) {
		const message: FromServerMessage = cbor.decode(new Uint8Array(messageBytes))

		if (messageBytes.byteLength === 0)
			throw new Error("received a zero-length message")

		if (isPeerMessage(message)) {
			const {peerMetadata} = message

			this.peerCandidate(message.senderId, peerMetadata)
		} else if (isErrorMessage(message)) {
		} else {
			this.emit("message", message)
		}
	}
}

function joinMessage(
	senderId: PeerId,
	peerMetadata: PeerMetadata
): JoinMessage {
	return {
		type: "join",
		senderId,
		peerMetadata,
		supportedProtocolVersions: [ProtocolV1],
	}
}

type TimeoutId = ReturnType<typeof setTimeout> //  https://stackoverflow.com/questions/45802988

export const toArrayBuffer = (bytes: Uint8Array) => {
	const {buffer, byteOffset, byteLength} = bytes
	return buffer.slice(byteOffset, byteOffset + byteLength)
}
