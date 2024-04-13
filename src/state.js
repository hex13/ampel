const getHandler = listener => listener.handler;
const createListener = handler => ({ handler });

export class State {
	#data;
	#meta;
	#listeners = [];
	#invokeListeners() {
		this.#listeners.forEach(listener => {
			getHandler(listener)(this.#data);
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
	off(handler) {
		const idx = this.#listeners.findIndex(l => getHandler(l) === handler);
		if (idx >= 0) {
			this.#listeners.splice(idx, 1);
		}
	}
	then(handler) {
		this.once(handler);
	}
	map(handler, meta = {}) {
		const mapped = new State(this.get(), {kind: 'map', source: this, ...meta});
		const mapper = v => {
			mapped.set(handler(v));
		};
		mapped.meta().mapper = mapper;
		this.on(mapper);
		this.#meta.mapped.push(mapped);
		return mapped;
	}
}