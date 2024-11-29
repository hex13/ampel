import * as A from '../src/ampel.js';

const canvas = document.createElement('canvas');
canvas.width = 1000;
canvas.height = 1000;
canvas.style.border = '1px solid red';
document.body.append(canvas);
const ctx = canvas.getContext('2d');

const canvasListener = new A.Listener(canvas);

const getCoords = (e) => {
	const bounds = e.target.getBoundingClientRect();
	return {x: e.clientX - bounds.x, y: e.clientY - bounds.y};
};

let mode = 'pencil';
document.querySelectorAll('.mode').forEach(el => {
	el.addEventListener('click', () => {
		mode = el.dataset.mode;
		A.cancel(canvasListener);
	});
});

async function pencil(when) {
	for await (const [last, curr] of A.pairs(A.map(getCoords, A.drag(when)))) {
		ctx.beginPath();
		ctx.moveTo(curr.x, curr.y);
		ctx.lineTo(last.x, last.y);
		ctx.stroke();
	}
}

async function rectangle(when) {
	let pt1, pt2;
	for await (const curr of A.map(getCoords, A.drag(when))) {
		if (!pt1) pt1 = curr;
		pt2 = curr;
	}
	ctx.fillRect(pt1.x, pt1.y, pt2.x - pt1.x, pt2.y - pt1.y);
}

const modes = {
	pencil, rectangle,
};

A.loop(async () => {
	await modes[mode](canvasListener.on);
});
//61; 49