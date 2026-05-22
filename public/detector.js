const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const monitorMessage = document.getElementById('monitorMessage');
const detectedList = document.getElementById('detectedList');

const restrictedItems = [
  { label: 'Pocket Knife', alert: 'Restricted item detected: Pocket Knife' },
  { label: 'Firearm', alert: 'Restricted item detected: Firearm' },
  { label: 'Mobile Phone', alert: 'Student device noticed in restricted zone' },
  { label: 'Sharp Object', alert: 'Potential sharp object identified' },
  { label: 'Backpack', alert: 'Large object detected near entry area' },
];

let color = 'rgba(56, 189, 248, 0.65)';
let detectionTimer;

function speak(message) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

function renderDetection(items) {
  detectedList.innerHTML = items.length
    ? items.map((item) => `<li>${item}</li>`).join('')
    : '<li>No restricted items detected.</li>';
}

function drawOverlay(boxes) {
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.font = '18px Inter, sans-serif';
  ctx.fillStyle = color;

  boxes.forEach((box) => {
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.fillText(box.label, box.x + 6, box.y + 24);
  });
}

function createSimulatedDetection() {
  const active = Math.random() < 0.35;
  if (!active) {
    monitorMessage.textContent = 'Video stream is active. No restricted item detected.';
    renderDetection([]);
    drawOverlay([]);
    return;
  }

  const item = restrictedItems[Math.floor(Math.random() * restrictedItems.length)];
  monitorMessage.textContent = item.alert;
  renderDetection([item.alert]);
  speak(item.alert);

  const width = overlay.width;
  const height = overlay.height;
  const box = {
    x: Math.random() * (width * 0.55),
    y: Math.random() * (height * 0.55),
    width: width * (0.2 + Math.random() * 0.25),
    height: height * (0.18 + Math.random() * 0.25),
    label: item.label,
  };
  drawOverlay([box]);
}

function resizeCanvas() {
  const rect = video.getBoundingClientRect();
  overlay.width = rect.width;
  overlay.height = rect.height;
}

async function startupDetector() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    monitorMessage.textContent = 'Webcam API is not supported in your browser.';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      resizeCanvas();
      monitorMessage.textContent = 'Webcam stream enabled. Detecting restricted items...';
      if (detectionTimer) clearInterval(detectionTimer);
      detectionTimer = setInterval(createSimulatedDetection, 2600);
    };
  } catch (error) {
    monitorMessage.textContent = 'Unable to access the webcam. Please allow camera permission.';
    console.error(error);
  }
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('DOMContentLoaded', startupDetector);
