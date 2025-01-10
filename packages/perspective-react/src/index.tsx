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

export function usePspActions(): FunctionsByType<PspAction> {
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

const PspContext = React.createContext<PspState | null>(null);

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
                case "removeTable":
                    const { [action.table]: _, ...tables } = state.tables;
                    return { ...state, tables };
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

export function usePsp(): PspState {
    const ctx = React.useContext(PspContext);
    if (!ctx) {
        throw new Error("usePsp must be used within a PerspectiveProvider");
    }
    return ctx;
}

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
    const { selectedTable, config, onConfigUpdate, tableData } = props;

    const [viewer, setViewer] = React.useState<HTMLPerspectiveViewerElement>();
    const [version, setVersion] = React.useState(0);
    const versionRef = React.useRef(version);
    const ctx = usePsp();
    const tablePromise = selectedTable ? ctx.tables[selectedTable] : undefined;

    // Allows the effect block to access the latest `onConfigUpdate` function without
    // needing to re-register the event listener every time it changes.
    const onConfigUpdateRef = React.useRef(onConfigUpdate);
    onConfigUpdateRef.current = onConfigUpdate;

    const lastConfigRef = React.useRef<ViewerConfigUpdate>();
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        if (!loaded) {
            return;
        }
        if (viewer && config) {
            // Check identity to avoid infinite loop.
            if (lastConfigRef.current !== config) {
                viewer.restore(config);
            }
        }
    }, [viewer, config, loaded]);

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

    React.useEffect(() => {
        if (viewer && selectedTable) {
            if (selectedTable in ctx.tables) {
                const ts = new Date().toISOString();
                viewer.load(tablePromise).then(() => {
                    // if the viewer we're loading is deleted mid-load,
                    // setting loaded will cause a restore before load
                    // is complete on the new viewer.
                    if (version === versionRef.current) {
                        setLoaded(true);
                        console.log(ts, "loaded", version, versionRef.current);
                    } else {
                        console.log(
                            ts,
                            "cancelled_load",
                            version,
                            versionRef.current
                        );
                    }
                });
                return () => {
                    // Force recreation of webcomponent on next render.
                    setVersion(version + 1);
                    versionRef.current = version + 1;
                    setLoaded(false);
                };
            }
        }
    }, [viewer, tablePromise, selectedTable]);

    return <perspective-viewer key={version} ref={setViewer as any} />;
};

export const PerspectiveViewer: React.FC<PerspectiveViewerProps> = React.memo(
    PerspectiveViewerInternal
);
