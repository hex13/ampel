import * as assert from 'assert';
import { Model, createDepsGatherer } from '../src/Model.js';

const notify = (events, name) => (...args) => {
	events.push([name, ...args]);
};

describe('Model', () => {
	it('update', () => {
		const model = new Model({});
		const res = model.update({a: 10});
		assert.deepStrictEqual(res, {
			a: 10,
		});
		assert.deepStrictEqual(model.data, {a: 10});
	});

	it('update with links', () => {
		const links = {
			a: [{target: 'b', mapper: x => x + 2 }, {target: 'c', mapper: x => x + 10}],
		};
		const model = new Model({somethingWasHere: 123}, { links });
		const res = model.update({a: 11});
		assert.deepStrictEqual(res, {
			a: 11,
			b: 13,
			c: 21,
		});
		assert.deepStrictEqual(model.data, {
			a: 11,
			b: 13,
			c: 21,
			somethingWasHere: 123,
		});
	});

	it('link', () => {
		const model = new Model({
			a: 10,
			b: 21,
		});
		model.link('a', 'c', state => state.a + state.b, true);

		model.update({a: 11});
		assert.strictEqual(model.data.c, 32);

		model.update({b: 1000});
		assert.strictEqual(model.data.c, 32);
	});

	it('computed properties', () => {
		const model = new Model({
			a: 10,
			b: 21,
			$c: state => state.a + state.b,
		});
		assert.strictEqual(model.data.c, 31);

		model.update({a: 20});
		assert.strictEqual(model.data.c, 41);

		model.update({b: 22});
		assert.strictEqual(model.data.c, 42);
	});

	it('invoke listeners ', () => {
		const events = [];
		const model = new Model({a: 123});
		model.on('a', notify(events, 'a'));
		model.on('a', notify(events, 'a-2'));

		model.update({b: 1});
		assert.deepStrictEqual(events, []);
		model.update({a: 10});
		assert.deepStrictEqual(events, [
			['a', 10],
			['a-2', 10],
		]);
	});
});

describe('createDepsGatherer', () => {
	it('gathers deps', () => {
		const { proxy, deps } = createDepsGatherer({foo: 10, bar: 20, baz: 30});
		assert.strictEqual(proxy.foo, 10);
		assert.strictEqual(proxy.baz, 30);
		assert.deepStrictEqual(deps, {
			foo: true,
			baz: true,
		});
	});
});