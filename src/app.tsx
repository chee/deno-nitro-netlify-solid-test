import {For, type Component} from "solid-js"
import {createStore} from "solid-js/store"
import {makePersisted} from "@solid-primitives/storage"

const App: Component = () => {
	const [project, update] = makePersisted(
		createStore<{
			title: string
			items: {title: string; complete?: Date}[]
		}>({
			title: "My project",
			items: [
				{title: "Item 1"},
				{title: "Item 2", complete: new Date()},
				{title: "Item 3"},
			],
		}),
		{
			name: "project",
		}
	)

	return (
		<div>
			<h1>{project.title}</h1>
			<ul>
				<For each={project.items}>
					{(item, i) => {
						return (
							<li>
								<input
									type="checkbox"
									checked={!!item?.complete}
									onChange={e => {
										if (e.currentTarget.checked) {
											update("items", i(), "complete", new Date())
										} else {
											update("items", i(), "complete", undefined)
										}
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
