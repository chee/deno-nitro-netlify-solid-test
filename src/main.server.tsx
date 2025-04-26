import {generateHydrationScript, renderToString} from "solid-js/web"
import App from "./app.tsx"

const app = renderToString(() => <App />)

// deno-lint-ignore require-await
export default async function render(_url: string, template: string) {
	const html = template
		.replace("<!-- app -->", app)
		.replace("<!-- hydrate -->", generateHydrationScript())

	return html
}
