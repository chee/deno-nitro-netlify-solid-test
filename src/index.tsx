/* @refresh reload */
import {hydrate, render} from "solid-js/web"

import App from "./app.tsx"

if (globalThis?._$HY) {
	hydrate(() => <App />, globalThis.document)
} else if (globalThis?.document) {
	const el = globalThis?.document?.getElementById("app")
	if (el) {
		render(() => <App />, el)
	}
}
