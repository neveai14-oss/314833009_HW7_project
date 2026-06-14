# Prompt-to-Flow Poster Studio

Student ID: 314833009

A local generative AI demo with two modes:

- `Generate Flow Poster`: browser Canvas Flow Matching style poster animation.
- `Generate SD Image`: optional Stable Diffusion XL text-to-image generation.

Recommended final prompt:

```text
台北夜市裡的未來感 AI 視覺音樂祭
```

The current demonstration material included in this GitHub repository is:

```text
assets/314833009_HW7.png  # App operation screenshot
```

The operation recording `assets/314833009_HW7.mp4` is kept out of GitHub because the file is larger than GitHub's single-file upload limit. If a video is required, submit it separately through the course platform or an external link.

## System Architecture

- Frontend: `src/index.html`, `src/styles.css`, and `src/app.js` provide the browser interface, Canvas Flow Matching poster renderer, prompt mode selector, download action, and demo-asset save action.
- Backend: `src/server.py` is a local Python HTTP server that serves the app and exposes JSON APIs.
- LLM layer: `src/llm_client.py` expands the creative brief into structured art direction with Ollama, OpenRouter, or an offline fallback.
- Diffusion layer: `src/diffusion_client.py` optionally runs Stable Diffusion XL through Hugging Face Diffusers when GPU dependencies are installed.
- Main APIs: `/api/expand`, `/api/stable-diffusion`, `/api/capabilities`, and `/api/save-demo-image`.

## Fastest Way to Run

### Flow Matching only

This mode does not require extra Python packages.

```bash
cd 314833009_HW7_project
python src/server.py
```

Open:

```text
http://127.0.0.1:8000
```

Click `Generate Flow Poster`.

### Stable Diffusion XL image generation

This mode needs a GPU environment plus the optional packages in `requirements-stable-diffusion.txt`.

Use the same Python environment for installing packages and starting the server:

```bash
cd 314833009_HW7_project
python -m pip install -r requirements-stable-diffusion.txt
python src/server.py
```

If the server is running in the provided container, the tested interpreter was:

```bash
/workspace/env01/bin/python src/server.py
```

That path is container-specific. On another computer, activate that computer's own `venv` or Conda environment and run `python src/server.py`.

Open:

```text
http://127.0.0.1:8000
```

The SD button should show `Generate SD Image`, not `SD Unavailable`.

## How to Generate the Final Image

1. Start the server.
2. Open `http://127.0.0.1:8000`.
3. Keep the prompt as:

```text
台北夜市裡的未來感 AI 視覺音樂祭
```

4. Set `SD Prompt Mode` to `Project Theme`.
5. Click `Generate SD Image`.
6. If the image is good, click `Update Demo Asset`.
7. The current browser Canvas is saved to:

```text
assets/314833009_HW7.png
```

## Button Guide

| Button / Control | Meaning |
| --- | --- |
| `Generate Flow Poster` | Creates the Canvas Flow Matching style poster. This works without Stable Diffusion packages. |
| `SD Prompt Mode` | Selects the Stable Diffusion prompt template. `Project Theme` is for the HW7 Taipei night-market AI visual music festival. `Free Prompt` is for arbitrary prompts. |
| `Generate SD Image` | Generates a Stable Diffusion XL image on the backend GPU environment. |
| `SD Unavailable` | The current Python server cannot import the optional Stable Diffusion packages, or it is running with the wrong Python interpreter. |
| `Download Current Image` | Downloads the current Canvas image as a PNG. |
| `Update Demo Asset` | Saves the current Canvas image directly to `assets/314833009_HW7.png`. |
| `Advanced Flow Matching Controls` | Shows Flow Matching sliders. These affect only `Generate Flow Poster`, not Stable Diffusion. |

## Prompt Modes

`Project Theme` adds extra SDXL prompt engineering for this final topic:

```text
台北夜市裡的未來感 AI 視覺音樂祭
```

It works best with prompts close to Taipei night market, neon, AI visual performance, rain reflections, and music festival atmosphere.

`Free Prompt` is general-purpose. It does not add the Taipei night-market template, so it is better for unrelated ideas. For arbitrary Free Prompt generation, English or bilingual prompts are recommended because SDXL follows English prompts more reliably than Chinese-only prompts. The app adds a few simple English semantic hints for common Chinese words, but Chinese-only prompts may still drift because of model limitations.

Examples:

```text
森林中的龍，月光、巨樹、霧氣、電影感
forest dragon, full dragon body, moonlight, giant ancient trees, mist, cinematic fantasy scene
海底城市，透明穹頂、發光珊瑚、未來交通
underwater city, transparent dome, glowing coral, futuristic transit
```

## Fixing `SD Unavailable`

The frontend checks:

```text
/api/capabilities
```

Open this URL to debug:

```text
http://127.0.0.1:8000/api/capabilities
```

A working setup returns:

```json
{
  "stable_diffusion": {
    "available": true,
    "model": "stabilityai/stable-diffusion-xl-base-1.0"
  }
}
```

