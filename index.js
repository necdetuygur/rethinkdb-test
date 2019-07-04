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
        get(socket);
    });
    get(socket);
    socket.on("get", () => {
        get(socket);
    });
});

var get = (socket) => {
    r.connect(config).then(function (conn) {
        r.table('table').orderBy("date").run(conn, function (err, result) {
            socket.emit("data", result);
        });
    });
}

app.use(express.static(__dirname + "/public"));

r.connect(config).then(function (conn) {
    r.table('table').changes().run(conn, function (err, cursor) {
        cursor.each(function (err, item) {
            io.emit("updated", item);
        });
    })
});