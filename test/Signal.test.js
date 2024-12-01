import * as assert from 'node:assert';
import * as A from '../src/ampel.js';
import * as sinon from 'sinon';
const getValue = (s) => s.get();
const setValue = (s, v) => s.set(v);

const { Signal } = A;

describe('Signal', () => {
	it('initial state', () => {
		const s = new A.Signal(123);
		assert.strictEqual(getValue(s), 123);
	});

	it('initial state', () => {
		const s = new A.Signal(123);
		assert.strictEqual(getValue(s), 123);
		assert.strictEqual(s.cancelled, false);
		assert.strictEqual(s.root, s);
		assert.deepStrictEqual(s.derived, []);
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
		const s = new A.Signal(123);
		const spy = sinon.spy();
		A.subscribe(s, spy);

		setValue(s, 456);
		setValue(s, 789);

		assert.deepStrictEqual(spy.args, [
			[456],
			[789],
		]);
	});

	it('state is thenable', async () => {
		const s = new A.Signal(123);
		const then1 = sinon.spy();
		const then2 = sinon.spy();
		const then3 = sinon.spy();

		s.then(then1);
		s.then(then2);
		setValue(s, 'something');

		s.then(then3);
		setValue(s, 'something else');

		assert.deepStrictEqual(then1.args, [['something']]);
		assert.deepStrictEqual(then2.args, [['something']]);
		assert.deepStrictEqual(then3.args, [['something else']]);

		setTimeout(() => {
			setValue(s, 'something different');
		}, 0);

		assert.strictEqual(await s, 'something different');
	});

	it('.transform() should set .derived', async () => {
		const a = new Signal();
		const b = a.transform(() => {});
		const c = a.transform(() => {});
		const d = a.map(() => {});
		const e = a.map(() => {});
		const f = a.filter(() => {});
		const g = a.filter(() => {});

		assert.strictEqual(a.derived.length, 6);
		assert.strictEqual(a.derived[0], b);
		assert.strictEqual(a.derived[1], c);
		assert.strictEqual(a.derived[2], d);
		assert.strictEqual(a.derived[3], e);
		assert.strictEqual(a.derived[4], f);
		assert.strictEqual(a.derived[5], g);
	});

	it('.transform()', async () => {
		const a = new Signal();
		const b = a.transform((s, v) => {
			assert.strictEqual(s, b);
			s.set(v);
			s.set(v + 1);
		});

		assert.ok(b instanceof Signal);
		assert.notStrictEqual(b, a);
		assert.strictEqual(b.root, a);

		const values = [];
		b.subscribe(v => {
			values.push(v);
		})
		a.set(1);
		a.set(13);
		a.set(-2);
		assert.deepStrictEqual(values, [1, 2, 13, 14, -2, -1]);
	});

	it('.map()', async () => {
		const a = new Signal();
		const b = a.map(x => x * 3);

		assert.ok(b instanceof Signal);
		assert.notStrictEqual(b, a);
		assert.strictEqual(b.root, a);
		assert.strictEqual(a.derived.length, 1);
		assert.strictEqual(a.derived[0], b);

		const values = [];
		b.subscribe(v => {
			values.push(v);
		})
		a.set(1);
		a.set(13);
		a.set(-2);
		assert.deepStrictEqual(values, [3, 39, -6]);
	});

	it('.filter()', async () => {
		const a = new Signal();
		const b = a.filter(x => x % 2 == 1);

		assert.ok(b instanceof Signal);
		assert.notStrictEqual(b, a);
		assert.strictEqual(b.root, a);
		assert.strictEqual(a.derived.length, 1);
		assert.strictEqual(a.derived[0], b);

		const values = [];
		b.subscribe(v => {
			values.push(v);
		});
		a.set(1);
		a.set(2);
		a.set(4);
		a.set(7);
		a.set(11);
		assert.deepStrictEqual(values, [1, 7, 11]);
	});

	it('cancellation should prevent for setting new value', async () => {
		const s = new A.Signal();
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

	it('Signal: .cancel() should cancel derived signals', async () => {
		const a = new Signal();
		const b = a.transform(x => x);
		const c = a.filter(x => x);
		const d = a.map(x => x);
		const e = a.map(x => x).filter(x => x);
		assert.strictEqual(a.cancelled, false);
		assert.strictEqual(b.cancelled, false);
		assert.strictEqual(c.cancelled, false);
		assert.strictEqual(d.cancelled, false);
		assert.strictEqual(e.cancelled, false);
		a.cancel();
		assert.strictEqual(a.cancelled, true);
		assert.strictEqual(b.cancelled, true);
		assert.strictEqual(c.cancelled, true);
		assert.strictEqual(d.cancelled, true);
		assert.strictEqual(e.cancelled, true);
	});

	it('Signal: .on()', () => {
		const s = new Signal();
		const { on } = s; // for testing `this` binding
		const root = {
			doListen: sinon.spy(),
		};
		s.root = root;
		s.doListen = sinon.spy();
		const onFoo = s.on('foo');
		const onFoo2 = s.on('foo');
		assert.strictEqual(onFoo, onFoo2);

		const onBar = on('bar');
		const fooSpy = sinon.spy();
		const barSpy = sinon.spy();
		onFoo.subscribe(fooSpy);
		onBar.subscribe(barSpy);
		assert.ok(onFoo instanceof Signal);
		assert.ok(onBar instanceof Signal);
		s.set({type: 'foo', a: 1});
		s.set({type: 'bar', a: 3})
		s.set({type: 'foo', a: 2});

		assert.deepStrictEqual(fooSpy.args, [
			[{type: 'foo', a: 1}],
			[{type: 'foo', a: 2}],
		]);
		assert.deepStrictEqual(barSpy.args, [
			[{type: 'bar', a: 3}],
		]);
		assert.deepStrictEqual(s.doListen.args.length, 0);
		assert.deepStrictEqual(root.doListen.args, [
			['foo'],
			['bar'],
		]);
	});

	it('Signal.fromEventTarget()', () => {
		const eventTarget = new EventTarget();
		const s = Signal.fromEventTarget(eventTarget);
		const onFoo = s.on('foo');
		const onBar = s.on('bar');
		const fooSpy = sinon.spy();
		const barSpy = sinon.spy();
		onFoo.subscribe(fooSpy)
		onBar.subscribe(barSpy)

		const e1 = new Event('foo');
		eventTarget.dispatchEvent(e1);

		const e2 = new Event('foo');
		eventTarget.dispatchEvent(e2);

		const e3 = new Event('bar');
		eventTarget.dispatchEvent(e3);

		assert.strictEqual(fooSpy.args.length, 2);
		assert.strictEqual(fooSpy.args[0][0], e1);
		assert.strictEqual(fooSpy.args[1][0], e2);
		assert.strictEqual(barSpy.args.length, 1);
		assert.strictEqual(barSpy.args[0][0], e3);
	});

});
