export function subscribe(signal, cb) {
	signal.subscribe(cb);
}

export function isSignal(thing) {
	return !!thing?.isSignal;
}

export function Signal(initial) {
	let value = initial;
	let listeners = [];
	const s = (...args) => {
		if (args.length == 0) return value;
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
	s.then = (cb) => {
		listeners.push({ cb, once: true });
	};
	return s;
}

export function fromEventTarget(target) {
	const signals = Object.create(null);
	return (eventType) => {
		if (signals[eventType]) return signals[eventType];
		const s = Signal();
		target.addEventListener(eventType, (v) =>{
			s(v);
		});
		signals[eventType] = s;
		return s;
	};
}
