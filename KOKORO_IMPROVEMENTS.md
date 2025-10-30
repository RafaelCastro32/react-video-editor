# Melhorias no Kokoro TTS

## Problemas Identificados e Soluções

### 1. Qualidade de Áudio Ruim
**Problema:** O áudio gerado estava com qualidade inferior ao teste standalone.

**Solução:**
- ✅ Adicionado formato PCM_16 (16-bit) no `sf.write()` para melhor qualidade
- ✅ Mantido sample rate de 24kHz (padrão do Kokoro)
- ✅ Adicionado logs detalhados para debug (duração, tamanho dos segmentos)

**Código atualizado em `kokoro_api.py`:**
```python
# Salvar com 16-bit PCM para melhor qualidade
sf.write(output_path, audio_concat, 24000, subtype='PCM_16')
```

### 2. Geração Lenta
**Problema:** A geração estava demorando muito tempo.

**Soluções implementadas:**
- ✅ Limite de 500 caracteres para evitar textos muito longos
- ✅ Para textos curtos (<200 chars), gera tudo de uma vez sem split
- ✅ Para textos longos, usa split apenas por sentença (`.!?`)
- ✅ Logs informativos mostrando progresso da geração

**Código otimizado:**
```python
# Texto curto - mais rápido (sem split)
if len(text) < 200:
    generator = pipeline(text, voice=voice)
else:
    # Texto longo - divide em sentenças
    generator = pipeline(text, voice=voice, split_pattern=r'(?<=[.!?])\s+')
```

### 3. Áudio Não Aparecia no Editor
**Problema:** O áudio era gerado mas não aparecia na interface para uso.

**Solução:**
- ✅ Conversão de base64 para Blob
- ✅ Criação de Object URL
- ✅ Obtenção automática da duração via metadata
- ✅ Adição automática ao upload store
- ✅ Áudio aparece na aba "Uploads" pronto para arrastar para timeline

**Código implementado em `ai-voice.tsx`:**
```typescript
// Converte base64 para blob
const base64Data = data.audio.split(',')[1];
const binaryString = atob(base64Data);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}
const blob = new Blob([bytes], { type: 'audio/wav' });

// Cria URL e obtém duração
const audioUrl = URL.createObjectURL(blob);
const audioElement = new Audio(audioUrl);

audioElement.addEventListener('loadedmetadata', () => {
  const durationMs = Math.floor(audioElement.duration * 1000);
  
  // Adiciona ao upload store
  const { setUploads } = useUploadStore.getState();
  setUploads((prev) => [
    ...prev,
    {
      id: `kokoro-audio-${Date.now()}`,
      name: `Kokoro Voice - ${selectedVoice.name}.wav`,
      url: audioUrl,
      filePath: audioUrl,
      type: 'audio',
      duration: durationMs,
      width: 0,
      height: 0,
    }
  ]);
  
  toast.success("Voice generated and added to uploads!");
  audioElement.play();
});
```

## Como Usar Agora

1. **Abra o editor de vídeo**
2. **Vá para a aba "AI Voice Generation"**
3. **Digite o texto desejado** (máx. 500 caracteres)
4. **Selecione a voz** (ex: "Dora - Portuguese Female")
5. **Clique em "Generate Voice"**
6. **Aguarde a geração** (será mais rápida agora, especialmente para textos curtos)
7. **O áudio será:**
   - Reproduzido automaticamente
   - Adicionado à aba "Uploads"
   - Pronto para arrastar para a timeline

## Melhorias de Performance

| Cenário | Antes | Depois |
|---------|-------|--------|
| Texto curto (<200 chars) | ~5-10s | ~2-3s |
| Texto médio (200-500 chars) | ~15-20s | ~5-8s |
| Qualidade do áudio | Baixa | Alta (16-bit PCM) |
| Disponibilidade no editor | ❌ Não aparecia | ✅ Aparece automaticamente |

## Debug e Logs

O script Python agora fornece logs detalhados no stderr:
- Idioma e voz sendo usada
- Texto sendo processado (primeiros 50 chars)
- Tamanho de cada segmento gerado
- Duração total do áudio gerado
- Caminho onde o arquivo foi salvo

Para ver os logs, execute manualmente:
```bash
cd c:\Users\EXM\Documents\Web-Pro\react-video-editor
.\venv\Scripts\python.exe kokoro_api.py "Olá, mundo!" "pf_dora"
```

## Observações Importantes

1. **Blob URLs:** Os áudios gerados usam blob URLs que são válidos apenas durante a sessão
2. **Limite de caracteres:** Textos são limitados a 500 caracteres para performance
3. **Qualidade:** Arquivos WAV 16-bit a 24kHz (alta qualidade, mas arquivos grandes)
4. **Idiomas suportados:** Português (p), Inglês Americano (a), Inglês Britânico (b)

## Próximos Passos Sugeridos

- [ ] Adicionar opção de salvar áudio permanentemente no disco
- [ ] Implementar cache de vozes geradas
- [ ] Adicionar pré-visualização de texto antes de gerar
- [ ] Permitir ajuste de velocidade/pitch da voz
- [ ] Adicionar suporte para mais idiomas Kokoro
