# Custom JSON Format dla AI Tool Calling

## Przegląd

Zamiast standardowego function calling, AI zwraca JSON bezpośrednio w odpowiedzi tekstowej, który jest następnie parsowany i wykonywany.

**✅ WIELOKROTNE WYWOŁANIA:** System wykonuje **wszystkie** funkcje które AI zwróci w jednym JSON - nie tylko pierwszą!

## Format JSON

AI musi zwrócić JSON w następującym formacie:

```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "nazwa_akcji",
        ...parametry
      }
    }
  ]
}
```

## Dostępne Akcje

### 1. Screenshot
```json
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
```

### 2. Kliknięcie myszą

**Left Click:**
```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "left_click",
        "coordinate": [512, 384]
      }
    }
  ]
}
```

**Double Click:**
```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "double_click",
        "coordinate": [512, 384]
      }
    }
  ]
}
```

**Right Click:**
```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "right_click",
        "coordinate": [512, 384]
      }
    }
  ]
}
```

### 3. Ruch myszą
```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "mouse_move",
        "coordinate": [100, 200]
      }
    }
  ]
}
```

### 4. Wpisywanie tekstu
```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "type",
        "text": "Hello World"
      }
    }
  ]
}
```

### 5. Naciśnięcie klawisza
```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "key",
        "text": "enter"
      }
    }
  ]
}
```

Dostępne klawisze: `enter`, `tab`, `escape`, `backspace`, `delete`, `ctrl+c`, `ctrl+v`, itp.

### 6. Scrollowanie
```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "scroll",
        "delta_y": 100
      }
    }
  ]
}
```

- `delta_y > 0` - scroll w dół
- `delta_y < 0` - scroll w górę
- `delta_x` - scroll w prawo/lewo

### 7. Przeciąganie
```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "left_click_drag",
        "start_coordinate": [100, 200],
        "coordinate": [300, 400]
      }
    }
  ]
}
```

### 8. Czekanie
```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "wait",
        "duration": 1
      }
    }
  ]
}
```

Max: 2 sekundy

## Wielokrotne Wywołania

AI może zwrócić **wiele funkcji naraz** w jednym JSON:

```json
{
  "tools": [
    {
      "name": "computer_use",
      "arguments": {
        "action": "left_click",
        "coordinate": [100, 200]
      }
    },
    {
      "name": "computer_use",
      "arguments": {
        "action": "type",
        "text": "Hello World"
      }
    },
    {
      "name": "computer_use",
      "arguments": {
        "action": "key",
        "text": "enter"
      }
    }
  ]
}
```

System wykona **wszystkie** funkcje po kolei, w kolejności w jakiej zostały zwrócone.

## Współrzędne Ekranu

- **Rozdzielczość:** 1024 x 768 pikseli
- **X:** 0-1023 (poziomo, lewo→prawo)
- **Y:** 0-767 (pionowo, góra→dół)
- **Środek ekranu:** [512, 384]

## Sposób Zwracania

AI może zwrócić JSON w dwóch formatach:

### 1. Markdown Code Block (preferowane)
```
\```json
{"tools": [{"name": "computer_use", "arguments": {"action": "screenshot"}}]}
\```
```

### 2. Raw JSON
```
{"tools": [{"name": "computer_use", "arguments": {"action": "screenshot"}}]}
```

## Fallback - Text Parsing

Jeśli AI nie zwróci JSON, system próbuje parsować tekst w formacie:
- `computer_use("screenshot")`
- `computer_use("left_click", 100, 200)`
- `computer_use("type", "text")`

## Implementacja

Parser znajduje się w `app/api/chat/route.ts`:
1. Zbiera pełną odpowiedź tekstową od AI
2. Szuka bloków JSON markdown: `/```json\s*(\{[\s\S]*?\})\s*```/g`
3. Jeśli nie znajdzie, szuka raw JSON: `/\{[\s\S]*?"tools"[\s\S]*?\}/g`
4. Parsuje JSON i wyciąga `tools` array
5. Wykonuje każde tool call przez OnKernel SDK
6. Zwraca wyniki do AI

## Zalety

- **Kontrola:** Pełna kontrola nad formatem i parsowaniem
- **Debugowanie:** Łatwiejsze debugowanie - widzimy dokładnie co AI zwraca
- **Elastyczność:** Możliwość dodawania własnych formatów
- **Niezależność:** Nie zależy od natywnego function calling modelu
