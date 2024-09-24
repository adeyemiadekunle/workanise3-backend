"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var appRoutes_1 = __importDefault(require("./appRoutes"));
var session_scheduler_1 = __importDefault(require("./utils/session-scheduler"));
var http_1 = require("http");
var websocket_server_1 = require("./utils/websocket-server");
var app = (0, express_1.default)();
var server = (0, http_1.createServer)(app);
app.get('/', function (req, res) {
    var name = process.env.NAME || 'World';
    res.send("Hello ".concat(name, "!"));
});
// Middleware
app.use(express_1.default.json());
// Register routes
app.use('/api', appRoutes_1.default);
// background jobs
(0, session_scheduler_1.default)();
(0, websocket_server_1.setupWebSocketServer)(server);
var port = parseInt(process.env.PORT || '3000');
app.listen(port, function () {
    console.log("listening on port ".concat(port));
});
//# sourceMappingURL=index.js.map