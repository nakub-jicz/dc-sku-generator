# Operacje Masowe - DC SKU Generator

## Przegląd

System operacji masowych pozwala na aktualizację SKU dla tysięcy produktów w jednej operacji, bez ograniczeń tradycyjnych limitów API Shopify.

## Architektura

### Komponenty systemu:

1. **`bulkOperations.ts`** - Główny serwis obsługujący operacje masowe
2. **`api.bulk-update-sku.tsx`** - API endpoint do uruchamiania operacji
3. **`api.bulk-status.tsx`** - API endpoint do monitorowania statusu
4. **`BulkOperationManager.tsx`** - Komponent React z interfejsem użytkownika

## Proces operacji masowej

### Krok 1: Generowanie pliku JSONL
```typescript
generateBulkUpdateJSONL(zasady: ZasadyGeneratora, warianty: ProductVariant[])
```
- Grupuje warianty według produktu
- Generuje nowe SKU używając `generujPojedynczeSKU`
- Tworzy plik JSONL z obiektami `ProductSetInput` dla mutacji `productSet`

### Krok 2: Upload pliku
```typescript
uploadBulkFile(admin: any, jsonlContent: string, filename?: string)
```
- Używa `stagedUploadsCreate` do utworzenia upload URL
- Uploaduje plik JSONL do Shopify
- Zwraca `resourceUrl` potrzebny w następnym kroku

### Krok 3: Uruchomienie operacji
```typescript
startBulkOperation(admin: any, stagedUploadPath: string, totalVariants: number)
```
- **Inteligentny wybór mutacji**: `productSet(synchronous: true)` dla ≤100 wariantów, `productSet(synchronous: false)` dla więcej
- **Synchroniczny**: Błyskawiczne rezultaty dla małych operacji (≤100 wariantów)
- **Asynchroniczny**: Skaluje do 2000 wariantów na produkt
- Shopify wykonuje mutację dla każdego produktu z pliku JSONL
- Zwraca ID operacji do monitorowania

### Krok 4: Monitorowanie statusu
```typescript
getBulkOperationStatus(admin: any, operationId: string)
getCurrentBulkOperation(admin: any)
```
- Sprawdza status operacji: `CREATED` → `RUNNING` → `COMPLETED`/`FAILED`
- Komponent automatycznie sprawdza status co 3 sekundy

### Krok 5: Pobieranie wyników
```typescript
getBulkOperationResults(resultsUrl: string)
```
- Po zakończeniu operacji, Shopify udostępnia plik z wynikami
- Parsuje wyniki JSONL i analizuje sukces/błędy

## Użycie w aplikacji

### API Endpoints

**POST `/api/bulk-update-sku`**
```json
{
  "zasady": ZasadyGeneratora,
  "warianty": ProductVariant[]
}
```

**GET `/api/bulk-status?id=OPERATION_ID&includeResults=true`**

### Interfejs użytkownika

Komponent `BulkOperationManager` automatycznie pojawia się gdy:
- Są wybrane produkty
- Są skonfigurowane zasady generowania

## Korzyści vs standardowe API

### Standardowe API (obecnie dostępne w aplikacji):
- ❌ Ograniczone limitami API (40 req/s dla Plus, 2 req/s dla Basic)
- ❌ Synchroniczne - musisz czekać na każdą odpowiedź
- ❌ Problemy z timeoutami przy dużych operacjach
- ✅ Dobry dla małych operacji (< 100 produktów)

### Operacje Masowe z `productSet`:
- ✅ **Synchroniczne dla ≤100 wariantów** - błyskawiczne rezultaty!
- ✅ **Asynchroniczne dla 100-2000 wariantów** - skaluje ogromnie
- ✅ **Brak limitów API** - Shopify przetwarza bez ograniczeń
- ✅ **Inteligentny wybór** - automatycznie optymalizuje wydajność
- ✅ **Prostsze API** - jedna mutacja na produkt zamiast na wariant
- ✅ **Pełny raport** z sukcesami/błędami
- ✅ **Automatic retry** dla błędów przejściowych

## Przykłady użycia

```typescript
// Kompletna operacja masowa - używa productSet z inteligentnym wyborem sync/async
const bulkOperation = await executeBulkSKUUpdate(admin, zasady, warianty);

// Automatyczny wybór:
// ≤100 wariantów → productSet(synchronous: true) → błyskawiczne rezultaty
// >100 wariantów → productSet(synchronous: false) → asynchroniczne przetwarzanie

// Monitorowanie (tylko dla async)
const status = await getBulkOperationStatus(admin, bulkOperation.id);

// Pobieranie wyników po zakończeniu
if (status.status === 'COMPLETED' && status.url) {
  const results = await getBulkOperationResults(status.url);
}
```

