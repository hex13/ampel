Ampel - reactive library for signals 
===

Signals
====

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

State (proxied reactive object)
====

```js
import { State, on } from 'ampel';
const a = State({
	x: 10, y: 20,
});

on(a, v => {
	console.log("value = ", v);
});

a.x = 11;
a.y = 25;


```
