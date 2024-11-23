import * as assert from 'node:assert';
import * as A from '../src/ampel.js';

describe('Ampel', () => {
	it('initial state', () => {
		const s = new A.Signal(123);
		assert.strictEqual(s(), 123);
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
		s(456);
		assert.strictEqual(s(), 456);
	});

	it('subscribing', async () => {
		const calls = [];
		const s = new A.Signal(123);

		A.subscribe(s, (...args) => {
			calls.push(args);
		});

		s(456);
		s(789);

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

		s('something');
		s.then((v) => {
			calls.push(['then3', v]);
		});
		s('something else');

		assert.deepStrictEqual(calls, [
			['then1', 'something'],
			['then2', 'something'],
			['then3', 'something else'],
		]);

		setTimeout(() => {
			s('something different');
		}, 0);

		assert.strictEqual(await s, 'something different');
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
});

