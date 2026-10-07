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

//! Reconcile the workspace's derived `Table`s with a restored
//! `derived_tables` map.

use std::collections::{BTreeMap, BTreeSet};

use perspective_js::utils::*;

use crate::config::{DerivedTableConfig, OptionalUpdate, ViewerConfigUpdate};
use crate::derived::topo_order;
use crate::presentation::Presentation;
use crate::session::MissingTable;
use crate::tasks::{RestoreErrors, RestoreMode, build_derived, restore_panel};
use crate::workspace::Workspace;

/// Build every derivation in `configs` that is not already reusable,
/// parents-first, deferring any whose parent is not yet hosted.
pub async fn apply_derived_tables(
    workspace: &Workspace,
    configs: BTreeMap<String, DerivedTableConfig>,
) -> ApiResult<()> {
    let order = topo_order(&configs).map_err(ApiError::new)?;
    let reuse = workspace.derived_reusable(&order, &configs);

    // Delete the stale generations children-first BEFORE building: a
    // non-reusable name's old registration otherwise blocks its parent's
    // redefinition (the parent's consumer count includes the stale child,
    // and the engine refuses to delete a table the child's view reads).
    for name in order.iter().rev() {
        if reuse.contains(name) || !workspace.is_derived(name) {
            continue;
        }

        let consumers = workspace.derived_consumers(name);
        if consumers > 0 {
            return Err(ApiError::new(format!(
                "Cannot redefine `{name}` while {consumers} panels or tables read it"
            )));
        }

        if let Some(stale) = workspace.take_derived(name) {
            stale.delete().await?;
        }
    }

    let mut deferred = BTreeMap::new();
    for name in &order {
        let config = &configs[name];
        if reuse.contains(name) {
            continue;
        }

        if deferred.contains_key(&config.table) {
            deferred.insert(name.clone(), config.clone());
            continue;
        }

        let Some(client) = workspace
            .resolve_client_for_table(&config.table, None)
            .await
        else {
            deferred.insert(name.clone(), config.clone());
            continue;
        };

        if !build_derived(&client, workspace, name, &config.table, &config.view_config).await? {
            deferred.insert(name.clone(), config.clone());
        }
    }

    workspace.set_derived_pending(deferred);
    Ok(())
}

/// Delete every registered derivation absent from `keep`, children first.
pub async fn prune_derived(workspace: &Workspace, keep: &BTreeSet<String>) -> ApiResult<()> {
    let mut doomed = workspace
        .derived_names()
        .into_iter()
        .filter(|name| !keep.contains(name))
        .collect::<Vec<_>>();

    doomed.sort_by_key(|name| std::cmp::Reverse(workspace.derived_ancestors(name).len()));
    for name in doomed {
        if workspace.derived_consumers(&name) > 0 {
            tracing::warn!("Keeping derived table \"{name}\", which is still read");
            continue;
        }

        if let Some(derived) = workspace.take_derived(&name)
            && let Err(err) = derived.delete().await
        {
            tracing::warn!("Failed to delete derived table \"{name}\": {err}");
        }
    }

    Ok(())
}

/// Retry the derivations whose parent was not hosted when they were restored.
pub async fn resume_derived(workspace: &Workspace) -> ApiResult<()> {
    let pending = workspace.derived_pending();
    if pending.is_empty() {
        return Ok(());
    }

    let mut configs = workspace.derived_configs();
    configs.extend(pending);
    apply_derived_tables(workspace, configs).await
}

/// Tear down the element's ENTIRE derived state (the "all" reset): release
/// every panel bound or pending to a derived (or pending-derived) table to
/// its root ancestor, clear the pending registry, and delete every
/// registered derivation children-first.
pub async fn purge_derived(workspace: &Workspace, presentation: &Presentation) -> ApiResult<()> {
    let pending = workspace.derived_pending();
    if workspace.derived_names().is_empty() && pending.is_empty() {
        return Ok(());
    }

    let parent_of = |name: &str| {
        workspace
            .derived_config(name)
            .map(|x| x.table)
            .or_else(|| pending.get(name).map(|x| x.table.clone()))
    };

    let root_of = |name: &str| {
        let mut seen = BTreeSet::new();
        let mut cursor = name.to_owned();
        while seen.insert(cursor.clone()) {
            match parent_of(&cursor) {
                Some(parent) => cursor = parent,
                None => break,
            }
        }

        cursor
    };

    let active = workspace.active_id();
    let mut rebinds = Vec::new();
    for panel in workspace.panels() {
        let Some(bound) = panel
            .session
            .get_table()
            .map(|x| x.get_name().to_owned())
            .or_else(|| panel.session.pending_table())
        else {
            continue;
        };

        if parent_of(&bound).is_none() {
            continue;
        }

        let update = ViewerConfigUpdate {
            table: OptionalUpdate::Update(root_of(&bound).into()),
            ..ViewerConfigUpdate::default()
        };

        let is_active = active.as_ref() == Some(&panel.id);
        let presentation = presentation.clone();
        let workspace = workspace.clone();
        rebinds.push(async move {
            restore_panel(
                &panel.session,
                &panel.renderer,
                &presentation,
                &workspace,
                RestoreMode::Existing { active: is_active },
                update,
                RestoreErrors::Publish,
                MissingTable::Pend,
                None,
            )
            .await
        });
    }

    futures::future::join_all(rebinds)
        .await
        .into_iter()
        .collect::<ApiResult<Vec<_>>>()?;

    workspace.set_derived_pending(BTreeMap::new());
    prune_derived(workspace, &BTreeSet::new()).await
}
