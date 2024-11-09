import { WebSocketServer } from "ws";
import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import neopi, { jsonValidator, isBlankString } from "./src/socket/message.js";
import { recents, recomendation } from "./src/defaults/request.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", async (ws, req) => {
	const config = Object.fromEntries(
		new URLSearchParams(req.url.match(/[^\/?]+/)[0])
	);
	const socket = neopi(config);
	ws.on("error", async (...err) => {
		const [message, statusCode, shouldRestart] = err;
		const errorMessage = { command: "error system", message, statusCode };

		sendMessage(errorMessage);
		if (shouldRestart) await main(config);
		return;
	});

	if (socket.error) {
		ws.emit("error", socket.error, 403);
		return ws.close();
	}
	socket.on("error", console.log);

	ws.send("connection success!");
	ws.on("message", async raw => {
		const isJSON = jsonValidator(raw.toString());
		if (!isJSON) return ws.emit("error", "invalid input", 422);

		const msg = JSON.parse(raw);
		const isBlankProp = isBlankString(msg);
		if (typeof msg !== "object") return ws.emit("error", "invalid input", 422);
		else if (isBlankProp) return ws.emit("error", "invalid request", 403);

		const command = socket[msg.command];
		if (command == "history" || command == "recomendevent")
			return ws.emit("error", "not support command " + command, 422);
		else if (typeof command == "function") {
			try {
				await socket[msg.command](msg);
			} catch (e) {
				ws.emit("error", e, 500);
			}
		} else {
			ws.emit("error", "unsopporting command", 403);
		}
	});

	const eventNames = ["self", "message", "error"];
	for (const event of eventNames) socket.on(event, cb => sendMessage(cb));
	socket.on("close", b => console.log(b));

	function sendMessage(msg) {
		return ws.send(JSON.stringify(msg));
	}
});

wss.on("close", console.log);
const queryBodyParser = bodyParser.urlencoded({ extended: false });

app.post("/", async (req, res) => {
	res.status(200);
	res.send("Online...");
});

app.post("/chat", queryBodyParser, async (req, res) => {
	const { target, next_token } = req.query;
	let jsonMessage = {};
	if (!/Token \w+/.test(req.headers.authorization)) {
		jsonMessage.message = "Token can`t be undefined";
		jsonMessage.statusCode = 401;
	} else if (isBlankString({ target })) {
		jsonMessage.message = "target can`t be undefined or blank";
		jsonMessage.statusCode = 403;
	} else {
		jsonMessage = await recents(target, req.headers.authorization, next_token);
	}
	res.status(jsonMessage.statusCode);
	return res.json(jsonMessage);
});

app.post("/recommend", queryBodyParser, async (req, res) => {
	const { events } = req.query;
	let jsonMessage = {};
	if (!/Token \w+/.test(req.headers.authorization)) {
		jsonMessage.message = "Token can`t be undefined";
		jsonMessage.statusCode = 401;
	} else if (isBlankString({ events })) {
		jsonMessage.message = "target can`t be undefined or blank";
		jsonMessage.statusCode = 403;
	} else {
		jsonMessage = await recomendation(events, req.headers.authorization);
	}
	res.status(jsonMessage.statusCode);
	return res.json(jsonMessage);
});

server.listen(3000, () => console.log("server is running on port:3000"));
