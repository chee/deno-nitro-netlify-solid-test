import {For, mapArray, type Component} from "solid-js"
import createRepo from "./repo.ts"
import type {AutomergeUrl} from "@automerge/automerge-repo"
import {makeDocumentProjection} from "solid-automerge"

const repo = createRepo()
const handle = await repo.find<{
	title: string
	items: {title: string; complete?: Date}[]
}>("automerge:eotaLiXw74by35jy5JEti3k1NEr" as AutomergeUrl)
const App: Component = () => {
	const doc = makeDocumentProjection<{
		title: string
		items: {title: string; complete?: Date}[]
	}>(handle as any)

	return (
		<div>
			<h1>{doc?.title}</h1>
			<ul>
				<For each={doc.items}>
					{(item, i) => {
						return (
							<li>
								<input
									type="checkbox"
									checked={!!item?.complete}
									onChange={e => {
										handle?.change(project => {
											const item = project.items[i()]
											if (!item) return
											if (e.currentTarget.checked) {
												item.complete = new Date()
											} else {
												delete item.complete
											}
										})
									}}
								/>
								{item?.title}
							</li>
						)
					}}
				</For>
			</ul>
		</div>
	)
}

export default App
