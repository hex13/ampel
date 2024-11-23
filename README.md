Ampel.js - library for signals 
===

example:

```js
import * as A from 'ampel';

const whenFirst = A.fromEventTarget(document.getElementById('first'));
const whenSecond = A.fromEventTarget(document.getElementById('second'));

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