# Correções Aplicadas - Problemas do Editor

## ✅ Problemas Corrigidos

### 1. ❌ Arquivos blob:http://lo... após recarregar página

**Problema:** Ao fechar e reabrir a aplicação, os uploads locais ficavam com URLs blob inválidas.

**Causa:** URLs `blob:` são criadas pelo navegador e são válidas apenas durante a sessão. Quando a página é recarregada, essas URLs se tornam inválidas.

**Solução Aplicada:**
```typescript
// src/features/editor/store/use-upload-store.ts
partialize: (state) => ({
  uploads: state.uploads.filter((upload) => {
    const isBlobUrl = upload.url?.startsWith('blob:') || 
                     upload.filePath?.startsWith('blob:');
    return !isBlobUrl; // Não persiste uploads com blob URLs
  })
})
```

**Resultado:** ✅ Uploads locais não são mais persistidos (blob URLs não funcionam após reload)

---

### 2. ❌ Aplicação abre na aba de "Textos" em vez de "Upload"

**Problema:** Ao iniciar, a aba ativa era "Textos", mas o ideal é começar com "Upload".

**Solução Aplicada:**
```typescript
// src/features/editor/store/use-layout-store.ts
const useLayoutStore = create<ILayoutState>((set) => ({
  activeMenuItem: "uploads", // Alterado de "texts" para "uploads"
}));
```

**Resultado:** ✅ Aplicação agora inicia na aba de Upload

---

### 3. ⚠️ Transitions não podem ser arrastadas para Timeline

**Problema:** Ao clicar ou arrastar transitions para a timeline, nada acontece.

**Causa Raiz:** 
- ❌ Transitions **NÃO estão implementadas** para drag & drop na timeline
- ❌ Não existe evento `ADD_TRANSITION` no sistema
- ❌ O componente `DroppableArea` só aceita: `image`, `video`, `audio`
- ❌ Transitions são aplicadas **entre clipes**, não como itens independentes

**Análise do Código:**
```typescript
// src/features/editor/scene/droppable.tsx
enum AcceptedDropTypes {
  IMAGE = "image",
  VIDEO = "video", 
  AUDIO = "audio"
  // ❌ TRANSITION não existe aqui
}
```

**Como Transitions Funcionam:**
- Transitions são efeitos **entre dois clipes** na timeline
- Não são itens independentes que você arrasta
- Precisam ser aplicadas através de:
  1. Seleção de dois clipes adjacentes
  2. Menu de contexto ou painel de controle
  3. API específica para adicionar transition entre clipes

**Status:** ⚠️ **FUNCIONALIDADE NÃO IMPLEMENTADA**
- Transitions existem no código mas não têm drag & drop
- As imagens de preview vêm de API online (imagekit.io)
- Sistema usa biblioteca `@designcombo/transitions`

---

### 4. ❓ Opção de Legenda (Captions)

**Análise:** ✅ **JÁ EXISTE!**

**Localização:** Aba "Captions" no menu lateral

**Funcionalidades Encontradas:**
```typescript
// src/features/editor/menu-item/captions.tsx
- Geração automática de legendas
- Seleção de mídia para transcrever
- Edição de texto das legendas
- Sincronização com áudio
- Estilos personalizáveis
```

**Como Usar:**
1. Adicione um vídeo/áudio na timeline
2. Clique na aba "Captions" no menu
3. Selecione a mídia que deseja legendar
4. Clique em "Generate Captions"
5. ⚠️ **Requer API externa** para transcrição (veja logs: `POST /api/transcribe 401`)

**Diferença entre Captions e Texts:**
- **Captions:** Legendas sincronizadas com áudio/vídeo (palavra por palavra)
- **Texts:** Textos estáticos que você posiciona manualmente

---

## 🔧 APIs Externas Falhando (Logs)

### Erros Identificados:

```bash
GET /api/pexels-videos 500      # ❌ Pexels API (vídeos de stock)
GET /api/pexels 500              # ❌ Pexels API (imagens de stock)
POST /api/voices 500             # ❌ API de vozes AI (404)
POST /api/transcribe 401         # ❌ API de transcrição (não autenticado)
```

### Impacto:
- ✅ **Editor funciona offline** para arquivos locais
- ❌ **Não funciona:** Stock videos/images, AI voices, Auto captions
- ⚠️ **Transitions:** Imagens de preview vêm de API online mas funcionam localmente

---

## 📋 Resumo das Mudanças

| Problema | Status | Arquivo Modificado |
|----------|--------|-------------------|
| Blob URLs após reload | ✅ Corrigido | `use-upload-store.ts` |
| Inicia em "Textos" | ✅ Corrigido | `use-layout-store.ts` |
| Transitions drag & drop | ⚠️ Não implementado | N/A |
| Legendas (Captions) | ✅ Já existe | `captions.tsx` |

---

## 🚀 Próximos Passos (Opcional)

### Para Implementar Drag & Drop de Transitions:

1. Adicionar tipo `TRANSITION` ao enum `AcceptedDropTypes`
2. Criar evento `ADD_TRANSITION` no state manager
3. Modificar lógica para aplicar entre dois clipes
4. Adicionar validação (precisa de 2 clipes adjacentes)

### Para Usar Captions Offline:

Você precisaria implementar uma solução local de transcrição:
- Whisper.js (Web Assembly)
- API local (Whisper Python rodando localmente)
- Ou entrada manual de legendas

---

## ⚠️ Limitações Modo Offline

**Funciona Offline:**
- ✅ Upload de arquivos locais
- ✅ Edição de vídeo/áudio/imagens
- ✅ Textos e elementos
- ✅ Transitions (visualização/aplicação)
- ✅ Timeline e controles

**Requer Internet:**
- ❌ Pexels stock media
- ❌ AI voices
- ❌ Auto captions (transcrição)
- ❌ Preview images de transitions (mas funcionam sem)

---

*Correções aplicadas em: 30/10/2025*
