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
		let pt1, pt2;
		const e = await whenCanvas('pointerdown');
		e.target.setPointerCapture(e.pointerId);
		pt1 = getCoords(e);

		while (true) {
			const e = await Promise.any([whenCanvas('pointermove'), whenCanvas('pointerup')]);
			if (e.type == 'pointerup') break;
			pt2 = getCoords(e);
			ctx.beginPath();
			ctx.moveTo(pt1.x, pt1.y);
			ctx.lineTo(pt2.x, pt2.y);
			ctx.stroke();
			pt1 = pt2;
		}
	},
	async rectangle() {
		let pt1, pt2;
		const e = await whenCanvas('pointerdown');
		e.target.setPointerCapture(e.pointerId);
		pt1 = getCoords(e);

		while (true) {
			const e = await Promise.any([whenCanvas('pointermove'), whenCanvas('pointerup')]);
			if (e.type == 'pointerup') break;
			pt2 = getCoords(e);
		}
		ctx.fillRect(pt1.x, pt1.y, pt2.x - pt1.x, pt2.y - pt1.y);
	}
};

async function main() {
	while (true) {
		try {
			await modes[mode]();
 		} catch (e) {
			console.log("err", e);
		}
		await A.delay(0); // to prevent freezing the browser
	}
}

main();