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
    const dirty = {};
    const funcsToRun = [];
    for (const [prop, value] of Object.entries(updates)) {
        if (Object.hasOwn(links, prop)) {
            links[prop].forEach(link => {
                if (typeof link.target == 'function') {
                    link.target(value)
                } else {
                    funcsToRun.push(() => {
                        const mappedValue = link.mapper(link.wholeState? target : value);
                        dirty[link.target] = mappedValue;
                        target[link.target] = mappedValue;
                    });
                }
            });
        }
        target[prop] = value;
        dirty[prop] = value;
    }
    funcsToRun.forEach(f => {
        f();
    });
    return {
        dirty,
    };
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
