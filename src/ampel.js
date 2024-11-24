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

export function Signal(initial) {
	let value = initial;
	let listeners = [];
	const s = (...args) => {
		if (args.length == 0) return value;
		if (s.cancelled) return;
		value = args[0];
		listeners = listeners.filter(({ cb, once }) => {
			cb(value);
			return !once;
		});
	};
	s.isSignal = true;
	s.subscribe = (cb) => {
		listeners.push({ cb });
	};
	s.then = (cb, reject) => {
		listeners.push({ cb, reject, once: true });
	};
	s.cancel = (reason) => {
		s.cancelled = true;
		listeners.forEach(l => {
			l.reject && l.reject(reason);
		});
	};
	s.cancelled = false;
	return s;
}

export function MultiSignal(subscribe) {
	const ms = (eventType) => {
		if (ms.signals[eventType] && !ms.signals[eventType].cancelled) return ms.signals[eventType];
		const s = Signal();
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
			s(v);
		});
	});
}
