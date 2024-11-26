import * as assert from 'node:assert';

import { on, MULTISIGNAL } from '../src/experiments/signal.js';
import { State, onProp } from '../src/experiments/state.js';

describe('State', () => {
	it('has initial data', () => {
		const state = State({
			x: 123,
			y: 3,
		});
		assert.strictEqual(state.x, 123);
		assert.strictEqual(state.y, 3);

		const result = {...state};
		delete result[MULTISIGNAL];
		assert.deepStrictEqual(result, {x: 123, y: 3});
	});
	it('allows for setting and getting', () => {
		const state = State({
			x: 123,
			y: 3,
		});
		state.x = 4;
		assert.strictEqual(state.x, 4);
		assert.strictEqual(state.y, 3);
	});
	it('allows for observing', () => {
		const events = [];
		const state = State({
			x: 123,
			y: 3,
		});
		on(state, ({x, y}) => {
			events.push({x,y});
		});
		state.x = 100;
		state.y = 6;
		assert.deepStrictEqual(events, [
			{x: 100, y: 3},
			{x: 100, y: 6},
		]);
	});
	it('allows for observing individual properties', () => {
		const events = [];
		const state = State({
			x: 123,
			y: 3,
		});
		onProp(state, 'x', value => {
			events.push(['x', value]);
		});
		onProp(state, 'y', value => {
			events.push(['y', value]);
		});

		state.x = 100;
		state.y = 6;

		assert.deepStrictEqual(events, [
			['x', 100],
			['y', 6],
		]);

	});
});
