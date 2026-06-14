# Agent Collaboration Workflow Log

Student ID: 314833009

## Phase 1: Ideation and Proposal

### Initial Context

The assignment requires a generative AI final project that uses an AI Agent workflow and includes LLM and/or Diffusion / Flow Matching technology. It must provide source code, a README, a workflow log, and demonstration material.

### Tools Used

- IDE Agent / Codex-style coding assistant for ideation, task breakdown, implementation, debugging, and documentation.
- Terminal commands for running the local Python server, checking syntax, inspecting files, and verifying generated assets.
- Browser app at `http://127.0.0.1:8000` for interactive testing and screenshot / video demonstration.
- Optional model tools: Ollama or OpenRouter for LLM prompt expansion, and Hugging Face Diffusers with Stable Diffusion XL for image generation.

### Key Prompt

```text
Design a final project for a Deep Generative Models course.
It should combine LLM prompt engineering with Diffusion or Flow Matching,
be runnable locally, and include an interactive app interface.
```

### Agent Output

The selected idea was **Prompt-to-Flow Poster Studio**:

- The user enters a creative brief.
- An LLM expands the brief into a structured art direction.
- A browser Canvas app generates a poster through rectified-flow inspired particle motion.
- A GPU Stable Diffusion mode can generate semantic text-to-image outputs from the same art direction.
- The app supports optional Ollama or OpenRouter model calls and an offline fallback.

## Phase 2: Architecture Design and Task Breakdown

### Key Prompt

```text
Break the selected topic into implementable components.
Define frontend/backend boundaries, API payload format, and demo requirements.
```

### Architecture Decisions

- Backend: Python standard-library HTTP server.
- LLM layer: `llm_client.py`, with provider order `Ollama -> OpenRouter -> offline fallback`.
- API endpoint: `POST /api/expand`.
- Diffusion endpoint: `POST /api/stable-diffusion`.
- Capability endpoint: `GET /api/capabilities`, used by the UI to decide whether Stable Diffusion is available.
- Demo asset endpoint: `POST /api/save-demo-image`, used to save the current app output as `assets/314833009_HW7.png`.
- Frontend: HTML, CSS, and JavaScript Canvas.
- Generative method: rectified-flow style interpolation from random noise points to deterministic target points.
- Optional generative model: Stable Diffusion XL via Hugging Face Diffusers when GPU dependencies are installed.
- Stable Diffusion prompt modes: `Project Theme` for the HW7 Taipei night-market AI visual music festival, and `Free Prompt` for arbitrary SDXL prompts.

### API Format

Request:

```json
{
  "prompt": "台北夜市裡的未來感 AI 視覺音樂祭"
}
```

Response:

```json
{
  "title": "Taipei Night Market",
  "palette": ["#111827", "#22c55e", "#f8fafc", "#f59e0b"],
  "objects": ["台北", "夜市", "AI", "音樂祭"],
  "mood": "cinematic, experimental, crisp",
  "motion": "rectified flow particles converge from noise into semantic clusters",
  "prompt": "Create a generative poster...",
  "source": "ollama | openrouter | offline_fallback"
}
```

## Phase 3: Code Generation and Implementation

### Key Prompt

```text
Implement a dependency-light local app.
The backend should call Ollama or OpenRouter when configured,
but still run offline for grading.
The frontend should animate a Flow Matching inspired generative image.
```

### Generated Components

- `src/server.py`: serves static files and exposes `/api/expand`.
- `src/llm_client.py`: implements Ollama, OpenRouter, and fallback prompt expansion.
- `src/diffusion_client.py`: implements optional Stable Diffusion XL image generation.
- `src/index.html`: app shell with Flow Matching controls, Stable Diffusion prompt mode selection, download, and demo-asset update actions.
- `src/styles.css`: responsive interface.
- `src/app.js`: prompt request, flow particle animation, Project Theme / Free Prompt SDXL templates, poster rendering, PNG export, and direct demo-asset saving.

### Technical Issues Resolved by Agent

- Kept the base Flow Matching app dependency-light so it can run in a grading environment.
- Added fallback prompt expansion to prevent API-key failures.
- Used deterministic seeded randomness so the same prompt produces repeatable poster structure.
- Added a Stable Diffusion capability check so the UI shows `SD Unavailable` when optional GPU dependencies are missing or when the server is started with the wrong Python interpreter.
- Upgraded the optional image model path to Stable Diffusion XL for better prompt adherence.
- Added `Project Theme` and `Free Prompt` modes to separate the final HW7 topic from arbitrary prompt testing.
- Refined Free Prompt handling with English semantic hints because SDXL follows English or bilingual prompts more reliably than Chinese-only prompts.

## Phase 4: Interface Packaging and Summary

### Key Prompt

```text
Package the project for submission.
Write README instructions, workflow log, and produce demonstration material.
```

### Final Deliverables

- Source code folder: `314833009_HW7_project`
- README: `README.md`
- Workflow log: `docs/WORKFLOW_LOG.md`
- Demonstration screenshot: `assets/314833009_HW7.png`
- Operation recording: `assets/314833009_HW7.mp4`
- Generated examples:
  - `assets/example_project_theme_ai_visual_music_festival.png`
  - `assets/example_free_prompt_forest_dragon.png`
  - `assets/example_free_prompt_underwater_city.png`

## Requirement Coverage Check

- LLM: `src/llm_client.py` supports Ollama, OpenRouter, and an offline fallback for structured art-direction JSON.
- Prompt Engineering: `src/app.js` contains Project Theme and Free Prompt templates for Stable Diffusion XL.
- Diffusion / Flow Matching: the app includes both a browser Flow Matching style particle poster and optional Stable Diffusion XL image generation.
- App Interface: `src/index.html`, `src/styles.css`, and `src/app.js` provide the interactive local app.
- Submission Materials: README, workflow log, source code, requirements, screenshot, operation recording, and generated examples are all included in the project folder.

## Reflection

The project demonstrates an agentic workflow where the Agent helped with ideation, architecture, implementation, prompt refinement, SDXL troubleshooting, and packaging. The resulting app covers LLM prompt engineering, Flow Matching concepts, and optional Stable Diffusion XL image generation while remaining practical to execute locally.
