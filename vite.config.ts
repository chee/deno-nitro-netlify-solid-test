import {defineConfig} from "vite"
import solidPlugin from "vite-plugin-solid"
import nitro from "@analogjs/vite-plugin-nitro"
import wasm from "vite-plugin-wasm"

export default defineConfig({
	plugins: [
		wasm(),
		solidPlugin({ssr: true}),
		nitro(
			{
				ssr: true,
				entryServer: "src/main.server.tsx",
			},
			{
				preset: "netlify-edge",
				compatibilityDate: "2025-04-01",
				output: {
					dir: ".output",
					publicDir: ".output/public",
				},

				experimental: {
					wasm: true,
					bundleRuntimeDependencies: false,
				},
			}
		),
	],
	server: {port: 3000},
	build: {
		outDir: "dist/client",
		target: "esnext",
	},
})
