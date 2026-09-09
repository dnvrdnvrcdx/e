/*
  EDIT ONLY THIS ARRAY if you want to change the on-screen lyric words.
  Use your own permitted text. Times are seconds from the start of the audio.
*/
const lyrics = [
  { time: 0.00, text: "I text a postcard sent to you" },
  { time: 3.30, text: "Did it go through?" },
  { time: 7.80, text: "Sendin' all my love to you" },
  { time: 12.00, text: "You are the moonlight of my lifeE" },
  { time: 17.00, text: "Every night" },
  { time: 24.00, text: "Givin' all my love to you" }
];

/* 31.74s is the reference cut; the audio file is ~31.74s. */
const timeline = [
  [0.00, 2.20, "postcardScene"],
  [2.20, 3.30, "sentScene"],
  [3.30, 7.80, "truckScene"],
  [7.80, 15.90, "phoneScene"],
  [15.90, 23.90, "boardScene"],
  [23.90, 31.74, "endingScene"]
];

const $ = id => document.getElementById(id);
const song = $("song");
const start = $("start");
const playPause = $("playPause");
const progress = $("progress");
const progressBar = $("progressBar");
const truck = $("truck");
const stage = $("stage");

const targets = {
  postcardScene: $("postcardLyric"),
  truckScene: $("truckLyric"),
  phoneScene: $("phoneLyric"),
  boardScene: $("boardLyric"),
  endingScene: $("endingLyric")
};

let started = false;
let lastScene = "postcardScene";
let truckRun = 0;

function cleanLyrics(){
  return lyrics.filter(x => x && Number.isFinite(Number(x.time)) && typeof x.text === "string")
    .map(x => ({time:Number(x.time), text:x.text.trim()}))
    .filter(x => x.text)
    .sort((a,b) => a.time - b.time);
}

function lyricAt(t){
  let line = "";
  for(const item of cleanLyrics()){
    if(t >= item.time) line = item.text;
    else break;
  }
  return line;
}

function sceneAt(t){
  return (timeline.find(([a,b]) => t >= a && t < b) || timeline[timeline.length - 1])[2];
}

function showScene(id){
  document.querySelectorAll(".scene").forEach(el => {
    const active = el.id === id;
    el.classList.toggle("is-active", active);
    el.setAttribute("aria-hidden", String(!active));
  });

  if(id === "truckScene"){
    truckRun++;
    const run = truckRun;
    truck.classList.remove("drive");
    void truck.offsetWidth;
    requestAnimationFrame(() => {
      if(run === truckRun) truck.classList.add("drive");
    });
  }
}

function renderLyric(t){
  const text = lyricAt(t);
  Object.values(targets).forEach(el => el.textContent = "");
  const id = sceneAt(t);
  if(targets[id]) targets[id].textContent = text;
}

function update(){
  const t = Number(song.currentTime) || 0;
  const duration = Number.isFinite(song.duration) && song.duration > 0 ? song.duration : 31.74;
  const pct = Math.max(0, Math.min(100, t / duration * 100));
  progressBar.style.width = pct + "%";
  progress.setAttribute("aria-valuenow", String(Math.round(pct)));

  const id = sceneAt(t);
  renderLyric(t);
  if(id !== lastScene){
    lastScene = id;
    showScene(id);
  }
}

async function begin(){
  if(started) return;
  started = true;
  start.classList.add("hidden");
  controls.classList.add("visible");
  lastScene = "postcardScene";
  showScene(lastScene);
  renderLyric(0);
  song.currentTime = 0;
  try { await song.play(); }
  catch(err){
    started = false;
    start.classList.remove("hidden");
    controls.classList.remove("visible");
  }
}

start.addEventListener("click", begin);
playPause.addEventListener("click", async () => {
  if(song.paused){ try { await song.play(); } catch {} }
  else song.pause();
});

song.addEventListener("play", () => playPause.textContent = "Ⅱ");
song.addEventListener("pause", () => playPause.textContent = "▶");
song.addEventListener("timeupdate", update);
song.addEventListener("loadedmetadata", update);
song.addEventListener("seeked", update);

song.addEventListener("ended", () => {
  playPause.textContent = "▶";
  started = false;
  start.textContent = "click to play again";
  start.classList.remove("hidden");
  controls.classList.remove("visible");
  lastScene = "postcardScene";
  showScene("postcardScene");
  song.currentTime = 0;
  renderLyric(0);
});

function seek(clientX){
  const duration = Number.isFinite(song.duration) && song.duration > 0 ? song.duration : 31.74;
  const rect = progress.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  song.currentTime = ratio * duration;
  update();
}

progress.addEventListener("pointerdown", e => {
  progress.setPointerCapture?.(e.pointerId);
  seek(e.clientX);
});
progress.addEventListener("pointermove", e => { if(e.buttons) seek(e.clientX); });
progress.addEventListener("keydown", e => {
  if(!["ArrowLeft","ArrowRight"].includes(e.key)) return;
  e.preventDefault();
  const step = e.key === "ArrowRight" ? 1 : -1;
  song.currentTime = Math.max(0, Math.min(song.duration || 31.74, song.currentTime + step));
  update();
});

document.addEventListener("keydown", e => {
  if(e.code === "Space" && e.target === document.body){ e.preventDefault(); playPause.click(); }
});

showScene("postcardScene");
renderLyric(0);
