import * as assert from 'assert';
import { Model, invokePropListeners } from '../src/Model.js';

const notify = (events, name) => (...args) => {
	events.push([name, ...args]);
};

describe('invokePropListeners()', () => {
	it('invoke listeners', () => {
		const events = [];
		invokePropListeners({
			a: 100,
			b: 234,
		}, {
			a: [notify(events, 'a')],
			b: [notify(events, 'b'), notify(events, 'b-2')],
			c: [notify(events, 'c')],
		});
		assert.deepStrictEqual(events, [
			['a', 100],
			['b', 234],
			['b-2', 234],
		]);
	});
});

describe('Model', () => {
	it('update', () => {
		const model = new Model({});
		const res = model.update({a: 10});
		assert.deepStrictEqual(res, {
			dirty: {
				a: 10,
			},
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
			dirty: {
				a: 11,
				b: 13,
				c: 21,
			},
		});
		assert.deepStrictEqual(model.data, {
			a: 11,
			b: 13,
			c: 21,
			somethingWasHere: 123,
		});
	});

	it('invoke listeners ', () => {
		const events = [];
		const model = new Model({a: 123});
		model.on('a', notify(events, 'a'));
		model.update({b: 1});
		assert.deepStrictEqual(events, []);
		model.update({a: 10});
		assert.deepStrictEqual(events, [
			['a', 10],
		]);
	});
});
