#!/bin/bash
# Script para iniciar rapidamente o Kokoro-82M (teste_kokoro.py)
# Ativa o ambiente virtual e executa a aplicação Gradio

cd "$(dirname "$0")"

# Ativar o ambiente virtual
source venv/bin/activate

# Executar a aplicação
python3 teste_kokoro.py
