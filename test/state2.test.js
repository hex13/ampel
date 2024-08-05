import * as assert from 'assert';
import { State, DELTAS, on, once } from '../src/state2.js';

const sleep = () => {
    return new Promise(r => setTimeout(r, 0));
};
describe('State', () => {
    it('initial state', () => {
        const obj = {
            counter: 10,
        };
        const state = State(obj);
        assert.deepStrictEqual(state, {
            counter: 10,
        });
        assert.deepStrictEqual(state[DELTAS], []);
    });

    it('setting should change both state and obj', () => {
        const obj = {
            counter: 10,
        };
        const state = State(obj);
        state.counter += 1;
        assert.deepStrictEqual(state, {
            counter: 11,
        });
        assert.deepStrictEqual(obj, {
            counter: 11,
        });
    });

    it('setting should set deltas', () => {
        const obj = {
            counter: 10,
            color: 'red',
        };
        const state = State(obj);
        state.counter = 11;
        state.color = 'green';
        assert.deepStrictEqual(state[DELTAS], [
            ['counter', 11],
            ['color', 'green'],
        ]);
    });

    const createExampleState = () => {
        const events = [];
        const obj = {
            counter: 10,
            color: 'red',
        };
        const state = State(obj, {
            onUpdate(deltas) {
                events.push(deltas.slice());
            },
        });
        return { state, events, obj };
    };
    it('onUpdate', async () => {
        let { events, state, obj } = createExampleState();
        state.counter = 11;
        state.color = 'green';

        await Promise.resolve();

        assert.deepStrictEqual(state[DELTAS], []);
        assert.deepStrictEqual(events, [
            [['counter', 11], ['color', 'green']],
        ]);

        events.length = 0;
        state.color = 'yellow';

        await Promise.resolve();
        assert.deepStrictEqual(events, [
            [['color', 'yellow']],
        ]);
    });

    it('subscribe to properties', async () => {
        let { state, obj } = createExampleState();
        let events = [];
        on(state, 'color', v => {
            events.push(['on', v]);
        });
        state.counter += 1;
        state.color = 'green';
        state.color = 'yellow';

        await Promise.resolve();

        assert.deepStrictEqual(events, [
            ['on', 'yellow'],
        ]);

        events = [];

        state.counter += 1;

        assert.deepStrictEqual(events, []);

    });

    it('once', async () => {
        let events = [];
        const onB = (v) => {
            events.push(['b', v]);
        };
        const state = State({
            a: 10,
            b: 20,
        });

        let b = once(state, 'b');
        b.then(onB);

        state.a = 100;
        await sleep();
        assert.deepStrictEqual(events, []);

        state.b = 200;
        await sleep();

        assert.deepStrictEqual(events, [
            ['b', 200],
        ]);
        events = [];

        state.b = 201;
        await sleep();
        assert.deepStrictEqual(events, []);

        once(state, 'b').then(onB);
        state.b = 202;
        await sleep();
        assert.deepStrictEqual(events, [
            ['b', 202]
        ]);
    });
});