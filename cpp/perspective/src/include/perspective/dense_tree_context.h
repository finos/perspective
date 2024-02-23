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

#pragma once
#include <perspective/first.h>
#include <perspective/data_table.h>
#include <perspective/aggregate.h>
#include <perspective/dense_tree.h>
#include <perspective/aggspec.h>
#include <perspective/exports.h>
#include <perspective/filter.h>

namespace perspective {

class PERSPECTIVE_EXPORT t_dtree_ctx {
public:
    t_dtree_ctx(
        std::shared_ptr<const t_data_table> strands,
        std::shared_ptr<const t_data_table> strand_deltas,
        const t_dtree& tree,
        const std::vector<t_aggspec>& aggspecs
    );
    void init();
    const t_data_table& get_aggtable() const;
    const t_dtree& get_tree() const;
    const std::vector<t_aggspec>& get_aggspecs() const;
    const t_aggspec& get_aggspec(const std::string& aggname) const;
    void pprint(const t_filter& fltr) const;

    std::pair<const t_uindex*, const t_uindex*> get_leaf_iterators(t_index idx
    ) const;

    std::shared_ptr<const t_column> get_pkey_col() const;
    std::shared_ptr<const t_column> get_strand_count_col() const;
    std::shared_ptr<const t_data_table> get_strands() const;
    std::shared_ptr<const t_data_table> get_strand_deltas() const;
    void pprint_strands() const;
    void pprint_strands_tree() const;

protected:
    void build_aggregates();
    t_uindex get_num_aggcols() const;

private:
    std::shared_ptr<const t_data_table> m_strands;
    std::shared_ptr<const t_data_table> m_strand_deltas;
    const t_dtree& m_tree;
    std::vector<t_aggspec> m_aggspecs;
    std::shared_ptr<t_data_table> m_aggregates;
    bool m_init;
    std::map<std::string, t_index> m_aggspecmap;
};

} // end namespace perspective
