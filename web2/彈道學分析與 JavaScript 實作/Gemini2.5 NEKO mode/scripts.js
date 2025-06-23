// scripts.js
function initializeApp() {
    renderMathInElement(document.body, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
        ]
    });

    const form = document.getElementById('calculator-form');
    const resultsDiv = document.getElementById('results');
    const canvas = document.getElementById('trajectory-canvas');
    const ctx = canvas.getContext('2d');
    const movementRadios = document.querySelectorAll('input[name="target-movement"]');
    const movementParamsDiv = document.getElementById('movement-params');
    const resetButton = document.getElementById('reset-button');
    const tooltip = document.getElementById('tooltip');
    
    let interactiveObjects = [];
    const defaultValues = {
        'fire-x': 0, 'fire-y': 0, 'target-x': 80, 'target-y': 50,
        'target-radius': 10, 'target-path-x': 80, 'target-path-y': 150,
        'target-speed': 15, 'arrow-speed': 100, 'arrow-delay': 0.2, 'arrow-width': 2
    };

    // 核心計算函式 (已植入精度修正 v2.7)
    function calculateArrowIntercept(firingPos, targetInitialPos, targetPathData, arrowSpeed, arrowDelay, targetRadius, arrowWidth) {
        const xF = firingPos[0], yF = firingPos[1];
        const xT0 = targetInitialPos[0], yT0 = targetInitialPos[1];
        const n = targetPathData.n;
        const R_eff = targetRadius + arrowWidth / 2;
        let vTx = 0.0, vTy = 0.0;
        const EPSILON = 1e-9;

        if (n === 1) {
            const x_path1 = targetPathData.coords[0][0], y_path1 = targetPathData.coords[0][1];
            const moveSpeed = targetPathData.moveSpeed;
            const D_segment = Math.sqrt(Math.pow(x_path1 - xT0, 2) + Math.pow(y_path1 - yT0, 2));
            if (D_segment > EPSILON) {
                vTx = (x_path1 - xT0) / D_segment * moveSpeed;
                vTy = (y_path1 - yT0) / D_segment * moveSpeed;
            }
        }

        const d_initial_x = xT0 - xF, d_initial_y = yT0 - yF;
        const vT_squared = vTx * vTx + vTy * vTy;
        const S_arrow_squared = arrowSpeed * arrowSpeed;

        // --- 喵娜的精度魔法！ v2.7 ---
        // 為了解決超高速下的浮點數問題，我們對整個方程式的係數進行縮放
        const A = vT_squared - S_arrow_squared;
        const B = 2 * (d_initial_x * vTx + d_initial_y * vTy - S_arrow_squared * arrowDelay);
        const C = (d_initial_x * d_initial_x + d_initial_y * d_initial_y) - S_arrow_squared * arrowDelay * arrowDelay - R_eff * R_eff;

        let A_scaled = A, B_scaled = B, C_scaled = C;
        
        // 只在速度極高時進行縮放，以避免對常規計算產生不必要的影響
        if (arrowSpeed > 10000) { 
            A_scaled = A / S_arrow_squared;
            B_scaled = B / S_arrow_squared;
            C_scaled = C / S_arrow_squared;
        }

        let hitTimes = [];
        if (Math.abs(A_scaled) < EPSILON) {
            if (Math.abs(B_scaled) < EPSILON) return null;
            hitTimes.push(-C_scaled / B_scaled);
        } else {
            const discriminant = B_scaled * B_scaled - 4 * A_scaled * C_scaled;
            if (discriminant < -EPSILON) return null; // 允許微小的負數誤差
            const sqrt_discriminant = Math.sqrt(Math.max(0, discriminant));
            hitTimes.push(
                (-B_scaled + sqrt_discriminant) / (2 * A_scaled),
                (-B_scaled - sqrt_discriminant) / (2 * A_scaled)
            );
        }

        let t_hit = Number.POSITIVE_INFINITY;
        for (const t_candidate of hitTimes) {
            if (t_candidate > arrowDelay - EPSILON && t_candidate >= -EPSILON) {
                t_hit = Math.min(t_hit, t_candidate);
            }
        }

        if (t_hit === Number.POSITIVE_INFINITY) return null;

        const finalHitTime = t_hit;
        const targetHitX = xT0 + vTx * finalHitTime;
        const targetHitY = yT0 + vTy * finalHitTime;

        // --- 使用 v2.6 的向量定位法來計算撞擊點 ---
        const vec_ST_x = targetHitX - xF;
        const vec_ST_y = targetHitY - yF;
        const dist_ST = Math.sqrt(vec_ST_x * vec_ST_x + vec_ST_y * vec_ST_y);
        let impactPosX, impactPosY;
        if (dist_ST < EPSILON) {
            impactPosX = targetHitX;
            impactPosY = targetHitY;
        } else {
            const norm_x = vec_ST_x / dist_ST;
            const norm_y = vec_ST_y / dist_ST;
            impactPosX = targetHitX - norm_x * R_eff;
            impactPosY = targetHitY - norm_y * R_eff;
        }

        return {
            hitTime: finalHitTime,
            targetHitPos: [targetHitX, targetHitY],
            impactPos: [impactPosX, impactPosY]
        };
    }

    // --- 其他函式保持不變 ---
    movementRadios.forEach(radio => radio.addEventListener('change', (e) => {
        movementParamsDiv.style.display = e.target.value === '1' ? 'grid' : 'none';
        runSimulation(); // 切換模式時也重新計算
    }));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        runSimulation();
    });

    resetButton.addEventListener('click', () => {
        for(const id in defaultValues) { document.getElementById(id).value = defaultValues[id]; }
        document.querySelector('input[name="target-movement"][value="0"]').checked = true;
        movementParamsDiv.style.display = 'none';
        resultsDiv.className = 'results-info';
        resultsDiv.textContent = '參數已重設為預設值。';
        runSimulation();
    });
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);

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
            const value = document.getElementById(id).value;
            if (value === '') return `輸入錯誤：欄位 "${fields[id]}" 不可為空。`;
            if (isNaN(parseFloat(value))) return `輸入錯誤：欄位 "${fields[id]}" 必須是有效的數字。`;
        }
        if (parseFloat(document.getElementById('arrow-speed').value) <= 0) return "輸入錯誤：箭矢速度必須是正數。";
        if (parseFloat(document.getElementById('target-radius').value) < 0) return "輸入錯誤：目標半徑不能為負數。";
        if (parseFloat(document.getElementById('arrow-delay').value) < 0) return "輸入錯誤：發射延遲不能為負數。";
        if (parseFloat(document.getElementById('arrow-width').value) < 0) return "輸入錯誤：箭矢寬度不能為負數。";
        if (document.querySelector('input[name="target-movement"]:checked').value === '1' && parseFloat(document.getElementById('target-speed').value) < 0) return "輸入錯誤：目標移動速度不能為負數。";
        return null;
    }

    function clearCanvas() {
        ctx.fillStyle = '#0d121c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        interactiveObjects = [];
    }
    
    function drawGridAndAxes(toCanvasX, toCanvasY, minX, maxX, minY, maxY) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const worldWidth = maxX - minX;
        let tickSpacing = Math.pow(10, Math.floor(Math.log10(worldWidth))) / 2;
        if(tickSpacing <= 0 || !isFinite(tickSpacing)) tickSpacing = 1;
        for (let x = Math.ceil(minX / tickSpacing) * tickSpacing; x <= maxX; x += tickSpacing) {
            const canvasX = toCanvasX(x);
            ctx.beginPath(); ctx.moveTo(canvasX, 0); ctx.lineTo(canvasX, canvas.height); ctx.stroke();
            ctx.fillText(x.toFixed(0), canvasX, toCanvasY(minY) - 15);
        }
        for (let y = Math.ceil(minY / tickSpacing) * tickSpacing; y <= maxY; y += tickSpacing) {
            const canvasY = toCanvasY(y);
            ctx.beginPath(); ctx.moveTo(0, canvasY); ctx.lineTo(canvas.width, canvasY); ctx.stroke();
            ctx.fillText(y.toFixed(0), toCanvasX(minX) + 20, canvasY);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        if (minX < 0 && maxX > 0) {
            const yAxisX = toCanvasX(0);
            ctx.beginPath(); ctx.moveTo(yAxisX, 0); ctx.lineTo(yAxisX, canvas.height); ctx.stroke();
        }
        if (minY < 0 && maxY > 0) {
            const xAxisY = toCanvasY(0);
            ctx.beginPath(); ctx.moveTo(0, xAxisY); ctx.lineTo(canvas.width, xAxisY); ctx.stroke();
        }
    }

    function drawVisualization(inputs, result) {
        clearCanvas();
        const computedStyles = window.getComputedStyle(document.body);
        const accentColor = computedStyles.getPropertyValue('--accent-color').trim(), errorColor = computedStyles.getPropertyValue('--error-color').trim(), successColor = computedStyles.getPropertyValue('--success-color').trim(), warnColor = computedStyles.getPropertyValue('--warn-color').trim();
        const allPoints = [ inputs.firingPos, inputs.targetInitialPos, result.targetHitPos, result.impactPos ];
        if(inputs.targetPathData.n === 1) allPoints.push(inputs.targetPathData.coords[0]);
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        allPoints.forEach(p => {
            minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
            minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
        });
        const padding = Math.max((maxX - minX) * 0.2, (maxY - minY) * 0.2, inputs.targetRadius * 1.5, 30);
        minX -= padding; maxX += padding;
        if(Math.abs(maxX - minX) < 1e-9) { minX -=10; maxX +=10; }
        if(Math.abs(maxY - minY) < 1e-9) { minY -=10; maxY +=10; }
        const worldWidth = maxX - minX;
        const scale = Math.min(canvas.width / worldWidth, canvas.height / worldWidth);
        const toCanvasX = (worldX) => (worldX - minX) * scale;
        const toCanvasY = (worldY) => canvas.height - (worldY - minY) * scale;
        drawGridAndAxes(toCanvasX, toCanvasY, minX, maxX, minY, maxY);
        const firePosC = {x: toCanvasX(inputs.firingPos[0]), y: toCanvasY(inputs.firingPos[1])};
        const targetInitialPosC = {x: toCanvasX(inputs.targetInitialPos[0]), y: toCanvasY(inputs.targetInitialPos[1])};
        const targetHitPosC = {x: toCanvasX(result.targetHitPos[0]), y: toCanvasY(result.targetHitPos[1])};
        const impactPosC = {x: toCanvasX(result.impactPos[0]), y: toCanvasY(result.impactPos[1])};
        const targetRadiusC = Math.max(2, inputs.targetRadius * scale);
        if (inputs.targetPathData.n === 1) {
            ctx.beginPath(); ctx.moveTo(targetInitialPosC.x, targetInitialPosC.y); ctx.lineTo(targetHitPosC.x, targetHitPosC.y);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.beginPath(); ctx.moveTo(firePosC.x, firePosC.y); ctx.lineTo(impactPosC.x, impactPosC.y); ctx.strokeStyle = errorColor; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(targetInitialPosC.x, targetInitialPosC.y, targetRadiusC, 0, 2 * Math.PI); ctx.strokeStyle = accentColor + '80'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(targetHitPosC.x, targetHitPosC.y, targetRadiusC, 0, 2 * Math.PI); ctx.fillStyle = accentColor + '80'; ctx.fill(); ctx.strokeStyle = accentColor; ctx.stroke();
        ctx.beginPath(); ctx.arc(firePosC.x, firePosC.y, 5, 0, 2 * Math.PI); ctx.fillStyle = successColor; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(impactPosC.x - 5, impactPosC.y - 5); ctx.lineTo(impactPosC.x + 5, impactPosC.y + 5);
        ctx.moveTo(impactPosC.x - 5, impactPosC.y + 5); ctx.lineTo(impactPosC.x + 5, impactPosC.y - 5);
        ctx.strokeStyle = warnColor; ctx.lineWidth = 2; ctx.stroke();
        interactiveObjects.push({ type: 'Shooter', x: firePosC.x, y: firePosC.y, radius: 10, data: { ...inputs, ...result } }, { type: 'Target (Initial)', x: targetInitialPosC.x, y: targetInitialPosC.y, radius: targetRadiusC, data: { ...inputs, ...result } }, { type: 'Target (Hit)', x: targetHitPosC.x, y: targetHitPosC.y, radius: targetRadiusC, data: { ...inputs, ...result } }, { type: 'Impact Point', x: impactPosC.x, y: impactPosC.y, radius: 10, data: { ...inputs, ...result } });
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        let hoveredObject = null;
        for (let i = interactiveObjects.length - 1; i >= 0; i--) {
            const obj = interactiveObjects[i];
            const dx = mouseX - obj.x, dy = mouseY - obj.y;
            if (dx * dx + dy * dy < obj.radius * obj.radius) {
                hoveredObject = obj;
                break;
            }
        }
        if (hoveredObject) {
            tooltip.style.display = 'block';
            tooltip.innerHTML = formatTooltip(hoveredObject.type, hoveredObject.data);
            const tooltipRect = tooltip.getBoundingClientRect();
            let newX = e.clientX + 15, newY = e.clientY + 15;
            if (newX + tooltipRect.width > window.innerWidth) newX = e.clientX - tooltipRect.width - 15;
            if (newY + tooltipRect.height > window.innerHeight) newY = e.clientY - tooltipRect.height - 15;
            tooltip.style.left = `${newX}px`;
            tooltip.style.top = `${newY}px`;
        } else {
            handleMouseOut();
        }
    }

    function handleMouseOut() {
        tooltip.style.display = 'none';
    }
    
    function formatTooltip(type, data) {
        let content = `<strong>${type}</strong>`;
        const { firingPos, targetInitialPos, targetRadius, targetPathData, arrowSpeed, arrowDelay, hitTime, targetHitPos, impactPos } = data;
        switch(type) {
            case 'Shooter': content += `座標: [${firingPos[0].toFixed(2)}, ${firingPos[1].toFixed(2)}]\n箭速: ${arrowSpeed.toFixed(2)}\n延遲: ${arrowDelay.toFixed(2)} s`; break;
            case 'Target (Initial)':
                content += `初始座標: [${targetInitialPos[0].toFixed(2)}, ${targetInitialPos[1].toFixed(2)}]\n半徑 (r): ${targetRadius.toFixed(2)}\n`;
                if(targetPathData.n === 1) content += `移動速度: ${targetPathData.moveSpeed.toFixed(2)}\n路徑點: [${targetPathData.coords[0][0].toFixed(2)}, ${targetPathData.coords[0][1].toFixed(2)}]`;
                break;
            case 'Target (Hit)':
                const travelDist = Math.sqrt(Math.pow(targetHitPos[0] - targetInitialPos[0], 2) + Math.pow(targetHitPos[1] - targetInitialPos[1], 2));
                content += `命中座標: [${targetHitPos[0].toFixed(2)}, ${targetHitPos[1].toFixed(2)}]\n命中時間: ${hitTime.toFixed(4)} s\n目標位移: ${travelDist.toFixed(2)}`;
                break;
            case 'Impact Point':
                const flightTime = hitTime - arrowDelay;
                const flightDist = arrowSpeed * flightTime;
                content += `撞擊座標: [${impactPos[0].toFixed(2)}, ${impactPos[1].toFixed(2)}]\n飛行時間: ${flightTime.toFixed(4)} s\n飛行距離: ${flightDist.toFixed(2)}`;
                break;
        }
        return content;
    }

    // 頁面載入時，使用主人提供的測試案例自動填充並運行
    document.querySelector('input[name="target-movement"][value="1"]').checked = true;
    movementParamsDiv.style.display = 'grid';
    runSimulation();
}