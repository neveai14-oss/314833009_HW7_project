const canvas = document.getElementById("poster");
const ctx = canvas.getContext("2d");
const promptInput = document.getElementById("prompt");
const specEl = document.getElementById("spec");
const statusEl = document.getElementById("status");
const progressOverlay = document.getElementById("progressOverlay");
const progressTitle = document.getElementById("progressTitle");
const progressDetail = document.getElementById("progressDetail");
const generateBtn = document.getElementById("generateBtn");
const stableBtn = document.getElementById("stableBtn");
const sdMode = document.getElementById("sdMode");
const downloadBtn = document.getElementById("downloadBtn");
const saveAssetBtn = document.getElementById("saveAssetBtn");
const flowControls = document.getElementById("flowControls");

let animationId = null;
let stableDiffusionAvailable = false;
let stableDiffusionReason = "Checking Stable Diffusion dependencies...";

function setStatus(message, options = {}) {
  const { busy = false, title = message, detail = "" } = options;
  statusEl.textContent = message;
  progressTitle.textContent = title;
  progressDetail.textContent = detail || message;
  progressOverlay.classList.toggle("hidden", !busy);
}

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

async function loadCapabilities() {
  try {
    const response = await fetch("/api/capabilities");
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    const status = data.stable_diffusion || {};
    stableDiffusionAvailable = Boolean(status.available);
    stableDiffusionReason = status.reason || "Stable Diffusion is unavailable in this environment.";
    stableBtn.disabled = !stableDiffusionAvailable;
    stableBtn.title = stableDiffusionAvailable
      ? "Stable Diffusion ready: " + (status.model || "configured model")
      : stableDiffusionReason;
    stableBtn.textContent = stableDiffusionAvailable ? "Generate SD Image" : "SD Unavailable";
  } catch (error) {
    stableDiffusionAvailable = false;
    stableDiffusionReason = "Stable Diffusion capability check failed: " + error.message;
    stableBtn.disabled = true;
    stableBtn.title = stableDiffusionReason;
    stableBtn.textContent = "SD Unavailable";
  }
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

function freePromptEnglishHints(text) {
  const hints = [];
  const pairs = [
    [/森林|樹林/, "forest"],
    [/龍|龙/, "dragon, full dragon body, wings or serpentine dragon silhouette"],
    [/月光|月亮/, "moonlight, moonlit atmosphere"],
    [/巨樹|大樹/, "giant ancient trees"],
    [/霧|霧氣|雾/, "mist, fog, atmospheric haze"],
    [/電影感/, "cinematic composition"],
    [/海底/, "underwater"],
    [/城市/, "city"],
    [/太空/, "space, sci-fi"],
  ];
  for (const [pattern, hint] of pairs) {
    if (pattern.test(text)) hints.push(hint);
  }
  return hints.join(", ");
}

async function generateStableDiffusionImage(spec) {
  const userBrief = promptInput.value.trim();
  const objectHints = Array.isArray(spec.objects) ? spec.objects.join(", ") : "";
  const mood = spec.mood || "cinematic, detailed, coherent";
  const isProjectMode = sdMode.value === "project";
  const freeHints = freePromptEnglishHints(userBrief);
  const sdPrompt = isProjectMode
    ? [
        "masterpiece, high quality, cinematic vertical wide angle environmental concept art, SDXL detailed scene",
        "PRIMARY SUBJECT: a futuristic AI music festival stage built inside a narrow Taipei night market street, stage clearly visible at the vanishing point",
        "visible DJ booth on the stage, huge LED main screen behind it, speaker stacks, lighting truss, holographic AI face visuals, laser beams over the crowd",
        "crowd viewed from behind, people standing in the wet night market street and facing the stage, concert audience behavior, hands raised, festival energy",
        "narrow Taipei night market street after heavy rain, intimate street-level perspective, not a stadium, not a plaza, not an aerial view",
        "wet reflective asphalt road with mirror-like neon reflections across the entire street",
        "food stalls, awnings, scooters, steam, umbrellas, and dense glowing neon light panels on both sides of the street",
        "small but unmistakable AI concert stage integrated into the market stalls, LED screen and lasers must be visible",
        "Taipei 101 visible in the distant background above the street, Taiwan night market atmosphere",
        "cyberpunk blue magenta green lighting, rain mist, cinematic depth, realistic scale, rich street details",
        "strong composition: narrow street perspective lines lead directly to the stage, stage is the focal point",
        "no readable text, no poster typography, signs are abstract glowing shapes only",
        userBrief,
        objectHints,
      ].filter(Boolean).join(", ")
    : [
        "masterpiece, high quality, SDXL detailed image, coherent scene, strong composition",
        "FOLLOW THE USER PROMPT LITERALLY. The main subject must be clearly visible in the image.",
        userBrief,
        freeHints ? "English semantic hints: " + freeHints : "",
        objectHints ? "key visual elements from the prompt: " + objectHints : "",
        "visual mood: " + mood,
        "cinematic lighting, clear subject, detailed environment, balanced foreground and background",
        "if the prompt mentions a creature or object, show that creature or object clearly, not only the environment",
        "no readable text, no poster typography, no watermark",
      ].filter(Boolean).join(", ");
  const negativePrompt = isProjectMode
    ? "ordinary street only, no concert, no stage, no DJ booth, no LED screen, no speaker stacks, no lasers, no crowd facing stage, stadium, huge plaza, aerial view, empty street, single main character, portrait, close up person, selfie, hero pose, solo singer closeup, performer closeup, readable text, Chinese characters, English words, fake text, gibberish text, broken letters, poster title, typography, captions, subtitles, watermark, logo, abstract pattern, geometric web, lattice, mandala, dry road, daylight, low quality, blurry, distorted faces"
    : "missing main subject, subject not visible, only background, temple, pagoda, palace, shrine, large building, architecture focus, readable text, fake text, gibberish text, broken letters, poster title, typography, captions, subtitles, watermark, logo, low quality, blurry, distorted anatomy, distorted faces, duplicate limbs, messy composition";
  const response = await fetch("/api/stable-diffusion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: sdPrompt,
      negative_prompt: negativePrompt,
      width: 768,
      height: 1024,
      steps: 35,
      guidance: isProjectMode ? 7.5 : 7.0,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Stable Diffusion request failed.");
  return data;
}

function cleanPosterTitle(text) {
  const title = String(text || "Stable Diffusion Poster")
    .replace(/，.*$/, "")
    .replace(/、.*$/, "")
    .replace(/\bAi\b/g, "AI")
    .trim();
  if (!title) return "Stable Diffusion Poster";

  const limit = sdMode.value === "free" ? 38 : 28;
  const chars = Array.from(title);
  if (chars.length <= limit) return title;
  return chars.slice(0, limit).join("") + "...";
}

function drawStableImage(data, spec) {
  const image = new Image();
  image.onload = () => {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(2, 6, 23, .52)";
    ctx.fillRect(60, 88, 1080, 132);
    ctx.fillStyle = "#f8fafc";
    ctx.font = '800 44px "Microsoft JhengHei", Inter, Arial, sans-serif';
    ctx.textBaseline = "top";
    wrapText(cleanPosterTitle(promptInput.value || spec.title), 92, 112, 980, 52);
    ctx.fillStyle = "rgba(248,250,252,.72)";
    ctx.font = "20px Inter, Arial, sans-serif";
    ctx.fillText(`Stable Diffusion · ${data.model} · seed ${data.seed}`, 92, 184);
    setStatus("Done · Stable Diffusion image");
  };
  image.src = data.image;
}

async function generate() {
  setStatus("Generating Flow Matching poster...", { busy: true, title: "Generating Flow Poster", detail: "Drawing the browser canvas particle poster. This is different from Stable Diffusion." });
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
      setStatus(`Flow matching denoising step ${Math.min(frame, totalSteps)} / ${totalSteps}`, { busy: true, title: "Generating Flow Poster", detail: `Denoising step ${Math.min(frame, totalSteps)} / ${totalSteps}` });
      if (frame < totalSteps) {
        animationId = requestAnimationFrame(tick);
      } else {
        setStatus(spec.provider_errors?.length
          ? "Done · LLM source: offline fallback"
          : `Done · LLM source: ${spec.source || "api"}`);
      }
    }
    tick();
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  } finally {
    generateBtn.disabled = false;
  }
}

