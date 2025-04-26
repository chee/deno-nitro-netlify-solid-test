import {For, mapArray, type Component} from "solid-js"
import createRepo from "./repo.ts"
import {useDocument} from "solid-automerge"
import type {AutomergeUrl} from "@automerge/automerge-repo"

const App: Component = () => {
	const repo = createRepo()

	const [doc, handle] = useDocument<{
		title: string
		items: AutomergeUrl[]
	}>("automerge:2FDkQ385GeeVP5JRenfqb4Xw3uDq" as AutomergeUrl, {repo})

	const items = mapArray(
		() => doc()?.items,
		item => useDocument<{title: string; complete?: Date}>(item, {repo})
	)

	return (
		<div>
			<pre>{JSON.stringify(handle)}</pre>
			<h1>{doc()?.title}</h1>
			<ul>
				<For each={items()}>
					{([item, itemHandle], i) => {
						console.log(item())
						return (
							<li>
								<input
									type="checkbox"
									checked={!!item()?.complete}
									onChange={e => {
										handle()?.change(project => {
											const item = project.items[i()]
											if (!item) return
											if (e.currentTarget.checked) {
												item().complete = new Date()
											} else {
												delete item().complete
											}
										})
									}}
								/>
								{item()?.title}
							</li>
						)
					}}
				</For>
			</ul>
		</div>
	)
}

export default App
