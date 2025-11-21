# Changelog - Custom JSON Parsing System

## 2025-11-21 - Implementacja Custom JSON Parsing

### Aktualizacja: Naprawiono parsowanie wielokrotnych wywołań

**✅ NAPRAWIONE:** System teraz wykonuje **wszystkie** funkcje które AI zwróci w JSON, nie tylko pierwszą!

### Co zostało zmienione?

Zastąpiono standardowy **function calling** własnym systemem parsowania JSON, który daje pełną kontrolę nad tym, jak AI steruje kernel browserem.

### Główne zmiany w `app/api/chat/route.ts`:

#### 1. **Usunięto parametr `tools` z API call**
```typescript
// PRZED:
const stream = await nvidia.chat.completions.create({
  model: NVIDIA_MODEL,
  messages: chatHistory,
  tools: tools,  // ❌ Usunięto
  tool_choice: "auto",  // ❌ Usunięto
  ...
});

// PO:
const stream = await nvidia.chat.completions.create({
  model: NVIDIA_MODEL,
  messages: chatHistory,
  temperature: 0.7,
  top_p: 0.95,
  stream: true,
});
```

#### 2. **Dodano Custom JSON Parser**

Parser wyciąga JSON z odpowiedzi tekstowej AI w dwóch formatach:

**Format 1: Markdown Code Block (preferowane)**
```json
\`\`\`json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "screenshot"
      }
    }
  ]
}
\`\`\`
```

**Format 2: Raw JSON**
```json
{"tools": [{"name": "computer_use", "arguments": {"action": "screenshot"}}]}
```

Parser Code:
```typescript
// Wyciągamy bloki JSON z markdown code blocks
const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
let match;
while ((match = jsonBlockRegex.exec(fullText)) !== null) {
  const parsedJson = JSON.parse(match[1]);
  if (parsedJson.tools && Array.isArray(parsedJson.tools)) {
    // Parsuj i dodaj do toolCalls
  }
}

// Fallback: Raw JSON
const rawJsonRegex = /\{[\s\S]*?"tools"[\s\S]*?\}/g;
```

#### 3. **Zaktualizowano INSTRUCTIONS dla AI**

Nowy prompt instruuje AI aby zwracało JSON zamiast używać function calling:

```typescript
const INSTRUCTIONS = `
**🔥 KRYTYCZNIE WAŻNE - CUSTOM JSON FORMAT 🔥**

Gdy chcesz wykonać akcję, MUSISZ zwrócić JSON w formacie:

\`\`\`json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "screenshot"
      }
    }
  ]
}
\`\`\`
...
`;
```

#### 4. **Fallback - Text Parsing**

Jeśli AI nie zwróci JSON, system używa fallbacku:
```typescript
const textToolCall = parseTextToolCall(fullText);
// Parsuje: computer_use("screenshot")
// Parsuje: computer_use("left_click", 100, 200)
```

### Zalety nowego systemu:

✅ **Pełna kontrola** - nie jesteś ograniczony formatem function calling modelu  
✅ **Elastyczność** - możesz dodać własne formaty i parsery  
✅ **Debugowanie** - widzisz dokładnie co AI zwraca w logu  
✅ **Niezależność** - działa z każdym LLM, nie wymaga natywnego function calling  
✅ **Fallback** - jeśli JSON się nie uda, text parsing nadal działa  

### Dostępne akcje (wszystkie przez JSON):

- `screenshot` - zrzut ekranu
- `left_click` - kliknięcie [x, y]
- `double_click` - podwójne kliknięcie [x, y]
- `right_click` - prawy przycisk [x, y]
- `mouse_move` - ruch myszą [x, y]
- `type` - wpisywanie tekstu
- `key` - naciśnięcie klawisza (enter, tab, etc.)
- `scroll` - scrollowanie (delta_y, delta_x)
- `left_click_drag` - przeciąganie (start_coordinate, coordinate)
- `wait` - czekanie (duration max 2s)

### Dokumentacja:

- **Główna dokumentacja**: `docs/CUSTOM_JSON_FORMAT.md`
- **Architektura**: Zaktualizowano `replit.md`
- **Ten plik**: `CHANGELOG.md`

### Jak to działa?

1. AI otrzymuje prompt z instrukcją zwracania JSON
2. AI generuje odpowiedź tekstową z JSON wewnątrz
3. Custom parser wyciąga JSON z tekstu
4. Parser parsuje JSON i wyciąga `tools` array
5. Każdy tool call jest wykonywany przez OnKernel SDK
6. Wyniki są zwracane do AI

### Naprawa wielokrotnych wywołań:

**Problem:** Poprzednio system wykonywał tylko pierwszą funkcję z array `tools`:
```typescript
const firstToolCall = toolCalls[0]; // ❌ Tylko pierwsza
// Wykonywał tylko firstToolCall
```

**Rozwiązanie:** Teraz iteruje przez wszystkie funkcje:
```typescript
for (const toolCall of toolCalls) { // ✅ Wszystkie
  // Wykonuje każdą funkcję po kolei
  const parsedArgs = JSON.parse(toolCall.arguments);
  // ... wykonanie funkcji ...
  chatHistory.push(toolMessage);
}
console.log(`[ALL ${toolCalls.length} TOOL CALLS EXECUTED]`);
```

**Przykład wielokrotnych wywołań:**
```json
{
  "tools": [
    {"name": "computer_use", "arguments": {"action": "left_click", "coordinate": [100, 200]}},
    {"name": "computer_use", "arguments": {"action": "type", "text": "Hello"}},
    {"name": "computer_use", "arguments": {"action": "key", "text": "enter"}}
  ]
}
```
System teraz wykona **wszystkie 3 akcje** po kolei!

### Przykład użycia:

**AI Input:**
```
User: Zrób screenshot
```

**AI Output (z custom JSON):**
```
Oczywiście! Robię zrzut ekranu.

\`\`\`json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "screenshot"
      }
    }
  ]
}
\`\`\`
```

**System:**
- Parser wyciąga JSON
- Wykonuje `computer_use` z akcją `screenshot`
- Zwraca wynik do AI

### Porównanie:

| Feature | Function Calling | Custom JSON |
|---------|-----------------|-------------|
| Kontrola formatu | ❌ Narzucona przez model | ✅ Pełna kontrola |
| Debugowanie | ❌ Trudne (binarne) | ✅ Łatwe (text visible) |
| Elastyczność | ❌ Ograniczona | ✅ Nielimitowana |
| Compatibility | ❌ Wymaga support | ✅ Działa wszędzie |
| Fallback | ❌ Brak | ✅ Text parsing |

---

**Status:** ✅ Zaimplementowane i działające  
**Data:** 2025-11-21  
**Autor:** AI Assistant (na życzenie użytkownika)
