# Agent Collaboration Workflow Log

Student ID: 314833009

## Phase 1: Ideation and Proposal

### Initial Context

The assignment requires a generative AI final project that uses an AI Agent workflow and includes LLM and/or Diffusion / Flow Matching technology. It must provide source code, a README, a workflow log, and demonstration material.

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
- Frontend: HTML, CSS, and JavaScript Canvas.
- Generative method: rectified-flow style interpolation from random noise points to deterministic target points.
- Optional generative model: Stable Diffusion via Hugging Face Diffusers when GPU dependencies are installed.

### API Format

Request:

```json
{
  "prompt": "台北夜市裡的未來感 AI 音樂祭"
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
- `src/diffusion_client.py`: implements optional Stable Diffusion image generation.
- `src/index.html`: app shell.
- `src/styles.css`: responsive interface.
- `src/app.js`: prompt request, flow particle animation, optional Stable Diffusion request, poster rendering, PNG export.

### Technical Issues Resolved by Agent

- Avoided heavyweight model dependencies so the app can run in a grading environment.
- Added fallback prompt expansion to prevent API-key failures.
- Used deterministic seeded randomness so the same prompt produces repeatable poster structure.
- Kept the app portable by using only Python standard library and browser APIs.

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
- Submission text file: `314833009_HW7.txt`

## Reflection

The project demonstrates an agentic workflow where the Agent helped with ideation, architecture, implementation, and packaging. The resulting app covers both LLM prompt engineering and Flow Matching concepts while remaining practical to execute locally.
