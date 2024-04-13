const getHandler = listener => listener.handler;
const createListener = handler => ({ handler });

export class State {
	#data;
	#meta;
	#listeners = [];
	#invokeListeners() {
		this.#listeners.forEach(listener => {
			const handler = getHandler(listener);
			const value = this.#data;
			if (typeof handler == 'function') {
				handler(value);
			} else {
				handler.target.set(handler.mapper(value));
			}
		});
		this.#listeners = this.#listeners.filter(l => !l.once);
	}
	constructor(initial, meta = {}) {
		this.#data = initial;
		this.#meta = {
			mapped: [],
			...meta,
		};
	}
	meta() {
		return this.#meta;
	}
	get() {
		return this.#data;
	}
	set(v) {
		this.#data = v;
		this.#invokeListeners();
	}
	on(handler, meta = {}) {
		const listener = createListener(handler);
		Object.assign(listener, meta);
		this.#listeners.push(listener);
	}
	once(handler, meta = {}) {
		this.on(handler, {...meta, once: true});
	}
	listener(handler) {
		return this.#listeners.find(l => getHandler(l) === handler);
	}
	off(target) {
		const idx = this.#listeners.findIndex(l => {
			return getHandler(l) === target || target === l.handler.target;
		});
		if (idx >= 0) {
			this.#listeners.splice(idx, 1);
		}
	}
	then(handler) {
		this.once(handler);
	}
	map(handler, meta = {}) {
		const mapped = new State(this.get(), {kind: 'map', source: this, ...meta});
		const mapper = {
			target: mapped,
			mapper: handler,
		};
		this.on(mapper);
		this.#meta.mapped.push(mapped);
		return mapped;
	}
}

export function get(state) {
	if (state instanceof State) {
		return state.get();
	}
	throw new Error(`cannot get from ${String(state)}`);
}