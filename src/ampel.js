export function subscribe(signal, cb) {
	signal.subscribe(cb);
}

export function isSignal(thing) {
	return !!thing?.isSignal;
}

export function cancel(signal, reason) {
	if (signal.cancel) {
		signal.cancel(reason);
	} else if (signal && typeof signal == 'object') {
		Object.values(signal).forEach(s => s.cancel());
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
	const signals = Object.create(null);
	const ms = (eventType) => {
		if (signals[eventType] && !signals[eventType].cancelled) return signals[eventType];
		const s = Signal();
		subscribe(eventType, s);
		signals[eventType] = s;
		return s;
	};
	ms.cancel = () => {
		Object.values(signals).forEach(s => {
			cancel(s);
		});
	};
	return ms;
}

export function fromEventTarget(target) {
	return MultiSignal((eventType, s) => {
		target.addEventListener(eventType, (v) => {
			s(v);
		});
	});
}

