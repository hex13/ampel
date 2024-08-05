export class Model {
    constructor(data, links = {}) {
        this.data = data;
        this.links = links;
        this.listeners = Object.create(null);
    }
    update(updates) {
        const computeInfo = compute(this.data, updates, this.links)
        invokePropListeners(computeInfo.dirty, this.listeners);
        return computeInfo;
    }
    on(prop, listener) {
        const propListeners = ensureProp(this.listeners, prop, () => []);
        propListeners.push(listener);
    }
}

function ensureProp(target, prop, create) {
    let value = target[prop];
    if (!value) {
        target[prop] = create();
    }
    return target[prop];
}

function compute(target, updates, links) {
    const dirty = {};
    for (const [prop, value] of Object.entries(updates)) {
        if (Object.hasOwn(links, prop)) {
            links[prop].forEach(link => {
                const mappedValue = link.mapper(value);
                dirty[link.target] = mappedValue;
                target[link.target] = mappedValue;
            });
        }
        target[prop] = value;
        dirty[prop] = value;
    }
    return {
        dirty,
    };
}

export function invokePropListeners(dirtyInfo, handlers) {
    for (const [k, v] of Object.entries(dirtyInfo)) {
        if (handlers[k]) {
            handlers[k].forEach(handler => {
                handler(v);
            });
        }
    }
}