export class Signal {
	isSignal = true;
	listeners = [];
	cancelled = false;
	constructor(initial) {
		this.value = initial;
		this.root = this;
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
	}
	on(type) {
		this.root.doListen(type);
		return this.filter(v => v.type == type);
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