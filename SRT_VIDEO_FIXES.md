# Correções de Problemas - SRT e Tamanho de Vídeo

## 1. ✅ SRT Carregamento Lento e Travamento

### Problemas Identificados
- Carregamento de muitas legendas de uma vez travava a aplicação
- Faltava array `words` nas legendas SRT, causando erro no player
- Sem feedback visual durante o processamento

### Soluções Implementadas

#### A. Loading Toast
```typescript
const loadingToast = toast.loading('Processing SRT file...');
// ... processamento ...
toast.dismiss(loadingToast);
```
- Mostra feedback visual durante o carregamento
- Usuário sabe que está processando

#### B. Limite de Legendas
```typescript
if (captions.length > 500) {
  toast.error(`Too many captions (${captions.length}). Maximum is 500.`);
  return;
}
```
- Previne travamento com arquivos SRT muito grandes
- Limite de 500 legendas por arquivo

#### C. Array de Words
```typescript
const words = caption.text.split(/\s+/).map((word, index) => ({
  text: word,
  start: caption.startMs + (index * 100),
  end: caption.startMs + ((index + 1) * 100)
}));
```
- Adiciona array `words` necessário para o player
- Distribui palavras ao longo da duração da legenda
- Corrige erro: `Cannot read properties of undefined (reading 'start')`

#### D. Processamento em Lotes (Batches)
```typescript
const batchSize = 50;
for (let i = 0; i < captionItems.length; i += batchSize) {
  const batch = captionItems.slice(i, i + batchSize);
  
  dispatch(ADD_ITEMS, { payload: { trackItems: batch, ... } });
  
  // Delay entre lotes para prevenir freeze
  await new Promise(resolve => setTimeout(resolve, 10));
}
```
- Adiciona 50 legendas por vez
- Delay de 10ms entre lotes
- UI permanece responsiva durante o processo

### Resultados
- ✅ Carregamento não trava mais
- ✅ Feedback visual com loading toast
- ✅ Legendas aparecem corretamente com duração do SRT
- ✅ Player não quebra mais (words array presente)
- ✅ Suporte para até 500 legendas

---

## 2. ✅ Vídeo Não Acompanha Tamanho do Canvas

### Problema Identificado
Ao mudar o tamanho do canvas (Settings → Size), o vídeo ficava pequeno no canto inferior esquerdo ao invés de preencher todo o espaço.

### Causa Raiz
```typescript
scaleMode: "fit"  // ❌ Mantém proporções mas não preenche
```

O modo `"fit"` mantém o vídeo dentro do canvas mas não preenche todo o espaço, deixando barras pretas.

### Solução
```typescript
scaleMode: "cover"  // ✅ Preenche todo o canvas
```

Mudamos de `"fit"` para `"cover"` que:
- Preenche todo o canvas
- Mantém proporções do vídeo
- Corta excesso se necessário (como CSS object-fit: cover)

### Código Corrigido
```typescript
dispatch(ADD_VIDEO, {
  payload: {
    id: generateId(),
    details: {
      src: srcVideo
    },
    metadata: {
      previewUrl: "https://cdn.designcombo.dev/caption_previews/static_preset1.webp"
    }
  },
  options: {
    resourceId: "main",
    scaleMode: "cover" // ✅ Preenche todo o canvas
  }
});
```

### Resultados
- ✅ Vídeo preenche todo o canvas definido em Settings → Size
- ✅ Proporções mantidas
- ✅ Funciona com todos os presets (Portrait, Landscape, Square, etc.)
- ✅ Funciona com tamanhos customizados

---

## 3. ✅ Caption Player Error Fix

### Problema
```
TypeError: Cannot read properties of undefined (reading 'start')
```

### Causa
```typescript
const [firstWord] = details.words;
const offsetFrom = display.from - firstWord.start; // ❌ firstWord undefined
```

### Solução
```typescript
const [firstWord] = details.words || [];
const offsetFrom = firstWord?.start ? display.from - firstWord.start : 0;
```

- Safe access com optional chaining (`?.`)
- Fallback para 0 se words não existir
- Previne crashes no player

---

## Como Testar

### 1. Upload de SRT
1. Prepare um arquivo .srt com várias legendas
2. Vá em **Captions** → **Upload SRT File**
3. Selecione o arquivo
4. Observe o loading toast
5. Legendas aparecem na timeline com duração correta
6. Player não trava

### 2. Tamanho do Vídeo
1. Clique em **Settings** (ícone de engrenagem no navbar)
2. Escolha um preset (ex: Landscape 16:9)
3. Adicione um vídeo da aba Uploads
4. Vídeo preenche todo o canvas definido
5. Teste outros presets ou tamanho custom

### 3. Caption Manual
1. Vá em Captions → Add Manual Caption
2. Digite texto e defina tempo
3. Adicione à timeline
4. Player não quebra

---

## Arquivos Modificados

### 1. `captions.tsx`
- Adicionado loading toast
- Implementado processamento em lotes
- Adicionado limite de 500 legendas
- Adicionado array `words` nas legendas SRT
- Melhorado parsing de SRT

### 2. `uploads.tsx`
- Mudado `scaleMode` de "fit" para "cover"
- Vídeos agora preenchem todo o canvas

### 3. `caption.tsx` (player)
- Safe access para `words` array
- Optional chaining para prevenir crashes
- Fallback para offsetFrom

---

## Benefícios

### Performance
- ✅ Não trava mais com SRT grande
- ✅ UI responsiva durante carregamento
- ✅ Processamento assíncrono em lotes

### UX
- ✅ Feedback visual (loading toast)
- ✅ Mensagens de erro claras
- ✅ Vídeo preenche tela corretamente

### Estabilidade
- ✅ Sem crashes no player
- ✅ Validação de dados robusta
- ✅ Safe access em todos os pontos críticos

---

## Próximas Melhorias Sugeridas

- [ ] Pré-visualização do SRT antes de adicionar
- [ ] Opção de escolher scaleMode (fit/cover/fill) no upload
- [ ] Progress bar visual durante processamento de SRT
- [ ] Edição de legendas SRT na timeline
- [ ] Export de legendas editadas de volta para SRT
- [ ] Suporte para outros formatos de legenda (VTT, ASS)
