# 🚀 Guia Rápido - Debug e Performance

## 🎯 Como Usar as Novas Ferramentas

### 1️⃣ Painel de Debug Visual

**Ativar:**
- Pressione `Ctrl + Shift + D`
- Ou clique no botão "🔍 Debug" (canto inferior direito)

**O que mostra:**
- ✅ FPS em tempo real
- ✅ Uso de memória (MB)
- ✅ Contadores de erros
- ✅ Problemas de performance
- ✅ Alertas críticos

**Cores:**
- 🟢 Verde = Tudo OK
- 🟡 Amarelo = Atenção
- 🔴 Vermelho = Problema!

### 2️⃣ Console do Browser

**Abrir console:** `F12` ou `Ctrl + Shift + I`

**Comandos úteis:**

```javascript
// Ver relatório completo de erros
window.__errorMonitor.generateReport()

// Ver resumo rápido
window.__errorMonitor.getErrorSummary()

// Ver top 5 erros mais frequentes
window.__errorMonitor.getTopErrors(5)

// Limpar estatísticas
window.__errorMonitor.clearErrors()
```

### 3️⃣ Quando a Aplicação Travar

**Passo a passo:**

1. Abra o painel de debug (`Ctrl + Shift + D`)
2. Veja quais contadores estão altos (vermelho)
3. Abra o console (`F12`)
4. Execute: `window.__errorMonitor.generateReport()`
5. Copie o relatório e analise

**Exemplo de relatório:**
```
=== 🔍 RELATÓRIO DE ANÁLISE DO SISTEMA ===

📊 RESUMO:
  • Erros: 15
  • Avisos: 8
  • Problemas de Performance: 23
  • Problemas de Memória: 5

🔴 ERROS CRÍTICOS:
  • MP4Clip.tick video timeout (12x)
  • High memory usage: 485MB / 512MB (5x)

⚠️  ERROS FREQUENTES:
  • Loading audio data for blob:http://... (18x)
```

### 4️⃣ Logs Melhorados

Agora os logs têm **emojis** e são mais claros:

```
🎬 Preparing video assets for video-123
✅ Video assets prepared successfully
🔄 Loading audio data for blob:http://...
✅ Audio data loaded successfully
⏳ Audio data already loading, waiting...
🖼️  Loading thumbnails for video-123
⚠️  MP4Clip timeout - video may load slowly
❌ Failed to load MP4Clip
```

**Legenda:**
- 🎬 = Iniciando processo
- ✅ = Sucesso
- 🔄 = Em progresso
- ⏳ = Aguardando
- 🖼️ = Carregando imagens
- ⚠️ = Aviso
- ❌ = Erro

### 5️⃣ Dicas Rápidas

**Se a aplicação estiver lenta:**
1. Verifique FPS no painel (deve ser > 55)
2. Verifique memória (deve estar < 80%)
3. Gere relatório para ver gargalos

**Se vídeo não carregar:**
1. Veja logs no console
2. Procure por "❌ Failed to load"
3. Verifique se é problema de timeout

**Se memória crescer muito:**
1. Pause a edição
2. Aguarde 10-15 segundos
3. O sistema fará cleanup automático
4. Se não melhorar, recarregue a página

### 6️⃣ Atalhos do Teclado

- `Ctrl + Shift + D` = Toggle Debug Panel
- `F12` = Abrir DevTools
- `Ctrl + Shift + C` = Inspecionar Elemento
- `Ctrl + Shift + J` = Console

### 7️⃣ Quando Reportar Bug

**Informações necessárias:**

1. **Relatório de erros:**
   ```javascript
   window.__errorMonitor.generateReport()
   ```

2. **Screenshot do Debug Panel**

3. **Specs do vídeo:**
   - Tamanho (MB)
   - Duração
   - Resolução
   - Formato

4. **O que você estava fazendo:**
   - Adicionando vídeo?
   - Editando timeline?
   - Aplicando efeito?

---

## 🎓 Exemplo Prático

**Cenário:** Aplicação travou ao adicionar 3º vídeo

**O que fazer:**

1. ✅ Abra painel: `Ctrl + Shift + D`
   - Vejo: FPS = 12 (vermelho)
   - Memória = 489 / 512 MB (alto!)

2. ✅ Abra console: `F12`
   - Execute: `window.__errorMonitor.generateReport()`
   
3. ✅ Analise o relatório:
   ```
   🔴 ERROS CRÍTICOS:
     • MP4Clip.tick video timeout (3x)
     • High memory usage (2x)
   ```

4. ✅ **Conclusão:** Muitos vídeos pesados simultaneamente

5. ✅ **Solução:**
   - Remova 1-2 vídeos
   - Use vídeos menores (< 50MB)
   - Ou converta para h264

---

## 📞 Precisa de Ajuda?

1. Gere relatório completo
2. Tire screenshot do debug panel
3. Descreva o problema
4. Compartilhe as informações acima

---

**Boa edição!** 🎬✨
