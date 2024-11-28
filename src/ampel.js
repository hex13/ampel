import { Signal } from './Signal.js';

export { Signal } from './Signal.js';
export * from './transforms.js';


export function subscribe(signal, cb) {
	signal.subscribe(cb);
}


// TODO: move isSignal to Signal class as static method
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

// TODO: move takeUntil to Signal class
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

