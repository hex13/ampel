import { Signal } from './Signal.js';

export class Listener {
	signals = Object.create(null);
	on = (eventType) => {
		if (this.signals[eventType] && !this.signals[eventType].cancelled) return this.signals[eventType];
		const s = new Signal();
		this.listen(eventType, s);
		this.signals[eventType] = s;
		return s;
	}

	constructor(listen) {
		this.listen = listen;
	}
	static fromEventTarget(target) {
		return new Listener((eventType, s) => {
			target.addEventListener(eventType, (v) => {
				s.set(v);
			});
		});
	}
}
