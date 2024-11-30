import * as assert from 'node:assert';
import * as A from '../src/ampel.js';

const getValue = (s) => s.get();
const setValue = (s, v) => s.set(v);

describe('Ampel', () => {
	it('fromEventTarget', async () => {
		const calls = [];
		const target = new EventTarget();
		const listener = new A.Listener(target);
		A.subscribe(listener.on('foo'), v => {
			calls.push(['foo', v?.type, v?.abc]);
		});
		A.subscribe(listener.on('bar'), v => {
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
		const listener = new A.Listener(target);
		let foo1, foo2, bar;
		foo1 = listener.on('foo');
		foo2 = listener.on('foo');
		bar = listener.on('bar');
		[foo1, foo2, bar].forEach(s => {
			assert.ok(s);
			assert.ok(A.isSignal(s));
		});
		assert.strictEqual(foo1, foo2);
		assert.notStrictEqual(foo1, bar);
	});

	it('fromEventTarget: after cancellation should recreate signal', async () => {
		const target = new EventTarget();
		const listener = new A.Listener(target);
		let foo1, foo2, foo3;
		foo1 = listener.on('foo');
		foo2 = listener.on('foo');
		A.cancel(foo1);
		foo3 = listener.on('foo');

		assert.strictEqual(foo1, foo2);
		assert.notStrictEqual(foo1, foo3);
	});

	it('Listener: cancelling multiple signals at once', async () => {
		const target = new EventTarget();
		const listener = new A.Listener({
			addEventListener() {},
		});
		const foo = listener.on('foo');
		const bar = listener.on('foo');

		assert.strictEqual(foo.cancelled, false);
		assert.strictEqual(bar.cancelled, false);
		A.cancel(listener);
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
