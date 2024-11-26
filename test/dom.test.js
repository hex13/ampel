import * as assert from 'node:assert';
import { mount, jsx } from '../src/experiments/dom.js';
import { Signal, set } from '../src/experiments/signal.js';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

describe('dom', () => {
	let dom, root, document;
	beforeEach(() => {
		dom = new JSDOM('<div id="root"></div>');
		root = dom.window.document.getElementById('root');
		document = dom.window.document;
	});

	it('mounts', () => {
		const counter = new Signal(1234);
		mount(root, {
			type: 'div',
			children: [
				{type: 'span', text: 'kotek'},
				{type: 'span', text: 'wchodzi'},
				'abc',
				43,
				counter,
			],
		}, document.createElement.bind(document));
		let current = root;
		assert.strictEqual(current.childNodes.length, 1);
		current = current.childNodes[0];
		assert.strictEqual(current.childNodes.length, 5);

		assert.strictEqual(current.childNodes[0].innerText, 'kotek');
		assert.strictEqual(current.childNodes[0].tagName.toLowerCase(), 'span');
		assert.strictEqual(current.childNodes[1].innerText, 'wchodzi');
		assert.strictEqual(current.childNodes[1].tagName.toLowerCase(), 'span');
		assert.strictEqual(current.childNodes[2].innerText, 'abc');
		assert.strictEqual(current.childNodes[2].tagName.toLowerCase(), 'span');
		assert.strictEqual(current.childNodes[3].innerText, 43);
		assert.strictEqual(current.childNodes[3].tagName.toLowerCase(), 'span');
		assert.strictEqual(current.childNodes[4].innerText, 1234);
		assert.strictEqual(current.childNodes[4].tagName.toLowerCase(), 'span');
	});

	it('mounts signals as text prop', () => {
		const counter = new Signal(123);
		mount(root, {
			type: 'div',
			text: counter,
		}, document.createElement.bind(document));
		let current = root.childNodes[0];
		assert.strictEqual(current.innerText, 123);
		set(counter, 124);
		assert.strictEqual(current.innerText, 124);
	});
});

describe('jsx', () => {
	it('element with props', () => {
		const el = jsx('span', {foo: 123, bar: 456});
		assert.deepStrictEqual(el, {
			type: 'span',
			props: {foo: 123, bar: 456},
		});
	});
	it('element with props and children', () => {
		const child1 = jsx('span', {text: 'kotek'});
		const child2 = jsx('span', {text: 'piesek'});
		const el = jsx('div', {foo: 123, bar: 456}, child1, child2);
		assert.deepStrictEqual(el, {
			type: 'div',
			props: {foo: 123, bar: 456},
			children: [child1, child2],
		});
	});
	it('element with string as children', () => {
		const child1 = 'doge';
		const child2 = 'kitty';
		const el = jsx('div', {foo: 123, bar: 456}, child1, child2);
		assert.deepStrictEqual(el, {
			type: 'div',
			props: {foo: 123, bar: 456},
			children: [child1, child2],
		});
	});
});