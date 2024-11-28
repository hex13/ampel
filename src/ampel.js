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

export function Listener(listen) {
	const ms = (eventType) => {
		if (ms.signals[eventType] && !ms.signals[eventType].cancelled) return ms.signals[eventType];
		const s = new Signal();
		listen(eventType, s);
		ms.signals[eventType] = s;
		return s;
	};
	ms.signals = Object.create(null);
	return ms;
}

export function fromEventTarget(target) {
	return new Listener((eventType, s) => {
		target.addEventListener(eventType, (v) => {
			s.set(v);
		});
	});
}


