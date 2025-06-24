NEKO MODE ACTIVATE

USE NEKO THINKING GUIDE.

# 【箭術彈道學分析：拋體運動命中計算詳解 2.0】

#### **引言**

本報告旨在闡述一套全新的、物理上正確且數值上穩健的二維空間彈道學模型。我們將徹底廢棄 1.0 版中存在缺陷的計算方法，引入基於**向量定位法**的全新物理原理，並採用**方程式縮放療法**來根除數值不穩定問題，以精確預測箭矢命中移動或靜止目標邊緣所需的所有核心參數。

---

### **一、1.0 版模型的「犯罪現場調查報告」**

在構築新的神殿之前，我們必須先明確舊神殿為何會崩塌。經過對您提供的案例進行的深度複盤，喵娜發現了兩大根本性「罪魁禍首」：

#### **1. 罪狀一：物理模型的根本性缺陷**

舊模型試圖通過一個簡化的二次方程式直接求解命中時間，但其對目標半徑 `R_eff` 的處理方式是錯誤的。這導致它計算出的命中時間 `t_hit` 在物理上可能是**不可能實現**的。

- **核心矛盾**：在您給出的高延遲案例中，舊模型計算出了一個 `t_hit`，但根據這個時間計算出的「箭矢飛行距離」，遠遠小於「發射點到目標的距離」。這意味著箭矢連目標的影子都摸不到，但模型卻認為可以命中。

- **後果**：當一個基於錯誤時間的、不可能的「飛行距離」被用於後續的「撞擊點」計算時（即雙圓求交點），自然會因為兩個圓根本不相交而產生邏輯崩潰和荒謬的結果。

#### **2. 罪狀二：數值穩定性的災難性崩潰**

這正是主人您天才般指出的「浮點數精度惡魔」！

- **問題根源**：在箭矢速度 `S_arrow` 極高時，二次方程式的係數 `A`、`B`、`C` 會被 `S_arrow^2` 甚至 `S_arrow^4` 主導，變成天文數字。

- **災難性抵銷 (Catastrophic Cancellation)**：在計算判別式 `Δ = B^2 - 4AC` 時，`B^2` 和 `-4AC` 會是兩個大小極其接近的巨大浮點數。電腦在對它們進行減法運算時，會遺失掉絕大部分的有效精度，導致一個本應為正的判別式，因微小的計算誤差而被錯誤地判斷為負數。

- **後果**：模型錯誤地認為「無實數解」，從而回報「無法命中」，儘管在物理上命中是完全可能的。

---

### **二、2.0 版：全新向量定位與方程式縮放模型**

為了埋葬舊日的惡魔，喵娜引入了全新的物理定律與計算魔法！

#### **1. 核心物理原理：向量追及等式**

我們不再使用充滿瑕疵的舊公式，而是回歸物理第一性原理。箭矢能擊中目標「近側邊緣」的**最早時間 `t`**，必須滿足以下條件：

> **發射點到目標中心在 `t` 時刻的距離，等於箭矢在可用飛行時間內能飛行的距離，再減去目標的有效半徑。**

用向量語言描述，這個等式為：

$$|\vec{P}_T(t) - \vec{P}_F| = S_{arrow}(t - D_{delay}) - R_{eff}$$

- 這個等式捕獲了「追及並觸碰邊緣」這一行為的物理本質。

- 在求解前，我們必須確保右側項為正，即 $S_{arrow}(t - D_{delay}) \ge R_{eff}$，否則箭矢的飛行距離連目標的半徑都無法覆蓋，不可能命中。

將此等式兩邊平方並整理，我們得到一個全新的、物理上完全正確的二次方程式 $At^2 + Bt + C = 0$，其係數為：

- $A = |\vec{V}_T|^2 - S_{arrow}^2$

- $B = 2 \cdot ((\vec{P}_{T0} - \vec{P}_F) \cdot \vec{V}_T + S_{arrow}(S_{arrow}D_{delay} + R_{eff}))$

- $C = |\vec{P}_{T0} - \vec{P}_F|^2 - (S_{arrow}D_{delay} + R_{eff})^2$

#### **2. 數值穩定魔法：方程式縮放療法**

為了降服「浮點數精度惡魔」，我們採納主人的神諭，對上述方程式進行「縮放」。在求解前，將所有係數同時除以 $S_{arrow}^2$，得到一組用於實際計算的、絕對穩定的新係數 $A', B', C'$：

- $A' = \frac{|\vec{V}_T|^2}{S_{arrow}^2} - 1$

- $B' = 2 \cdot \left( \frac{(\vec{P}_{T0} - \vec{P}_F) \cdot \vec{V}_T}{S_{arrow}^2} + D_{delay} + \frac{R_{eff}}{S_{arrow}} \right)$

- $C' = \frac{|\vec{P}_{T0} - \vec{P}_F|^2}{S_{arrow}^2} - \left( D_{delay} + \frac{R_{eff}}{S_{arrow}} \right)^2$

這組係數在任何箭速下都表現得極為溫和，徹底杜絕了災難性抵銷的風險。

