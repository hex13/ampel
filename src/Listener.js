import { Signal } from './Signal.js';

export class Listener {
	signals = Object.create(null);
	on = (eventType) => {
		const s = this.getSignal(eventType);
		this.listen(eventType, s);
		this.signals[eventType] = s;
		return s;
	}
	listen(eventType, s) {
		this.target.addEventListener(eventType, (e) => {
			this.signal.set(e);
		});
	}
	getSignal(eventType) {
		if (this.signals[eventType] && !this.signals[eventType].cancelled) return this.signals[eventType];
		return new Signal();
	}
	constructor(target, signal = new Signal()) {
		this.target = target;
		signal.subscribe(e => {
			this.getSignal(e.type).set(e);
		});
		this.signal = signal;
	}
	map(f) {
		const listener = new Listener(null, this.signal.map(f));
		listener.listen = () => {};
		listener.on = (eventType) => {
			return this.on(eventType).map(f);
		};
		return listener;
	}
}
