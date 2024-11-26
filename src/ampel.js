export function subscribe(signal, cb) {
	signal.subscribe(cb);
}

export function isSignal(thing) {
	return !!thing?.isSignal;
}

export function delay(duration) {
	return new Promise(r => setTimeout(r, duration));
}


export async function loop(f) {
	while (true) {
		try {
			await f();
		} catch (e) {
			console.log("err", e);
		}
		await delay(0); // to prevent freezing the browser
	}
}

export function cancel(signal, reason) {
	if (signal.cancel) {
		signal.cancel(reason);
	} else {
		Object.values(signal.signals || signal).forEach(s => s.cancel(reason));
	}
}

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
			s(v);
		});
		return s;
	}

}

export async function* takeUntil(when, until) {
	let ended = false;
	while (!ended) {
		const e = await Promise.any([
			when,
			Promise.resolve(until).then(e => {
				ended = true;
				return e;
			}),
		]);
		yield e;
	}
}

export async function* drag(on) {
	const e = await on('pointerdown');
	e.target.setPointerCapture(e.pointerId);
	yield e;
	for await (const e of takeUntil(on('pointermove'), on('pointerup'))) {
		yield e;
	}
}

export function MultiSignal(subscribe) {
	const ms = (eventType) => {
		if (ms.signals[eventType] && !ms.signals[eventType].cancelled) return ms.signals[eventType];
		const s = new Signal();
		subscribe(eventType, s);
		ms.signals[eventType] = s;
		return s;
	};
	ms.signals = Object.create(null);
	return ms;
}

export function fromEventTarget(target) {
	return MultiSignal((eventType, s) => {
		target.addEventListener(eventType, (v) => {
			s.set(v);
		});
	});
}

export async function* map(mapper, it) {
	for await (const value of it) {
		yield mapper(value);
	}
}


export async function* pairs(it) {
	let last;
	for await (const value of it) {
		if (last != undefined) {
			yield [last, value];
		}
		last = value;
	}
}
