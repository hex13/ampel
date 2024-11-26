import { MultiSignal, get, set, on } from './signal.js';

const STATE = Symbol('STATE');
const SIGNALS = Symbol('SIGNALS');

export function State(initial) {
	const multiSignal = MultiSignal(initial);
	return new Proxy(multiSignal, {
		get(target, key, v) {
			if (key === SIGNALS) {
				return target;
			}
			if (typeof key == 'symbol') {
				return target[key];
			}
			return get(target[key]);
		},
		set(target, key, value) {
			set(target[key], value);
			return true;
		}
	});
}

export function onProp(state, prop, handler) {
	on(state[SIGNALS][prop], handler);
}