export class Model {
    constructor(data, schema = {links: {}}) {
        this.data = data;
        this.links = schema.links;
        this.listeners = Object.create(null);
    }
    update(updates) {
        const computeInfo = compute(this.data, updates, this.links)
        return computeInfo;
    }
    on(prop, listener) {
        ensureProp(this.links, prop, () => []).push({target: listener});
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
                if (typeof link.target == 'function') {
                    link.target(value)
                } else {
                    const mappedValue = link.mapper(value);
                    dirty[link.target] = mappedValue;
                    target[link.target] = mappedValue;
                }
            });
        }
        target[prop] = value;
        dirty[prop] = value;
    }
    return {
        dirty,
    };
}
