import * as assert from 'node:assert';
import * as A from '../src/ampel.js';

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

	it('.transform()', async () => {
		const a = new Signal();
		const b = a.transform((s, v) => {
			assert.strictEqual(s, b);
			s.set(v);
			s.set(v + 1);
		});

		assert.ok(b instanceof Signal);
		assert.notStrictEqual(b, a);

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

		const values = [];
		b.subscribe(v => {
			values.push(v);
		})
		a.set(1);
		a.set(2);
		a.set(4);
		a.set(7);
		a.set(11);
		assert.deepStrictEqual(values, [1, 7, 11]);
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

});