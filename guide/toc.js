// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded affix "><a href="perspective.html">What is Perspective</a></li><li class="chapter-item expanded affix "><li class="part-title">Overview</li><li class="chapter-item expanded "><a href="explanation/architecture.html"><strong aria-hidden="true">1.</strong> Data Architecture</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="explanation/architecture/client_only.html"><strong aria-hidden="true">1.1.</strong> Client-only</a></li><li class="chapter-item expanded "><a href="explanation/architecture/client_server.html"><strong aria-hidden="true">1.2.</strong> Client/Server replicated</a></li><li class="chapter-item expanded "><a href="explanation/architecture/server_only.html"><strong aria-hidden="true">1.3.</strong> Server only</a></li></ol></li><li class="chapter-item expanded "><a href="explanation/table.html"><strong aria-hidden="true">2.</strong> Table</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="explanation/table/constructing_schema.html"><strong aria-hidden="true">2.1.</strong> Construct an empty Table from a schema</a></li><li class="chapter-item expanded "><a href="explanation/table/schema.html"><strong aria-hidden="true">2.2.</strong> Schema and column types</a></li><li class="chapter-item expanded "><a href="explanation/table/loading_data.html"><strong aria-hidden="true">2.3.</strong> Loading data</a></li><li class="chapter-item expanded "><a href="explanation/table/options.html"><strong aria-hidden="true">2.4.</strong> index and limit options</a></li><li class="chapter-item expanded "><a href="explanation/table/update_and_remove.html"><strong aria-hidden="true">2.5.</strong> update() and remove() streaming methods</a></li><li class="chapter-item expanded "><a href="explanation/table/clear_and_replace.html"><strong aria-hidden="true">2.6.</strong> clear() and replace() start-over methods</a></li></ol></li><li class="chapter-item expanded "><a href="explanation/view.html"><strong aria-hidden="true">3.</strong> View</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="explanation/view/querying.html"><strong aria-hidden="true">3.1.</strong> Querying data</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="explanation/view/config/group_by.html"><strong aria-hidden="true">3.1.1.</strong> group_by</a></li><li class="chapter-item expanded "><a href="explanation/view/config/split_by.html"><strong aria-hidden="true">3.1.2.</strong> split_by</a></li><li class="chapter-item expanded "><a href="explanation/view/config/aggregates.html"><strong aria-hidden="true">3.1.3.</strong> aggregates</a></li><li class="chapter-item expanded "><a href="explanation/view/config/columns.html"><strong aria-hidden="true">3.1.4.</strong> columns</a></li><li class="chapter-item expanded "><a href="explanation/view/config/sort.html"><strong aria-hidden="true">3.1.5.</strong> sort</a></li><li class="chapter-item expanded "><a href="explanation/view/config/filter.html"><strong aria-hidden="true">3.1.6.</strong> filter</a></li><li class="chapter-item expanded "><a href="explanation/view/config/expressions.html"><strong aria-hidden="true">3.1.7.</strong> expressions</a></li></ol></li><li class="chapter-item expanded "><a href="explanation/view/config/flattening.html"><strong aria-hidden="true">3.2.</strong> Flattening a View into a Table</a></li></ol></li><li class="chapter-item expanded "><a href="explanation/javascript.html"><strong aria-hidden="true">4.</strong> JavaScript</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="explanation/javascript_module_structure.html"><strong aria-hidden="true">4.1.</strong> Module Structure</a></li><li class="chapter-item expanded "><a href="explanation/javascript_builds.html"><strong aria-hidden="true">4.2.</strong> Build options</a></li></ol></li><li class="chapter-item expanded "><a href="explanation/python.html"><strong aria-hidden="true">5.</strong> Python</a></li><li class="chapter-item expanded affix "><li class="part-title">Getting Started</li><li class="chapter-item expanded "><a href="how_to/rust.html"><strong aria-hidden="true">6.</strong> Rust</a></li><li class="chapter-item expanded "><a href="how_to/javascript.html"><strong aria-hidden="true">7.</strong> JavaScript</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="how_to/javascript/installation.html"><strong aria-hidden="true">7.1.</strong> Installation via NPM</a></li><li class="chapter-item expanded "><a href="how_to/javascript/importing.html"><strong aria-hidden="true">7.2.</strong> Importing with or without a bundler</a></li><li class="chapter-item expanded "><a href="how_to/javascript/worker.html"><strong aria-hidden="true">7.3.</strong> perspective data engine library</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="how_to/javascript/serializing.html"><strong aria-hidden="true">7.3.1.</strong> Serializing data</a></li><li class="chapter-item expanded "><a href="how_to/javascript/deleting.html"><strong aria-hidden="true">7.3.2.</strong> Cleaning up resources</a></li><li class="chapter-item expanded "><a href="how_to/javascript/nodejs_server.html"><strong aria-hidden="true">7.3.3.</strong> Hosting a WebSocketServer in Node.js</a></li><li class="chapter-item expanded "><a href="how_to/javascript/custom_worker.html"><strong aria-hidden="true">7.3.4.</strong> Using a dedicated Worker, SharedWorker, or ServiceWorker</a></li></ol></li><li class="chapter-item expanded "><a href="how_to/javascript/viewer.html"><strong aria-hidden="true">7.4.</strong> perspective-viewer Custom Element library</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="how_to/javascript/theming.html"><strong aria-hidden="true">7.4.1.</strong> Theming</a></li><li class="chapter-item expanded "><a href="how_to/javascript/custom_themes.html"><strong aria-hidden="true">7.4.2.</strong> Custom Themes</a></li><li class="chapter-item expanded "><a href="how_to/javascript/loading_data.html"><strong aria-hidden="true">7.4.3.</strong> Loading data from a Table</a></li><li class="chapter-item expanded "><a href="how_to/javascript/loading_virtual_data.html"><strong aria-hidden="true">7.4.4.</strong> Loading data from a virtual Table</a></li><li class="chapter-item expanded "><a href="how_to/javascript/save_restore.html"><strong aria-hidden="true">7.4.5.</strong> Saving and restoring UI state</a></li><li class="chapter-item expanded "><a href="how_to/javascript/events.html"><strong aria-hidden="true">7.4.6.</strong> Listening for events</a></li><li class="chapter-item expanded "><a href="how_to/javascript/events.html"><strong aria-hidden="true">7.4.7.</strong> Plugin render limits</a></li></ol></li><li class="chapter-item expanded "><a href="how_to/javascript/react.html"><strong aria-hidden="true">7.5.</strong> React Component</a></li></ol></li><li class="chapter-item expanded "><a href="how_to/python.html"><strong aria-hidden="true">8.</strong> Python</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="how_to/python/installation.html"><strong aria-hidden="true">8.1.</strong> Installation</a></li><li class="chapter-item expanded "><a href="how_to/python/table.html"><strong aria-hidden="true">8.2.</strong> Loading data into a Table</a></li><li class="chapter-item expanded "><a href="how_to/python/callbacks.html"><strong aria-hidden="true">8.3.</strong> Callbacks and events</a></li><li class="chapter-item expanded "><a href="how_to/python/multithreading.html"><strong aria-hidden="true">8.4.</strong> Multithreading</a></li><li class="chapter-item expanded "><a href="how_to/python/websocket.html"><strong aria-hidden="true">8.5.</strong> Hosting a WebSocket server</a></li><li class="chapter-item expanded "><a href="how_to/python/jupyterlab.html"><strong aria-hidden="true">8.6.</strong> PerspectiveWidget for JupyterLab</a></li><li class="chapter-item expanded "><a href="tutorials/python/tornado.html"><strong aria-hidden="true">8.7.</strong> Tutorial: A tornado server with virtual perspective-viewer</a></li></ol></li><li class="chapter-item expanded "><li class="part-title">API</li><li class="chapter-item expanded "><a href="api_reference.html"><strong aria-hidden="true">9.</strong> Crate documentation on docs.rs </a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString();
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