## Bezpieczeństwo

- Tylko jedna operacja masowa może być uruchomiona jednocześnie
- System automatycznie sprawdza czy jest już uruchomiona operacja
- Wszystkie operacje są logowane w konsoli
- Pełne raportowanie błędów

## Monitoring i debugowanie

### Logi:
```
Generated JSONL with X operations
File uploaded to: [staged_upload_path]
Bulk operation started: [operation_id]
```

### Statusy operacji:
- `CREATED` - Operacja utworzona, czeka na rozpoczęcie
- `RUNNING` - W trakcie wykonywania
- `COMPLETED` - Zakończona pomyślnie
- `FAILED` - Nieudana
- `CANCELED` - Anulowana

### Analiza wyników:
```json
{
  "summary": {
    "total": 1000,
    "successful": 980,
    "failed": 20,
    "successRate": "98.0"
  }
}
```

## Nowe możliwości z `productSet`

### 🚀 Inteligentny wybór wydajności:
- **≤100 wariantów**: Synchroniczne `productSet` - **natychmiastowe rezultaty**
- **>100 wariantów**: Asynchroniczne `productSet` - **skaluje do 2000 wariantów/produkt**

### 💡 Przykłady zastosowań:

**Małe sklepy (do 100 wariantów):**
```typescript
// Synchroniczne - rezultaty w sekundach, nie minutach!
await updateSKU(zasady, warianty); // ← Błyskawiczne
```

**Duże sklepy (100-2000 wariantów na produkt):**
```typescript
// Asynchroniczne - monitorowanie postępu
const operation = await updateSKU(zasady, warianty);
// Shopify przetwarza w tle, ty monitorujesz
```

### 📊 Porównanie wydajności:

| Metoda | Warianty | Czas | Rezultat |
|--------|----------|------|----------|
| **Standardowe API** | 100 | ~2-5 min | ⚡ Średnio |
| **productSet (sync)** | 100 | ~5-15 sek | 🚀 Błyskawicznie |
| **productSet (async)** | 1000 | ~1-3 min | 💪 Skaluje |
| **productSet (async)** | 2000 | ~2-5 min | 🎯 Maksimum |

## ✅ **NAJWAŻNIEJSZA NAPRAWKA - optionValues**

W API 2025-04 **KAŻDY wariant MUSI mieć pole `optionValues`** z wartościami opcji produktu.

### **Poprawna struktura JSONL:**
```json
{"id":"gid://shopify/Product/123","options":[{"name":"Color","values":["Red","Blue"]},{"name":"Size","values":["M","L"]}],"variants":[{"id":"gid://shopify/ProductVariant/456","sku":"SKU-001","optionValues":[{"name":"Color","value":"Red"},{"name":"Size","value":"M"}]},{"id":"gid://shopify/ProductVariant/789","sku":"SKU-002","optionValues":[{"name":"Color","value":"Blue"},{"name":"Size","value":"L"}]}]}
```

### **Kluczowe wymagania:**
- ✅ `options` musi być zdefiniowane na poziomie produktu z wszystkimi opcjami i ich możliwymi wartościami
- ✅ `optionValues` musi być tablicą **obiektów** z polami `name` i `value`
- ✅ Każdy obiekt musi mieć `name` (nazwa opcji) i `value` (wartość opcji)
- ✅ Kolejność obiektów musi odpowiadać kolejności opcji produktu
- ✅ Nie może być `null` ani `undefined`

### **Przykład dla produktu z opcjami ["Color", "Size"]:**
```typescript
// POPRAWNE (API 2025-04):
{
  id: "gid://shopify/Product/123",
  options: [
    { name: "Color", values: ["Red", "Blue"] },
    { name: "Size", values: ["M", "L"] }
  ],
  variants: [{
    id: "gid://shopify/ProductVariant/123",
    sku: "NEW-SKU-123", 
    optionValues: [
      { name: "Color", value: "Red" },
      { name: "Size", value: "M" }
    ]  // ✅ Obiekty z name i value
  }]
}

// BŁĘDNE:
{
  id: "gid://shopify/ProductVariant/123",
  sku: "NEW-SKU-123",
  optionValues: ["Red", "M"]  // ❌ Stringi zamiast obiektów!
}
```

### **Dla produktów z jedną opcją (Default Title):**
```typescript
{
  id: "gid://shopify/Product/123",
  options: [
    { name: "Title", values: ["Default Title"] }
  ],
  variants: [{
    id: "gid://shopify/ProductVariant/123",
    sku: "NEW-SKU-123",
    optionValues: [
      { name: "Title", value: "Default Title" }
    ]  // ✅ Jeden obiekt dla jednej opcji
  }]
}
``` 