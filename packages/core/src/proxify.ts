import { Lens } from './types';

export const proxify = (target: any) => {
    return new Proxy(target, {
        get(target: { instantiate: (lens: Lens[]) => any } & Record<string, any>, prop: any) {
            if (prop in target) {
                return target[prop];
            }
            if (typeof prop === 'symbol') return;
            return target.instantiate([
                {
                    key: 'focus ' + prop,
                    get: (s) => s[prop],
                    set: (a, s) =>
                        Array.isArray(s) ? [...s.slice(0, prop), a, ...s.slice(Number(prop) + 1)] : { ...s, [prop]: a },
                },
            ]);
        },
    });
};
