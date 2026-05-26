const { ipcRenderer } = require("electron");

/* ---------------- CLOCK ---------------- */
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  m = m < 10 ? "0" + m : m;
  document.getElementById("clock").innerText = `${h}:${m} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ---------------- AUDIO ---------------- */
const boot = new Audio("assets/sound/boot.mp3");
const music = new Audio("assets/sound/menu.mp3");
const move = new Audio("assets/sound/move.mp3");

music.loop = true;

function startAudio() {
  boot.play();
  setTimeout(() => music.play(), 2000);
}

document.addEventListener("click", startAudio, { once: true });
document.addEventListener("keydown", startAudio, { once: true });

function playMove() {
  move.currentTime = 0;
  move.play();
}

/* ---------------- HOME MENU ---------------- */
let apps = JSON.parse(localStorage.getItem("apps") || "[]");
let index = 0;

function renderApps() {
  const home = document.getElementById("home");
  home.innerHTML = "";

  apps.forEach((app, i) => {
    const div = document.createElement("div");
    div.className = "app" + (i === index ? " selected" : "");
    div.style.backgroundImage = `url(${app.image})`;
    div.innerText = app.name;

    div.onclick = () => launchApp(app);

    home.appendChild(div);
  });

  updatePos();
}

function updatePos() {
  document.getElementById("home").style.transform =
    `translate(${index * -220}px, -50%)`;
}

function launchApp(app) {
  alert("Launching " + app.name);
}

/* ---------------- CONTROLLER SUPPORT ---------------- */
window.addEventListener("gamepadconnected", () => {
  setInterval(() => {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    if (gp.buttons[15]?.pressed) {
      index = Math.min(index + 1, apps.length - 1);
      renderApps();
      playMove();
    }

    if (gp.buttons[14]?.pressed) {
      index = Math.max(index - 1, 0);
      renderApps();
      playMove();
    }
  }, 150);
});

/* ---------------- KEYBOARD ---------------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    index = Math.min(index + 1, apps.length - 1);
    renderApps();
    playMove();
  }

  if (e.key === "ArrowLeft") {
    index = Math.max(index - 1, 0);
    renderApps();
    playMove();
  }
});

/* ---------------- ADD GAME ---------------- */
document.getElementById("addGame").onclick = () => {
  const name = prompt("Game name:");
  const image = prompt("Image URL (or leave blank):");

  apps.push({
    name,
    image: image || "https://via.placeholder.com/300"
  });

  localStorage.setItem("apps", JSON.stringify(apps));
  renderApps();
};

/* ---------------- TURN OFF ---------------- */
document.getElementById("turnOff").onclick = () => {
  ipcRenderer.send("app-close");
};

/* ---------------- PS CAMERA (SIMPLE MOTION DETECTION) ---------------- */
const video = document.getElementById("cameraBox");

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream);

/* basic motion control */
let lastX = 0;

setInterval(() => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0);

  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let avgX = 0;

  for (let i = 0; i < frame.data.length; i += 4) {
    avgX += frame.data[i];
  }

  avgX /= frame.data.length;

  if (avgX > lastX + 5) {
    index = Math.min(index + 1, apps.length - 1);
    renderApps();
  }

  if (avgX < lastX - 5) {
    index = Math.max(index - 1, 0);
    renderApps();
  }

  lastX = avgX;
}, 300);

/* INIT */
renderApps()