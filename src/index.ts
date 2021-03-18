import express from "express";
import * as pogger from "pogger";
import { AddressInfo } from "net";
import { Server } from "socket.io";
import { removeProperties } from "remove-properties";

// we actually don't need redis, IDK why I put this :D
// import { redisAdapter } from "./redis";

const app = express();

// sending html file directly
app.use(express.static("public"));

const server = app.listen(3000, "0.0.0.0", () => {
	pogger.success(
		`Express server listenin on ${(server.address() as AddressInfo).port}`,
	);
});

// Initialize socket.io server
const io = new Server(server, {
	cors: {
		origin: "http://localhost:3000",
	},
	//adapter: redisAdapter
});

io.sockets.on("connection", async (socket) => {
	/**
	 * Initial package to set default userdata
	 *
	 * incoming packet:
	 * {
	 *		username: string;
	 *		id: string;
	 *		color: string;
	 *		filter: string;
	 *	}
	 */
	const query = socket.handshake.query;
	const credentials = removeProperties(query, ["EIO", "transport", "t"]);

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
	socket.on("mousemove", async (data) => {
		socket.broadcast.emit("moving", { ...data, ...credentials });
	});
});
