import * as A from '../src/ampel.js';

const width = 5;
const height = 4;
const buttonSize = 50;
const isButton = (el) => el.tagName.toLowerCase() == 'button';

async function main() {
	const container = document.createElement('div');
	container.style.position = 'relative';
	document.body.append(container);
	const whenButton = new A.Listener(container).on;

	while (true) {
		const numbers = [];
		for (let i = 0; i < width * height / 2; i++) {
			numbers.push(i);
			numbers.push(i);
		}

		numbers.sort((a, b) => Math.random() - 0.5);
		let buttonsLeft = numbers.length;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const el = document.createElement('button');
				el.style.position = 'absolute';
				el.style.width = `${buttonSize}px`;
				el.style.height = `${buttonSize}px`;
				el.style.left = `${x * buttonSize}px`;
				el.style.top = `${y * buttonSize}px`;
				el.dataset.value = numbers.pop();
				container.append(el);
			}
		}

		while (buttonsLeft > 0) {
			const first = (await whenButton('click').filter(e => isButton(e.target))).target;
			const firstValue = first.dataset.value;
			first.innerText = firstValue;

			const second = (await whenButton('click').filter(e => isButton(e.target) && e.target != first)).target;
			const secondValue = second.dataset.value;
			second.innerText = secondValue;

			await A.delay(500);

			if (firstValue == secondValue) {
				first.remove();
				second.remove();
				buttonsLeft -= 2;
			} else {
				first.innerText = '';
				second.innerText = '';
			}
		}
		alert("You win.")
	}
}

main();
