export const DELTAS = Symbol('DELTAS');
export const LISTENERS = Symbol('LISTENERS');

function Atom() {
	let resolve, promise;
	const trigger = (value) => {
		resolve && resolve(value);
		promise = new Promise(r => resolve = r);
	};
	trigger();
	return {
		then: (...args) => promise.then(...args),
		trigger,
	};
};

export function State(obj, opts = {}) {
	const onUpdate = opts.onUpdate || (() => {});
	const listeners = Object.create(null);
	let scheduledUpdate;
	let deltas = [];
	let changes = Object.create(null);
	return new Proxy(obj, {
		get(target, prop) {
			if (prop == DELTAS) return deltas;
			if (prop == LISTENERS) return listeners;
			if (typeof prop == 'string' && typeof target['$' + prop] == 'function') {
				return target['$' + prop]();
			}
			return target[prop];
		},
		set(target, prop, value) {
			target[prop] = value;
			deltas.push([prop, value])
			changes[prop] = value;
			if (!scheduledUpdate) {
				scheduledUpdate = Promise.resolve().then(() => {
					onUpdate(deltas);
					Object.entries(changes).forEach(([p, v]) => {
						if (listeners[p]) listeners[p](v);
					});

					deltas = [];
					scheduledUpdate = null;
				});
			}
			return true;
		}
	});
}

export function on(state, prop, f) {
	state[LISTENERS][prop] = f;
}

export function once(state, prop, f) {
	let listener = state[LISTENERS][prop];
	if(!listener) {
		const atom = Atom();
		listener = state[LISTENERS][prop] = (v) => {
			atom.trigger(v);
		};
		listener.atom = atom;
	}
	return listener.atom;
}