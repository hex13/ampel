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
			handler(value);
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
}

export function get(state) {
	if (state instanceof State) {
		return state.get();
	}
	throw new Error(`cannot get from ${String(state)}`);
}

export function set(state, value) {
	if (state instanceof State) {
		return state.set(value);
	}
	throw new Error(`cannot set ${String(state)}`);
}

export function on(state, handler, metadata) {
	if (state instanceof State) {
		return state.on(handler, metadata);
	}
	throw new Error(`cannot subscribe to ${String(state)}`);
}

export function once(state, handler, metadata) {
	if (state instanceof State) {
		return state.once(handler, metadata);
	}
	throw new Error(`cannot subscribe once to ${String(state)}`);
}

export function off(state, handler) {
	if (state instanceof State) {
		return state.off(handler);
	}
	throw new Error(`cannot unsubscribe from ${String(state)}`);
}


export function pipe(src, dest, mapper) {
	const handler = value => {
		set(dest, mapper(value));
	};
	on(src, handler);
	return () => {
		off(src, handler);
	}
};

export function map(state, handler, meta) {
	if (state instanceof State) {
		const mapped = new State(state.get());
		Object.assign(mapped.meta(), {
			...meta,
			kind: 'map',
			source: state,
		});
		mapped.stop = pipe(state, mapped, handler);
		state.meta().mapped.push(mapped);
		return mapped;
	}
	throw new Error(`cannot map ${String(state)}`);
}

