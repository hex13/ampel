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

async function pencil(when) {
	for await (const { curr, last } of A.drag(when, getCoords)) {
		if (last) {
			ctx.beginPath();
			ctx.moveTo(curr.x, curr.y);
			ctx.lineTo(last.x, last.y);
			ctx.stroke();
		}
	}
}

async function rectangle(when) {
	let pt1, pt2;
	for await (const { curr, last } of A.drag(when, getCoords)) {
		if (!pt1) pt1 = curr;
		pt2 = curr;
	}
	ctx.fillRect(pt1.x, pt1.y, pt2.x - pt1.x, pt2.y - pt1.y);
}

const modes = {
	pencil, rectangle,
};

A.loop(async () => {
	await modes[mode](whenCanvas);
});
//61; 49