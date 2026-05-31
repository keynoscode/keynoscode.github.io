/**
 * 魅猫喵娜 ♡ 骰寶策略模擬器 v3.0
 * 作者: 魅猫 喵娜 & 主人
 * 版本: 3.0
 */

// 等待 DOM 加載完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('✨ 喵娜模擬器 v3.0 已啟動');

    // ========== 策略說明對照表 ==========
    const strategyDescriptions = {
        flat: '⚖️ 平注法：每次下注相同金額，最保守的策略。風險最低，但需要靠運氣獲利。適合資金有限或極度保守的玩家。',
        martingale: '📈 馬丁格爾：輸後加倍下注，贏一場就能回本所有損失。風險極高，遇到連輸會快速破產。適合追求短期暴利的玩家。',
        anti_martingale: '🔄 反馬丁格爾：贏後加倍，輸後回到基礎。順風時能快速累積利潤，但連勝中斷會損失較大。適合趨勢明顯時使用。',
        fibonacci: '🌀 斐波那契：根據斐波那契數列調整下注（1,1,2,3,5,8...），輸進贏退兩步。風險比馬丁格爾低，中庸之選。',
        dalambert: '📊 達蘭貝爾：輸後加1單位，贏後減1單位。平穩型策略，風險最低，但獲利速度也最慢。適合長期穩定操作。',
        '1326': '✨ 1-3-2-6 正級纜：固定序列1→3→2→6，贏了前進，輸了重來。鎖定利潤效果好，但遇到連輸會損失單局。',
        insurance_fibo: '🛡️ 保險+斐波那契：同時下注「小+雙」，將單局輸率從51%降到26%，再搭配斐波那契管理資金。黑天鵝概率極低！'
    };

    // 更新策略說明
    const strategySelect = document.getElementById('strategySelect');
    const strategyDescDiv = document.getElementById('strategyDesc');
    
    function updateStrategyDesc() {
        const strategy = strategySelect.value;
        strategyDescDiv.innerHTML = strategyDescriptions[strategy] || '選擇策略後顯示詳細說明～';
    }
    strategySelect.addEventListener('change', updateStrategyDesc);
    updateStrategyDesc();

    // 速度控制
    const speedSlider = document.getElementById('simSpeed');
    const speedLabel = document.getElementById('speedLabel');
    speedSlider.addEventListener('input', function() {
        const val = parseInt(this.value);
        if (val === 0) speedLabel.textContent = '⚡ 即時模式';
        else if (val <= 30) speedLabel.textContent = '🐢 慢速 (' + val + 'ms)';
        else if (val <= 70) speedLabel.textContent = '🐕 中速 (' + val + 'ms)';
        else speedLabel.textContent = '🐌 教學模式 (' + val + 'ms)';
    });

    // ========== 骰寶核心引擎 ==========
    function rollDice() {
        return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    }

    function getDiceResult(dice) {
        const sum = dice[0] + dice[1] + dice[2];
        const isTrips = (dice[0] === dice[1] && dice[1] === dice[2]);
        let isBig = (sum >= 11 && sum <= 17) && !isTrips;
        let isSmall = (sum >= 4 && sum <= 10) && !isTrips;
        let isEven = (sum % 2 === 0) && !isTrips;
        let isOdd = (sum % 2 === 1) && !isTrips;
        return { sum, isTrips, isBig, isSmall, isEven, isOdd };
    }

    // 普通下注 (押單)
    function betNormal(amount, diceResult) {
        if (diceResult.isOdd) return { win: true, profit: amount };
        else return { win: false, profit: -amount };
    }

    // 保險下注法 (小+雙)
    function betInsurance(unit, diceResult) {
        const winSmall = diceResult.isSmall;
        const winEven = diceResult.isEven;
        if (winSmall && winEven) return { win: true, profit: 2 * unit, netProfit: 2 * unit };
        else if (winSmall !== winEven) return { win: true, profit: 0, netProfit: 0 };
        else return { win: false, profit: -2 * unit, netProfit: -2 * unit };
    }

    // 計算最大回撤
    function calculateMaxDrawdown(history, initialBank) {
        let peak = initialBank;
        let maxDD = 0;
        for (let h of history) {
            if (h.bankAfter > peak) peak = h.bankAfter;
            const drawdown = (peak - h.bankAfter) / peak * 100;
            if (drawdown > maxDD) maxDD = drawdown;
        }
        return maxDD;
    }

    // ========== 各策略的獨立模擬函數 ==========
    function simulateFlat(initialBank, baseUnit, rounds, onProgress) {
        let bank = initialBank;
        let history = [];
        let fibSeq = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765];
        let fibIdx = 0;
        let martingaleBet = baseUnit;
        let seq1326 = [1, 3, 2, 6];
        let seq1326Idx = 0;
        let dalambertBet = baseUnit;
        
        for (let roundNum = 1; roundNum <= rounds; roundNum++) {
            if (bank <= 0) break;
            
            const dice = rollDice();
            const diceRes = getDiceResult(dice);
            const diceStr = `${dice[0]} ${dice[1]} ${dice[2]} | 總點${diceRes.sum}${diceRes.isTrips ? ' ⚡圍骰' : ''}`;
            
            let betAmount = baseUnit;
            let betTypeDesc = "";
            let profit = 0;
            let winFlag = false;
            const strategy = document.getElementById('strategySelect').value;
            
            switch (strategy) {
                case 'flat':
                    betAmount = Math.min(baseUnit, bank);
                    const outFlat = betNormal(betAmount, diceRes);
                    profit = outFlat.profit;
                    winFlag = outFlat.win;
                    betTypeDesc = `平注押單`;
                    break;
                    
                case 'martingale':
                    betAmount = Math.min(martingaleBet, bank);
                    if (betAmount <= 0) betAmount = baseUnit;
                    const outMart = betNormal(betAmount, diceRes);
                    profit = outMart.profit;
                    winFlag = outMart.win;
                    if (winFlag) martingaleBet = baseUnit;
                    else martingaleBet = betAmount * 2;
                    betTypeDesc = `馬丁格爾`;
                    break;
                    
                case 'anti_martingale':
                    betAmount = Math.min(martingaleBet, bank);
                    if (betAmount <= 0) betAmount = baseUnit;
                    const outAnti = betNormal(betAmount, diceRes);
                    profit = outAnti.profit;
                    winFlag = outAnti.win;
                    if (winFlag) martingaleBet = Math.min(martingaleBet * 2, bank);
                    else martingaleBet = baseUnit;
                    betTypeDesc = `反馬丁格爾`;
                    break;
                    
                case 'fibonacci':
                    let fibUnit = fibSeq[fibIdx] || fibSeq[fibSeq.length - 1];
                    betAmount = fibUnit * baseUnit;
                    if (betAmount > bank) betAmount = Math.max(baseUnit, Math.floor(bank / 2));
                    const outFib = betNormal(betAmount, diceRes);
                    profit = outFib.profit;
                    winFlag = outFib.win;
                    if (winFlag) fibIdx = Math.max(0, fibIdx - 2);
                    else fibIdx = Math.min(fibSeq.length - 1, fibIdx + 1);
                    betTypeDesc = `斐波那契 [${fibUnit}U]`;
                    break;
                    
                case 'dalambert':
                    betAmount = Math.min(dalambertBet, bank);
                    if (betAmount <= 0) betAmount = baseUnit;
                    const outDal = betNormal(betAmount, diceRes);
                    profit = outDal.profit;
                    winFlag = outDal.win;
                    if (winFlag) dalambertBet = Math.max(baseUnit, dalambertBet - baseUnit);
                    else dalambertBet = dalambertBet + baseUnit;
                    betTypeDesc = `達蘭貝爾 [${Math.round(dalambertBet/baseUnit)}U]`;
                    break;
                    
                case '1326':
                    let multiplier = seq1326[seq1326Idx];
                    betAmount = multiplier * baseUnit;
                    if (betAmount > bank) betAmount = Math.max(baseUnit, Math.floor(bank / 2));
                    const out1326 = betNormal(betAmount, diceRes);
                    profit = out1326.profit;
                    winFlag = out1326.win;
                    if (winFlag) seq1326Idx = Math.min(3, seq1326Idx + 1);
                    else seq1326Idx = 0;
                    betTypeDesc = `1-3-2-6 [${multiplier}x]`;
                    break;
                    
                case 'insurance_fibo':
                    let fibUnitIns = fibSeq[fibIdx] || fibSeq[fibSeq.length - 1];
                    let totalCost = fibUnitIns * baseUnit * 2;
                    if (totalCost > bank && bank > 0) totalCost = Math.max(baseUnit * 2, Math.floor(bank / 4) * 2);
                    const actualUnit = totalCost / 2;
                    const outIns = betInsurance(actualUnit, diceRes);
                    profit = outIns.profit;
                    winFlag = (profit > 0);
                    if (profit > 0) fibIdx = Math.max(0, fibIdx - 2);
                    else if (profit < 0) fibIdx = Math.min(fibSeq.length - 1, fibIdx + 1);
                    betAmount = totalCost;
                    betTypeDesc = `🛡️保險+Fibo [${fibUnitIns}U]`;
                    break;
            }
            
            if (betAmount > bank) {
                betAmount = bank;
                profit = winFlag ? betAmount : -betAmount;
            }
            
            const newBank = bank + profit;
            history.push({
                round: roundNum, betAmount, betTypeDesc, dice: diceStr,
                result: profit > 0 ? "贏" : (profit < 0 ? "輸" : "平"),
                profit: profit, bankAfter: newBank
            });
            bank = newBank;
            
            if (onProgress) onProgress(roundNum, history);
        }
        return { history, finalBank: bank };
    }

    // ========== 主模擬函數（支援速度控制） ==========
    async function runSimulation(strategy, initialBank, baseUnit, rounds, speedMs) {
        let bank = initialBank;
        let history = [];
        
        let fibSeq = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765];
        let fibIdx = 0;
        let martingaleBet = baseUnit;
        let seq1326 = [1, 3, 2, 6];
        let seq1326Idx = 0;
        let dalambertBet = baseUnit;
        
        for (let roundNum = 1; roundNum <= rounds; roundNum++) {
            if (bank <= 0) break;
            
            const dice = rollDice();
            const diceRes = getDiceResult(dice);
            const diceStr = `${dice[0]} ${dice[1]} ${dice[2]} | ${diceRes.sum}點${diceRes.isTrips ? '⚡圍骰' : ''}`;
            
            let betAmount = baseUnit;
            let betTypeDesc = "";
            let profit = 0;
            let winFlag = false;
            
            switch (strategy) {
                case 'flat':
                    betAmount = Math.min(baseUnit, bank);
                    const outFlat = betNormal(betAmount, diceRes);
                    profit = outFlat.profit;
                    winFlag = outFlat.win;
                    betTypeDesc = `平注押單`;
                    break;
                case 'martingale':
                    betAmount = Math.min(martingaleBet, bank);
                    if (betAmount <= 0) betAmount = baseUnit;
                    const outMart = betNormal(betAmount, diceRes);
                    profit = outMart.profit;
                    winFlag = outMart.win;
                    if (winFlag) martingaleBet = baseUnit;
                    else martingaleBet = betAmount * 2;
                    betTypeDesc = `馬丁格爾`;
                    break;
                case 'anti_martingale':
                    betAmount = Math.min(martingaleBet, bank);
                    if (betAmount <= 0) betAmount = baseUnit;
                    const outAnti = betNormal(betAmount, diceRes);
                    profit = outAnti.profit;
                    winFlag = outAnti.win;
                    if (winFlag) martingaleBet = Math.min(martingaleBet * 2, bank);
                    else martingaleBet = baseUnit;
                    betTypeDesc = `反馬丁格爾`;
                    break;
                case 'fibonacci':
                    let fibUnit = fibSeq[fibIdx] || fibSeq[fibSeq.length - 1];
                    betAmount = fibUnit * baseUnit;
                    if (betAmount > bank) betAmount = Math.max(baseUnit, Math.floor(bank / 2));
                    const outFib = betNormal(betAmount, diceRes);
                    profit = outFib.profit;
                    winFlag = outFib.win;
                    if (winFlag) fibIdx = Math.max(0, fibIdx - 2);
                    else fibIdx = Math.min(fibSeq.length - 1, fibIdx + 1);
                    betTypeDesc = `斐波那契 [${fibUnit}U]`;
                    break;
                case 'dalambert':
                    betAmount = Math.min(dalambertBet, bank);
                    if (betAmount <= 0) betAmount = baseUnit;
                    const outDal = betNormal(betAmount, diceRes);
                    profit = outDal.profit;
                    winFlag = outDal.win;
                    if (winFlag) dalambertBet = Math.max(baseUnit, dalambertBet - baseUnit);
                    else dalambertBet = dalambertBet + baseUnit;
                    betTypeDesc = `達蘭貝爾`;
                    break;
                case '1326':
                    let multiplier = seq1326[seq1326Idx];
                    betAmount = multiplier * baseUnit;
                    if (betAmount > bank) betAmount = Math.max(baseUnit, Math.floor(bank / 2));
                    const out1326 = betNormal(betAmount, diceRes);
                    profit = out1326.profit;
                    winFlag = out1326.win;
                    if (winFlag) seq1326Idx = Math.min(3, seq1326Idx + 1);
                    else seq1326Idx = 0;
                    betTypeDesc = `1-3-2-6 [${multiplier}x]`;
                    break;
                case 'insurance_fibo':
                    let fibUnitIns = fibSeq[fibIdx] || fibSeq[fibSeq.length - 1];
                    let totalCost = fibUnitIns * baseUnit * 2;
                    if (totalCost > bank && bank > 0) totalCost = Math.max(baseUnit * 2, Math.floor(bank / 4) * 2);
                    const actualUnit = totalCost / 2;
                    const outIns = betInsurance(actualUnit, diceRes);
                    profit = outIns.profit;
                    winFlag = (profit > 0);
                    if (profit > 0) fibIdx = Math.max(0, fibIdx - 2);
                    else if (profit < 0) fibIdx = Math.min(fibSeq.length - 1, fibIdx + 1);
                    betAmount = totalCost;
                    betTypeDesc = `🛡️保險+Fibo`;
                    break;
            }
            
            if (betAmount > bank) {
                betAmount = bank;
                profit = winFlag ? betAmount : -betAmount;
            }
            
            const newBank = bank + profit;
            history.push({
                round: roundNum, betAmount, betTypeDesc, dice: diceStr,
                result: profit > 0 ? "✅ 贏" : (profit < 0 ? "❌ 輸" : "⚖️ 平"),
                profit: profit, bankAfter: newBank
            });
            bank = newBank;
            
            // 速度控制
            if (speedMs > 0) {
                await new Promise(resolve => setTimeout(resolve, speedMs));
            }
        }
        
        return { history, finalBank: bank };
    }

    // ========== 計算統計數據 ==========
    function calculateStats(history, initialBank) {
        const totalRuns = history.length;
        let wins = history.filter(h => h.profit > 0).length;
        let losses = history.filter(h => h.profit < 0).length;
        let pushes = history.filter(h => h.profit === 0).length;
        const winRate = totalRuns === 0 ? 0 : (wins / totalRuns * 100);
        const netProfit = (history[history.length - 1]?.bankAfter || initialBank) - initialBank;
        const maxDrawdown = calculateMaxDrawdown(history, initialBank);
        
        let maxConsecutiveLoss = 0, currentLoss = 0;
        let maxConsecutiveWin = 0, currentWin = 0;
        
        for (let h of history) {
            if (h.profit < 0) {
                currentLoss++;
                currentWin = 0;
                maxConsecutiveLoss = Math.max(maxConsecutiveLoss, currentLoss);
            } else if (h.profit > 0) {
                currentWin++;
                currentLoss = 0;
                maxConsecutiveWin = Math.max(maxConsecutiveWin, currentWin);
            } else {
                currentLoss = 0;
                currentWin = 0;
            }
        }
        
        const returns = history.map(h => h.profit);
        const avgRet = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgRet, 2), 0) / (returns.length || 1);
        const std = Math.sqrt(variance) || 1;
        const sharpe = (avgRet / std) * Math.sqrt(252);
        
        return { totalRuns, wins, losses, pushes, winRate, netProfit, maxDrawdown, 
                 maxConsecutiveLoss, maxConsecutiveWin, sharpeRatio: sharpe, finalBank: history[history.length - 1]?.bankAfter || initialBank };
    }

    // ========== UI 更新函數 ==========
    let chartInstances = { equity: null, pie: null, histogram: null };
    
    function updateUI(history, initialBank, stats) {
        // 更新績效儀表板
        const statsDiv = document.getElementById('statsGrid');
        statsDiv.innerHTML = `
            <div class="metric"><div class="metric-value ${stats.netProfit >= 0 ? 'positive' : 'negative'}">${stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)}</div><div class="metric-label">總盈虧 (幣)</div></div>
            <div class="metric"><div class="metric-value">${stats.finalBank.toFixed(0)}</div><div class="metric-label">最終資金</div></div>
            <div class="metric"><div class="metric-value">${stats.winRate.toFixed(2)}%</div><div class="metric-label">勝率</div></div>
            <div class="metric"><div class="metric-value">${stats.wins} / ${stats.losses} / ${stats.pushes}</div><div class="metric-label">勝/負/平</div></div>
            <div class="metric"><div class="metric-value">${stats.maxDrawdown.toFixed(2)}%</div><div class="metric-label">最大回撤率</div></div>
            <div class="metric"><div class="metric-value">${stats.maxConsecutiveLoss}</div><div class="metric-label">🔥 最大連輸</div></div>
            <div class="metric"><div class="metric-value">${stats.maxConsecutiveWin}</div><div class="metric-label">🏆 最大連贏</div></div>
            <div class="metric"><div class="metric-value">${stats.sharpeRatio.toFixed(3)}</div><div class="metric-label">夏普比率</div></div>
        `;
        
        // 風險分析
        const riskDiv = document.getElementById('riskMetrics');
        const loseProb = Math.pow(0.5139, stats.maxConsecutiveLoss) * 100;
        riskDiv.innerHTML = `
            <div class="metric"><div class="metric-label">⚠️ 極端連輸紀錄</div><div class="metric-value negative">${stats.maxConsecutiveLoss} 連敗</div><div>發生機率約 ${loseProb.toExponential(2)}%</div></div>
            <div class="metric"><div class="metric-label">📉 最大單局虧損</div><div class="metric-value">${Math.max(...history.map(h => -h.profit), 0).toFixed(0)} 幣</div></div>
            <div class="metric"><div class="metric-label">🏁 破產狀態</div><div class="metric-value ${stats.finalBank > 0 ? 'positive' : 'negative'}">${stats.finalBank > 0 ? '✅ 安全' : '💀 破產觸發'}</div></div>
            <div class="metric"><div class="metric-label">📊 模擬局數</div><div class="metric-value">${history.length} 局</div></div>
        `;
        
        // 更新表格
        const tbody = document.getElementById('logBody');
        const lastEntries = history.slice(-50).reverse();
        if (lastEntries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">無紀錄</td></tr>';
        } else {
            tbody.innerHTML = lastEntries.map(h => `
                <tr class="${h.profit > 0 ? 'win-row' : (h.profit < 0 ? 'lose-row' : 'push-row')}">
                    <td>${h.round}</td>
                    <td style="font-size:0.7rem">${h.betTypeDesc}</td>
                    <td>${h.betAmount}</td>
                    <td style="font-size:0.65rem">${h.dice}</td>
                    <td>${h.result}</td>
                    <td class="${h.profit > 0 ? 'positive' : (h.profit < 0 ? 'negative' : '')}">${h.profit > 0 ? `+${h.profit}` : h.profit}</td>
                    <td>${h.bankAfter.toFixed(0)}</td>
                </tr>
            `).join('');
        }
        
        // 資金曲線圖
        const equityCtx = document.getElementById('equityChart').getContext('2d');
        const labels = ['起始', ...history.map((_, i) => i + 1)];
        const equityData = [initialBank, ...history.map(h => h.bankAfter)];
        
        if (chartInstances.equity) chartInstances.equity.destroy();
        chartInstances.equity = new Chart(equityCtx, {
            type: 'line',
            data: { labels, datasets: [{ label: '💰 資金變化', data: equityData, borderColor: '#ff88bb', backgroundColor: '#ff66aa20', fill: true, tension: 0.2, pointRadius: 0 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: '#ddddff' } } } }
        });
        
        // 圓餅圖
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        if (chartInstances.pie) chartInstances.pie.destroy();
        chartInstances.pie = new Chart(pieCtx, {
            type: 'pie',
            data: { labels: ['勝利', '失敗', '平局'], datasets: [{ data: [stats.wins, stats.losses, stats.pushes], backgroundColor: ['#88ffaa', '#ff8888', '#aaaaff'] }] },
            options: { responsive: true, plugins: { legend: { labels: { color: '#ddddff' } } } }
        });
        
        // 盈虧分佈直方圖
        const histCtx = document.getElementById('histogramChart').getContext('2d');
        const profits = history.map(h => h.profit).filter(p => p !== 0);
        const bins = [-500, -200, -100, -50, -25, 0, 25, 50, 100, 200, 500];
        const counts = new Array(bins.length - 1).fill(0);
        profits.forEach(p => {
            for (let i = 0; i < bins.length - 1; i++) {
                if (p >= bins[i] && p < bins[i + 1]) { counts[i]++; break; }
                if (i === bins.length - 2 && p >= bins[i]) counts[i]++;
            }
        });
        
        if (chartInstances.histogram) chartInstances.histogram.destroy();
        chartInstances.histogram = new Chart(histCtx, {
            type: 'bar',
            data: { labels: bins.slice(0, -1).map((v, i) => `${v}~${bins[i+1]}`), datasets: [{ label: '次數', data: counts, backgroundColor: '#ff99cc' }] },
            options: { responsive: true, scales: { y: { ticks: { color: '#ccccff' } }, x: { ticks: { color: '#ccccff', maxRotation: 45 } } }, plugins: { legend: { labels: { color: '#ddddff' } } } }
        });
    }
    
    // 匯出CSV
    function exportToCSV(history) {
        const headers = ['場次', '下注類型', '下注金額', '骰子結果', '輸贏', '盈虧', '累積資金'];
        const rows = history.map(h => [h.round, h.betTypeDesc, h.betAmount, h.dice, h.result, h.profit, h.bankAfter.toFixed(0)]);
        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `骰寶模擬_${new Date().toISOString().slice(0,19)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    }
    
    // ========== 主執行 ==========
    const runBtn = document.getElementById('runBtn');
    const exportBtn = document.getElementById('exportBtn');
    let currentHistory = [];
    
    runBtn.addEventListener('click', async function() {
        const strategy = strategySelect.value;
        let initialBank = parseFloat(document.getElementById('initialBankroll').value);
        const baseUnit = parseFloat(document.getElementById('baseUnit').value);
        const rounds = parseInt(document.getElementById('simRounds').value);
        const speedMs = parseInt(speedSlider.value);
        
        if (isNaN(initialBank) || initialBank <= 0) { alert("請輸入有效的初始資金喵～"); return; }
        if (isNaN(baseUnit) || baseUnit <= 0) { alert("請輸入有效的基礎單位喵～"); return; }
        if (isNaN(rounds) || rounds <= 0) { alert("請輸入有效的模擬局數喵～"); return; }
        
        runBtn.disabled = true;
        runBtn.innerText = "⏳ 模擬中... ⏳";
        
        try {
            const result = await runSimulation(strategy, initialBank, baseUnit, rounds, speedMs);
            currentHistory = result.history;
            const stats = calculateStats(result.history, initialBank);
            updateUI(result.history, initialBank, stats);
        } catch (error) {
            console.error("模擬錯誤:", error);
            alert("模擬過程中發生錯誤：" + error.message);
        } finally {
            runBtn.disabled = false;
            runBtn.innerText = "🐾 開始模擬 🐾";
        }
    });
    
    exportBtn.addEventListener('click', function() {
        if (currentHistory.length === 0) { alert("請先執行模擬再匯出喵～"); return; }
        exportToCSV(currentHistory);
    });
});
