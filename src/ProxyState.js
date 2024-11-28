import { Signal } from './Signal.js';

export class ProxyState {
	changes = new Signal();
	constructor(initial = {}) {
		this.innerState = initial;
		let timeout;
		this.state = new Proxy(this.innerState, {
			set: (target, prop, value) => {
				target[prop] = value;
				if (!timeout) {
					timeout = setTimeout(() => {
						this.changes.set(this.innerState);
						timeout = null;
					});
				}
				return true;
			}
		});
	}
}