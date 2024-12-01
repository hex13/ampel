Ampel.js - library for signals 
===
this library is WIP - API can change and documentation can be not accurate. Changes may not be published to npm. Check out this project later if you find it interesting.

building blocks:
- Signal - represents single value changing in time. It can be used as reactive primitive (something similar to observable).
- ProxyState - wraps object and exposes the reactive proxy. Thus changes can be traced. 

JS concepts Ampel.js supports:

- async/await - you can await signals 
- asynchronous generators - functions that can use await but also can emit values. This can be used for constructing powerful helpers. Ampel.js provides helpers for asynchronous generators (A.map, A.filter, A.pairs)

Look into [examples](examples) folder to check for usage.

What's nice about this library?

You can await signals (which can be constructed from e.g. DOM events). This allows for more straightforward implementation of complex interactions. Programmers often write such interactions using boolean flags or hand-made state machines. But this can be written in less convoluted way. Just write what you have in mind and await things you wait for (e.g. mouse events):


```js
import * as A from 'ampel';

const whenFirst = A.Signal.fromEventTarget(document.getElementById('first')).on;
const whenSecond = A.Signal.fromEventTarget(document.getElementById('second')).on;

async function main() {
	while (true) {
		alert("click first");
		await whenFirst('click');
		alert("click second");
		await whenSecond('click');
	}
}
main();
```

Signal
===
Signal represents single value changing in time. It can be used as reactive primitive (something similar to observable).

You can:
- set and get values (.set and .get methods)
- subscribe via .subscribe method
- await signal
- create signal from promise (static method .fromPromise)
- cancel signal via .cancel
	cancelled signal can not worked be set. Additionally it would reject subscribers set via `.then` or `await` (so awaited signal would throw)

creating signals from DOM elements
===

example:
```js
async function main() {
	const foo = A.Signal.fromEventTarget(document.getElementById('foo'));
	await foo.on('click');
	alert('you clicked #foo');
}
main();
```
