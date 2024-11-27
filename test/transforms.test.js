import * as assert from 'node:assert';
import { map, filter, pairs } from '../src/transforms.js';

async function* foo() {
	await Promise.resolve();
	yield 124;
	await Promise.resolve();
	yield 891;
	await Promise.resolve();
	yield 9;
	await Promise.resolve();
	yield 10;
}

describe('transforms', () => {
	it('map()', async () => {
		const values = [];
		for await (const v of map(x => x + 10, foo())) {
			values.push(v);
		}
		assert.deepStrictEqual(values, [134, 901, 19, 20]);
	});
	it('filter()', async () => {
		const values = [];
		for await (const v of filter(x => x < 100, foo())) {
			values.push(v);
		}
		assert.deepStrictEqual(values, [9, 10]);
	});
	it('pairs()', async () => {
		const values = [];
		for await (const v of pairs(foo())) {
			values.push(v);
		}
		assert.deepStrictEqual(values, [
			[124, 891],
			[891, 9],
			[9, 10],
		]);
	});
});