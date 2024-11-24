import * as A from '../src/ampel.js';

const canvas = document.createElement('canvas');
canvas.width = 1000;
canvas.height = 1000;
canvas.style.border = '1px solid red';
document.body.append(canvas);
const ctx = canvas.getContext('2d');

const whenCanvas = A.fromEventTarget(canvas);

const getCoords = (e) => {
	const bounds = e.target.getBoundingClientRect();
	return {x: e.clientX - bounds.x, y: e.clientY - bounds.y};
};

let mode = 'pencil';
document.querySelectorAll('.mode').forEach(el => {
	el.addEventListener('click', () => {
		mode = el.dataset.mode;
		A.cancel(whenCanvas);
	});
});

const modes = {
	async pencil() {
		for await (const { curr, last } of A.drag(whenCanvas, getCoords)) {
			if (last) {
				ctx.beginPath();
				ctx.moveTo(curr.x, curr.y);
				ctx.lineTo(last.x, last.y);
				ctx.stroke();
			}
		}
	},
	async rectangle() {
		let pt1, pt2;
		for await (const { curr, last } of A.drag(whenCanvas, getCoords)) {
			if (!pt1) pt1 = curr;
			pt2 = curr;
		}
		ctx.fillRect(pt1.x, pt1.y, pt2.x - pt1.x, pt2.y - pt1.y);
	},
};

A.loop(async () => {
	await modes[mode]();
});
