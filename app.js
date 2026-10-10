"use strict";

const wheel = document.querySelector("#wheel");
const context = wheel.getContext("2d");
const spinButton = document.querySelector("#spin-button");
const statusText = document.querySelector("#wheel-status");
const resultDialog = document.querySelector("#result-dialog");
const resultPrize = document.querySelector("#result-prize");
const couponCode = document.querySelector("#coupon-code");
const prizes = Array.isArray(window.LOOM_LINE_PRICES) ? window.LOOM_LINE_PRICES : [];
const segmentAngle = prizes.length ? (Math.PI * 2) / prizes.length : 0;
let isSpinning = false;
let currentRotation = 0;
let lastSpinClick = 0;

function drawWheel() {
  const center = wheel.width / 2;
  const radius = center - 9;
  context.clearRect(0, 0, wheel.width, wheel.height);

  prizes.forEach((prize, index) => {
    const start = -Math.PI / 2 + index * segmentAngle;
    const end = start + segmentAngle;
    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, start, end);
    context.closePath();
    context.fillStyle = prize.color;
    context.fill();
    context.strokeStyle = "rgba(20, 43, 73, 0.38)";
    context.lineWidth = 2;
    context.stroke();

    context.save();
    context.translate(center, center);
    context.rotate(start + segmentAngle / 2);
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = prize.text;
    context.font = "600 21px 'Segoe UI', sans-serif";
    context.letterSpacing = "1px";
    context.fillText(prize.label, radius * 0.82, 0, radius * 0.43);
    context.restore();
  });

  context.beginPath();
  context.arc(center, center, radius - 3, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 255, 255, 0.55)";
  context.lineWidth = 2;
  context.stroke();
}

function secureRandomIndex(length) {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error("Random selection requires a positive range.");
  }
  if (!window.crypto || typeof window.crypto.getRandomValues !== "function") {
    throw new Error("Secure random number generation is unavailable.");
  }

  const range = 0x100000000;
  const limit = range - (range % length);
  const value = new Uint32Array(1);
  do {
    window.crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % length;
}

function showResult(prize) {
  resultPrize.textContent = prize.title;
  couponCode.textContent = prize.code;
  statusText.textContent = "A little something, picked just for you.";
  resultDialog.showModal();
  document.querySelector("#close-dialog").focus();
}

function spin() {
  const now = performance.now();
  if (isSpinning || now - lastSpinClick < 700) return;
  lastSpinClick = now;

  let prizeIndex;
  let turns;
  try {
    prizeIndex = secureRandomIndex(prizes.length);
    turns = 6 + secureRandomIndex(3);
  } catch {
    statusText.textContent = "This browser cannot securely draw a result. Please try a supported browser.";
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;
  spinButton.setAttribute("aria-label", "Wheel spinning");
  statusText.textContent = "A little moment of anticipation...";

  const segmentCenter = (prizeIndex + 0.5) * (360 / prizes.length);
  const targetAngle = 360 - segmentCenter;
  const currentAngle = ((currentRotation % 360) + 360) % 360;
  const alignmentTurn = (targetAngle - currentAngle + 360) % 360;
  currentRotation += turns * 360 + alignmentTurn;
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  wheel.addEventListener("transitionend", () => {
    statusText.textContent = `You landed on ${prizes[prizeIndex].title}.`;
    window.setTimeout(() => {
      isSpinning = false;
      spinButton.disabled = false;
      spinButton.setAttribute("aria-label", "Give the wheel a spin");
      showResult(prizes[prizeIndex]);
    }, 1000);
  }, { once: true });
}

spinButton.addEventListener("click", spin);
spinButton.addEventListener("dblclick", (event) => event.preventDefault());
document.addEventListener("contextmenu", (event) => event.preventDefault());
document.querySelector("#close-dialog").addEventListener("click", () => resultDialog.close());
document.querySelector("#copy-code").addEventListener("click", async () => {
  const copyStatus = document.querySelector("#copy-status");
  try {
    await navigator.clipboard.writeText(couponCode.textContent);
    copyStatus.textContent = "Copied. See you at checkout.";
  } catch {
    copyStatus.textContent = "Select and copy your code above.";
  }
});

function initialize() {
  const requiredFields = ["label", "title", "code", "color", "text"];
  if (prizes.length !== 6 || prizes.some((prize) =>
    requiredFields.some((field) => typeof prize[field] !== "string")
  )) {
    spinButton.disabled = true;
    statusText.textContent = "Unable to load offers. Please refresh and try again.";
    return;
  }

  drawWheel();
  spinButton.disabled = false;
}

initialize();