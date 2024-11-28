Ampel.js - library for signals 
===
(this library is WIP and changes are not published to npm. Check out later for the npm release).

building blocks:
- Signal - represents single value changing in time. It can be used as reactive primitive (something similar to observable).
- Listener - allows for listening event targets (e.g. DOM elements). It changes events into signals
- ProxyState - wraps object and exposes the reactive proxy. Thus changes can be traced. 

JS concepts Ampel.js supports:

- async/await - you can await signals 
- asynchronous generators - functions that can use await but also can emit values. This can be used for constructing powerful helpers. Ampel.js provides helpers for asynchronous generators (A.map, A.filter, A.pairs)

Look into [examples](examples) folder to check for usage.

What's nice about this library?

You can await signals (which can be constructed from e.g. DOM events). This allows for more straightforward implementation of complex interactions. Programmers often write such interactions using boolean flags or hand-made state machines. But this can be written in less convoluted way. Just write what you have in mind and await things you wait for (e.g. mouse events):


```js
import * as A from 'ampel';

const whenFirst = A.Listener.fromEventTarget(document.getElementById('first'));
const whenSecond = A.Listener.fromEventTarget(document.getElementById('second'));

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
