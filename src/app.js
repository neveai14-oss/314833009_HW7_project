const canvas = document.getElementById("poster");
const ctx = canvas.getContext("2d");
const promptInput = document.getElementById("prompt");
const specEl = document.getElementById("spec");
const statusEl = document.getElementById("status");
const generateBtn = document.getElementById("generateBtn");
const stableBtn = document.getElementById("stableBtn");
const downloadBtn = document.getElementById("downloadBtn");

let animationId = null;

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map(ch => ch + ch).join("") : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function mixColor(a, b, t) {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  return `rgb(${ar.map((v, i) => Math.round(v + (br[i] - v) * t)).join(",")})`;
}

function targetPoint(i, count, rand, guidance, mode) {
  const angle = i * 2.399963 + rand() * 0.2;
  const band = (i % 7) / 7;
  const radius = 90 + band * 420 + Math.sin(i * 0.017 + mode) * 50;
  const wave = Math.sin(angle * (3 + mode) + guidance * 0.08) * 55;
  if (mode === 1) {
    const x = 190 + (i % 120) * 7.2;
    const y = 760 + Math.sin(i * 0.035 + guidance * 0.06) * 260 + rand() * 80;
    return { x, y };
  }
  if (mode === 2) {
    const ring = 220 + ((i % 5) * 58);
    return {
      x: 600 + Math.cos(angle) * (ring + wave),
      y: 820 + Math.sin(angle) * (ring * 0.7 + wave),
    };
  }
  if (mode === 3) {
    const col = i % 9;
    const row = Math.floor(i / 9) % 28;
    return {
      x: 210 + col * 95 + Math.sin(row * 0.6) * 24 + rand() * 18,
      y: 430 + row * 28 + Math.cos(col * 0.9) * 60 + rand() * 26,
    };
  }
  return {
    x: 600 + Math.cos(angle) * (radius + wave),
    y: 820 + Math.sin(angle) * (radius * 0.78 + wave) - Math.cos(i * 0.01) * 160,
  };
}

function visibleSpec(spec) {
  const { provider_errors: _providerErrors, ...publicSpec } = spec;
  if (spec.provider_errors?.length) {
    publicSpec.provider_status = "offline fallback used; configure Ollama or OpenRouter for live LLM expansion";
  }
  return publicSpec;
}

function buildCaption(spec) {
  const objects = Array.isArray(spec.objects) ? spec.objects.slice(0, 4).join(" / ") : "";
  const mood = spec.mood || "generative visual system";
  if (objects) {
    return `LLM art direction: ${mood}. Key elements: ${objects}.`;
  }
  return `LLM art direction: ${mood}.`;
}

function drawObjectTags(spec, palette) {
  if (!Array.isArray(spec.objects) || spec.objects.length === 0) return;
  ctx.font = '20px "Microsoft JhengHei", Inter, Arial, sans-serif';
  ctx.textBaseline = "middle";
  let x = 92;
  let y = 1210;
  for (const object of spec.objects.slice(0, 5)) {
    const label = String(object).slice(0, 18);
    const width = Math.min(300, ctx.measureText(label).width + 34);
    if (x + width > 1090) {
      x = 92;
      y += 42;
    }
    ctx.fillStyle = "rgba(2, 6, 23, .38)";
    ctx.strokeStyle = palette[1] || "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y - 17, width, 34, 17);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(248,250,252,.86)";
    ctx.fillText(label, x + 17, y);
    x += width + 12;
  }
}

