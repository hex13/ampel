import * as assert from 'node:assert';
import * as sinon from 'sinon';
import * as A from '../src/ampel.js';

const getValue = (s) => s.get();
const setValue = (s, v) => s.set(v);

describe('Ampel', () => {
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
