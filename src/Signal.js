export class Signal {
	isSignal = true;
	listeners = [];
	cancelled = false;
	constructor(initial) {
		this.value = initial;
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
	cancel(reason) {
		this.cancelled = true;
		this.listeners.forEach(l => {
			l.reject && l.reject(reason);
		});
	}
	static fromPromise(promise) {
		const s = new Signal();
		promise.then(v => {
			s.set(v);
		});
		return s;
	}
}