import {Repo, initializeBase64Wasm} from "@automerge/automerge-repo/slim"
import {automergeWasmBase64} from "@automerge/automerge/automerge.wasm.base64.js"
await initializeBase64Wasm(automergeWasmBase64)

import {WebSocketClientAdapter} from "./websocket-adapter.ts"
// import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"
import {isServer} from "solid-js/web"
import {IndexedDBStorageAdapter} from "@automerge/automerge-repo-storage-indexeddb"
// import {Repo} from "@automerge/automerge-repo"

export default function createRepo() {
	const network = new WebSocketClientAdapter("wss://galaxy.observer")

	return new Repo({
		network: globalThis?.process?.env?.BUILDING ? [] : [network],
		storage: isServer ? undefined : new IndexedDBStorageAdapter("repo"),
		enableRemoteHeadsGossiping: true,
	})
}
