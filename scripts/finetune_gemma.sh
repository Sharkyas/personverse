#!/usr/bin/env bash
# LoRA fine-tune of Gemma on the SYNTHETIC coach data (data/coach/*.jsonl) with Apple MLX, then serve it.
# Usage: MODEL=<mlx-community gemma repo> ./scripts/finetune_gemma.sh [train|serve]
# DATA picks the dataset folder (default data/coach, the v1 distillation set). For the v2 synthetic set that ships in the
# repo use DATA=data/synthetic-v2; its examples are longer, so keep --max-seq-length at 2048.
# Needs Apple Silicon. Uses a venv in .venv-mlx. Adapters go to adapters/coach (git-ignored).
set -euo pipefail
cd "$(dirname "$0")/.."
MODEL="${MODEL:?set MODEL to an MLX Gemma repo, e.g. mlx-community/gemma-...-4bit}"
ITERS="${ITERS:-600}"
if [ ! -d .venv-mlx ]; then python3 -m venv .venv-mlx; fi
. .venv-mlx/bin/activate
python -m pip install -q --upgrade pip mlx-lm
case "${1:-train}" in
  train)
    python -m mlx_lm lora --model "$MODEL" --train --data "${DATA:-data/coach}" --adapter-path adapters/coach \
      --iters "$ITERS" --batch-size "${BATCH:-2}" --num-layers "${LAYERS:-16}" --learning-rate "${LR:-1e-4}" \
      --max-seq-length 2048 --grad-checkpoint --steps-per-eval 100 --save-every 100 2>&1 | tee research/finetune_log.txt
    ;;
  serve)
    # OpenAI-compatible server; start the app with LOCAL_AI_URL=http://127.0.0.1:8081 OLLAMA_MODEL=<served model id>
    python -m mlx_lm server --model "$MODEL" --adapter-path adapters/coach --host 127.0.0.1 --port 8081
    ;;
  serve-base)
    python -m mlx_lm server --model "$MODEL" --host 127.0.0.1 --port 8082
    ;;
esac
