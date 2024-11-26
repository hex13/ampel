export class Model {
    constructor(data, schema = {links: {}}) {
        this.data = data;
        this.links = schema.links;
        this.listeners = Object.create(null);
        for (const [k, v] of Object.entries(data)) {
            if (typeof k == 'string' && k.startsWith('$')) {
                const targetProp = k.slice(1);
                const { proxy, deps } = createDepsGatherer(this.data);
                v(proxy);
                Object.keys(deps).forEach(dep => {
                    this.link(dep, targetProp, v, true)
                });
            }
        }
        // emulate updating only for links to be runned
        this.update(this.data);
    }
    update(updates) {
        return applyUpdates(this.data, updates, this.links)
    }
    on(prop, listener, wholeState = false) {
        this.link(prop, listener);
    }
    link(from, to, mapper, wholeState = false) {
        ensureProp(this.links, from, () => []).push({target: to, mapper, wholeState});
    }
}

function ensureProp(target, prop, create) {
    let value = target[prop];
    if (!value) {
        target[prop] = create();
    }
    return target[prop];
}

function applyUpdates(target, updates, links) {
    const newUpdates = {};
    for (const [prop, value] of Object.entries(updates)) {
        target[prop] = value;
        if (Object.hasOwn(links, prop)) {
            const value = target[prop];
            links[prop].forEach(link => {
                if (typeof link.target == 'function') {
                    link.target(value);
                } else {
                    newUpdates[link.target] = link.mapper(link.wholeState? target : value);
                }
            });
        }
    }
    if (Object.keys(newUpdates).length > 0) {
        applyUpdates(target, newUpdates, links);
    }
    return Object.assign(newUpdates, updates);
}

export function createDepsGatherer(obj) {
    const deps = {};
    const proxy = new Proxy(obj, {
        get(target, prop) {
            deps[prop] = true;
            return target[prop];
        }
    });
    return { proxy, deps };
}