function drawPoster(spec, progress = 1) {
  const palette = spec.palette?.length >= 3 ? spec.palette : ["#0f766e", "#38bdf8", "#172554", "#ecfeff"];
  const seed = hashString(JSON.stringify(spec));
  const rand = rng(seed);
  const mode = seed % 4;
  const particleCount = Number(document.getElementById("particles").value);
  const guidance = Number(document.getElementById("guidance").value);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(0.55, palette[2] || "#172554");
  gradient.addColorStop(1, palette[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < particleCount; i++) {
    const start = { x: rand() * 1200, y: rand() * 1600 };
    const target = targetPoint(i, particleCount, rand, guidance, mode);
    const t = Math.min(1, Math.max(0, progress));
    const eased = t * t * (3 - 2 * t);
    const wobble = Math.sin((i + t * 24) * 0.19) * (1 - t) * 90;
    const x = start.x + (target.x - start.x) * eased + wobble;
    const y = start.y + (target.y - start.y) * eased + Math.cos(i * 0.13) * (1 - t) * 80;
    ctx.fillStyle = mixColor(palette[i % palette.length], palette[(i + 1) % palette.length], rand());
    ctx.globalAlpha = 0.18 + 0.62 * t;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + rand() * 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(2, 6, 23, .42)";
  ctx.fillRect(72, 92, 850, 210);
  ctx.fillStyle = "#f8fafc";
  ctx.font = '800 72px "Microsoft JhengHei", Inter, Arial, sans-serif';
  ctx.textBaseline = "top";
  wrapText((spec.title || "台北夜市裡的未來感 AI 音樂祭 霓虹招牌").toUpperCase(), 92, 112, 790, 78);
  ctx.fillStyle = "rgba(248, 250, 252, .78)";
  ctx.font = "28px Inter, Arial, sans-serif";
  wrapText(spec.mood || "fluid, luminous, calm", 92, 260, 800, 34);

  drawObjectTags(spec, palette);

  ctx.fillStyle = "rgba(248, 250, 252, .76)";
  ctx.font = '24px "Microsoft JhengHei", Inter, Arial, sans-serif';
  wrapText(buildCaption(spec), 92, 1350, 990, 34);
  ctx.fillStyle = palette[1] || "#38bdf8";
  ctx.fillRect(92, 1308, 220, 6);
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

async function expandPrompt(prompt) {
  const response = await fetch("/api/expand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function generateStableDiffusionImage(spec) {
  const response = await fetch("/api/stable-diffusion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `${spec.prompt || promptInput.value}. poster design, cinematic composition, high quality, detailed, clean layout`,
      negative_prompt: "low quality, blurry, watermark, unreadable text, distorted typography",
      width: 512,
      height: 768,
      steps: 25,
      guidance: 7.5,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Stable Diffusion request failed.");
  return data;
}

function drawStableImage(data, spec) {
  const image = new Image();
  image.onload = () => {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(2, 6, 23, .64)";
    ctx.fillRect(60, 80, 1080, 180);
    ctx.fillStyle = "#f8fafc";
    ctx.font = '800 52px "Microsoft JhengHei", Inter, Arial, sans-serif';
    ctx.textBaseline = "top";
    wrapText(spec.title || "Stable Diffusion Poster", 92, 110, 980, 62);
    ctx.fillStyle = "rgba(248,250,252,.78)";
    ctx.font = "24px Inter, Arial, sans-serif";
    ctx.fillText(`Stable Diffusion · ${data.model} · seed ${data.seed}`, 92, 220);
    statusEl.textContent = "Done · Stable Diffusion image";
  };
  image.src = data.image;
}

async function generate() {
  statusEl.textContent = "Expanding prompt with LLM client...";
  generateBtn.disabled = true;
  try {
    const spec = await expandPrompt(promptInput.value);
    specEl.textContent = JSON.stringify(visibleSpec(spec), null, 2);
    const totalSteps = Number(document.getElementById("steps").value);
    let frame = 0;
    cancelAnimationFrame(animationId);
    function tick() {
      frame += 1;
      const progress = frame / totalSteps;
      drawPoster(spec, progress);
      statusEl.textContent = `Flow matching denoising step ${Math.min(frame, totalSteps)} / ${totalSteps}`;
      if (frame < totalSteps) {
        animationId = requestAnimationFrame(tick);
      } else {
        statusEl.textContent = spec.provider_errors?.length
          ? "Done · LLM source: offline fallback"
          : `Done · LLM source: ${spec.source || "api"}`;
      }
    }
    tick();
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
  } finally {
    generateBtn.disabled = false;
  }
}

async function generateStable() {
  statusEl.textContent = "Expanding prompt, then running Stable Diffusion...";
  generateBtn.disabled = true;
  stableBtn.disabled = true;
  try {
    const spec = await expandPrompt(promptInput.value);
    specEl.textContent = JSON.stringify(visibleSpec(spec), null, 2);
    const data = await generateStableDiffusionImage(spec);
    drawStableImage(data, spec);
  } catch (error) {
    statusEl.textContent = `Stable Diffusion error: ${error.message}`;
  } finally {
    generateBtn.disabled = false;
    stableBtn.disabled = false;
  }
}

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "314833009_HW7_poster.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

generateBtn.addEventListener("click", generate);
stableBtn.addEventListener("click", generateStable);

const defaultSpec = {
  title: "台北夜市裡的未來感 AI 音樂祭 霓虹招牌",
  palette: ["#0f766e", "#38bdf8", "#172554", "#ecfeff"],
  objects: ["台北夜市裡的未來感", "AI", "音樂祭", "霓虹招牌", "雨後反光與人群能量"],
  mood: "fluid, luminous, calm",
  motion: "rectified flow particles converge from noise into semantic clusters",
  prompt: "Create a generative poster about 台北夜市裡的未來感 AI 音樂祭，霓虹招牌、雨後反光與人群能量. Use fluid, luminous, calm visual language, clean typography, and particles that move from random noise into structured forms.",
  source: "offline_fallback",
};

specEl.textContent = JSON.stringify(visibleSpec(defaultSpec), null, 2);
statusEl.textContent = "Done · LLM source: offline_fallback";
drawPoster(defaultSpec);
