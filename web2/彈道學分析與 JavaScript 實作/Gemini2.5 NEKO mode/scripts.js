// scripts.js
function initializeApp() {
    // KaTeX 渲染
    renderMathInElement(document.body, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\[', right: '\\]', display: true},
            {left: '\\(', right: '\\)', display: false}
        ]
    });

    // --- DOM 元素獲取 ---
    const form = document.getElementById('calculator-form');
    const resultsDiv = document.getElementById('results');
    const canvas = document.getElementById('trajectory-canvas');
    const ctx = canvas.getContext('2d');
    const movementRadios = document.querySelectorAll('input[name="target-movement"]');
    const movementParamsDiv = document.getElementById('movement-params');
    const resetButton = document.getElementById('reset-button');
    const tooltip = document.getElementById('tooltip');
    
    // --- 全域變數 ---
    let interactiveObjects = []; // 儲存可互動物件的資訊
    const defaultValues = {
        'fire-x': 0, 'fire-y': 0, 'target-x': 80, 'target-y': 50,
        'target-radius': 10, 'target-path-x': 80, 'target-path-y': 150,
        'target-speed': 15, 'arrow-speed': 100, 'arrow-delay': 0.2, 'arrow-width': 2
    };

    // --- 核心計算函式 (與之前相同) ---
    function calculateArrowIntercept(firingPos, targetInitialPos, targetPathData, arrowSpeed, arrowDelay, targetRadius, arrowWidth) {
        // ... (此處省略未變更的 calculateArrowIntercept 函式程式碼)
        const xF = firingPos[0], yF = firingPos[1];
        const xT0 = targetInitialPos[0], yT0 = targetInitialPos[1];
        const n = targetPathData.n;
        const R_eff = targetRadius + arrowWidth / 2;
        let vTx = 0.0, vTy = 0.0;

        if (n === 1) {
            const x_path1 = targetPathData.coords[0][0], y_path1 = targetPathData.coords[0][1];
            const moveSpeed = targetPathData.moveSpeed;
            const D_segment = Math.sqrt(Math.pow(x_path1 - xT0, 2) + Math.pow(y_path1 - yT0, 2));
            if (D_segment > 1e-9) {
                vTx = (x_path1 - xT0) / D_segment * moveSpeed;
                vTy = (y_path1 - yT0) / D_segment * moveSpeed;
            }
        }

        const d_initial_x = xT0 - xF, d_initial_y = yT0 - yF;
        const A = (vTx * vTx + vTy * vTy) - (arrowSpeed * arrowSpeed);
        const B = 2 * (d_initial_x * vTx + d_initial_y * vTy - arrowSpeed * arrowSpeed * arrowDelay);
        const C = (d_initial_x * d_initial_x + d_initial_y * d_initial_y) - (arrowSpeed * arrowSpeed * arrowDelay * arrowDelay) - (R_eff * R_eff);

        let hitTimes = [];
        const EPSILON = 1e-9;

        if (Math.abs(A) < EPSILON) {
            if (Math.abs(B) < EPSILON) { return null; }
            else { hitTimes.push(-C / B); }
        } else {
            const discriminant = B * B - 4 * A * C;
            if (discriminant < 0) { return null; }
            hitTimes.push((-B + Math.sqrt(discriminant)) / (2 * A), (-B - Math.sqrt(discriminant)) / (2 * A));
        }

        let t_hit = Number.POSITIVE_INFINITY;
        for (const t_candidate of hitTimes) {
            if (t_candidate > arrowDelay - EPSILON && t_candidate >= 0) {
                t_hit = Math.min(t_hit, t_candidate);
            }
        }

        if (t_hit === Number.POSITIVE_INFINITY) return null;

        const finalHitTime = t_hit;
        const targetHitX = xT0 + vTx * finalHitTime, targetHitY = yT0 + vTy * finalHitTime;
        const D_proj_flight = arrowSpeed * (finalHitTime - arrowDelay);
        const L_between_centers_x = targetHitX - xF;
        const L_between_centers_y = targetHitY - yF;
        const d = Math.sqrt(L_between_centers_x * L_between_centers_x + L_between_centers_y * L_between_centers_y);
        
        const a = (D_proj_flight * D_proj_flight - R_eff * R_eff + d * d) / (2 * d);
        const h = Math.sqrt(Math.max(0, D_proj_flight * D_proj_flight - a * a));
        const p2x = xF + a * L_between_centers_x / d;
        const p2y = yF + a * L_between_centers_y / d;
        const impactPosX = p2x + h * L_between_centers_y / d;
        const impactPosY = p2y - h * L_between_centers_x / d;
        
        return {
            hitTime: finalHitTime,
            targetHitPos: [targetHitX, targetHitY],
            impactPos: [impactPosX, impactPosY]
        };
    }

    // --- 事件監聽器 ---
    movementRadios.forEach(radio => radio.addEventListener('change', (e) => {
        movementParamsDiv.style.display = e.target.value === '1' ? 'grid' : 'none';
    }));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        runSimulation();
    });

    resetButton.addEventListener('click', () => {
        for(const id in defaultValues) {
            document.getElementById(id).value = defaultValues[id];
        }
        document.querySelector('input[name="target-movement"][value="0"]').checked = true;
        movementParamsDiv.style.display = 'none';
        resultsDiv.className = 'results-info';
        resultsDiv.textContent = '參數已重設為預設值。';
        runSimulation();
    });
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);


    // --- 主要模擬與繪圖邏輯 ---
    function runSimulation() {
        const validationError = validateInputs();
        if (validationError) {
            resultsDiv.className = 'results-error';
            resultsDiv.textContent = validationError;
            clearCanvas();
            return;
        }

        const inputs = getInputs();
        const result = calculateArrowIntercept(inputs.firingPos, inputs.targetInitialPos, inputs.targetPathData, inputs.arrowSpeed, inputs.arrowDelay, inputs.targetRadius, inputs.arrowWidth);

        if (result) {
            resultsDiv.className = 'results-success';
            resultsDiv.textContent = `命中成功！\n命中時間 (t_hit): ${result.hitTime.toFixed(4)} 秒\n目標命中座標: [${result.targetHitPos[0].toFixed(2)}, ${result.targetHitPos[1].toFixed(2)}]\n實際撞擊點: [${result.impactPos[0].toFixed(2)}, ${result.impactPos[1].toFixed(2)}]`;
            drawVisualization(inputs, result);
        } else {
            resultsDiv.className = 'results-error';
            resultsDiv.textContent = '計算失敗：無法命中目標。';
            clearCanvas();
        }
    }

    // --- 輔助函式 (輸入, 驗證, 繪圖等) ---
    function getInputs() {
        const firingPos = [parseFloat(document.getElementById('fire-x').value), parseFloat(document.getElementById('fire-y').value)];
        const targetInitialPos = [parseFloat(document.getElementById('target-x').value), parseFloat(document.getElementById('target-y').value)];
        const targetRadius = parseFloat(document.getElementById('target-radius').value);
        const n = parseInt(document.querySelector('input[name="target-movement"]:checked').value);
        let targetPathData = { n };
        if (n === 1) {
            targetPathData.coords = [[parseFloat(document.getElementById('target-path-x').value), parseFloat(document.getElementById('target-path-y').value)]];
            targetPathData.moveSpeed = parseFloat(document.getElementById('target-speed').value);
        }
        const arrowSpeed = parseFloat(document.getElementById('arrow-speed').value);
        const arrowDelay = parseFloat(document.getElementById('arrow-delay').value);
        const arrowWidth = parseFloat(document.getElementById('arrow-width').value);
        return { firingPos, targetInitialPos, targetRadius, targetPathData, arrowSpeed, arrowDelay, arrowWidth };
    }
    
    function validateInputs() {
        // ... (此處省略未變更的 validateInputs 函式程式碼)
        const fields = {
            'fire-x': '發射者 座標 X', 'fire-y': '發射者 座標 Y', 'target-x': '目標 初始座標 X', 'target-y': '目標 初始座標 Y',
            'target-radius': '目標 半徑 (r)', 'arrow-speed': '箭矢 速度 (S_arrow)', 'arrow-delay': '箭矢 發射延遲 (D_delay)', 'arrow-width': '箭矢 寬度 (width)'
        };
        if (document.querySelector('input[name="target-movement"]:checked').value === '1') {
            fields['target-path-x'] = '目標 路徑點 X';
            fields['target-path-y'] = '目標 路徑點 Y';
            fields['target-speed'] = '目標 移動速度';
        }

        for (const id in fields) {
            const inputElement = document.getElementById(id);
            const value = inputElement.value;
            if (value === '') return `輸入錯誤：欄位 "${fields[id]}" 不可為空。`;
            if (isNaN(parseFloat(value))) return `輸入錯誤：欄位 "${fields[id]}" 必須是有效的數字。`;
        }
        
        if (parseFloat(document.getElementById('arrow-speed').value) <= 0) { return "輸入錯誤：箭矢速度必須是正數。"; }
        if (parseFloat(document.getElementById('target-radius').value) < 0) { return "輸入錯誤：目標半徑不能為負數。"; }
        if (document.querySelector('input[name="target-movement"]:checked').value === '1' && parseFloat(document.getElementById('target-speed').value) < 0) {
             return "輸入錯誤：目標移動速度不能為負數。";
        }
        return null;
    }

    function clearCanvas() {
        ctx.fillStyle = '#0d121c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 喵娜的座標軸繪製魔法！♡
    function drawGridAndAxes(toCanvasX, toCanvasY, minX, maxX, minY, maxY) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const worldWidth = maxX - minX;
        const tickSpacing = Math.pow(10, Math.floor(Math.log10(worldWidth)) - 1) * 5;

        // 繪製垂直網格線和X軸刻度
        for (let x = Math.ceil(minX / tickSpacing) * tickSpacing; x <= maxX; x += tickSpacing) {
            const canvasX = toCanvasX(x);
            ctx.beginPath();
            ctx.moveTo(canvasX, 0);
            ctx.lineTo(canvasX, canvas.height);
            ctx.stroke();
            ctx.fillText(x.toFixed(0), canvasX, toCanvasY(minY) - 10);
        }
        
        // 繪製水平網格線和Y軸刻度
        for (let y = Math.ceil(minY / tickSpacing) * tickSpacing; y <= maxY; y += tickSpacing) {
            const canvasY = toCanvasY(y);
            ctx.beginPath();
            ctx.moveTo(0, canvasY);
            ctx.lineTo(canvas.width, canvasY);
            ctx.stroke();
            ctx.fillText(y.toFixed(0), toCanvasX(minX) + 20, canvasY);
        }
        
        // 繪製主座標軸
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        // Y軸 (x=0)
        if (minX < 0 && maxX > 0) {
            const yAxisX = toCanvasX(0);
            ctx.beginPath(); ctx.moveTo(yAxisX, 0); ctx.lineTo(yAxisX, canvas.height); ctx.stroke();
        }
        // X軸 (y=0)
        if (minY < 0 && maxY > 0) {
            const xAxisY = toCanvasY(0);
            ctx.beginPath(); ctx.moveTo(0, xAxisY); ctx.lineTo(canvas.width, xAxisY); ctx.stroke();
        }
    }

    function drawVisualization(inputs, result) {
        clearCanvas();
        interactiveObjects = []; // 清空可互動物件列表
        const computedStyles = window.getComputedStyle(document.body);
        const accentColor = computedStyles.getPropertyValue('--accent-color').trim();
        const errorColor = computedStyles.getPropertyValue('--error-color').trim();
        const successColor = computedStyles.getPropertyValue('--success-color').trim();
        const warnColor = computedStyles.getPropertyValue('--warn-color').trim();

        const allPoints = [ inputs.firingPos, inputs.targetInitialPos, result.targetHitPos, result.impactPos ];
        if(inputs.targetPathData.n === 1) { allPoints.push(inputs.targetPathData.coords[0]); }

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        allPoints.forEach(p => {
            minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
            minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
        });
        
        const padding = Math.max((maxX - minX) * 0.15, (maxY - minY) * 0.15, inputs.targetRadius * 1.5, 20);
        minX -= padding; maxX += padding; minY -= padding; maxY += padding;
        if(minX === maxX) { minX -=10; maxX +=10; }
        if(minY === maxY) { minY -=10; maxY +=10; }
        
        const worldWidth = maxX - minX, worldHeight = maxY - minY;
        const scale = Math.min(canvas.width / worldWidth, canvas.height / worldHeight);

        const toCanvasX = (worldX) => (worldX - minX) * scale;
        const toCanvasY = (worldY) => canvas.height - (worldY - minY) * scale;

        // --- 繪製座標軸和網格 ---
        drawGridAndAxes(toCanvasX, toCanvasY, minX, maxX, minY, maxY);

        // --- 座標轉換 ---
        const firePosC = {x: toCanvasX(inputs.firingPos[0]), y: toCanvasY(inputs.firingPos[1])};
        const targetInitialPosC = {x: toCanvasX(inputs.targetInitialPos[0]), y: toCanvasY(inputs.targetInitialPos[1])};
        const targetHitPosC = {x: toCanvasX(result.targetHitPos[0]), y: toCanvasY(result.targetHitPos[1])};
        const impactPosC = {x: toCanvasX(result.impactPos[0]), y: toCanvasY(result.impactPos[1])};
        const targetRadiusC = Math.max(2, inputs.targetRadius * scale);
        
        // --- 繪製模擬物件 ---
        // 目標移動路徑
        if (inputs.targetPathData.n === 1) {
            ctx.beginPath(); ctx.moveTo(targetInitialPosC.x, targetInitialPosC.y);
            ctx.lineTo(targetHitPosC.x, targetHitPosC.y);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.setLineDash([5, 5]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        }
        // 箭矢路徑
        ctx.beginPath(); ctx.moveTo(firePosC.x, firePosC.y);
        ctx.lineTo(impactPosC.x, impactPosC.y);
        ctx.strokeStyle = errorColor; ctx.lineWidth = 2; ctx.stroke();
        // 初始目標
        ctx.beginPath(); ctx.arc(targetInitialPosC.x, targetInitialPosC.y, targetRadiusC, 0, 2 * Math.PI);
        ctx.strokeStyle = accentColor + '80'; ctx.lineWidth = 2; ctx.stroke();
        // 命中目標
        ctx.beginPath(); ctx.arc(targetHitPosC.x, targetHitPosC.y, targetRadiusC, 0, 2 * Math.PI);
        ctx.fillStyle = accentColor + '80'; ctx.fill();
        ctx.strokeStyle = accentColor; ctx.stroke();
        // 發射者
        ctx.beginPath(); ctx.arc(firePosC.x, firePosC.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = successColor; ctx.fill();
        // 撞擊點
        ctx.beginPath();
        ctx.moveTo(impactPosC.x - 5, impactPosC.y - 5); ctx.lineTo(impactPosC.x + 5, impactPosC.y + 5);
        ctx.moveTo(impactPosC.x - 5, impactPosC.y + 5); ctx.lineTo(impactPosC.x + 5, impactPosC.y - 5);
        ctx.strokeStyle = warnColor; ctx.lineWidth = 2; ctx.stroke();
        
        // --- 填充可互動物件列表 ---
        interactiveObjects.push({
            type: 'Shooter', x: firePosC.x, y: firePosC.y, radius: 10,
            data: { ...inputs, ...result }
        });
        interactiveObjects.push({
            type: 'Target (Initial)', x: targetInitialPosC.x, y: targetInitialPosC.y, radius: targetRadiusC,
            data: { ...inputs, ...result }
        });
        interactiveObjects.push({
            type: 'Target (Hit)', x: targetHitPosC.x, y: targetHitPosC.y, radius: targetRadiusC,
            data: { ...inputs, ...result }
        });
        interactiveObjects.push({
            type: 'Impact Point', x: impactPosC.x, y: impactPosC.y, radius: 10,
            data: { ...inputs, ...result }
        });
    }

    // --- Tooltip 互動邏輯 ---
    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let hoveredObject = null;
        for (let i = interactiveObjects.length - 1; i >= 0; i--) {
            const obj = interactiveObjects[i];
            const dx = mouseX - obj.x;
            const dy = mouseY - obj.y;
            if (dx * dx + dy * dy < obj.radius * obj.radius) {
                hoveredObject = obj;
                break;
            }
        }

        if (hoveredObject) {
            tooltip.style.display = 'block';
            tooltip.innerHTML = formatTooltip(hoveredObject.type, hoveredObject.data);
            
            // 智慧定位 Tooltip
            const tooltipRect = tooltip.getBoundingClientRect();
            let newX = e.clientX + 15;
            let newY = e.clientY + 15;
            if (newX + tooltipRect.width > window.innerWidth) {
                newX = e.clientX - tooltipRect.width - 15;
            }
            if (newY + tooltipRect.height > window.innerHeight) {
                newY = e.clientY - tooltipRect.height - 15;
            }
            tooltip.style.left = `${newX}px`;
            tooltip.style.top = `${newY}px`;
            
        } else {
            tooltip.style.display = 'none';
        }
    }

    function handleMouseOut() {
        tooltip.style.display = 'none';
    }
    
    function formatTooltip(type, data) {
        let content = `<strong>${type}</strong>\n`;
        switch(type) {
            case 'Shooter':
                content += `座標: [${data.firingPos[0].toFixed(2)}, ${data.firingPos[1].toFixed(2)}]`;
                break;
            case 'Target (Initial)':
                content += `初始座標: [${data.targetInitialPos[0].toFixed(2)}, ${data.targetInitialPos[1].toFixed(2)}]\n`;
                content += `半徑 (r): ${data.targetRadius.toFixed(2)}`;
                break;
            case 'Target (Hit)':
                content += `命中座標: [${data.targetHitPos[0].toFixed(2)}, ${data.targetHitPos[1].toFixed(2)}]\n`;
                content += `命中時間: ${data.hitTime.toFixed(4)} s`;
                break;
            case 'Impact Point':
                content += `撞擊點座標: [${data.impactPos[0].toFixed(2)}, ${data.impactPos[1].toFixed(2)}]`;
                break;
        }
        return content;
    }

    // 初始運行
    runSimulation();
}