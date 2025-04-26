import {Repo, initializeBase64Wasm} from "@automerge/automerge-repo/slim"
import {automergeWasmBase64} from "@automerge/automerge/automerge.wasm.base64.js"

import {WebSocketClientAdapter} from "@automerge/automerge-repo-network-websocket"
import {isServer} from "solid-js/web"
import {IndexedDBStorageAdapter} from "@automerge/automerge-repo-storage-indexeddb"

await initializeBase64Wasm(automergeWasmBase64)
export default function createRepo() {
	return new Repo({
		network: globalThis?.process?.env?.BUILDING
			? []
			: [new WebSocketClientAdapter("wss://galaxy.observer")],
		storage: isServer ? undefined : new IndexedDBStorageAdapter("repo"),
		enableRemoteHeadsGossiping: true,
	})
}
