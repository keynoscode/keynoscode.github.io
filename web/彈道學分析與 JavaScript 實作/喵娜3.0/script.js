// 喵嗚！♡ 歡迎來到我們道場的心臟 v2.4！
// 這次我們修正了 Hitbox，並將互動模式從「懸停」進化為更穩定的「點擊」！

document.addEventListener('DOMContentLoaded', () => {
    // 核心計算函式 v2.0 維持不變
    function calculateArrowIntercept_v2(firingPos, targetInitialPos, targetPathData, arrowSpeed, arrowDelay, targetRadius, arrowWidth) {
        const EPSILON = 1e-6; if (arrowSpeed < EPSILON) return null;
        const [xF, yF] = firingPos; const [xT0, yT0] = targetInitialPos;
        const { n, coords, moveSpeed } = targetPathData;
        const R_eff = targetRadius + arrowWidth / 2;
        let vTx = 0.0, vTy = 0.0;
        if (n === 1 && moveSpeed > EPSILON) {
            const [x_path1, y_path1] = coords[0];
            const D_segment = Math.sqrt(Math.pow(x_path1 - xT0, 2) + Math.pow(y_path1 - yT0, 2));
            if (D_segment > EPSILON) { vTx = (x_path1 - xT0) / D_segment * moveSpeed; vTy = (y_path1 - yT0) / D_segment * moveSpeed; }
        }
        const d_initial_x = xT0 - xF; const d_initial_y = yT0 - yF;
        const d_dot_v = d_initial_x * vTx + d_initial_y * vTy;
        const d_sq = d_initial_x * d_initial_x + d_initial_y * d_initial_y;
        const v_sq = vTx * vTx + vTy * vTy;
        const inv_arrowSpeed_sq = 1 / (arrowSpeed * arrowSpeed);
        const R_eff_over_S = R_eff / arrowSpeed;
        const A_prime = v_sq * inv_arrowSpeed_sq - 1;
        const B_prime = 2 * (d_dot_v * inv_arrowSpeed_sq + arrowDelay + R_eff_over_S);
        const C_prime = d_sq * inv_arrowSpeed_sq - Math.pow(arrowDelay + R_eff_over_S, 2);
        let solutions = [];
        if (Math.abs(A_prime) < EPSILON) {
            if (Math.abs(B_prime) > EPSILON) solutions.push(-C_prime / B_prime);
        } else {
            const discriminant = B_prime * B_prime - 4 * A_prime * C_prime;
            if (discriminant >= 0) {
                const sqrt_discriminant = Math.sqrt(discriminant);
                solutions.push((-B_prime + sqrt_discriminant) / (2 * A_prime));
                solutions.push((-B_prime - sqrt_discriminant) / (2 * A_prime));
            }
        }
        let t_hit = Number.POSITIVE_INFINITY;
        for (const t of solutions) {
            if (t < t_hit && t > arrowDelay - EPSILON) { if (arrowSpeed * (t - arrowDelay) >= R_eff - EPSILON) { t_hit = t; } }
        }
        if (t_hit === Number.POSITIVE_INFINITY) return null;
        const targetHitX = xT0 + vTx * t_hit; const targetHitY = yT0 + vTy * t_hit;
        const finalTargetHitPos = [targetHitX, targetHitY];
        const shooter_to_target_hit_x = targetHitX - xF; const shooter_to_target_hit_y = targetHitY - yF;
        const dist_shooter_to_target_hit = Math.sqrt(shooter_to_target_hit_x * shooter_to_target_hit_x + shooter_to_target_hit_y * shooter_to_target_hit_y);
        let impactPosX, impactPosY;
        if (dist_shooter_to_target_hit < EPSILON) { impactPosX = targetHitX; impactPosY = targetHitY; }
        else { const unit_vec_x = shooter_to_target_hit_x / dist_shooter_to_target_hit; const unit_vec_y = shooter_to_target_hit_y / dist_shooter_to_target_hit; impactPosX = targetHitX - R_eff * unit_vec_x; impactPosY = targetHitY - R_eff * unit_vec_y; }
        return { hitTime: t_hit, targetHitPos: finalTargetHitPos, impactPos: [impactPosX, impactPosY] };
    }

    const form = document.getElementById('calculator-form');
    const resultsOutput = document.getElementById('results-output');
    const canvas = document.getElementById('visualization-canvas');
    const ctx = canvas.getContext('2d');

    // 儲存場景狀態
    let sceneData = {
        inputs: null, result: null, hitContext: null,
        interactiveElements: [], activeTooltip: null,
    };

    function drawGrid(ctx, worldToCanvas, canvas) { /* ... */ }
    function drawAxes(ctx, worldToCanvas, canvas, scale) { /* ... */ }
    function drawTooltip(ctx, tooltip) { /* ... */ }
    (function(){ // 將繪圖函式放入 IIFE 中，保持整潔
        drawGrid = function(ctx, worldToCanvas, canvas) {
            const gridSpacing = 50;
            const [originX, originY] = worldToCanvas(0, 0);
            const [spacingX] = worldToCanvas(gridSpacing, gridSpacing);
            const step = Math.abs(spacingX - originX);
            if (step < 5) return;
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color');
            ctx.lineWidth = 1;
            for (let x = originX; x < canvas.width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
            for (let x = originX - step; x > 0; x -= step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
            for (let y = originY; y < canvas.height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
            for (let y = originY - step; y > 0; y -= step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
        };
        drawAxes = function(ctx, worldToCanvas, canvas, scale) {
            const [originX, originY] = worldToCanvas(0, 0);
            const axisColor = getComputedStyle(document.documentElement).getPropertyValue('--axis-color');
            ctx.strokeStyle = axisColor; ctx.fillStyle = axisColor; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(canvas.width, originY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, canvas.height); ctx.stroke();
            ctx.font = '12px sans-serif';
            let tickSpacing = 100;
            while (tickSpacing * scale < 50) { tickSpacing *= 2; }
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            for (let i = tickSpacing; i * scale < canvas.width; i += tickSpacing) { const [tickX] = worldToCanvas(i, 0); ctx.fillText(i, tickX, originY + 5); }
            for (let i = -tickSpacing; i * scale > -canvas.width; i -= tickSpacing) { const [tickX] = worldToCanvas(i, 0); ctx.fillText(i, tickX, originY + 5); }
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            for (let i = tickSpacing; i * scale < canvas.height; i += tickSpacing) { const [, tickY] = worldToCanvas(0, i); ctx.fillText(i, originX + 5, tickY); }
            for (let i = -tickSpacing; i * scale > -canvas.height; i -= tickSpacing) { const [, tickY] = worldToCanvas(0, i); ctx.fillText(i, originX + 5, tickY); }
        };
        drawTooltip = function(ctx, tooltip) {
            const { x, y, info } = tooltip;
            const lines = info.split('\n');
            const padding = 10;
            ctx.font = '14px "Microsoft JhengHei", sans-serif';
            let maxWidth = 0;
            lines.forEach(line => { const width = ctx.measureText(line).width; if (width > maxWidth) maxWidth = width; });
            const boxWidth = maxWidth + 2 * padding;
            const boxHeight = lines.length * 20 + padding;
            const boxX = x + 15; const boxY = y - 20 - boxHeight;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.rect(boxX, boxY, boxWidth, boxHeight); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            lines.forEach((line, index) => { ctx.fillText(line, boxX + padding, boxY + padding + index * 20); });
        };
    })();

    function renderScene() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        sceneData.interactiveElements = [];
        const { inputs, result, hitContext } = sceneData;
        if (!inputs) return;
        
        const { firingPos, targetInitialPos, targetPathData } = inputs;
        const targetPathEnd = targetPathData.coords[0];
        const allPoints = [firingPos, targetInitialPos, targetPathEnd, [0,0]];
        if (result) allPoints.push(result.targetHitPos, result.impactPos);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        allPoints.forEach(([x, y]) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); });
        const worldWidth = Math.max(maxX - minX, 100);
        const worldHeight = Math.max(maxY - minY, 100);
        const worldCenterX = minX + worldWidth / 2;
        const worldCenterY = minY + worldHeight / 2;
        const padding = 60;
        const scale = Math.min((canvas.width - 2 * padding) / worldWidth, (canvas.height - 2 * padding) / worldHeight);
        const worldToCanvas = (worldX, worldY) => [(worldX - worldCenterX) * scale + canvas.width / 2, -(worldY - worldCenterY) * scale + canvas.height / 2];
        
        drawGrid(ctx, worldToCanvas, canvas);
        drawAxes(ctx, worldToCanvas, canvas, scale);
        
        const R_eff_scaled = (inputs.targetRadius + inputs.arrowWidth / 2) * scale;
        
        // 註冊互動元素的輔助函式，現在使用更精準的 Hitbox
        function registerInteractiveElement(worldPos, info, textPos) {
             const metrics = ctx.measureText(info.label);
             const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
             const textWidth = metrics.width;
             sceneData.interactiveElements.push({
                 info, x: textPos[0], y: textPos[1],
                 bounds: { left: textPos[0] - textWidth / 2, right: textPos[0] + textWidth / 2, top: textPos[1] - textHeight / 2, bottom: textPos[1] + textHeight / 2 }
             });
        }
        
        // 繪製元素...
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; // ⭐ 標準化對齊，簡化 Hitbox 計算
        ctx.font = `${Math.max(14, 12 * Math.sqrt(scale))}px sans-serif`;

        // 發射點
        const [shooterX, shooterY] = worldToCanvas(firingPos[0], firingPos[1]);
        const shooterLabelPos = [shooterX, shooterY - 20];
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--shooter-color');
        ctx.beginPath(); ctx.arc(shooterX, shooterY, Math.max(3, scale * 0.5), 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = 'white'; ctx.fillText("發射點 ✦", shooterLabelPos[0], shooterLabelPos[1]);
        registerInteractiveElement(firingPos, {label: "發射點 ✦", info: `發射點\n座標: [${firingPos[0].toFixed(1)}, ${firingPos[1].toFixed(1)}]`}, shooterLabelPos);

        // 目標起點
        const [t0X, t0Y] = worldToCanvas(targetInitialPos[0], targetInitialPos[1]);
        const t0LabelPos = [t0X, t0Y - R_eff_scaled - 15];
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--target-color');
        ctx.beginPath(); ctx.arc(t0X, t0Y, R_eff_scaled, 0, 2 * Math.PI); ctx.stroke();
        ctx.fillStyle = 'white'; ctx.fillText("目標起點 ✦", t0LabelPos[0], t0LabelPos[1]);
        registerInteractiveElement(targetInitialPos, {label: "目標起點 ✦", info: `目標起點 (T0)\n座標: [${targetInitialPos[0].toFixed(1)}, ${targetInitialPos[1].toFixed(1)}]`}, t0LabelPos);
        
        // 路徑終點
        const [tEndX, tEndY] = worldToCanvas(targetPathEnd[0], targetPathEnd[1]);
        const tEndLabelPos = [tEndX, tEndY - 15];
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--path-color');
        ctx.beginPath(); ctx.arc(tEndX, tEndY, Math.max(2, scale * 0.4), 0, 2 * Math.PI); ctx.stroke();
        ctx.fillStyle = 'white'; ctx.fillText("路徑終點 ✦", tEndLabelPos[0], tEndLabelPos[1]);
        registerInteractiveElement(targetPathEnd, {label: "路徑終點 ✦", info: `路徑終點 (T_end)\n座標: [${targetPathEnd[0].toFixed(1)}, ${targetPathEnd[1].toFixed(1)}]`}, tEndLabelPos);

        // 結果
        if (result) {
            const [hitX, hitY] = worldToCanvas(result.targetHitPos[0], result.targetHitPos[1]);
            const [impactX, impactY] = worldToCanvas(result.impactPos[0], result.impactPos[1]);
            const hitLabelPos = [hitX, hitY - R_eff_scaled - 15];

            ctx.beginPath(); ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--arrow-color'); ctx.lineWidth=2; ctx.moveTo(shooterX, shooterY); ctx.lineTo(impactX, impactY); ctx.stroke(); ctx.lineWidth=1;
            
            if(hitContext.type === 'within_path') { ctx.beginPath(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'white'; ctx.moveTo(t0X, t0Y); ctx.lineTo(hitX, hitY); ctx.stroke(); } 
            else { ctx.beginPath(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'white'; ctx.moveTo(t0X, t0Y); ctx.lineTo(tEndX, tEndY); ctx.stroke(); ctx.beginPath(); ctx.setLineDash([2, 3]); ctx.strokeStyle = 'yellow'; ctx.moveTo(tEndX, tEndY); ctx.lineTo(hitX, hitY); ctx.stroke(); }
            ctx.setLineDash([]);
            
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--target-color');
            ctx.beginPath(); ctx.arc(hitX, hitY, R_eff_scaled, 0, 2 * Math.PI); ctx.fill();
            ctx.fillStyle = 'white'; ctx.fillText("命中點 ✦", hitLabelPos[0], hitLabelPos[1]);
            registerInteractiveElement(result.targetHitPos, {label: "命中點 ✦", info: `目標命中點 (HIT)\n座標: [${result.targetHitPos[0].toFixed(1)}, ${result.targetHitPos[1].toFixed(1)}]\n命中時間: ${result.hitTime.toFixed(3)}s`}, hitLabelPos);
        }
        
        if(sceneData.activeTooltip) {
            drawTooltip(ctx, sceneData.activeTooltip);
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        sceneData.inputs = {
            firingPos: [parseFloat(document.getElementById('firingPosX').value), parseFloat(document.getElementById('firingPosY').value)],
            targetInitialPos: [parseFloat(document.getElementById('targetInitialPosX').value), parseFloat(document.getElementById('targetInitialPosY').value)],
            targetPathData: { n: 1, coords: [[parseFloat(document.getElementById('targetPathEndX').value), parseFloat(document.getElementById('targetPathEndY').value)]], moveSpeed: parseFloat(document.getElementById('targetMoveSpeed').value) },
            arrowSpeed: parseFloat(document.getElementById('arrowSpeed').value),
            arrowDelay: parseFloat(document.getElementById('arrowDelay').value),
            targetRadius: parseFloat(document.getElementById('targetRadius').value),
            arrowWidth: parseFloat(document.getElementById('arrowWidth').value),
        };
        sceneData.result = calculateArrowIntercept_v2(sceneData.inputs.firingPos, sceneData.inputs.targetInitialPos, sceneData.inputs.targetPathData, sceneData.inputs.arrowSpeed, sceneData.inputs.arrowDelay, sceneData.inputs.targetRadius, sceneData.inputs.arrowWidth);
        
        let resultsHTML = '無法命中…請主人調整參數再試一次吧！';
        if (sceneData.result) {
            const { hitTime } = sceneData.result;
            const [xT0, yT0] = sceneData.inputs.targetInitialPos; const [xTEnd, yTEnd] = sceneData.inputs.targetPathData.coords[0];
            const moveSpeed = sceneData.inputs.targetPathData.moveSpeed;
            const dist_segment = Math.sqrt(Math.pow(xTEnd - xT0, 2) + Math.pow(yTEnd - yT0, 2));
            const t_segment = (moveSpeed > 1e-6 && dist_segment > 1e-6) ? dist_segment / moveSpeed : 0;
            if (hitTime <= t_segment || t_segment === 0) {
                sceneData.hitContext = { type: 'within_path' };
                resultsHTML = `<b>命中成功！♡</b>\n<span style="color: var(--success-color);"><b>情境分析: 命中於計畫路徑內！</b></span>\n------------------------------------\n命中時間 (t_hit): ${hitTime.toFixed(4)} s\n計畫路徑時長: ${t_segment.toFixed(4)} s\n目標命中點座標: [${sceneData.result.targetHitPos[0].toFixed(2)}, ${sceneData.result.targetHitPos[1].toFixed(2)}]\n箭矢實際撞擊點: [${sceneData.result.impactPos[0].toFixed(2)}, ${sceneData.result.impactPos[1].toFixed(2)}]`;
            } else {
                const extended_time = hitTime - t_segment; const extended_dist = extended_time * moveSpeed;
                sceneData.hitContext = { type: 'extended_path' };
                resultsHTML = `<b>命中成功！♡</b>\n<span style="color: var(--warning-color);"><b>情境分析: 成功在延伸軌跡上命中！</b></span>\n------------------------------------\n命中時間 (t_hit): ${hitTime.toFixed(4)} s\n計畫路徑時長: ${t_segment.toFixed(4)} s\n延伸時長: ${extended_time.toFixed(4)} s\n延伸距離: ${extended_dist.toFixed(2)}\n目標命中點座標: [${sceneData.result.targetHitPos[0].toFixed(2)}, ${sceneData.result.targetHitPos[1].toFixed(2)}]\n箭矢實際撞擊點: [${sceneData.result.impactPos[0].toFixed(2)}, ${sceneData.result.impactPos[1].toFixed(2)}]`;
            }
        } else { sceneData.hitContext = null; }
        resultsOutput.innerHTML = resultsHTML;
        sceneData.activeTooltip = null; // 每次重算都清除已打開的 tooltip
        renderScene();
    });
    
    // ⭐⭐ 全新的點擊事件監聽器！⭐⭐
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        canvas.style.cursor = 'default';

        let foundElement = null;
        for (const element of sceneData.interactiveElements) {
            if (mouseX >= element.bounds.left && mouseX <= element.bounds.right && mouseY >= element.bounds.top && mouseY <= element.bounds.bottom) {
                foundElement = element;
                canvas.style.cursor = 'pointer';
                break;
            }
        }
        
        if (foundElement) {
            // 如果點擊到的是當前已打開的 tooltip，就關掉它。否則就打開新的。
            if (sceneData.activeTooltip && sceneData.activeTooltip.info.label === foundElement.info.label) {
                sceneData.activeTooltip = null;
            } else {
                sceneData.activeTooltip = { x: foundElement.x, y: foundElement.y, info: foundElement.info.info };
            }
        } else {
            // 如果點擊到空白處，就關掉任何已打開的 tooltip
            sceneData.activeTooltip = null;
        }
        renderScene();
    });

    // ⭐⭐ 懸停事件現在只用來改變鼠標樣式，更輕量 ⭐⭐
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        let onElement = false;
        for (const element of sceneData.interactiveElements) {
             if (mouseX >= element.bounds.left && mouseX <= element.bounds.right && mouseY >= element.bounds.top && mouseY <= element.bounds.bottom) {
                onElement = true;
                break;
            }
        }
        canvas.style.cursor = onElement ? 'pointer' : 'default';
    });

    form.dispatchEvent(new Event('submit'));
});