Common fixes:

| Problem | Fix |
| --- | --- |
| `diffusers` is missing | `python -m pip install -r requirements-stable-diffusion.txt` |
| Packages installed in one Python, server started with another | Activate the environment where packages were installed, then run `python src/server.py`. |
| Server was not restarted after installation | Stop the server, start it again, then refresh the browser. |
| VS Code points to a Windows Python path | Use `Python: Select Interpreter` and choose the project venv/Conda/Linux interpreter. |

## Optional: Use a Real LLM for Art Direction

This section is optional. The app runs even without Ollama or OpenRouter because `src/llm_client.py` has an offline fallback. A live LLM can improve the structured art direction shown in the JSON panel.

### Ollama

Install Ollama first if the `ollama` command is not available. Download it from:

```text
https://ollama.com/download
```

After installing Ollama, start the Ollama server first. In some Linux containers, systemd is not running, so Ollama must be started manually.

Terminal 1:

```bash
ollama serve
```

Keep Terminal 1 open. Then use another terminal to enter the project folder, pull a model if needed, and start the app with Ollama enabled.

Linux / macOS / zsh / bash:

```bash
cd /workspace/314833009_HW7_project
ollama pull llama3.1  # only needed the first time
export LLM_PROVIDER="ollama"
export OLLAMA_MODEL="llama3.1"
python src/server.py
```

If you are using the provided container environment, start the server with the tested Python interpreter:

```bash
cd /workspace/314833009_HW7_project
export LLM_PROVIDER="ollama"
export OLLAMA_MODEL="llama3.1"
/workspace/env01/bin/python src/server.py
```

PowerShell:

```powershell
cd .\314833009_HW7_project
ollama pull llama3.1  # only needed the first time
$env:LLM_PROVIDER="ollama"
$env:OLLAMA_MODEL="llama3.1"
python src/server.py
```

If Ollama is slow on the first request, wait for the first generation to finish. The default Ollama timeout is 120 seconds and can be changed with `OLLAMA_TIMEOUT`.

If `ollama` is not installed or not running, the app will still work by using the offline fallback.

### OpenRouter

```bash
export LLM_PROVIDER="openrouter"
export OPENROUTER_API_KEY="your_api_key"
export OPENROUTER_MODEL="opencode/big-pickle"
python src/server.py
```

PowerShell:

```powershell
$env:LLM_PROVIDER="openrouter"
$env:OPENROUTER_API_KEY="your_api_key"
$env:OPENROUTER_MODEL="opencode/big-pickle"
python src/server.py
```

## Demonstration Materials and Examples

```text
assets/314833009_HW7.png
```

Main demonstration screenshot. It shows the app running in the browser, the prompt, `Project Theme`, the JSON art direction panel, and the generated SDXL image.

```text
assets/example_project_theme_ai_visual_music_festival.png
assets/example_free_prompt_forest_dragon.png
assets/example_free_prompt_underwater_city.png
```

Generated image examples. These show one `Project Theme` result and two `Free Prompt` results.

## Project Structure

```text
314833009_HW7_project/
  README.md
  requirements.txt
  requirements-stable-diffusion.txt
  src/
    app.js
    diffusion_client.py
    index.html
    llm_client.py
    server.py
    styles.css
  docs/
    WORKFLOW_LOG.md
  assets/
    314833009_HW7.png
    example_project_theme_ai_visual_music_festival.png
    example_free_prompt_forest_dragon.png
    example_free_prompt_underwater_city.png
```

## Requirement Mapping

| Course requirement | Implementation |
| --- | --- |
| Large Language Models | `src/llm_client.py` supports Ollama, OpenRouter, and offline fallback prompt expansion. |
| Prompt Engineering | LLM art-direction JSON plus SDXL prompt templates in `src/app.js`. |
| Diffusion / Flow Matching | Flow Matching style Canvas animation in `src/app.js`; optional Stable Diffusion XL in `src/diffusion_client.py`. |
| App Interface | Local browser app in `src/index.html`, `src/styles.css`, and `src/app.js`. |
| Agentic Workflow | `docs/WORKFLOW_LOG.md`. |

## Submission Checklist

- Source code is included in `src/`.
- Dependency files are included as `requirements.txt` and `requirements-stable-diffusion.txt`.
- Project documentation is included in this `README.md`.
- Agent workflow documentation is included in `docs/WORKFLOW_LOG.md`.
- The demonstration screenshot is included in `assets/314833009_HW7.png`. The operation recording is not tracked in GitHub because it exceeds the file-size limit.
- After publishing the GitHub repository, put the public repository link in `314833009_HW7.txt` for submission.

## Notes

- The base Flow Matching mode is intentionally dependency-light so the app can still run without GPU packages.
- Stable Diffusion XL is optional because it needs a compatible GPU, PyTorch, Diffusers, and model download access.
- English or bilingual Free Prompt inputs usually produce better SDXL results than Chinese-only inputs.

