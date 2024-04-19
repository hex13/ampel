const createListener = handler => ({ handler });
const MULTISIGNAL = Symbol('MULTISIGNAL');

function invokeListeners(listeners, value) {
	listeners.forEach(listener => {
		listener.handler(value);
	});
	return listeners.filter(l => !l.once);
}

export class Signal {
	#listeners = [];
	constructor(initial, meta = {}) {
		this.value = initial;
		this.meta = {
			deps: [],
			sinks: [],
			pipes: [],
			isDirty: false,
			onInvalidate: () => {
				this.value = this.compute();
				this.#listeners = invokeListeners(this.#listeners, this.value);
				this.meta.isDirty = false;
			},
			...meta,
		};
	}
	invalidate() {
		this.meta.isDirty = true;
		this.meta.sinks.forEach(sink => {
			sink.invalidate();
		});
	}
	compute() {
		return this.value;
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
		return this.#listeners.find(l => l.handler === handler);
	}
	off(handler) {
		this.#listeners = this.#listeners.filter(l => l.handler !== handler);
	}
	then(handler) {
		this.once(handler);
	}
	update() {
		if (this.meta.isDirty) {
			this.value = this.compute();
			this.meta.isDirty = false;
		}
	}
}


export function MultiSignal(initial) {
	const multiSignal = new Signal({});
	const state = {...initial};
	const signals = {};
	for (const k in initial) {
		signals[k] = new Signal(initial[k]);
		on(signals[k], x => {
			state[k] = x;
			set(multiSignal, state);
		});
	}
	signals[MULTISIGNAL] = multiSignal;
	return signals;
}

export function get(state) {
	if (state instanceof Signal) {
		return state.value;
	}
	throw new Error(`cannot get from ${String(state)}`);
}

export function set(state, value) {
	if (state instanceof Signal) {
		state.value = value;
		invalidate(state);
		return;
	}
	throw new Error(`cannot set ${String(state)}`);
}

export function on(state, handler, metadata) {
	if (state instanceof Signal) {
		return state.on(handler, metadata);
	}
	if (state[MULTISIGNAL]) {
		return state[MULTISIGNAL].on(handler, metadata);
	}
	throw new Error(`cannot subscribe to ${String(state)}`);
}

export function once(state, handler, metadata) {
	if (state instanceof Signal) {
		return state.once(handler, metadata);
	}
	throw new Error(`cannot subscribe once to ${String(state)}`);
}

export function off(state, handler) {
	if (state instanceof Signal) {
		return state.off(handler);
	}
	throw new Error(`cannot unsubscribe from ${String(state)}`);
}

export function pipe(src, dest) {
	const handler = value => {
		invalidate(dest);
	};
	src.meta.sinks.push(dest);
	on(src, handler);
	return () => {
		off(src, handler);
	}
};

export function map(state, handler, meta) {
	if (state instanceof Signal) {
		return computed(get => handler(get(state)));
	}
	throw new Error(`cannot map ${String(state)}`);
}

export function computed(f) {
	const s = new Signal();

	const deps = s.meta.deps;
	const _get = (source) => {
		// TODO check if some deps are not needed anymore after next computation
		if (!deps.includes(source)) {
			deps.push(source);
			s.meta.pipes.push(pipe(source, s));
		}
		return get(source);
	}
	const compute = () => {
		return f(_get);
	};
	set(s, f(_get));
	s.compute = () => f(get);
	return s;
}

export function detach(state) {
	state.meta.pipes.forEach(stop => {
		stop();
	});
	state.meta.deps.length = 0;
}

export function invalidate(state) {
	state.invalidate();
	state.meta.onInvalidate(state.value);
}
// 140 ; 127 ; 122 ; 121 ; 131