const getHandler = listener => listener.handler;
const createListener = handler => ({ handler });

export class State {
	#data;
	#listeners = [];
	#invokeListeners() {
		this.#listeners.forEach(listener => {
			getHandler(listener)(this.#data);
		});
		this.#listeners = this.#listeners.filter(l => !l.once);
	}
	constructor(initial) {
		this.#data = initial;
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
	meta(handler) {
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
	map(handler) {
		const mapped = new State(this.get());
		mapped.source = this;
		this.on(v => {
			mapped.set(handler(v));
		});
		return mapped;
	}
}