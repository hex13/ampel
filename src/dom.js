import { Signal, get, on } from './signal.js';

export function mount(container, params, createElement = document.createElement.bind(document)) {
	const el = createElement(params.type);
	if (params.text) {
		if (params.text instanceof Signal) {
			el.innerText = get(params.text);
			on(params.text, x => {
				el.innerText = x;
			});
		} else {
			el.innerText = params.text;
		}
	}
	container.append(el);
	if (params.events) {
		for (const k in params.events) {
			el.addEventListener(k, params.events[k]);
		}
	}
	if (params.children) {
		params.children.forEach(child => {
			mount(el, child, createElement);
		});
	}
}
