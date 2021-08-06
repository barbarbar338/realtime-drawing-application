import express from "express";
import * as pogger from "pogger";
import { AddressInfo } from "net";
import { Server } from "socket.io";
import { json, urlencoded } from "body-parser";
import { get, redisAdapter, set } from "./redis";
import { Snowflake } from "./utils/snowflake";
import { Color, hexToRgb, Solver } from "./utils/color";
import { CONFIG } from "./config";

const app = express();

// sending html file directly
app.use(express.static("public"));

app.use(urlencoded({ extended: false }));
app.use(json());

// create profile
app.post("/credentials", async (req, res) => {
	const colorRegex = /^#[0-9A-F]{6}$/i;
	const { username, color, id } = req.body;
	if (!username || !color)
		return res.status(400).json({ message: "username and color expected" });
	if (!colorRegex.test(color))
		return res.status(400).json({ message: "invalid color code" });
	const userID = id || Snowflake.generate();
	const rgb = hexToRgb(color) as number[];
	const colorParser = new Color(rgb[0], rgb[1], rgb[2]);
	const solver = new Solver(colorParser);
	const { filter } = solver.solve();
	await set(userID, { id: userID, username, color, filter });
	return res.status(201).json({ id: userID, username, color, filter });
});

const server = app.listen(CONFIG.PORT, "0.0.0.0", () => {
	pogger.success(
		`Express server listenin on ${(server.address() as AddressInfo).port}`,
	);
});

// Initialize socket.io server
const io = new Server(server, {
	cors: {
		origin: "http://localhost:3000,https://draw.fly.dev/",
	},
	adapter: redisAdapter,
});

io.sockets.on("connection", async (socket) => {
	/**
	 * Initial package to set default userdata
	 *
	 * incoming packet:
	 * {
	 *		id: string;
	 *	}
	 */
	const { id } = socket.handshake.query;
	const credentials = await get(id as string);
	if (!credentials.id) socket.emit("no_credential");

	/**
	 * Nothing fancy on server-side.
	 * We broadcast the data coming from the client to other clients as is.
	 *
	 * incoming packet:
	 * {
	 * 		x: number;
	 *		y: number;
	 *		isDrawing: boolean;
	 *		id: number;
	 * }
	 *
	 */
	socket.on("mousemove", async (packet) => {
		const data = { ...packet, ...credentials };
		io.emit("moving", { ...data, ...credentials });
	});
});
