import * as assert from 'node:assert';
import * as sinon from 'sinon';
import * as A from '../src/ampel.js';

const getValue = (s) => s.get();
const setValue = (s, v) => s.set(v);

describe('Listener', () => {
	it('from EventTarget', async () => {
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

	it('Listener: .map()', () => {
		const eventTarget = new EventTarget();
		const original = new A.Listener(eventTarget);
		const mapped1 = original.map(e => ({text: e.abc}));
		const mapped2 = original.map(e => ({$: e.price}));
		const spy1 = sinon.spy();
		const spy2 = sinon.spy();
		mapped1.on('cat').subscribe(spy1);
		mapped2.on('car').subscribe(spy2);

		let e;
		e = new Event('cat');
		e.abc = 'miaow';
		eventTarget.dispatchEvent(e);

		e = new Event('car');
		e.price = 200_000;
		eventTarget.dispatchEvent(e);

		assert.deepStrictEqual(spy1.args, [
			[{text: 'miaow'}],
		]);
		assert.deepStrictEqual(spy2.args, [
			[{$: 200_000}],
		]);

	});

});
