var zerorpc = require("zerorpc");
const perspective = require("@finos/perspective");

var views = {}
var view_counter = 0;
var table;

var server = new zerorpc.Server({
    heartbeat: function(reply) {
        reply(null, "pong");
    },
    table: function(data, options, reply) {
        if(table){ table.delete(); }
        table = perspective.table(data, options);
        reply(null, "");
    },
    update: function(data, reply) {
        if(!table){ return; }
        if(!Array.isArray(data)){data = [data];}
        table.update(data);
        reply(null, "");
    },
    remove: function(data, reply) {
        if(!table){ return; }
        table.remove(data);
        reply(null, "");
    },
    view: function(config, reply) {
        if(!table){ return; }
        views[view_counter] = table.view(config);
        reply(null, view_counter);
        view_counter++;
    },
    to_json: function(data, reply) {
        if(!table){ return; }
        if(data >= 0){
            views[data].to_json().then(json=>reply(null, json));
        } else {
            table.view({}).to_json().then(json=>reply(null, json));
        }
    },
    to_columns: function(data, reply) {
        if(!table){ return; }
        if(data >= 0){
            views[data].to_columns().then(json=>reply(null, json));
        } else {
            table.view({}).to_columns().then(json=>reply(null, json));
        }
    }


});

server.bind("tcp://" + process.env.PERSPECTIVE_NODE_HOST);
