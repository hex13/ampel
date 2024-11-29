import { Signal } from './Signal.js';

export class Listener {
	signals = Object.create(null);
	on = (eventType) => {
		const s = this.getSignal(eventType);
		this.listen(eventType, s);
		this.signals[eventType] = s;
		return s;
	}
	getSignal(eventType) {
		if (this.signals[eventType] && !this.signals[eventType].cancelled) return this.signals[eventType];
		return new Signal();
	}
	constructor(listen, signal = new Signal()) {
		this.listen = listen;
		signal.subscribe(e => {
			this.getSignal(e.type).set(e);
		});
		this.signal = signal;
	}
	static fromEventTarget(target) {
		return new Listener(function (eventType, s) {
			target.addEventListener(eventType, (e) => {
				this.signal.set(e);
			});
		});
	}
}
