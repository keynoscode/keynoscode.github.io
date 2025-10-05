# 【 Nexus AI ✦ 長期記憶系統架構 v2.0 】

**核心理念：** 賦予 AI 代理超越單次對話的持續性上下文感知能力。將其從一個僅響應當前輸入的「工具」，進化為一個能夠記住過去、理解偏好、並在持續互動中成長的「智慧夥伴」。

---

## 1. 核心架構：從文字到知識庫的進化

記憶系統的基石是將原本非結構化的文字記憶，升級為結構化的 JSON 知識庫。這一轉變是通過以下核心類型定義實現的：

### `types/index.ts` - 數據結構的定義

#### **`MemoryEntry`**
這是記憶的原子單位，代表一次有意義的互動摘要。

```typescript
// 代表 AI 代理的一條長期記憶。
export interface MemoryEntry {
  timestamp: string; // ISO 8601 格式，記錄記憶生成的時間
  summary: string;   // 經由 AI 提煉的單行互動摘要
}
```

#### **`AIAgent`**
核心 AI 代理介面被修改，以容納新的結構化記憶。

```typescript
export interface AIAgent {
  // ... 其他屬性
  memoryEnabled?: boolean;  // 是否啟用長期記憶
  memory?: MemoryEntry[]; // 更新: 儲存對話摘要的長期記憶 (JSON 陣列)
  // ... 其他屬性
}
```

`memory` 屬性從 `string | undefined` 變更為 `MemoryEntry[] | undefined`，這是整個系統得以運作的根本性變更。

---

## 2. 記憶的生命週期 (`services/memory.service.ts`)

`memory.service.ts` 是 AI 記憶的中樞神經系統，負責記憶的完整生命週期管理：**創建、儲存、檢索、與清除**。

### **2.1 記憶的創建 (`updateAgentMemory`)**

記憶並非簡單地記錄原始對話，而是經過 AI 的二次提煉。

-   **觸發時機：** 當一個**啟用了長期記憶**的自訂代理成功回應使用者後觸發。
-   **工作流程：**
    1.  **情境構建：** 服務會收集 `使用者輸入`、`AI 的回應` 以及 `歷史記憶`。
    2.  **摘要提示：** 構造一個特殊的 `prompt`，指令 Gemini 扮演「記憶管理單元」的角色。
        ```
        你是 AI 代理的記憶管理單元...
        你的任務是總結以下交互...
        摘要請盡量簡潔，一行即可完成。

        先前記憶：
        ---
        - 使用者偏好簡潔的程式碼審查。
        - 使用者正在開發 Nexus AI 專案。
        ---

        目前要總結的互動：
        ---
        使用者輸入：“幫我檢查這段 React 程式碼。”
        你（代理）回覆：“好的，這段程式碼...（省略）”
        ---

        要加入記憶中的新的簡潔摘要行：
        ```
    3.  **AI 提煉：** 調用 `callGeminiAPI`，讓 AI 生成一句高度濃縮的摘要，例如：「使用者請求進行 React 程式碼審查。」
    4.  **結構化封裝：** 將這句摘要與當前時間戳封裝成一個 `MemoryEntry` 物件。
    5.  **儲存與更新：** 將新的 `MemoryEntry` 添加到代理的 `memory` 陣列中，並調用 `agent.service` 的 `updateAgent` 函式將其持久化。

### **2.2 記憶容量管理**

為防止記憶無限增長導致性能問題和 `prompt` 過長，系統採用了「滑動窗口」機制。

-   **`MAX_MEMORY_ENTRIES`：** 在 `memory.service.ts` 中定義了一個常數（目前為 `50`），限制了記憶陣列的最大長度。
-   **自動修剪：** 在每次新增記憶後，系統會自動截取最新的 `50` 條記憶，舊的記憶會被自然淘汰。

### **2.3 記憶的檢索與使用 (`services/ai/agent.executor.ts`)**

記憶的價值在於被使用。當使用者觸發自訂代理時，記憶會被注入到 `prompt` 中，為 AI 提供上下文。

```typescript
// 於 _runCustomPromptAgent 函式中
const memoryContext = (agent.memoryEnabled && agent.memory) 
    ? `\n\n--- Past Conversation Summary (Your Memory) ---\n${agent.memory.map(m => m.summary).join('\n')}\n------------------------------------------\n` 
    : '';

const fullPrompt = `${agent.systemPrompt}${memoryContext}\n\nUser input: "${userInput}"`;
```

這段 `memoryContext` 會將所有記憶摘要格式化為一個清晰的列表，置於系統提示和使用者當前輸入之間，讓 AI 在回應前能充分「回憶」起過去的相關互動。

### **2.4 記憶的清除與摘要 (`clearAgentMemory`, `getAgentMemorySummary`)**

-   **`clearAgentMemory`：** 提供一個簡單直接的方式來重置代理的記憶，它會將代理的 `memory` 屬性設置為一個空陣列 `[]`。
-   **`getAgentMemorySummary`：** 這是一個高階功能，它會收集代理所有的記憶條目，並再次調用 Gemini，要求其將這些零散的摘要點，融合成一段通順、連貫的**段落式總結**，用於導出功能。

---

## 3. 使用者介面 (`components/builder/MemoryOverview.tsx`)

使用者介面是使用者與 AI 記憶互動的唯一窗口，提供了直觀的管理工具。

-   **視覺化呈現：**
    -   元件直接接收 `MemoryEntry[]` 陣列。
    -   它不再顯示混亂的文字塊，而是將每條 `summary` 作為一個獨立的列表項，並配上 `<LightBulbIcon>` 圖標，清晰地展示每一條記憶。

-   **強化的導出功能：**
    -   **`.json`：** 導出包含 `timestamp` 和 `summary` 的完整、原始的結構化數據。
    -   **`.txt`：** 導出一個純文字檔案，每行包含一條 `summary`。
    -   **`.md`：** 導出一個格式化的 Markdown 檔案，包含標題和一個無序列表，每項是一條 `summary`。

-   **管理操作：**
    -   **清除記憶：** 點擊垃圾桶圖標，觸發 `onClearMemory` 回調，執行 `clearAgentMemory` 服務。
    -   **AI 摘要：** 點擊「AI 摘要」按鈕，觸發 `onGenerateSummary` 回調，執行 `getAgentMemorySummary` 服務，並將返回的段落式總結直接下載為 `.txt` 檔案。
    -   **導入記憶：** (未來功能) 預留了導入按鈕，未來可實現從 `.json` 檔案恢復代理的記憶。

---

## 4. 總結流程圖

```mermaid
graph TD
    A[使用者與自訂代理互動] --> B{代理回應生成};
    B --> C[memory.service.ts: updateAgentMemory];
    C --> D[向 Gemini 請求互動摘要];
    D --> E[生成新的 MemoryEntry];
    E --> F[更新代理的 memory[] 陣列];
    F --> G[持久化到 localStorage];
    
    subgraph "下一次互動"
        H[使用者觸發同一代理] --> I[agent.executor.ts: _runCustomPromptAgent];
        I --> J[從 memory[] 讀取所有記憶];
        J --> K[將記憶注入 Prompt];
        K --> L[向 Gemini 請求回應];
    end
    
    subgraph "UI 操作"
       M[AgentBuilder: MemoryOverview] --> N{顯示 memory[] 列表};
       M --> O[觸發 onClearMemory];
       O --> P[memory.service.ts: clearAgentMemory];
    end

```
