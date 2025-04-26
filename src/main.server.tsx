import {
	generateHydrationScript,
	renderToString,
	renderToStringAsync,
} from "solid-js/web"
import App from "./app.tsx"

const app = renderToStringAsync(() => <App />)

// deno-lint-ignore require-await
export default async function render(_url: string, template: string) {
	const html = template
		.replace("<!-- app -->", await app)
		.replace("<!-- hydrate -->", generateHydrationScript())

	return html
}