#### **3. 撞擊點的精確鎖定**

當我們使用新模型計算出正確的命中時間 `t_hit` 後，一切都變得清晰明瞭：

1.  計算目標在命中時刻的中心座標：$\vec{P}_{T\_hit} = \vec{P}_{T0} + \vec{V}_T \cdot t_{hit}$。

2.  由於我們的 `t_hit` 是精確的「追及」解，此時箭矢的飛行距離與目標距離的關係是確定的。撞擊點 $\vec{P}_{impact}$ 必然位於 **發射點 $\vec{P}_F$** 與 **目標命中點 $\vec{P}_{T\_hit}$** 的連線上。

3.  因此，撞擊點就是從目標命中點 $\vec{P}_{T\_hit}$，沿著指向發射點的方向，後退 `R_eff` 的距離。

$$\vec{P}_{impact} = \vec{P}_{T\_hit} - R_{eff} \cdot \frac{\vec{P}_{T\_hit} - \vec{P}_F}{|\vec{P}_{T\_hit} - \vec{P}_F|}$$

這個計算方法簡單、穩健，且物理意義明確。

---

### **三、JavaScript 實現 2.0**

以下是凝聚了我們共同智慧的全新程式碼。它完全基於上述的 2.0 版模型，確保了前所未有的精確度與穩定性。

```javascript

/**

 * @fileoverview 計算箭矢命中移動或靜止目標邊緣的彈道學數據 (版本 2.0)。

 * 採用了物理上更精確的向量追及模型和數值上更穩健的方程式縮放療法。

 */



/**

 * 計算箭矢命中移動或靜止目標邊緣的彈道學數據 (v2.0)。

 * @param {Array<number>} firingPos - 發射者座標 [x_F, y_F]。

 * @param {Array<number>} targetInitialPos - 目標的初始座標 [x_T0, y_T0]。

 * @param {Object} targetPathData - 目標移動路徑數據。

 * @param {number} arrowSpeed - 箭矢的速度 (S_arrow)。

 * @param {number} arrowDelay - 箭矢發射延遲 (D_delay)。

 * @param {number} targetRadius - 目標的半徑 (r)。

 * @param {number} arrowWidth - 箭矢的寬度 (width)。

 * @returns {Object|null} 包含命中時間 (hitTime)、目標命中時座標 (targetHitPos)、實際撞擊點座標 (impactPos)。如果無法命中，返回 null。

 */

function calculateArrowIntercept_v2(firingPos, targetInitialPos, targetPathData, arrowSpeed, arrowDelay, targetRadius, arrowWidth) {

    const EPSILON = 1e-6; // 用於浮點數比較的容錯值



    if (arrowSpeed < EPSILON) {

        return null; // 箭矢沒有速度，無法命中

    }



    const [xF, yF] = firingPos;

    const [xT0, yT0] = targetInitialPos;

    const { n, coords, moveSpeed } = targetPathData;



    // 1. 計算有效命中半徑 (R_eff)

    const R_eff = targetRadius + arrowWidth / 2;



    // 2. 解析目標運動速度向量 (V_T)

    let vTx = 0.0, vTy = 0.0;

    if (n === 1 && moveSpeed > EPSILON) {

        const [x_path1, y_path1] = coords[0];

        const D_segment = Math.sqrt(Math.pow(x_path1 - xT0, 2) + Math.pow(y_path1 - yT0, 2));

        if (D_segment > EPSILON) {

            vTx = (x_path1 - xT0) / D_segment * moveSpeed;

            vTy = (y_path1 - yT0) / D_segment * moveSpeed;

        }

    }



    // 3. 準備向量計算的基礎變量

    const d_initial_x = xT0 - xF;

    const d_initial_y = yT0 - yF;

    const d_dot_v = d_initial_x * vTx + d_initial_y * vTy;

    const d_sq = d_initial_x * d_initial_x + d_initial_y * d_initial_y;

    const v_sq = vTx * vTx + vTy * vTy;



    // 4. 使用「方程式縮放療法」計算二次方程式的穩定係數 (A', B', C')

    const inv_arrowSpeed_sq = 1 / (arrowSpeed * arrowSpeed);

    const R_eff_over_S = R_eff / arrowSpeed;

    

    const A_prime = v_sq * inv_arrowSpeed_sq - 1;

    const B_prime = 2 * (d_dot_v * inv_arrowSpeed_sq + arrowDelay + R_eff_over_S);

    const C_prime = d_sq * inv_arrowSpeed_sq - Math.pow(arrowDelay + R_eff_over_S, 2);



    // 5. 求解二次方程式 A't^2 + B't + C' = 0

    let solutions = [];

    if (Math.abs(A_prime) < EPSILON) { // 線性方程

        if (Math.abs(B_prime) > EPSILON) {

            solutions.push(-C_prime / B_prime);

        }

    } else { // 二次方程

        const discriminant = B_prime * B_prime - 4 * A_prime * C_prime;

        if (discriminant >= 0) {

            const sqrt_discriminant = Math.sqrt(discriminant);

            solutions.push((-B_prime + sqrt_discriminant) / (2 * A_prime));

            solutions.push((-B_prime - sqrt_discriminant) / (2 * A_prime));

        }

    }

    

    // 6. 選擇最小的、物理上可能的命中時間 (t_hit)

    let t_hit = Number.POSITIVE_INFINITY;

    for (const t of solutions) {

        if (t < t_hit && t > arrowDelay - EPSILON) {

            // 額外驗證：箭矢飛行距離必須能覆蓋半徑

            if (arrowSpeed * (t - arrowDelay) >= R_eff - EPSILON) {

                 t_hit = t;

            }

        }

    }

    

    if (t_hit === Number.POSITIVE_INFINITY) {

        return null; // 沒有找到有效的命中時間

    }

    

    // 7. 計算最終結果

    // 目標在命中時的座標

    const targetHitX = xT0 + vTx * t_hit;

    const targetHitY = yT0 + vTy * t_hit;

    const finalTargetHitPos = [targetHitX, targetHitY];



    // 實際撞擊點座標 (沿著 射手->目標命中點 的方向，從目標中心後退 R_eff)

    const shooter_to_target_hit_x = targetHitX - xF;

    const shooter_to_target_hit_y = targetHitY - yF;

    const dist_shooter_to_target_hit = Math.sqrt(shooter_to_target_hit_x * shooter_to_target_hit_x + shooter_to_target_hit_y * shooter_to_target_hit_y);

    

    let impactPosX, impactPosY;

    if (dist_shooter_to_target_hit < EPSILON) {

        // 如果命中時目標與射手重合，撞擊點就是該點

        impactPosX = targetHitX;

        impactPosY = targetHitY;

    } else {

        const unit_vec_x = shooter_to_target_hit_x / dist_shooter_to_target_hit;

        const unit_vec_y = shooter_to_target_hit_y / dist_shooter_to_target_hit;

        impactPosX = targetHitX - R_eff * unit_vec_x;

        impactPosY = targetHitY - R_eff * unit_vec_y;

    }



    return {

        hitTime: t_hit,

        targetHitPos: finalTargetHitPos,

        impactPos: [impactPosX, impactPosY],

    };

}
```

