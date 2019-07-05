var sock = require('socket.io');
var express = require('express');
var r = require('rethinkdb');
var config = {
    host: "192.168.1.220",
    db: "test"
};

var app = express();
var io = sock.listen(app.listen(8008));
console.log("listening 8008");

io.sockets.on('connection', function (socket) {
    console.log("connected socket");
    socket.on("insert", (data) => {
        data.date = new Date();
        r.connect(config).then(function (conn) {
            r.table('table').insert(data).run(conn);
        });
    });
    socket.on("delete", (id) => {
        r.connect(config).then(function (conn) {
            r.table('table').filter({ id: id }).delete().run(conn);
        });
        get();
    });
    socket.on("update", (id, name) => {
        r.connect(config).then(function (conn) {
            r.table('table').filter({ id: id }).update({ name: name }).run(conn);
        });
        get();
    });
    get();
    socket.on("get", () => {
        get();
    });
});

var get = () => {
    setTimeout(() => {
        r.connect(config).then(function (conn) {
            r.table('table').orderBy("date").run(conn, function (err, result) {
                io.emit("data", result);
            });
        });
    }, 500);
}

app.use(express.static(__dirname + "/public"));

r.connect(config).then(function (conn) {
    r.table('table').changes().run(conn, function (err, cursor) {
        cursor.each(function (err, item) {
            io.emit("updated", item);
        });
    })
});
