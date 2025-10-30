# 🎙️ Kokoro TTS Integration - Setup Guide

## 📋 Prerequisites

### Required Files
Certifique-se de que você tenha os seguintes arquivos/pastas:
- ✅ `Kokoro-82M/` - Pasta com o modelo Kokoro TTS
- ✅ `venv/` - Ambiente virtual Python
- ✅ `start_kokoro.sh` - Script de inicialização
- ✅ `teste_kokoro.py` - Interface Gradio (opcional para testes)
- ✅ `kokoro_api.py` - API Python para integração com Next.js

---

## 🚀 Installation Steps

### 1. Python Environment Setup

Se você ainda não tem o ambiente virtual configurado:

```powershell
# No diretório do projeto
python -m venv venv

# Ativar ambiente virtual (Windows)
.\venv\Scripts\activate

# Instalar dependências
pip install kokoro-onnx gradio soundfile numpy
```

### 2. Verify Kokoro Model

Certifique-se de que a pasta `Kokoro-82M` está no diretório raiz do projeto:

```
react-video-editor/
├── Kokoro-82M/          ← Modelo aqui
├── venv/
├── kokoro_api.py
├── teste_kokoro.py
├── start_kokoro.sh
├── src/
└── ...
```

### 3. Test Kokoro (Optional)

Teste se o Kokoro está funcionando:

```powershell
# Ativar venv
.\venv\Scripts\activate

# Testar API
python teste_kokoro.py
```

Isso abrirá uma interface Gradio em http://localhost:7860 para testar as vozes.

---

##  🎯 Using Kokoro in the Editor

### 1. Start the Next.js Application

```powershell
pnpm dev
```

### 2. Navigate to AI Voice Generation

1. Abra o editor em `http://localhost:3000`
2. Clique na aba **"AI Voice"** no menu lateral
3. Selecione uma voz Kokoro local

### 3. Available Voices

**Português (pt-BR):**
- 👩 Dora (Feminino)
- 👨 Alex (Masculino)

**English (US):**
- 👩 Heart, Alloy, Bella, Nova, Sarah
- 👨 Adam, Eric, Liam, Michael

**English (GB):**
- 👩 Alice, Emma
- 👨 Daniel, George

**Español:**
- 👩 Dora
- 👨 Alex

**Français, Italiano, etc.**

### 4. Generate Voice

1. Digite ou cole seu texto
2. Selecione uma voz
3. Clique em **"Generate Voice"**
4. O áudio será gerado localmente usando Kokoro TTS! 🎉

---

## 🎬 Manual Captions Feature

### Adding Manual Captions

1. Vá para a aba **"Captions"** no menu
2. Clique em **"Add Manual Caption"**
3. Preencha:
   - **Caption Text**: Texto da legenda
   - **Start Time**: Hora de início (HH:MM:SS)
   - **End Time**: Hora de término (HH:MM:SS)
4. Clique em **"Add Caption"**
5. A legenda será adicionada à timeline! ✅

### Caption Format

- **Start/End Time**: Use formato `HH:MM:SS`
  - Exemplo: `00:00:05` (5 segundos)
  - Exemplo: `00:01:30` (1 minuto e 30 segundos)

---

## 🔧 Troubleshooting

### Error: "Failed to generate voice"

**Solução:**
1. Verifique se o ambiente virtual está ativo
2. Teste manualmente:
```powershell
.\venv\Scripts\activate
python kokoro_api.py "Teste" "pf_dora" "p" "test.wav"
```

### Error: "Module kokoro not found"

**Solução:**
```powershell
.\venv\Scripts\activate
pip install kokoro-onnx
```

### Error: "Kokoro-82M model not found"

**Solução:**
- Certifique-se de que a pasta `Kokoro-82M` está no diretório raiz
- Baixe o modelo se necessário

### Python script não encontrado

**Solução:**
- Verifique se `kokoro_api.py` está no diretório raiz
- No arquivo `src/app/api/kokoro/route.ts`, verifique o caminho:
```typescript
const pythonScript = path.join(projectRoot, "kokoro_api.py");
```

---

## 📝 API Endpoints

### GET /api/kokoro
Retorna lista de vozes disponíveis

**Response:**
```json
{
  "voices": [
    {
      "id": "pf_dora",
      "name": "Dora (Feminino)",
      "lang": "pt-BR",
      "gender": "female"
    },
    ...
  ]
}
```

### POST /api/kokoro
Gera áudio TTS

**Request:**
```json
{
  "text": "Olá, este é um teste",
  "voice": "pf_dora"
}
```

**Response:**
```json
{
  "success": true,
  "audio": "data:audio/wav;base64,...",
  "voice": {...},
  "text": "Olá, este é um teste"
}
```

---

## 🎨 Features

### ✅ Kokoro TTS Local
- ✅ Geração de voz 100% offline
- ✅ Múltiplas vozes e idiomas
- ✅ Sem necessidade de API externa
- ✅ Integração com timeline do editor

### ✅ Manual Captions
- ✅ Adicionar legendas manualmente
- ✅ Controle preciso de timing
- ✅ Edição de texto
- ✅ Preview na timeline

---

## 🌟 Advantages

**Kokoro TTS:**
- 🚀 Rápido (processamento local)
- 🔒 Privacidade (sem envio de dados)
- 💰 Gratuito (sem custos de API)
- 🌐 Funciona offline

**Manual Captions:**
- ✏️ Controle total sobre legendas
- ⏱️ Timing preciso
- 📝 Edição fácil
- 🎯 Sem necessidade de transcrição automática

---

## 📚 Additional Resources

- **Kokoro TTS**: [GitHub Repository](https://github.com/thewh1teagle/kokoro-onnx)
- **Gradio**: Interface de teste incluída em `teste_kokoro.py`
- **Next.js API Routes**: `src/app/api/kokoro/route.ts`

---

## 🤝 Support

Se encontrar problemas:
1. Verifique os logs do servidor Next.js
2. Teste o Python script manualmente
3. Verifique se todas as dependências estão instaladas
4. Consulte a documentação do Kokoro TTS

---

*Última atualização: 30/10/2025*
*Versão: 1.0*