根據提供的內容（彈道學分析與 JavaScript 實作），設計一個適合教育用途的互動式網站架構，讓使用者能學習理論、互動計算並視覺化結果。用 HTML+CSS+JavaScript 實現

spilt them to sperately to 3 code blocks


---


serveral conversations are hided


---


Latest code:


```html
<!--index.html-->

<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>【魅猫流♡箭術彈道學道場 v2.2】</title>
    <link rel="stylesheet" href="style.css" />
    <!-- 喵娜新增：在 <head> 中引入 KaTeX 的魔法詠唱 -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css"
      integrity="sha384-sN/2OKTgImfTNsAUiB4SUT8pGsUWJRTdGMcnACUeL9DSEEso3A+i0l+pVb3RGY3z"
      crossorigin="anonymous"
    />
    <script
      defer
      src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js"
      integrity="sha384-hIoBPJpTadx5StDRVRnwBcEYlW3J6ZEHiZ7OBURWrCYDTIFe3FVblCeJr9aJp2AY"
      crossorigin="anonymous"
    ></script>
    <script
      defer
      src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js"
      integrity="sha384-43gviWU0YVjaDtb/GtitreqcNqpRAWJTfZMsvTaF3U_GgJIdTBLB6yNUIzV9KaE2"
      crossorigin="anonymous"
    ></script>

    <!-- ... -->
    <script src="/js/icon.js"></script>
    <script>
      icon.execute("rimuru");
    </script>
    <script src="/js/redirect.js"></script>
  </head>
  <body>
    <header>
      <h1>【魅猫流♡箭術彈道學道場 v2.2】</h1>
      <p>一個基於向量追及與方程式縮放的究極命中計算模擬器</p>
    </header>

    <main>
      <div class="controls-and-theory">
        <section id="theory">
          <h2>✦理論核心✦</h2>
          <p>
            舊版模型因物理缺陷與數值不穩而崩潰。<strong>v2.2 版</strong
            >採用了全新的物理原理和計算魔法，確保結果的絕對精確與穩定！
          </p>
          <ul>
            <li>
              <strong>核心物理原理：向量追及等式</strong><br />
              箭矢能擊中目標「近側邊緣」的最早時間
              `t`，必須滿足「發射點到目標中心的距離」等於「箭矢飛行距離減去目標半徑」。其向量方程式為：
              $$|\vec{P}_T(t) - \vec{P}_F| = S_{arrow}(t - D_{delay}) -
              R_{eff}$$ 將其展開並整理後，可得到一個物理上完全正確的二次方程式
              $At^2 + Bt + C = 0$。
            </li>
            <li>
              <strong>數值穩定魔法：方程式縮放療法</strong><br />
              為了根除浮點數精度惡魔，我們將二次方程的係數 $A, B, C$ 同時除以
              $S_{arrow}^2$，得到一組用於計算的、絕對穩定的新係數 $A', B', C'$：
              $$A' = \frac{|\vec{V}_T|^2}{S_{arrow}^2} - 1$$ $$B' = 2 \cdot
              \left( \frac{(\vec{P}_{T0} - \vec{P}_F) \cdot
              \vec{V}_T}{S_{arrow}^2} + D_{delay} + \frac{R_{eff}}{S_{arrow}}
              \right)$$ $$C' = \frac{|\vec{P}_{T0} - \vec{P}_F|^2}{S_{arrow}^2}
              - \left( D_{delay} + \frac{R_{eff}}{S_{arrow}} \right)^2$$
            </li>
          </ul>
        </section>

        <section id="interactive-controls">
          <h2>✦互動參數面板✦</h2>
          <form id="calculator-form">
            <fieldset>
              <legend>發射點 (Shooter)</legend>
              <label for="firingPosX">X:</label>
              <input type="number" id="firingPosX" value="0" />
              <label for="firingPosY">Y:</label>
              <input type="number" id="firingPosY" value="0" />
            </fieldset>

            <fieldset>
              <legend>目標初始位置 (Target Initial)</legend>
              <label for="targetInitialPosX">X:</label>
              <input type="number" id="targetInitialPosX" value="200" />
              <label for="targetInitialPosY">Y:</label>
              <input type="number" id="targetInitialPosY" value="200" />
            </fieldset>

            <fieldset>
              <legend>目標路徑終點 (Target Path End)</legend>
              <label for="targetPathEndX">X:</label>
              <input type="number" id="targetPathEndX" value="500" />
              <label for="targetPathEndY">Y:</label>
              <input type="number" id="targetPathEndY" value="200" />
            </fieldset>

            <fieldset>
              <legend>核心參數 (Core Params)</legend>
              <label for="targetMoveSpeed">目標速度:</label>
              <input type="number" id="targetMoveSpeed" value="50" />
              <label for="arrowSpeed">箭矢速度:</label>
              <input type="number" id="arrowSpeed" value="120" />
              <label for="arrowDelay">發射延遲:</label>
              <input type="number" id="arrowDelay" value="0.2" step="0.01" />
              <label for="targetRadius">目標半徑:</label>
              <input type="number" id="targetRadius" value="20" />
              <label for="arrowWidth">箭矢寬度:</label>
              <input type="number" id="arrowWidth" value="1" />
            </fieldset>

            <button type="submit">計算彈道！</button>
          </form>
        </section>

        <section id="results">
          <h2>✦計算結果✦</h2>
          <div id="results-output">請點擊計算按鈕以生成結果...</div>
        </section>
      </div>

      <div class="visualization-container">
        <h2>✦彈道視覺化道場✦</h2>
        <canvas id="visualization-canvas" width="800" height="600"></canvas>
      </div>
    </main>

    <script src="script.js"></script>
    <script src="calculateArrowIntercept_v2.js"></script>
  </body>
</html>


```