async function generateStable() {
  if (!stableDiffusionAvailable) {
    setStatus("Stable Diffusion unavailable · " + stableDiffusionReason);
    return;
  }
  setStatus("Running Stable Diffusion image generation...", { busy: true, title: "Generating SD Image", detail: "Running the GPU text-to-image model. This output will differ from the Flow Matching poster." });
  generateBtn.disabled = true;
  stableBtn.disabled = true;
  flowControls.disabled = true;
  try {
    const spec = await expandPrompt(promptInput.value);
    specEl.textContent = JSON.stringify(visibleSpec(spec), null, 2);
    const data = await generateStableDiffusionImage(spec);
    drawStableImage(data, spec);
  } catch (error) {
    setStatus(`Stable Diffusion error: ${error.message}`);
  } finally {
    generateBtn.disabled = false;
    stableBtn.disabled = false;
    flowControls.disabled = false;
  }
}

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "314833009_HW7_poster.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

saveAssetBtn.addEventListener("click", async () => {
  saveAssetBtn.disabled = true;
  try {
    const response = await fetch("/api/save-demo-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: canvas.toDataURL("image/png") }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Save failed.");
    setStatus("Saved current canvas to assets/314833009_HW7.png");
  } catch (error) {
    setStatus("Save demo asset error: " + error.message);
  } finally {
    saveAssetBtn.disabled = false;
  }
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
setStatus("Done · LLM source: offline_fallback");
drawPoster(defaultSpec);
loadCapabilities();
