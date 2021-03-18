// Get local credentials
const id = localStorage.getItem("id");
if (!id) window.location.href = "/";

// send initial data
const socket = io(window.location.origin, { query: `id=${id}` });
socket.on("no_credential", () => {
	localStorage.removeItem("id");
	window.location.href = "/";
});

// Client properties
const previous = {};
let isDrawing = false;
let lastEmit = Date.now();

// cursors and clients to render
const clients = new Map();
const cursors = new Map();

// Client timeout (just a little optimisation)
const timeout = 10 * 1000;

/**
 * Default cursor component for other clients
 * color: Clients color code
 * username: Clients ID or custom username
 */
const cursorTemplate = `
	<div class="cursor test">
		<div>
			<p style="color: {color};">{username}</p>
		</div>
	</div>
`;

$(() => {
	const doc = $(document);
	const canvas = $("#paper");
	const context = canvas[0].getContext("2d");

	/**
	 * Get move data from other clients. See "mousemove" event on server-side
	 * incoming packet:
	 * {
	 * 		x: number;
	 *		y: number;
	 *		isDrawing: boolean;
	 *		id: number;
	 *		username: string;
	 *		color: string;
	 *		filter: string;
	 * }
	 */
	socket.on("moving", (data) => {
		// If packets client is new to us, render its cursor
		if (data.id != id) {
			if (!cursors.has(data.id)) {
				const cursor = $(
					cursorTemplate
						.replace("{color}", data.color)
						.replace("{username}", data.username),
				)
					.appendTo("#cursors")
					.css({ filter: data.filter });
				cursors.set(data.id, cursor);
			}

			// set clients cursors position
			cursors.get(data.id).css({
				left: data.x,
				top: data.y,
				"background-image": data.isDrawing
					? "url('../img/drawing.png')"
					: "url('../img/not-drawing.png')",
			});
		}

		// and if client is drawing, draw on our canvas too
		if (data.isDrawing && clients.has(data.id)) {
			const client = clients.get(data.id);
			drawLine(client.x, client.y, data.x, data.y, `${data.color}`);
		}

		// set updated value for AFK check
		data.updated = Date.now();
		clients.set(data.id, data);
	});

	// if we click on canvas, set us as drawing
	canvas.on("mousedown", (event) => {
		event.preventDefault();
		isDrawing = true;
		previous.x = event.pageX;
		previous.y = event.pageY;
	});

	// and if we don't, set us as not drawing
	doc.bind("mouseup mouseleave", () => (isDrawing = false));

	/**
	 * when we move our mouse, trigger "mousemove" event
	 * Also if isDrawing is true, draw a line
	 * outgoing packet:
	 * {
	 * 		x: number;
	 *		y: number;
	 *		isDrawing: boolean;
	 *		id: number;
	 * }
	 */
	doc.on("mousemove", (event) => {
		if (Date.now() - lastEmit > 30) {
			socket.emit("mousemove", {
				x: event.pageX,
				y: event.pageY,
				isDrawing,
				id,
			});
			lastEmit = Date.now();
		}
		if (isDrawing) {
			//drawLine(previous.x, previous.y, event.pageX, event.pageY, "#000000");
			previous.x = event.pageX;
			previous.y = event.pageY;
		}
	});

	// Clear AFK clients (just a little optimisation)
	setInterval(() => {
		clients.forEach((client) => {
			if (client.updated > timeout) {
				clients.delete(client.id);
				cursors.get(client.id).remove();
				cursors.delete(client.id);
			}
		});
	}, timeout);

	// draw a line on canvas from (x1, y1) to (x2, y2) with color (color)
	function drawLine(x1, y1, x2, y2, color) {
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.stroke();
	}
});
