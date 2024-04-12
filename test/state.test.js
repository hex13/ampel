import * as assert from 'node:assert';
import { State } from '../src/state.js';

function checkSetGet(state, nv) {
	let nv_copy = structuredClone(nv);
	state.set(nv);
	assert.strictEqual(state.get(), nv);
	assert.deepStrictEqual(nv, nv_copy);
}

function createHandlers() {
	const events = [];

	const first = v => {
		events.push(['first', v]);
	};
	const second = v => {
		events.push(['second', v]);
	};

	return { first, second, events };
}

describe('State', () => {
	it('after creation state.get() returns initial value and has metadata', () => {
		const meta = {x: 'bzium'};
		const state = new State(122, meta);
		assert.strictEqual(state.get(), 122);
		assert.strictEqual(state.meta(), meta);
	});
	it('it should be possible to .set and .get value ', () => {
		checkSetGet(new State(122), 439);
		checkSetGet(new State(122), {a: 2});
		checkSetGet(new State(122), [10, 20, 30]);
	});
	it('it should be possible to .set and .get value multiple times', () => {
		const state = new State(10);
		checkSetGet(state, 439);
		checkSetGet(state, {a: 2});
		checkSetGet(state, [10, 20, 30]);
	});

	it('it should trigger listeners after setting value', () => {
		const state = new State(10);
		const { first, second, events } = createHandlers();
		state.on(first);
		state.on(second);

		state.set(123);
		state.set(456);

		assert.deepStrictEqual(events, [
			['first', 123],
			['second', 123],
			['first', 456],
			['second', 456],
		]);
	});

	it('it should be possible to .off and .on listeners', () => {
		const state = new State(10);
		const { first, second, events } = createHandlers();

		state.on(first);
		state.on(second);
		state.off(second);
		state.set(123);

		state.off(first);
		state.set(456);

		state.on(second);
		state.set(789);

		assert.deepStrictEqual(events, [
			['first', 123],
			['second', 789],
		]);
	});

	it('it should be possible to set .once listener', () => {
		const state = new State(10);
		const { first, second, events } = createHandlers();

		state.once(first);
		state.set(123);
		state.set(456);
		state.set(789);

		assert.deepStrictEqual(events, [
			['first', 123],
		]);
	});

	it('state should be thenable', async () => {
		const state = new State(10);
		const { first, events } = createHandlers();

		state.then(first);
		state.set(1000);
		state.set(1001);

		return Promise.resolve().then(() => {
			assert.deepStrictEqual(events, [
				['first', 1000],
			]);
		});
	});

	it('state should be awaitable', async () => {
		const state = new State(10);
		const { first, events } = createHandlers();

		(async () => {
			first(await state);
		})();

		await Promise.resolve();

		state.set(1000);
		state.set(1001);

		await Promise.resolve();

		assert.deepStrictEqual(events, [
			['first', 1000],
		]);
	});

	it('state should be mappable', async () => {
		const initial = 10;
		const state = new State(initial);
		const mapped = state.map(x => x + 100);
		const { first, events } = createHandlers();

		assert.ok(mapped instanceof State);
		assert.strictEqual(mapped.source, state);
		assert.strictEqual(mapped.get(), initial);
		mapped.on(first);

		state.set(123);
		state.set(456);

		assert.deepStrictEqual(events, [
			['first', 223],
			['first', 556],
		]);
	});

	it('metadata for listeners', async () => {
		const initial = 10;
		const state = new State(initial);
		const { first, second } = createHandlers();

		state.on(first, {kotek: 'wlazł'});
		state.once(second, {kotek: 'na płotek'});
		assert.strictEqual(state.listener(first).kotek, 'wlazł');
		assert.strictEqual(state.listener(second).kotek, 'na płotek');
	});

});
