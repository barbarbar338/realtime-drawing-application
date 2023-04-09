// Get local credentials
const id = localStorage.getItem("id");
if (id) window.location.href = "/draw.html";

const button = $("#login");
const username = $("#username");
const color = $("#color").val(getRandomColor());

// get user id from server
button.click(async () => {
	const usernameValue = username.val();
	const colorValue = color.val();
	if (!usernameValue || !colorValue)
		return alert("Username and color expected");
	if (colorValue.length < 7)
		return alert("Specify a valid color code (example: #FFF000)");
	const res = await fetch("/credentials", {
		method: "POST",
		body: JSON.stringify({ username: usernameValue, color: colorValue }),
		headers: {
			"Content-Type": "application/json",
		},
	});
	if (res.status != 201) return alert("A valid username and color expected");
	const body = await res.json();
	localStorage.setItem("id", body.id);
	window.location.href = "/draw.html";
});

// Generate random 6 digit hex color code
function getRandomColor() {
	const letters = "0123456789ABCDEF";
	let color = "#";
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * letters.length)];
	}
	return color;
}
