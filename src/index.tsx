/* @refresh reload */
import {hydrate} from "solid-js/web"

import App from "./app.tsx"

hydrate(() => <App />, globalThis.document)
