const getHandler = listener => listener.handler;
const createListener = handler => ({ handler });

export class State {
	#meta;
	#listeners = [];
	#invokeListeners() {
		this.#listeners.forEach(listener => {
			const handler = getHandler(listener);
			handler(this.value);
		});
		this.#listeners = this.#listeners.filter(l => !l.once);
	}
	constructor(initial, meta = {}) {
		this.value = initial;
		this.#meta = {
			mapped: [],
			deps: [],
			pipes: [],
			onSet: () => {
				this.#invokeListeners();
			},
			...meta,
		};
	}
	meta() {
		return this.#meta;
	}
	get() {
		return this.value;
	}
	set(v) {
		this.value = v;
		this.meta().onSet(v);
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
		return computed(get => handler(get(state)));
	}
	throw new Error(`cannot map ${String(state)}`);
}

export function computed(f) {
	const s = new State();

	const deps = s.meta().deps;
	const _get = (source) => {
		// TODO check if some deps are not needed anymore after next computation
		if (!deps.includes(source)) {
			deps.push(source);
			s.meta().pipes.push(pipe(source, s, compute));
		}
		return get(source);
	}
	const compute = () => {
		return f(_get);
	};
	set(s, compute());
	return s;
}

export function detach(state) {
	state.meta().pipes.forEach(stop => {
		stop();
	});
	state.meta().deps.length = 0;
}