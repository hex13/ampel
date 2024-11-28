import * as assert from 'node:assert';
import { ProxyState } from '../src/ProxyState.js';
import { Signal } from '../src/Signal.js';
import * as A from '../src/ampel.js';

describe('ProxyState', () => {
	it('initial state', () => {
		let ps;
		ps = new ProxyState();
		assert.deepStrictEqual(ps.state, {});
		assert.ok(ps.changes instanceof Signal);

		const initialState = {foo: 120, bar: 1};
		ps = new ProxyState(initialState);
		assert.deepStrictEqual(ps.state, {foo: 120, bar: 1});
		assert.strictEqual(ps.innerState, initialState);
		assert.ok(ps.changes instanceof Signal);
	});

	it('.state can be modified', () => {
		const ps = new ProxyState();
		ps.state.foo = 10;
		assert.strictEqual(ps.state.foo, 10);
		ps.state.foo = 20;
		assert.strictEqual(ps.state.foo, 20);
		ps.state.bar = 100;
		assert.strictEqual(ps.state.bar, 100);
		assert.deepStrictEqual(ps.state, {
			foo: 20,
			bar: 100,
		});
	});

	it('can be subscribed - no changes', (done) => {
		const values = [];
		const ps = new ProxyState();
		A.subscribe(ps.changes, (state) => {
			values.push(structuredClone(state));
		});
		setTimeout(() => {
			assert.deepStrictEqual(values, []);
			done();
		}, 0);
	});

	it('can be subscribed - changes', (done) => {
		const values = [];
		const ps = new ProxyState();
		A.subscribe(ps.changes, (state) => {
			values.push(structuredClone(state));
		});
		ps.state.foo = 10;
		ps.state.foo = 20;
		ps.state.bar = 30;

		setTimeout(() => {
			assert.deepStrictEqual(values, [{foo: 20, bar: 30}]);
			ps.state.qwe = 123;
			setTimeout(() => {
				assert.deepStrictEqual(values, [
					{foo: 20, bar: 30},
					{foo: 20, bar: 30, qwe: 123},
				]);
				done();
			}, 0);
		}, 0);
	});

});
