Ampel - reactive library for signals 
===

```js
import { Signal, get, set, on } from 'ampel';
const a = new Signal(10);
on(a, v => {
	console.log("value = ", v);
})
set(a, 123);
set(a, 456);
console.log(get(a));

```