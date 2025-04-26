/* @refresh reload */
import {hydrate, render} from "solid-js/web"

import App from "./app.tsx"

hydrate(() => <App />, globalThis.document)
