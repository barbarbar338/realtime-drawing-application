import { Color, hexToRgb, Solver } from "./color.js";
import { Snowflake } from "./snowflake.js";

// Get local credentials
const localData = JSON.parse(localStorage.getItem("credentials") || "{}");

// Get URL params
const urlParams = new URLSearchParams(window.location.search);

// Credentials
export const id = defineID();
export const username = defineUsername();
export const color = defineColor();
export const filter = defineFilter();

// save new credentials
localStorage.setItem(
	"credentials",
	JSON.stringify({
		id,
		username,
		color,
	}),
);

// Define which ID to use
function defineID() {
	const localID = localData.id;
	return localID || Snowflake.generate();
}

// Define which username to use
function defineUsername() {
	const localUsername = localData.username;
	const paramUsername = urlParams.get("username");
	return paramUsername ? paramUsername : localUsername ? localUsername : id;
}

// Define which color to use
function defineColor() {
	const colorRegex = /^#[0-9A-F]{6}$/i;
	const localColor = localData.color;
	const paramColor = urlParams.get("color");
	return paramColor && colorRegex.test(`#${paramColor}`)
		? `#${paramColor}`
		: localColor && colorRegex.test(localColor)
		? localColor
		: getRandomColor();
}

// generate image filter to match with color
function defineFilter() {
	const rgb = hexToRgb(color);
	const colorParser = new Color(rgb[0], rgb[1], rgb[2]);
	const solver = new Solver(colorParser);
	const { filter } = solver.solve();
	return filter;
}

// Generate random 6 digit hex color code
function getRandomColor() {
	const letters = "0123456789ABCDEF";
	let color = "#";
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * letters.length)];
	}
	return color;
}
