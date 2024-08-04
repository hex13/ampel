export const DELTAS = Symbol('DELTAS');
export const LISTENERS = Symbol('LISTENERS');

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