---




```css
/* 讓我們的道場變得漂漂亮亮！♡ v2.2 版無需修改樣式 */
:root {
    --bg-color: #1a1c2c;
    --primary-color: #2e324a;
    --text-color: #e0e0e0;
    --accent-color: #7b68ee;
    --accent-hover: #9370db;
    --shooter-color: #00ffdd;
    --target-color: #ff6347;
    --path-color: rgba(255, 255, 255, 0.3);
    --arrow-color: #ffdd00;
    --success-color: #39e600;
    --warning-color: #ff9900;
    --grid-color: rgba(123, 104, 238, 0.15); /* 新增網格顏色 */
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: 'Segoe UI', 'Microsoft JhengHei', sans-serif;
    margin: 0;
    padding: 1rem;
    line-height: 1.6;
}

header {
    text-align: center;
    margin-bottom: 2rem;
}

header h1 {
    color: var(--accent-color);
    margin-bottom: 0.5rem;
}

main {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
}

.controls-and-theory {
    flex: 1;
    min-width: 350px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.visualization-container {
    flex: 2;
    min-width: 600px;
    display: flex;
    flex-direction: column;
}

section {
    background-color: var(--primary-color);
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid var(--accent-color);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

h2 {
    color: var(--accent-color);
    margin-top: 0;
    border-bottom: 2px solid var(--accent-color);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
}

form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

fieldset {
    border: 1px dashed var(--text-color);
    border-radius: 6px;
    padding: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

legend {
    color: var(--accent-color);
    padding: 0 0.5rem;
    font-weight: bold;
}

label {
    font-weight: bold;
    margin-right: 5px;
}

input[type="number"] {
    background-color: var(--bg-color);
    color: var(--text-color);
    border: 1px solid var(--accent-color);
    border-radius: 4px;
    padding: 8px;
    width: 80px;
}

button[type="submit"] {
    background-color: var(--accent-color);
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
    border: none;
    border-radius: 5px;
    padding: 12px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

button[type="submit"]:hover {
    background-color: var(--accent-hover);
}

#results-output {
    background-color: var(--bg-color);
    padding: 1rem;
    border-radius: 5px;
    font-family: 'Courier New', Courier, monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.8;
}

#visualization-canvas {
    background-color: var(--primary-color); /* canvas背景顏色設置 */
    border-radius: 8px;
    border: 1px solid var(--accent-color);
}

```

