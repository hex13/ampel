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
	on(handler) {
		this.#listeners.push(createListener(handler));
	}
	once(handler) {
		this.#listeners.push({
			...createListener(handler),
			once: true,
		});
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
}