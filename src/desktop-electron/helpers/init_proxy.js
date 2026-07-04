const Promise = require('bluebird');

// Provide access to an object only after it was initialized
function init_proxy(init)
{
    if (typeof init !== 'function') {
        throw new Error('init must be a function');
    }

    let status = 'idle'; // idle | running | ready
    let object = null;

    return new Proxy({}, {
        get(target, prop, receiver) {
            if (prop === 'init') {
                return async function (...args) {
                    if (status === 'ready') {
                        throw new Error('init() was already called');
                    }

                    if (status === 'running') {
                        throw new Error('init() is already running');
                    }

                    status = 'running';
                    try {
                        const tmp = await Promise.resolve(init.apply(this, args));
                        if (tmp === null || typeof tmp !== 'object') {
                            throw new Error('init() must return an object');
                        }
                        object = tmp;
                        status = 'ready';
                    }
                    finally {
                        if (status === 'running') {
                            status = 'idle';
                        }
                    }
                };
            }

            assert_ready();
            const value = Reflect.get(object, prop, object);
            return typeof value === 'function' ? value.bind(object) : value;
        },
        set(target, prop, value, receiver) {
            assert_ready();

            if (prop === 'init') {
                throw new Error('init() cannot be replaced');
            }

            return Reflect.set(object, prop, value, object);
        },
        has(target, prop) {
            assert_ready();
            return Reflect.has(object, prop);
        },
        deleteProperty(target, prop) {
            assert_ready();
            return Reflect.deleteProperty(object, prop);
        },
        ownKeys(target) {
            assert_ready();
            return Reflect.ownKeys(object);
        },
        getOwnPropertyDescriptor(target, prop) {
            assert_ready();
            return Reflect.getOwnPropertyDescriptor(object, prop);
        },
    });

    function assert_ready() {
        if (status === 'idle') {
            throw new Error('init() must be called first');
        }
        if (status === 'running') {
            throw new Error('init() is still running');
        }
    }
}

module.exports = init_proxy;
