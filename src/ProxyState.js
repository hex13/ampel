import { Signal } from './Signal.js';

export class ProxyState {
	innerState = {};
	changes = new Signal();
	constructor() {
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