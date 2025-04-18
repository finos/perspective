// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import * as React from "react";
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useSyncExternalStore,
    type Context,
    type Provider,
} from "react";

/**
 * Taken from
 * https://github.com/dai-shi/use-context-selector/issues/109#issuecomment-2614132155
 **/

type Subscribe = Parameters<typeof useSyncExternalStore>[0];
type Subscriber = () => void;
export type Store<A> = { value: A; subscribe: Subscribe };

/** useContext that supports selectors */
export const createContextWithSelectors = <A,>(defaultValue: A | null) => {
    /** create default react context */
    const context = createContext<Store<A> | null>(
        defaultValue
            ? {
                  /** put context value one level deep to allow addition of... */
                  value: defaultValue,
                  /** subscribe function to access from outside */
                  subscribe: () => () => {},
              }
            : null
    );

    /** original provider */
    const Original = context.Provider;

    /** provider to replace original one */
    const NewProvider: CallSignature<Provider<A>> = ({ value, children }) => {
        /** non-reactive store */
        const store = useRef<Store<A> | null>(null);

        /** subscribers of store */
        const subscribers = useRef(new Set<Subscriber>());

        /** initialize store */
        if (!store.current)
            store.current = {
                value,
                subscribe: (subscriber) => {
                    subscribers.current.add(subscriber);
                    return () => subscribers.current.delete(subscriber);
                },
            };

        /** when context value changes */
        useEffect(() => {
            if (!store.current) return;
            /** if new value is referentially different from old value */
            if (!Object.is(store.current.value, value)) {
                /** update value */
                store.current.value = value;
                /** notify subscribers of change */
                subscribers.current.forEach((subscriber) => subscriber());
            }
        }, [value]);

        /** render original provider */
        return <Original value={store.current}>{children}</Original>;
    };

    /** replace old provider with new one */
    context.Provider = NewProvider as Provider<Store<A> | null>;

    return context as unknown as ReturnType<typeof createContext<A | null>>;
};

/** select slice from context value */
export const useContextSelector = <A, B>(
    context: Context<A>,
    selector: (value: A) => B
) => {
    const store = useContext(context) as Store<A>;
    return useSyncExternalStore<B>(store.subscribe, () =>
        selector(store.value)
    );
};

export const useContextSelectors = <
    A,
    Selectors extends readonly ((value: A) => any)[],
    R
>(
    context: React.Context<A>,
    selectors: [...Selectors],
    mapper: (
        ...args: {
            [K in keyof Selectors]: Selectors[K] extends (value: A) => infer B
                ? B
                : never;
        }
    ) => R
): R => {
    const store = useContext(context) as Store<A>;

    const prevValuesRef = useRef<any[]>([]);
    const resultRef = useRef<R>();
    const initializedRef = useRef(false);

    return useSyncExternalStore(store.subscribe, () => {
        const nextValues = selectors.map((sel) => sel(store.value));
        const hasChanged =
            !initializedRef.current ||
            nextValues.some((val, i) => val !== prevValuesRef.current[i]);

        if (hasChanged) {
            prevValuesRef.current = nextValues;
            resultRef.current = mapper(...(nextValues as any));
            initializedRef.current = true;
        }

        return resultRef.current!;
    });
};

/** https://stackoverflow.com/questions/58657325/typescript-pick-call-signature-from-function-interface */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CallSignature<T> = T extends (...args: any[]) => any
    ? (...args: Parameters<T>) => ReturnType<T>
    : never;
