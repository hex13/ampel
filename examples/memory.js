import * as A from '../src/ampel.js';

const width = 5;
const height = 4;
const buttonSize = 50;

async function playMemory({ container, render, hideCard, uncoverCard, coverCard }) {
	while (true) {
		const numbers = [...Array(width * height)].map((_, i) => Math.floor(i / 2));
		numbers.sort((a, b) => Math.random() - 0.5);

		let cardsLeft = numbers.length;
		const cards = [];
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				cards.push({x, y, value: numbers.pop(), idx: cards.length });
			}
		}

		render({ container, cards });

		const cardClicked = A.Signal.fromEventTarget(container)
			.on('click')
			.filter((e) => e.target.tagName.toLowerCase() == 'button')
			.map(e => cards[e.target.dataset.idx]);

		while (cardsLeft > 0) {
			const first = await cardClicked;
			uncoverCard(first);
			const second = await cardClicked.filter(el => el != first);
			uncoverCard(second);

			await A.delay(500);

			if (first.value == second.value) {
				hideCard(first);
				hideCard(second);
				cardsLeft -= 2;
			} else {
				coverCard(first);
				coverCard(second);
			}
		}
		alert("You win.")
	}
}

const container = document.createElement('div');
container.style.position = 'relative';
document.body.append(container);

playMemory({
	container,
	render: ({ container, cards }) => {
		cards.forEach(card => {
			const el = document.createElement('button');
			el.style.position = 'absolute';
			el.style.width = `${buttonSize}px`;
			el.style.height = `${buttonSize}px`;
			el.style.left = `${card.x * buttonSize}px`;
			el.style.top = `${card.y * buttonSize}px`;
			el.dataset.value = card.value;
			el.dataset.idx = card.idx;
			card.el = el;
			container.append(el);
		});
	},
	hideCard: card => {
		card.el.remove();
	},
	uncoverCard: card => {
		card.el.innerText = card.value;
	},
	coverCard: card => {
		card.el.innerText = '';
	}
});
