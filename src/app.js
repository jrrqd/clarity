const state = { files: [], selected: null, scale: 4, format: "jpg", engine: null };
const $ = (id) => document.getElementById(id);
const input = $("fileInput");

async function detectEngine() {
  try {
    state.engine = await fetch("/api/status").then((r) => r.json());
    $("engineChip").textContent = state.engine.ai ? "AI · Apple Silicon ready" : "Local · Apple Silicon";
    $("engineName").textContent = state.engine.name;
    $("engineDescription").textContent = state.engine.description;
  } catch {
    $("engineChip").textContent = "Service unavailable";
    $("engineName").textContent = "Start Clarity with python3 server.py";
  }
}

function setActive(group, target) {
  group.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button === target));
}

function formatBytes(bytes) {
  if (!bytes) return "—";
  return bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

function selectFile(item) {
  state.selected = item;
  $("emptyState").classList.add("hidden");
  $("compare").classList.remove("hidden");
  $("beforeImage").src = item.url;
  $("afterImage").src = item.resultUrl || item.url;
  $("imageMeta").textContent = `${item.width} × ${item.height} · ${formatBytes(item.file.size)}`;
  updateDetails();
  renderQueue();
}

function updateDetails() {
  const item = state.selected;
  if (!item) return;
  $("dimensions").textContent = `${item.width * state.scale} × ${item.height * state.scale} px`;
  $("originalDimensions").textContent = `Original: ${item.width} × ${item.height} px`;
  $("estimate").textContent = `~ ${formatBytes(item.file.size * state.scale * (state.format === "png" ? 2.3 : .95))}`;
  $("qualityLabel").textContent = `${state.format.toUpperCase()}${state.format === "jpg" ? " · Quality 92%" : ""}`;
  $("upscaleButton").disabled = item.status === "processing";
  $("upscaleButton").textContent = item.status === "done" ? "Upscale again" : "Upscale image";
  renderQueue();
}

function addFiles(fileList) {
  [...fileList].filter((file) => file.type.startsWith("image/")).forEach((file) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const item = { id: crypto.randomUUID(), file, url, width: image.naturalWidth, height: image.naturalHeight, status: "ready" };
      state.files.push(item);
      selectFile(item);
    };
    image.src = url;
  });
}

function renderQueue() {
  $("queueCount").textContent = `(${state.files.length})`;
  if (!state.files.length) {
    $("queueList").innerHTML = '<p class="queue-empty">Images you add will appear here.</p>';
    return;
  }
  $("queueList").innerHTML = state.files.map((item) => `
    <div class="queue-row" data-id="${item.id}">
      <img src="${item.url}" alt="" />
      <div><strong>${item.file.name}</strong><small>${item.width} × ${item.height}</small></div>
      <span>${state.scale}×</span><span>${state.format.toUpperCase()}</span>
      <span class="state ${item.status === "done" ? "done" : ""}">${item.status === "processing" ? "Processing…" : item.status === "done" ? "Completed" : "Ready"}</span>
      <button class="queue-action" data-remove="${item.id}">${item.status === "done" ? "Download" : "Remove"}</button>
    </div>`).join("");
  document.querySelectorAll(".queue-row").forEach((row) => row.addEventListener("click", (event) => {
    const item = state.files.find((entry) => entry.id === row.dataset.id);
    if (event.target.dataset.remove) {
      if (item.status === "done") download(item);
      else remove(item);
    } else selectFile(item);
  }));
}

function remove(item) {
  state.files = state.files.filter((entry) => entry !== item);
  if (state.selected === item) state.selected = state.files.at(-1) || null;
  if (state.selected) selectFile(state.selected);
  else { $("compare").classList.add("hidden"); $("emptyState").classList.remove("hidden"); }
  renderQueue();
}

function download(item) {
  const link = document.createElement("a");
  link.href = item.resultUrl;
  link.download = item.outputName;
  link.click();
}

async function upscale() {
  const item = state.selected;
  if (!item) return;
  item.status = "processing";
  $("upscaleButton").disabled = true;
  $("upscaleButton").classList.add("processing");
  $("upscaleButton").textContent = "Processing locally…";
  renderQueue();
  const body = new FormData();
  body.append("image", item.file);
  body.append("scale", state.scale);
  body.append("format", state.format);
  try {
    const response = await fetch("/api/upscale", { method: "POST", body });
    if (!response.ok) throw new Error(await response.text());
    const blob = await response.blob();
    if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    item.resultUrl = URL.createObjectURL(blob);
    item.outputName = response.headers.get("X-Output-Name") || `clarity-${item.file.name}`;
    item.status = "done";
    $("afterImage").src = item.resultUrl;
  } catch (error) {
    item.status = "ready";
    alert(`Upscaling failed: ${error.message}`);
  }
  $("upscaleButton").classList.remove("processing");
  updateDetails();
}

$("chooseButton").onclick = $("addButton").onclick = () => input.click();
input.onchange = () => addFiles(input.files);
$("scaleControl").onclick = (event) => { if (event.target.dataset.scale) { state.scale = +event.target.dataset.scale; setActive($("scaleControl"), event.target); updateDetails(); } };
$("formatControl").onclick = (event) => { if (event.target.dataset.format) { state.format = event.target.dataset.format; setActive($("formatControl"), event.target); updateDetails(); } };
$("compareRange").oninput = (event) => { $("afterLayer").style.width = `${event.target.value}%`; };
$("upscaleButton").onclick = upscale;
$("clearButton").onclick = () => { state.files.filter((item) => item.status === "done").forEach(remove); };
$("aboutButton").onclick = () => $("aboutDialog").showModal();
$("closeAbout").onclick = () => $("aboutDialog").close();
document.addEventListener("dragover", (event) => { event.preventDefault(); $("dropZone").classList.add("dragging"); });
document.addEventListener("dragleave", () => $("dropZone").classList.remove("dragging"));
document.addEventListener("drop", (event) => { event.preventDefault(); $("dropZone").classList.remove("dragging"); addFiles(event.dataTransfer.files); });
detectEngine();
