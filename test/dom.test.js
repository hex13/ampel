import * as assert from 'node:assert';
import { mount } from '../src/dom.js';
import { Signal, set } from '../src/signal.js';
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
		mount(root, {
			type: 'div',
			children: [
				{type: 'span', text: 'kotek'},
				{type: 'span', text: 'wchodzi'},
			],
		}, document.createElement.bind(document));
		let current = root;
		assert.strictEqual(current.childNodes.length, 1);
		current = current.childNodes[0];
		assert.strictEqual(current.childNodes.length, 2);

		assert.strictEqual(current.childNodes[0].innerText, 'kotek');
		assert.strictEqual(current.childNodes[1].innerText, 'wchodzi');

		console.log("DDDDD", root.innerHTML);
		console.log("JS DOM", );
	});

	it('mounts signals', () => {
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