import {Repo} from "@automerge/automerge-repo"
import {BrowserWebSocketClientAdapter} from "@automerge/automerge-repo-network-websocket"
import {isServer} from "solid-js/web"
import {IndexedDBStorageAdapter} from "@automerge/automerge-repo-storage-indexeddb"
export default function createRepo() {
	return new Repo({
		network: [new BrowserWebSocketClientAdapter("wss://galaxy.observer")],
		storage: isServer ? undefined : new IndexedDBStorageAdapter("repo"),
		enableRemoteHeadsGossiping: true,
	})
}
