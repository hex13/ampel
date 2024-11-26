import * as assert from 'node:assert';
import * as A from '../src/ampel.js';

const getValue = (s) => s.get();
const setValue = (s, v) => s.set(v);

describe('Ampel', () => {
	it('initial state', () => {
		const s = new A.Signal(123);
		assert.strictEqual(getValue(s), 123);
		assert.strictEqual(s.cancelled, false);
	});
	it('isSignal()', () => {
		const s = new A.Signal();
		assert.strictEqual(A.isSignal(s), true);
		assert.strictEqual(A.isSignal({}), false);
		assert.strictEqual(A.isSignal(2), false);
		assert.strictEqual(A.isSignal(null), false);
	});

	it('set & get', () => {
		const s = new A.Signal(123);
		setValue(s, 456);
		assert.strictEqual(getValue(s), 456);
	});

	it('subscribing', async () => {
		const calls = [];
		const s = new A.Signal(123);

		A.subscribe(s, (...args) => {
			calls.push(args);
		});

		setValue(s, 456);
		setValue(s, 789);

		assert.deepStrictEqual(calls, [
			[456],
			[789],
		]);
	});

	it('state is thenable', async () => {
		const calls = [];
		const s = new A.Signal(123);

		s.then((v) => {
			calls.push(['then1', v]);
		});

		s.then((v) => {
			calls.push(['then2', v]);
		});

		setValue(s, 'something');
		s.then((v) => {
			calls.push(['then3', v]);
		});
		setValue(s, 'something else');

		assert.deepStrictEqual(calls, [
			['then1', 'something'],
			['then2', 'something'],
			['then3', 'something else'],
		]);

		setTimeout(() => {
			setValue(s, 'something different');
		}, 0);

		assert.strictEqual(await s, 'something different');
	});

	it('cancellation should prevent for setting new value', async () => {
		const calls = [];
		const s = new A.Signal();
		A.subscribe(s, (v) => {
			calls.push(v);
		});
		setValue(s, 123);
		setValue(s, 456);
		const error = {text: 'some error'};
		A.cancel(s, error);
		setValue(s, 789);

		assert.strictEqual(getValue(s), 456);
	});

	it('cancellation should propagate erros', async () => {
		const values = [];
		const s = new A.Signal();

		setTimeout(() => {
			A.cancel(s, {text: 'Nevermore'});
		}, 0);
		let error = false;
		try {
			await s;
		} catch (e) {
			error = e;
		}
		assert.deepStrictEqual(error, {text: 'Nevermore'});
	});

	it('A.cancel(): cancelling multiple signals at once when given object of signals', async () => {
		const o = {
			foo: new A.Signal(),
			bar: new A.Signal(),
		};
		assert.strictEqual(o.foo.cancelled, false);
		assert.strictEqual(o.bar.cancelled, false);
		A.cancel(o);
		assert.strictEqual(o.foo.cancelled, true);
		assert.strictEqual(o.bar.cancelled, true);
	});

	it('fromEventTarget', async () => {
		const calls = [];
		const target = new EventTarget();
		const getSignal = A.fromEventTarget(target);
		A.subscribe(getSignal('foo'), v => {
			calls.push(['foo', v?.type, v?.abc]);
		});
		A.subscribe(getSignal('bar'), v => {
			calls.push(['bar', v?.type, v?.abc]);
		});
		let e;
		e = new Event('foo');
		e.abc = 123;
		target.dispatchEvent(e);
		e = new Event('bar');
		e.abc = 456;
		target.dispatchEvent(e);

		assert.deepStrictEqual(calls, [
			['foo', 'foo', 123],
			['bar', 'bar', 456],
		]);
	});

	it('fromEventTarget: caching', async () => {
		const target = new EventTarget();
		const getSignal = A.fromEventTarget(target);
		let foo1, foo2, bar;
		foo1 = getSignal('foo');
		foo2 = getSignal('foo');
		bar = getSignal('bar');
		[foo1, foo2, bar].forEach(s => {
			assert.ok(s);
			assert.ok(A.isSignal(s));
		});
		assert.strictEqual(foo1, foo2);
		assert.notStrictEqual(foo1, bar);
	});

	it('fromEventTarget: after cancellation should recreate signal', async () => {
		const target = new EventTarget();
		const getSignal = A.fromEventTarget(target);
		let foo1, foo2, foo3;
		foo1 = getSignal('foo');
		foo2 = getSignal('foo');
		A.cancel(foo1);
		foo3 = getSignal('foo');

		assert.strictEqual(foo1, foo2);
		assert.notStrictEqual(foo1, foo3);
	});

	it('MultiSignal: cancelling multiple signals at once', async () => {
		const target = new EventTarget();
		const multiSignal = A.MultiSignal(() => {});
		const foo = multiSignal('foo');
		const bar = multiSignal('foo');

		assert.strictEqual(foo.cancelled, false);
		assert.strictEqual(bar.cancelled, false);
		A.cancel(multiSignal);
		assert.strictEqual(foo.cancelled, true);
		assert.strictEqual(bar.cancelled, true);
	});

	it('cancelling object of signals should pass reason to these signals', async () => {
		const errors = {};
		const signals = {
			foo: new A.Signal(),
			bar: new A.Signal(),
		};
		setTimeout(() => {
			A.cancel(signals, {text: 'Nevermore.'});
		}, 0);
		const p1 = (async () => {
			let error;
			try {
				await signals.foo;
			} catch (e) {
				errors.foo = e;
			}
		})();
		const p2 = (async () => {
			let error;
			try {
				await signals.bar;
			} catch (e) {
				errors.bar = e;
			}
		})();

		await Promise.all([p1, p2]);
		assert.deepStrictEqual(errors, {
			foo: {text: 'Nevermore.'},
			bar: {text: 'Nevermore.'},
		});
	});

});

