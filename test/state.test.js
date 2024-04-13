import * as assert from 'node:assert';
import { State, get, set, on, off, once, map } from '../src/state.js';

function checkSetGet(state, nv) {
	let nv_copy = structuredClone(nv);
	set(state, nv);
	assert.strictEqual(get(state), nv);
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
	it('after creation get(state) returns initial value', () => {
		const state = new State(122);
		assert.strictEqual(get(state), 122);
	});
	it('after creation has metadata', () => {
		const meta = {x: 'bzium'};
		const emptyMeta = {mapped: []};
		assert.deepStrictEqual(new State(122).meta(), emptyMeta);
		assert.deepStrictEqual(new State(122, meta).meta(), {
			...emptyMeta,
			...meta,
		});
	});
	it('it should be possible to set and get value ', () => {
		checkSetGet(new State(122), 439);
		checkSetGet(new State(122), {a: 2});
		checkSetGet(new State(122), [10, 20, 30]);
	});
	it('it should be possible to set and get value multiple times', () => {
		const state = new State(10);
		checkSetGet(state, 439);
		checkSetGet(state, {a: 2});
		checkSetGet(state, [10, 20, 30]);
	});

	it('it should trigger listeners after setting value', () => {
		const state = new State(10);
		const { first, second, events } = createHandlers();
		on(state, first);
		on(state, second);

		set(state, 123);
		set(state, 456);

		assert.deepStrictEqual(events, [
			['first', 123],
			['second', 123],
			['first', 456],
			['second', 456],
		]);
	});

	it('it should be possible to off and on listeners', () => {
		const state = new State(10);
		const { first, second, events } = createHandlers();

		on(state, first);
		on(state, second);
		off(state, second);
		set(state, 123);

		off(state, first);
		set(state, 456);

		on(state, second);
		set(state, 789);

		assert.deepStrictEqual(events, [
			['first', 123],
			['second', 789],
		]);
	});

	it('it should be possible to set once listener', () => {
		const state = new State(10);
		const { first, second, events } = createHandlers();

		once(state, first);
		set(state, 123);
		set(state, 456);
		set(state, 789);

		assert.deepStrictEqual(events, [
			['first', 123],
		]);
	});

	it('state should be thenable', async () => {
		const state = new State(10);
		const { first, events } = createHandlers();

		state.then(first);
		set(state, 1000);
		set(state, 1001);

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

		set(state, 1000);
		set(state, 1001);

		await Promise.resolve();

		assert.deepStrictEqual(events, [
			['first', 1000],
		]);
	});

	it('state should be mappable', async () => {
		const initial = 10;
		const state = new State(initial);
		const mapped = map(state, x => x + 100, {name: 'plus100'});
		const { first, events } = createHandlers();

		assert.ok(mapped instanceof State);

		assert.strictEqual(mapped.meta().source, state);
		assert.strictEqual(mapped.meta().name, 'plus100');
		assert.strictEqual(mapped.meta().kind, 'map');

		const metaMapped = state.meta().mapped;
		assert.strictEqual(metaMapped.length, 1);
		assert.strictEqual(metaMapped[0], mapped);

		assert.strictEqual(get(mapped), initial);
		on(mapped, first);

		set(state, 123);
		set(state, 456);
		off(state, mapped);
		set(state, 777);

		assert.deepStrictEqual(events, [
			['first', 223],
			['first', 556],
		]);
	});

	it('metadata for listeners', async () => {
		const initial = 10;
		const state = new State(initial);
		const { first, second } = createHandlers();

		on(state, first, {kotek: 'wlazł'});
		once(state, second, {kotek: 'na płotek'});
		assert.strictEqual(state.listener(first).kotek, 'wlazł');
		assert.strictEqual(state.listener(second).kotek, 'na płotek');
	});

});