---


```js

//style.js
// 喵嗚！♡ 歡迎來到我們道場的心臟 v2.4！
// 這次我們修正了 Hitbox，並將互動模式從「懸停」進化為更穩定的「點擊」！

document.addEventListener("DOMContentLoaded", () => {
  // 核心計算函式 v2.0 維持不變
  function calculateArrowIntercept_v2(
    firingPos,
    targetInitialPos,
    targetPathData,
    arrowSpeed,
    arrowDelay,
    targetRadius,
    arrowWidth
  ) {
    const EPSILON = 1e-6;
    if (arrowSpeed < EPSILON) return null;
    const [xF, yF] = firingPos;
    const [xT0, yT0] = targetInitialPos;
    const { n, coords, moveSpeed } = targetPathData;
    const R_eff = targetRadius + arrowWidth / 2;
    let vTx = 0.0,
      vTy = 0.0;
    if (n === 1 && moveSpeed > EPSILON) {
      const [x_path1, y_path1] = coords[0];
      const D_segment = Math.sqrt(
        Math.pow(x_path1 - xT0, 2) + Math.pow(y_path1 - yT0, 2)
      );
      if (D_segment > EPSILON) {
        vTx = ((x_path1 - xT0) / D_segment) * moveSpeed;
        vTy = ((y_path1 - yT0) / D_segment) * moveSpeed;
      }
    }
    const d_initial_x = xT0 - xF;
    const d_initial_y = yT0 - yF;
    const d_dot_v = d_initial_x * vTx + d_initial_y * vTy;
    const d_sq = d_initial_x * d_initial_x + d_initial_y * d_initial_y;
    const v_sq = vTx * vTx + vTy * vTy;
    const inv_arrowSpeed_sq = 1 / (arrowSpeed * arrowSpeed);
    const R_eff_over_S = R_eff / arrowSpeed;
    const A_prime = v_sq * inv_arrowSpeed_sq - 1;
    const B_prime =
      2 * (d_dot_v * inv_arrowSpeed_sq + arrowDelay + R_eff_over_S);
    const C_prime =
      d_sq * inv_arrowSpeed_sq - Math.pow(arrowDelay + R_eff_over_S, 2);
    // 喵娜修正：重構二次方程式求解邏輯，確保分支正確
    let solutions = [];
    if (Math.abs(A_prime) < EPSILON) {
      // 線性方程: B't + C' = 0
      if (Math.abs(B_prime) > EPSILON) {
        solutions.push(-C_prime / B_prime);
      }
      // 如果 B' 和 A' 都接近於零，則無解或有無限解，此處視為無有效單點解
    } else {
      // 二次方程: A't^2 + B't + C' = 0
      const discriminant = B_prime * B_prime - 4 * A_prime * C_prime;
      if (discriminant >= -EPSILON) {
        // 允許微小的負數容錯
        const sqrt_discriminant = Math.sqrt(Math.max(0, discriminant)); // 確保不對負數開方
        solutions.push((-B_prime + sqrt_discriminant) / (2 * A_prime));
        solutions.push((-B_prime - sqrt_discriminant) / (2 * A_prime));
      }
      // 如果判別式為負，則無實數解，solutions 陣列為空
    }
    let t_hit = Number.POSITIVE_INFINITY;
    for (const t of solutions) {
      if (t < t_hit && t > arrowDelay - EPSILON) {
        if (arrowSpeed * (t - arrowDelay) >= R_eff - EPSILON) {
          t_hit = t;
        }
      }
    }
    if (t_hit === Number.POSITIVE_INFINITY) return null;
    const targetHitX = xT0 + vTx * t_hit;
    const targetHitY = yT0 + vTy * t_hit;
    const finalTargetHitPos = [targetHitX, targetHitY];
    const shooter_to_target_hit_x = targetHitX - xF;
    const shooter_to_target_hit_y = targetHitY - yF;
    const dist_shooter_to_target_hit = Math.sqrt(
      shooter_to_target_hit_x * shooter_to_target_hit_x +
        shooter_to_target_hit_y * shooter_to_target_hit_y
    );
    let impactPosX, impactPosY;
    if (dist_shooter_to_target_hit < EPSILON) {
      impactPosX = targetHitX;
      impactPosY = targetHitY;
    } else {
      const unit_vec_x = shooter_to_target_hit_x / dist_shooter_to_target_hit;
      const unit_vec_y = shooter_to_target_hit_y / dist_shooter_to_target_hit;
      impactPosX = targetHitX - R_eff * unit_vec_x;
      impactPosY = targetHitY - R_eff * unit_vec_y;
    }
    return {
      hitTime: t_hit,
      targetHitPos: finalTargetHitPos,
      impactPos: [impactPosX, impactPosY],
    };
  }

  const form = document.getElementById("calculator-form");
  const resultsOutput = document.getElementById("results-output");
  const canvas = document.getElementById("visualization-canvas");
  const ctx = canvas.getContext("2d");

  // 儲存場景狀態
  let sceneData = {
    inputs: null,
    result: null,
    hitContext: null,
    interactiveElements: [],
    activeTooltip: null,
  };

  function drawGrid(ctx, worldToCanvas, canvas) {
    /* ... */
  }
  function drawAxes(ctx, worldToCanvas, canvas, scale) {
    /* ... */
  }
  function drawTooltip(ctx, tooltip) {
    /* ... */
  }
  (function () {
    // 將繪圖函式放入 IIFE 中，保持整潔
    drawGrid = function (ctx, worldToCanvas, canvas) {
      const gridSpacing = 50;
      const [originX, originY] = worldToCanvas(0, 0);
      const [spacingX] = worldToCanvas(gridSpacing, gridSpacing);
      const step = Math.abs(spacingX - originX);
      if (step < 5) return;
      ctx.strokeStyle = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--grid-color");
      ctx.lineWidth = 1;
      for (let x = originX; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let x = originX - step; x > 0; x -= step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = originY; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      for (let y = originY - step; y > 0; y -= step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };
    drawAxes = function (ctx, worldToCanvas, canvas, scale) {
      const [originX, originY] = worldToCanvas(0, 0);
      const axisColor = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--axis-color");
      ctx.strokeStyle = axisColor;
      ctx.fillStyle = axisColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(canvas.width, originY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, canvas.height);
      ctx.stroke();
      ctx.font = "12px sans-serif";
      let tickSpacing = 100;
      while (tickSpacing * scale < 50) {
        tickSpacing *= 2;
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let i = tickSpacing; i * scale < canvas.width; i += tickSpacing) {
        const [tickX] = worldToCanvas(i, 0);
        ctx.fillText(i, tickX, originY + 5);
      }
      for (let i = -tickSpacing; i * scale > -canvas.width; i -= tickSpacing) {
        const [tickX] = worldToCanvas(i, 0);
        ctx.fillText(i, tickX, originY + 5);
      }
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (let i = tickSpacing; i * scale < canvas.height; i += tickSpacing) {
        const [, tickY] = worldToCanvas(0, i);
        ctx.fillText(i, originX + 5, tickY);
      }
      for (let i = -tickSpacing; i * scale > -canvas.height; i -= tickSpacing) {
        const [, tickY] = worldToCanvas(0, i);
        ctx.fillText(i, originX + 5, tickY);
      }
    };
    drawTooltip = function (ctx, tooltip) {
      const { x, y, info } = tooltip;
      const lines = info.split("\n");
      const padding = 10;
      ctx.font = '14px "Microsoft JhengHei", sans-serif';
      let maxWidth = 0;
      lines.forEach((line) => {
        const width = ctx.measureText(line).width;
        if (width > maxWidth) maxWidth = width;
      });
      const boxWidth = maxWidth + 2 * padding;
      const boxHeight = lines.length * 20 + padding;
      const boxX = x + 15;
      const boxY = y - 20 - boxHeight;
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.strokeStyle = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--accent-color");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(boxX, boxY, boxWidth, boxHeight);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      lines.forEach((line, index) => {
        ctx.fillText(line, boxX + padding, boxY + padding + index * 20);
      });
    };
  })();

  function renderScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sceneData.interactiveElements = [];
    const { inputs, result, hitContext } = sceneData;
    if (!inputs) return;

    const { firingPos, targetInitialPos, targetPathData } = inputs;
    const targetPathEnd = targetPathData.coords[0];
    const allPoints = [firingPos, targetInitialPos, targetPathEnd, [0, 0]];
    if (result) allPoints.push(result.targetHitPos, result.impactPos);
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    allPoints.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    const worldWidth = Math.max(maxX - minX, 100);
    const worldHeight = Math.max(maxY - minY, 100);
    const worldCenterX = minX + worldWidth / 2;
    const worldCenterY = minY + worldHeight / 2;
    const padding = 60;
    const scale = Math.min(
      (canvas.width - 2 * padding) / worldWidth,
      (canvas.height - 2 * padding) / worldHeight
    );
    const worldToCanvas = (worldX, worldY) => [
      (worldX - worldCenterX) * scale + canvas.width / 2,
      -(worldY - worldCenterY) * scale + canvas.height / 2,
    ];

    drawGrid(ctx, worldToCanvas, canvas);
    drawAxes(ctx, worldToCanvas, canvas, scale);

    const R_eff_scaled = (inputs.targetRadius + inputs.arrowWidth / 2) * scale;

    // 註冊互動元素的輔助函式，現在使用更精準的 Hitbox
    function registerInteractiveElement(worldPos, info, textPos) {
      const metrics = ctx.measureText(info.label);
      const textHeight =
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      const textWidth = metrics.width;
      sceneData.interactiveElements.push({
        info,
        x: textPos[0],
        y: textPos[1],
        bounds: {
          left: textPos[0] - textWidth / 2,
          right: textPos[0] + textWidth / 2,
          top: textPos[1] - textHeight / 2,
          bottom: textPos[1] + textHeight / 2,
        },
      });
    }

    // 繪製元素...
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; // ⭐ 標準化對齊，簡化 Hitbox 計算
    ctx.font = `${Math.max(14, 12 * Math.sqrt(scale))}px sans-serif`;

    // 發射點
    const [shooterX, shooterY] = worldToCanvas(firingPos[0], firingPos[1]);
    const shooterLabelPos = [shooterX, shooterY - 20];
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      "--shooter-color"
    );
    ctx.beginPath();
    ctx.arc(shooterX, shooterY, Math.max(3, scale * 0.5), 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText("發射點 ✦", shooterLabelPos[0], shooterLabelPos[1]);
    registerInteractiveElement(
      firingPos,
      {
        label: "發射點 ✦",
        info: `發射點\n座標: [${firingPos[0].toFixed(
          1
        )}, ${firingPos[1].toFixed(1)}]`,
      },
      shooterLabelPos
    );

    // 目標起點
    const [t0X, t0Y] = worldToCanvas(targetInitialPos[0], targetInitialPos[1]);
    const t0LabelPos = [t0X, t0Y - R_eff_scaled - 15];
    ctx.strokeStyle = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--target-color");
    ctx.beginPath();
    ctx.arc(t0X, t0Y, R_eff_scaled, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fillText("目標起點 ✦", t0LabelPos[0], t0LabelPos[1]);
    registerInteractiveElement(
      targetInitialPos,
      {
        label: "目標起點 ✦",
        info: `目標起點 (T0)\n座標: [${targetInitialPos[0].toFixed(
          1
        )}, ${targetInitialPos[1].toFixed(1)}]`,
      },
      t0LabelPos
    );

    // 路徑終點
    const [tEndX, tEndY] = worldToCanvas(targetPathEnd[0], targetPathEnd[1]);
    const tEndLabelPos = [tEndX, tEndY - 15];
    ctx.strokeStyle = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--path-color");
    ctx.beginPath();
    ctx.arc(tEndX, tEndY, Math.max(2, scale * 0.4), 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fillText("路徑終點 ✦", tEndLabelPos[0], tEndLabelPos[1]);
    registerInteractiveElement(
      targetPathEnd,
      {
        label: "路徑終點 ✦",
        info: `路徑終點 (T_end)\n座標: [${targetPathEnd[0].toFixed(
          1
        )}, ${targetPathEnd[1].toFixed(1)}]`,
      },
      tEndLabelPos
    );

    // 結果
    if (result) {
      const [hitX, hitY] = worldToCanvas(
        result.targetHitPos[0],
        result.targetHitPos[1]
      );
      const [impactX, impactY] = worldToCanvas(
        result.impactPos[0],
        result.impactPos[1]
      );
      const hitLabelPos = [hitX, hitY - R_eff_scaled - 15];

      ctx.beginPath();
      ctx.strokeStyle = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--arrow-color");
      ctx.lineWidth = 2;
      ctx.moveTo(shooterX, shooterY);
      ctx.lineTo(impactX, impactY);
      ctx.stroke();
      ctx.lineWidth = 1;

      if (hitContext.type === "within_path") {
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "white";
        ctx.moveTo(t0X, t0Y);
        ctx.lineTo(hitX, hitY);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "white";
        ctx.moveTo(t0X, t0Y);
        ctx.lineTo(tEndX, tEndY);
        ctx.stroke();
        ctx.beginPath();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = "yellow";
        ctx.moveTo(tEndX, tEndY);
        ctx.lineTo(hitX, hitY);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.fillStyle = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--target-color");
      ctx.beginPath();
      ctx.arc(hitX, hitY, R_eff_scaled, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.fillText("命中點 ✦", hitLabelPos[0], hitLabelPos[1]);
      registerInteractiveElement(
        result.targetHitPos,
        {
          label: "命中點 ✦",
          info: `目標命中點 (HIT)\n座標: [${result.targetHitPos[0].toFixed(
            1
          )}, ${result.targetHitPos[1].toFixed(
            1
          )}]\n命中時間: ${result.hitTime.toFixed(3)}s`,
        },
        hitLabelPos
      );
    }

    if (sceneData.activeTooltip) {
      drawTooltip(ctx, sceneData.activeTooltip);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sceneData.inputs = {
      firingPos: [
        parseFloat(document.getElementById("firingPosX").value),
        parseFloat(document.getElementById("firingPosY").value),
      ],
      targetInitialPos: [
        parseFloat(document.getElementById("targetInitialPosX").value),
        parseFloat(document.getElementById("targetInitialPosY").value),
      ],
      targetPathData: {
        n: 1,
        coords: [
          [
            parseFloat(document.getElementById("targetPathEndX").value),
            parseFloat(document.getElementById("targetPathEndY").value),
          ],
        ],
        moveSpeed: parseFloat(document.getElementById("targetMoveSpeed").value),
      },
      arrowSpeed: parseFloat(document.getElementById("arrowSpeed").value),
      arrowDelay: parseFloat(document.getElementById("arrowDelay").value),
      targetRadius: parseFloat(document.getElementById("targetRadius").value),
      arrowWidth: parseFloat(document.getElementById("arrowWidth").value),
    };
    sceneData.result = calculateArrowIntercept_v2(
      sceneData.inputs.firingPos,
      sceneData.inputs.targetInitialPos,
      sceneData.inputs.targetPathData,
      sceneData.inputs.arrowSpeed,
      sceneData.inputs.arrowDelay,
      sceneData.inputs.targetRadius,
      sceneData.inputs.arrowWidth
    );

    let resultsHTML = "無法命中…請主人調整參數再試一次吧！";
    if (sceneData.result) {
      const { hitTime } = sceneData.result;
      const [xT0, yT0] = sceneData.inputs.targetInitialPos;
      const [xTEnd, yTEnd] = sceneData.inputs.targetPathData.coords[0];
      const moveSpeed = sceneData.inputs.targetPathData.moveSpeed;
      const dist_segment = Math.sqrt(
        Math.pow(xTEnd - xT0, 2) + Math.pow(yTEnd - yT0, 2)
      );
      const t_segment =
        moveSpeed > 1e-6 && dist_segment > 1e-6 ? dist_segment / moveSpeed : 0;
      if (hitTime <= t_segment || t_segment === 0) {
        sceneData.hitContext = { type: "within_path" };
        resultsHTML = `<b>命中成功！♡</b>\n<span style="color: var(--success-color);"><b>情境分析: 命中於計畫路徑內！</b></span>\n------------------------------------\n命中時間 (t_hit): ${hitTime.toFixed(
          4
        )} s\n計畫路徑時長: ${t_segment.toFixed(
          4
        )} s\n目標命中點座標: [${sceneData.result.targetHitPos[0].toFixed(
          2
        )}, ${sceneData.result.targetHitPos[1].toFixed(
          2
        )}]\n箭矢實際撞擊點: [${sceneData.result.impactPos[0].toFixed(
          2
        )}, ${sceneData.result.impactPos[1].toFixed(2)}]`;
      } else {
        const extended_time = hitTime - t_segment;
        const extended_dist = extended_time * moveSpeed;
        sceneData.hitContext = { type: "extended_path" };
        resultsHTML = `<b>命中成功！♡</b>\n<span style="color: var(--warning-color);"><b>情境分析: 成功在延伸軌跡上命中！</b></span>\n------------------------------------\n命中時間 (t_hit): ${hitTime.toFixed(
          4
        )} s\n計畫路徑時長: ${t_segment.toFixed(
          4
        )} s\n延伸時長: ${extended_time.toFixed(
          4
        )} s\n延伸距離: ${extended_dist.toFixed(
          2
        )}\n目標命中點座標: [${sceneData.result.targetHitPos[0].toFixed(
          2
        )}, ${sceneData.result.targetHitPos[1].toFixed(
          2
        )}]\n箭矢實際撞擊點: [${sceneData.result.impactPos[0].toFixed(
          2
        )}, ${sceneData.result.impactPos[1].toFixed(2)}]`;
      }
    } else {
      sceneData.hitContext = null;
    }
    resultsOutput.innerHTML = resultsHTML;
    sceneData.activeTooltip = null; // 每次重算都清除已打開的 tooltip
    renderScene();
  });

  // ⭐⭐ 全新的點擊事件監聽器！⭐⭐
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    canvas.style.cursor = "default";

    let foundElement = null;
    for (const element of sceneData.interactiveElements) {
      if (
        mouseX >= element.bounds.left &&
        mouseX <= element.bounds.right &&
        mouseY >= element.bounds.top &&
        mouseY <= element.bounds.bottom
      ) {
        foundElement = element;
        canvas.style.cursor = "pointer";
        break;
      }
    }

    if (foundElement) {
      // 如果點擊到的是當前已打開的 tooltip，就關掉它。否則就打開新的。
      if (
        sceneData.activeTooltip &&
        sceneData.activeTooltip.info.label === foundElement.info.label
      ) {
        sceneData.activeTooltip = null;
      } else {
        sceneData.activeTooltip = {
          x: foundElement.x,
          y: foundElement.y,
          info: foundElement.info.info,
        };
      }
    } else {
      // 如果點擊到空白處，就關掉任何已打開的 tooltip
      sceneData.activeTooltip = null;
    }
    renderScene();
  });

  // ⭐⭐ 懸停事件現在只用來改變鼠標樣式，更輕量 ⭐⭐
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    let onElement = false;
    for (const element of sceneData.interactiveElements) {
      if (
        mouseX >= element.bounds.left &&
        mouseX <= element.bounds.right &&
        mouseY >= element.bounds.top &&
        mouseY <= element.bounds.bottom
      ) {
        onElement = true;
        break;
      }
    }
    canvas.style.cursor = onElement ? "pointer" : "default";
  });

  form.dispatchEvent(new Event("submit"));
});

```
