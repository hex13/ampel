export class Signal {
	isSignal = true;
	listeners = [];
	cancelled = false;
	eventSignals = Object.create(null);
	on = (type) => {
		if (this.eventSignals[type]) return this.eventSignals[type];
		this.root.doListen(type);
		const s = this.filter(v => v.type == type);
		this.eventSignals[type] = s;
		return s;
	}
	constructor(initial) {
		this.value = initial;
		this.root = this;
		this.derived = [];
	}
	// virtual method that could be implemented for customization of method .on()
	doListen() {
	}
	get() {
		return this.value;
	}
	set(value) {
		if (this.cancelled) return;
		this.value = value;
		this.listeners = this.listeners.filter(({ cb, once }) => {
			cb(value);
			return !once;
		});
	}
	subscribe(cb) {
		this.listeners.push({ cb });
	}
	then(cb, reject) {
		this.listeners.push({ cb, reject, once: true });
	}
	transform(f) {
		const s = new Signal();
		s.root = this;
		this.derived.push(s);
		this.subscribe(v => {
			f(s, v);
		});
		return s;
	}
	map(f) {
		return this.transform((s, v) => {
			s.set(f(v));
		});
	}
	fork() {
		return this.map(v => v);
	}
	filter(f) {
		return this.transform((s, v) => {
			if (f(v)) s.set(v);
		});
	}
	cancel(reason) {
		this.cancelled = true;
		this.listeners.forEach(l => {
			l.reject && l.reject(reason);
		});
		this.derived.forEach(s => {
			s.cancel(reason);
		});
	}
	static fromEventTarget(eventTarget) {
		const s = new Signal();
		s.doListen = (type) => {
			eventTarget.addEventListener(type, (e) => {
				s.set(e);
			});
		};
		return s;
	}
	static fromPromise(promise) {
		const s = new Signal();
		promise.then(v => {
			s.set(v);
		});
		return s;
	}
}