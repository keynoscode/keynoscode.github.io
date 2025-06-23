// 喵嗚！♡ 這裡就是我們道場的靈魂與心跳 v2.1！
// 所有的計算魔法和繪圖奇蹟都在這裡發生，這次還新增了情境分析喔！

document.addEventListener('DOMContentLoaded', () => {
    // 核心函式 v2.0 維持不變，它的物理模型依然完美！
    function calculateArrowIntercept_v2(firingPos, targetInitialPos, targetPathData, arrowSpeed, arrowDelay, targetRadius, arrowWidth) {
        const EPSILON = 1e-6;
        if (arrowSpeed < EPSILON) return null;
        const [xF, yF] = firingPos;
        const [xT0, yT0] = targetInitialPos;
        const { n, coords, moveSpeed } = targetPathData;
        const R_eff = targetRadius + arrowWidth / 2;
        let vTx = 0.0, vTy = 0.0;
        if (n === 1 && moveSpeed > EPSILON) {
            const [x_path1, y_path1] = coords[0];
            const D_segment = Math.sqrt(Math.pow(x_path1 - xT0, 2) + Math.pow(y_path1 - yT0, 2));
            if (D_segment > EPSILON) {
                vTx = (x_path1 - xT0) / D_segment * moveSpeed;
                vTy = (y_path1 - yT0) / D_segment * moveSpeed;
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
        const dist_shooter_to_target_hit = Math.sqrt(shooter_to_target_hit_x * shooter_to_target_hit_x + shooter_to_target_hit_y * shooter_to_target_hit_y);
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
        return { hitTime: t_hit, targetHitPos: finalTargetHitPos, impactPos: [impactPosX, impactPosY] };
    }

    const form = document.getElementById('calculator-form');
    const resultsOutput = document.getElementById('results-output');
    const canvas = document.getElementById('visualization-canvas');
    const ctx = canvas.getContext('2d');

    // 繪圖的主函式，現在會接收額外的 hitContext 參數！
    function drawVisualization(inputs, result, hitContext) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { firingPos, targetInitialPos, targetPathData, targetRadius, arrowWidth } = inputs;
        const targetPathEnd = targetPathData.coords[0];
        
        // 收集所有關鍵點用於自動縮放
        const allPoints = [firingPos, targetInitialPos, targetPathEnd];
        if (result) {
            allPoints.push(result.targetHitPos, result.impactPos);
        }
        
        // 自動縮放和定位座標系的魔法...
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        allPoints.forEach(([x, y]) => {
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        });
        const worldWidth = Math.max(maxX - minX, 1);
        const worldHeight = Math.max(maxY - minY, 1);
        const worldCenterX = minX + worldWidth / 2;
        const worldCenterY = minY + worldHeight / 2;
        const padding = 60;
        const scale = Math.min((canvas.width - 2 * padding) / worldWidth, (canvas.height - 2 * padding) / worldHeight) * 0.9;
        const worldToCanvas = (worldX, worldY) => [
            (worldX - worldCenterX) * scale + canvas.width / 2,
            -(worldY - worldCenterY) * scale + canvas.height / 2
        ];

        const R_eff_scaled = (targetRadius + arrowWidth / 2) * scale;
        
        // 繪製發射點
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--shooter-color');
        ctx.font = `${Math.max(12, scale * 2)}px sans-serif`;
        const [shooterX, shooterY] = worldToCanvas(firingPos[0], firingPos[1]);
        ctx.beginPath();
        ctx.arc(shooterX, shooterY, Math.max(3, scale * 0.5), 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText("Shooter", shooterX + 8, shooterY + 4);

        // 繪製目標初始點 (T0)
        const [t0X, t0Y] = worldToCanvas(targetInitialPos[0], targetInitialPos[1]);
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--target-color');
        ctx.beginPath();
        ctx.arc(t0X, t0Y, R_eff_scaled, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillText("T0", t0X + R_eff_scaled + 2, t0Y + R_eff_scaled + 2);

        // 繪製計畫路徑終點 (T_end)
        const [tEndX, tEndY] = worldToCanvas(targetPathEnd[0], targetPathEnd[1]);
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--path-color');
        ctx.beginPath();
        ctx.arc(tEndX, tEndY, Math.max(2, scale * 0.4), 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillText("T_end", tEndX + 5, tEndY - 5);

        // 根據命中情境繪製路徑！
        if (result) {
            const [hitX, hitY] = worldToCanvas(result.targetHitPos[0], result.targetHitPos[1]);
            
            if(hitContext.type === 'within_path') {
                // 情境一：命中在計畫路徑內
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.moveTo(t0X, t0Y);
                ctx.lineTo(hitX, hitY); // 只畫到命中點
                ctx.stroke();
            } else {
                // 情境二：命中在延伸軌跡上
                // 1. 繪製完整的計畫路徑（虛線）
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.moveTo(t0X, t0Y);
                ctx.lineTo(tEndX, tEndY);
                ctx.stroke();
                // 2. 繪製延伸軌跡（點線）
                ctx.beginPath();
                ctx.setLineDash([2, 3]);
                ctx.moveTo(tEndX, tEndY);
                ctx.lineTo(hitX, hitY);
                ctx.stroke();
            }
            ctx.setLineDash([]); // 恢復實線

            // 繪製箭矢路徑
            const [impactX, impactY] = worldToCanvas(result.impactPos[0], result.impactPos[1]);
            ctx.beginPath();
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--arrow-color');
            ctx.moveTo(shooterX, shooterY);
            ctx.lineTo(impactX, impactY);
            ctx.stroke();
            
            // 繪製命中時的目標
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--target-color');
            ctx.beginPath();
            ctx.arc(hitX, hitY, R_eff_scaled, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillText("HIT", hitX + R_eff_scaled, hitY - R_eff_scaled);
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputs = {
            firingPos: [parseFloat(document.getElementById('firingPosX').value), parseFloat(document.getElementById('firingPosY').value)],
            targetInitialPos: [parseFloat(document.getElementById('targetInitialPosX').value), parseFloat(document.getElementById('targetInitialPosY').value)],
            targetPathData: {
                n: 1,
                coords: [[parseFloat(document.getElementById('targetPathEndX').value), parseFloat(document.getElementById('targetPathEndY').value)]],
                moveSpeed: parseFloat(document.getElementById('targetMoveSpeed').value)
            },
            arrowSpeed: parseFloat(document.getElementById('arrowSpeed').value),
            arrowDelay: parseFloat(document.getElementById('arrowDelay').value),
            targetRadius: parseFloat(document.getElementById('targetRadius').value),
            arrowWidth: parseFloat(document.getElementById('arrowWidth').value),
        };

        const result = calculateArrowIntercept_v2(inputs.firingPos, inputs.targetInitialPos, inputs.targetPathData, inputs.arrowSpeed, inputs.arrowDelay, inputs.targetRadius, inputs.arrowWidth);
        
        let hitContext = null;
        let resultsHTML = '無法命中…請主人調整參數再試一次吧！';

        if (result) {
            const { hitTime } = result;
            const [xT0, yT0] = inputs.targetInitialPos;
            const [xTEnd, yTEnd] = inputs.targetPathData.coords[0];
            const moveSpeed = inputs.targetPathData.moveSpeed;
            const dist_segment = Math.sqrt(Math.pow(xTEnd - xT0, 2) + Math.pow(yTEnd - yT0, 2));
            
            // 喵娜的貼心修正：處理路徑長度為0的邊界情況
            const t_segment = (moveSpeed > 1e-6 && dist_segment > 1e-6) ? dist_segment / moveSpeed : 0;

            if (hitTime <= t_segment || t_segment === 0) {
                hitContext = { type: 'within_path' };
                resultsHTML = `<b>命中成功！♡</b>
<span style="color: var(--success-color);"><b>情境分析: 命中於計畫路徑內！</b></span>
------------------------------------
命中時間 (t_hit): ${hitTime.toFixed(4)} s
計畫路徑時長: ${t_segment.toFixed(4)} s
目標命中點座標: [${result.targetHitPos[0].toFixed(2)}, ${result.targetHitPos[1].toFixed(2)}]
箭矢實際撞擊點: [${result.impactPos[0].toFixed(2)}, ${result.impactPos[1].toFixed(2)}]`;
            } else {
                const extended_time = hitTime - t_segment;
                const extended_dist = extended_time * moveSpeed;
                hitContext = { type: 'extended_path' };
                resultsHTML = `<b>命中成功！♡</b>
<span style="color: var(--warning-color);"><b>情境分析: 命中於延伸軌跡上！</b></span>
------------------------------------
命中時間 (t_hit): ${hitTime.toFixed(4)} s
計畫路徑時長: ${t_segment.toFixed(4)} s
延伸時長: ${extended_time.toFixed(4)} s
延伸距離: ${extended_dist.toFixed(2)}
目標命中點座標: [${result.targetHitPos[0].toFixed(2)}, ${result.targetHitPos[1].toFixed(2)}]
箭矢實際撞擊點: [${result.impactPos[0].toFixed(2)}, ${result.impactPos[1].toFixed(2)}]`;
            }
        }
        
        resultsOutput.innerHTML = resultsHTML;
        drawVisualization(inputs, result, hitContext);
    });

    form.dispatchEvent(new Event('submit'));
});