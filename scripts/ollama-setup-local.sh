#!/usr/bin/env bash
# Install Ollama (if missing), start it, and pull the default tutor model.
set -euo pipefail

MODEL="${OLLAMA_MODEL:-llama3.1:8b}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama is not installed. Install from https://ollama.com/download"
  echo "  Linux: curl -fsSL https://ollama.com/install.sh | sh"
  exit 1
fi

echo "Pulling model: ${MODEL}"
ollama pull "${MODEL}"

echo "Verifying API at http://127.0.0.1:11434 ..."
curl -sf "http://127.0.0.1:11434/api/tags" >/dev/null || {
  echo "Ollama API not reachable. Start the daemon: ollama serve"
  exit 1
}

echo "Done. Add to .env:"
echo "  OLLAMA_BASE_URL=http://127.0.0.1:11434"
echo "  OLLAMA_MODEL=${MODEL}"
