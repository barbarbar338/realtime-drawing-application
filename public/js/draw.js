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
let width = parseInt(localStorage.getItem("width")) || 5;

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
	const rc = rough.canvas(canvas[0]);

	const slider = $("#width-slider");
	const output = $("#width-output");

	// show users line width
	output.text(`Line Width: ${width}px`);
	slider.val(width);
	slider.on("input", (data) => {
		width = data.target.value;
		localStorage.setItem("width", width);
		output.text(`Line Width: ${width}px`);
	});

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

			rc.line(client.x, client.y, data.x, data.y, {
				strokeWidth: data.width,
				stroke: data.color,
			});
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
				width,
			});
			lastEmit = Date.now();
		}
		if (isDrawing) {
			previous.x = event.pageX;
			previous.y = event.pageY;
		}
	});

	// Clear AFK clients (just a little optimisation)
	setInterval(() => {
		clients.forEach((client) => {
			if (client.updated > timeout) {
				clients.delete(client.id);
				const cursor = cursors.get(client.id);
				if (cursor) cursor.remove();
				cursors.delete(client.id);
			}
		});
	}, timeout);
});
