# Interface Limpa ao Iniciar

## ✅ Alteração Realizada

**Problema:** Ao iniciar o programa, um vídeo de demonstração de 8 segundos era pré-carregado automaticamente com textos e outros elementos.

**Solução:** Removido o carregamento do design mock (exemplo) para que a aplicação inicie com uma interface limpa.

---

## 📝 Arquivo Modificado

### `src/features/editor/editor.tsx`

**Antes:**
```typescript
import { design } from "./mock";

// ...

useEffect(() => {
  dispatch(DESIGN_LOAD, { payload: design });
}, []);
```

**Depois:**
```typescript
// import { design } from "./mock"; // Removed: Don't load mock data on startup

// ...

// Removed: Don't load mock design on startup - start with clean interface
// useEffect(() => {
//   dispatch(DESIGN_LOAD, { payload: design });
// }, []);
```

---

## 🎯 Resultado

### Antes:
- ❌ Vídeo de 8 segundos pré-carregado
- ❌ Textos/legendas de exemplo
- ❌ Timeline preenchida com conteúdo
- ❌ Elementos pré-configurados

### Depois:
- ✅ Interface completamente limpa
- ✅ Tela de boas-vindas com "Click to upload"
- ✅ Timeline vazia
- ✅ Canvas vazio esperando conteúdo

---

## 🚀 O que aparece agora ao iniciar

Quando você inicia a aplicação, verá:

```
┌────────────────────────────────────────┐
│                                        │
│         [+]  Click to upload          │
│      Or drag and drop files here      │
│                                        │
└────────────────────────────────────────┘
```

Uma interface limpa e pronta para você adicionar seu próprio conteúdo!

---

## 📦 Arquivo Mock Preservado

O arquivo `src/features/editor/mock.ts` **não foi deletado** - ele continua disponível caso você precise:
- Testar recursos rapidamente
- Ter um exemplo de estrutura de design
- Restaurar o comportamento anterior

Para restaurar o vídeo de exemplo, basta descomentar as linhas no arquivo `editor.tsx`.

---

## ✨ Funcionalidades Mantidas

Todas as funcionalidades continuam funcionando:
- ✅ Upload de arquivos locais
- ✅ Drag and drop
- ✅ Edição de vídeo
- ✅ Timeline
- ✅ Controles
- ✅ Modo offline

A única diferença é que agora você começa com uma tela limpa!

---

*Alteração aplicada em: 30/10/2025*
