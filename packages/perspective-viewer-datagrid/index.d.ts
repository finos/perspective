import {View} from "@finos/perspective";
import {RegularTableElement} from "regular-table";

declare class PerspectiveViewerDatagridPluginElement extends HTMLElement {
    public readonly datagrid: RegularTableElement;

    // private methods
    private _toggle_edit_mode(force?: boolean): void;
    private _toggle_scroll_lock(force?: boolean): void;
    private _restore_column_size_overrides(old_sizes: any, cache: boolean);
    private _save_column_size_overrides(): any;

    // getters accessors
    public get name(): string;
    public get select_mode(): string;
    public get min_config_columns(): string;
    public get config_column_names(): string;

    // customElements methods
    protected connectedCallback(): void;
    protected disconnectedCallback(): void;

    // view related methods
    public activate(view: View): Promise<void>;
    public draw(view: View): Promise<void>;
    public update(view: View): Promise<void>;
    public restyle(view: View): Promise<void>;

    // other public methods
    public resize(): Promise<void>;
    public clear(): Promise<void>;
    public delete(): void;
    public save(): Promise<void>;
    public restore(token: any): Promise<void>;
    public restore(token: any): Promise<void>;
}
