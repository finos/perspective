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
import type * as psp from "@finos/perspective";
import type {
    HTMLPerspectiveViewerElement,
    ViewerConfigUpdate,
} from "@finos/perspective-viewer";

import {
    createContextWithSelectors,
    useContextSelector,
    useContextSelectors,
} from "./context";

type PspAction =
    | {
          type: "addTable";
          table: string;
          promise: Promise<psp.Table>;
      }
    | {
          type: "removeTable";
          table: string;
      };

type GeneratorsByType<T extends { type: string }> = {
    [K in T["type"]]: (fields: Omit<Extract<T, { type: K }>, "type">) => T;
};

type FunctionsByType<T extends { type: string }> = {
    [K in T["type"]]: (fields: Omit<Extract<T, { type: K }>, "type">) => void;
};

function createGenerator<T extends { type: string }>(): GeneratorsByType<T> {
    return new Proxy(
        {},
        {
            get: (_, type: string) => {
                return (fields: Record<string, unknown>) => ({
                    type,
                    ...fields,
                });
            },
        }
    ) as GeneratorsByType<T>;
}

const actions: GeneratorsByType<PspAction> = createGenerator<PspAction>();

export function useActions(): FunctionsByType<PspAction> {
    const dispatch = usePspDispatch();
    return new Proxy(
        {},
        {
            get: (_, type: string) => {
                return (fields: Record<string, unknown>) =>
                    dispatch((actions as any)[type](fields));
            },
        }
    ) as FunctionsByType<PspAction>;
}

interface PspState {
    tables: Record<string, Promise<psp.Table>>;
}

const PspContext = createContextWithSelectors<PspState>(null);

const PspDispatchContext =
    React.createContext<React.Dispatch<PspAction> | null>(null);

export const PerspectiveProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [state, dispatch] = React.useReducer(
        (state: PspState, action: PspAction) => {
            switch (action.type) {
                case "addTable":
                    return {
                        ...state,
                        tables: {
                            ...state.tables,
                            [action.table]: action.promise,
                        },
                    };
                case "removeTable": {
                    const { [action.table]: removed, ...tables } = state.tables;
                    return {
                        ...state,
                        tables,
                    };
                }
                default:
                    return state;
            }
        },
        { tables: {} }
    );

    return (
        <PspContext.Provider value={state}>
            <PspDispatchContext.Provider value={dispatch}>
                {children}
            </PspDispatchContext.Provider>
        </PspContext.Provider>
    );
};

export function useTables(): Record<string, Promise<psp.Table>> {
    return usePsp((s) => s.tables);
}

function usePsp<A>(selector: (_: PspState) => A): A {
    return useContextSelector(PspContext, (state) => {
        if (!state) {
            throw new Error("usePsp must be used within a PerspectiveProvider");
        }
        return selector(state);
    });
}

const usePspMulti = <
    Selectors extends readonly ((value: PspState) => any)[],
    R
>(
    selectors: [...Selectors],
    mapper: (
        ...args: {
            [K in keyof Selectors]: Selectors[K] extends (
                value: PspState
            ) => infer B
                ? B
                : never;
        }
    ) => R
): R => {
    const nullableSelectors = selectors.map((f) => (s: PspState | null) => {
        if (s === null) {
            throw Error(
                "usePspDispatch must be used within a PerspectiveProvider"
            );
        }
        return f(s);
    });
    return useContextSelectors(PspContext, nullableSelectors, mapper as any);
};

function usePspDispatch(): React.Dispatch<PspAction> {
    const ctx = React.useContext(PspDispatchContext);
    if (!ctx) {
        throw new Error(
            "usePspDispatch must be used within a PerspectiveProvider"
        );
    }
    return ctx;
}

function validateProps(props: PerspectiveViewerProps) {
    if (props.selectedTable && props.tableData) {
        throw new Error(
            "Cannot provide both `selectedTable` and `tableData` props"
        );
    }
}

interface PerspectiveViewerProps {
    selectedTable?: string;
    config?: ViewerConfigUpdate;
    onConfigUpdate?: (e: ViewerConfigUpdate) => void;
    tableData?: string | Array<object> | Record<string, any[]>;
}

const PerspectiveViewerInternal: React.FC<PerspectiveViewerProps> = (props) => {
    validateProps(props);
    const { selectedTable, config, onConfigUpdate } = props;

    const [viewer, setViewer] = React.useState<HTMLPerspectiveViewerElement>();
    const [version, setVersion] = React.useState(0);
    const tablePromise = usePsp((s) =>
        selectedTable ? s.tables[selectedTable] : undefined
    );

    // Allows the effect block to access the latest `onConfigUpdate` function without
    // needing to re-register the event listener every time it changes.
    const onConfigUpdateRef = React.useRef(onConfigUpdate);
    onConfigUpdateRef.current = onConfigUpdate;

    const lastConfigRef = React.useRef<ViewerConfigUpdate>();
    const [loaded, setLoaded] = React.useState(false);

    // Propagate config updates up the the parent if desired
    React.useEffect(() => {
        if (viewer) {
            const configUpdate = (e: CustomEvent) => {
                lastConfigRef.current = e.detail;
                onConfigUpdateRef.current &&
                    onConfigUpdateRef.current(e.detail);
            };
            viewer.addEventListener("perspective-config-update", configUpdate);
            return () => {
                viewer.removeEventListener(
                    "perspective-config-update",
                    configUpdate
                );
            };
        }
    }, [viewer]);

    // Load the table, we never unload
    React.useEffect(() => {
        if (viewer && tablePromise) {
            const cleanup = () => {
                console.log(`v${version} Cleanup`);
                // Force recreation of webcomponent on next render.
                setVersion(version + 1);
                // Prevent config restores while the viewer is being replaced.
                setLoaded(false);
            };

            viewer.load(tablePromise);
            // Now we can restore.
            setLoaded(true);
            return cleanup;
        }
    }, [viewer, tablePromise]);

    React.useEffect(() => {
        if (!loaded) {
            return;
        }
        if (viewer && config) {
            // Check identity to avoid infinite loop.
            if (lastConfigRef.current !== config) {
                console.log("Restoring viewer");
                viewer.restore(config);
            }
        }
    }, [viewer, config, loaded]);

    React.useEffect(() => {
        if (viewer) {
            return () => {
                viewer.delete();
            };
        }
    }, [viewer]);

    return <perspective-viewer key={version} ref={setViewer as any} />;
};

export const PerspectiveViewer: React.FC<PerspectiveViewerProps> = React.memo(
    PerspectiveViewerInternal
);
