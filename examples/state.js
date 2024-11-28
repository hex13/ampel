import * as A from '../src/ampel.js';

const model = new A.ProxyState({
	counter1: 0,
	odd: false,
});

setInterval(() => {
	model.state.counter1++;
	model.state.odd = !model.state.odd;
}, 1000);

model.changes.subscribe((state) => {
	console.log(state);
});