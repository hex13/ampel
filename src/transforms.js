export async function* map(mapper, it) {
	for await (const value of it) {
		yield mapper(value);
	}
}

export async function* filter(f, it) {
	for await (const value of it) {
		if (f(value)) {
			yield value;
		}
	}
}

export async function* pairs(it) {
	let last;
	for await (const value of it) {
		if (last != undefined) {
			yield [last, value];
		}
		last = value;
	}
}
