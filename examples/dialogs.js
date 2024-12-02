import * as A from '../src/ampel.js';

async function ask() {
	const container = document.createElement('div');
	Object.assign(container.style, {
		position: 'fixed',
		left: '100px',
		top: '100px',
		width: '300px',
		background: 'rgb(0 0 0 / 0.5)',
	});
	const input = document.createElement('input');

	container.append(input);
	const button = document.createElement('button');
	button.innerText = 'ok';
	container.append(button);
	document.body.append(container);
	input.focus();

	await Promise.any([
		A.listen(button).on('click'),
		A.listen(input).on('keydown').filter(e => e.code == 'Enter'),
	]);

	container.remove();
	return input.value;
}

function main() {
	const label = document.createElement('h1');
	document.body.append(label);

	const changeBtn = document.createElement('button');
	changeBtn.innerText = 'change';
	document.body.append(changeBtn);
	changeBtn.addEventListener('click', async () => {
		label.innerText = await ask();
	});
}

main();