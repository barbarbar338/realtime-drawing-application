import { json, urlencoded } from "body-parser";
import express from "express";
import { AddressInfo } from "net";
import * as pogger from "pogger";
import { Server } from "socket.io";
import { CONFIG } from "./config";
import { Color, Solver, hexToRgb } from "./utils/color";

const app = express();
const users = new Map<string, any>();

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
	const userID = id || CONFIG.PIKA.gen("user");
	const rgb = hexToRgb(color) as number[];
	const colorParser = new Color(rgb[0], rgb[1], rgb[2]);
	const solver = new Solver(colorParser);
	const { filter } = solver.solve();
	users.set(userID, { id: userID, username, color, filter });
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
		origin: `http://localhost:${CONFIG.PORT},https://draw.fly.dev/`,
	},
});

io.sockets.on("connection", async (socket) => {
	/**
	 * Initial package to set default userdata
	 *
	 * incoming packet:
	 * {
	 *		id: string;
	 * }
	 */
	const { id } = socket.handshake.query;
	const credentials = users.get(id as string);
	if (!credentials || !credentials.id) socket.emit("no_credential");

	// save user data to cache for fewer requests
	users.set(id as string, credentials);

	/**
	 * Nothing fancy on server-side.
	 * We broadcast the data coming from the client to other clients as is.
	 *
	 * incoming packet:
	 * {
	 * 		x: number;
	 *		y: number;
	 *		width: number;
	 *		isDrawing: boolean;
	 *		id: number;
	 * }
	 *
	 */
	socket.on("mousemove", async (packet) => {
		packet.width = packet.width > 10 || packet.width < 1 ? 5 : packet.width;
		const data = { ...packet, ...credentials };
		io.emit("moving", { ...data, ...credentials });
	});
});
