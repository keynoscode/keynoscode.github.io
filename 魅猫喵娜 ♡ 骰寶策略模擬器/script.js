/**
 * 魅猫喵娜 ♡ 骰寶策略模擬器 v4.0
 * 遵循 Karpathy 準則：先思考、簡單至上、精準修改、目標驅動
 * 新增功能：停損點設定、停損推薦、資金繼承、全域紀錄
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('✨ 喵娜模擬器 v4.0 已啟動');

    // ========== 全域紀錄儲存 ==========
    let globalRecords = [];  // 儲存所有模擬紀錄
    
    // 載入儲存的全域紀錄
    function loadGlobalRecords() {
        const saved = localStorage.getItem('miao_simulator_global_records');
        if (saved) {
            try {
                globalRecords = JSON.parse(saved);
                updateGlobalHistoryDisplay();
            } catch(e) { console.error(e); }
        }
    }
    
    // 儲存全域紀錄
    function saveGlobalRecords() {
        localStorage.setItem('miao_simulator_global_records', JSON.stringify(globalRecords.slice(-50))); // 保留最近50筆
        updateGlobalHistoryDisplay();
    }
    
    // 新增紀錄
    function addGlobalRecord(record) {
        const newRecord = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            ...record
        };
        globalRecords.unshift(newRecord); // 最新在上方
        if (globalRecords.length > 50) globalRecords = globalRecords.slice(0, 50);
        saveGlobalRecords();
    }
    
    // 更新全域紀錄顯示
    function updateGlobalHistoryDisplay() {
        const container = document.getElementById('globalHistoryPanel');
        if (!container) return;
        
        if (globalRecords.length === 0) {
            container.innerHTML = '<div style="color:#aaa; text-align:center;">尚無紀錄，執行模擬後會自動記錄</div>';
            return;
        }
        
        container.innerHTML = globalRecords.map(rec => `
            <div class="global-record-item">
                <div class="record-date">📅 ${rec.timestamp}</div>
                <div><strong>${rec.strategyName}</strong> | 本金: ${rec.initialBank.toFixed(0)} | 單位: ${rec.baseUnit}</div>
                <div class="record-stats">
                    <span>💰 盈虧: ${rec.netProfit >= 0 ? '+' : ''}${rec.netProfit.toFixed(2)}</span>
                    <span>📊 勝率: ${rec.winRate.toFixed(1)}%</span>
                    <span>🔥 最大連輸: ${rec.maxConsecutiveLoss}</span>
                    <span>🏆 最大連贏: ${rec.maxConsecutiveWin}</span>
                    <span>📉 最大回撤: ${rec.maxDrawdown.toFixed(1)}%</span>
                    <span>🎯 夏普: ${rec.sharpeRatio.toFixed(3)}</span>
                </div>
            </div>
        `).join('');
    }
    
    // 策略名稱對照
    const strategyNames = {
        flat: '平注法', martingale: '馬丁格爾', anti_martingale: '反馬丁格爾',
        fibonacci: '斐波那契', dalambert: '達蘭貝爾', '1326': '1-3-2-6',
        insurance_fibo: '保險+斐波那契'
    };
    
    // 策略說明
    const strategyDescriptions = {
        flat: '⚖️ 平注法：每次下注相同金額，最保守的策略。風險最低，但需要靠運氣獲利。',
        martingale: '📈 馬丁格爾：輸後加倍下注，贏一場就能回本。風險極高，遇到連輸會快速破產。',
        anti_martingale: '🔄 反馬丁格爾：贏後加倍，輸後回到基礎。順風時能快速累積利潤。',
        fibonacci: '🌀 斐波那契：根據斐波那契數列調整下注（1,1,2,3,5,8...），輸進贏退兩步。',
        dalambert: '📊 達蘭貝爾：輸後加1單位，贏後減1單位。平穩型策略，風險最低。',
        '1326': '✨ 1-3-2-6 正級纜：固定序列1→3→2→6，贏了前進，輸了重來。',
        insurance_fibo: '🛡️ 保險+斐波那契：同時下注「小+雙」，單局輸率從51%降到26%，再搭配斐波那契。'
    };
    
    // 更新策略說明
    const strategySelect = document.getElementById('strategySelect');
    const strategyDescDiv = document.getElementById('strategyDesc');
    if (strategyDescDiv) {
        function updateStrategyDesc() {
            const strategy = strategySelect.value;
            strategyDescDiv.innerHTML = strategyDescriptions[strategy] || '選擇策略後顯示詳細說明～';
        }
        strategySelect.addEventListener('change', updateStrategyDesc);
        updateStrategyDesc();
    }
    
    // 速度控制
    const speedSlider = document.getElementById('simSpeed');
    const speedLabel = document.getElementById('speedLabel');
    if (speedSlider) {
        speedSlider.addEventListener('input', function() {
            const val = parseInt(this.value);
            if (val === 0) speedLabel.textContent = '⚡ 即時模式';
            else if (val <= 30) speedLabel.textContent = '🐢 慢速 (' + val + 'ms)';
            else if (val <= 70) speedLabel.textContent = '🐕 中速 (' + val + 'ms)';
            else speedLabel.textContent = '🐌 教學模式 (' + val + 'ms)';
        });
    }
    
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
    
    function betNormal(amount, diceResult) {
        if (diceResult.isOdd) return { win: true, profit: amount };
        else return { win: false, profit: -amount };
    }
    
    function betInsurance(unit, diceResult) {
        const winSmall = diceResult.isSmall;
        const winEven = diceResult.isEven;
        if (winSmall && winEven) return { win: true, profit: 2 * unit };
        else if (winSmall !== winEven) return { win: true, profit: 0 };
        else return { win: false, profit: -2 * unit };
    }
    
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
    
    // ========== 停損點推薦計算 ==========
    function recommendStopLoss(initialBank, baseUnit) {
        const maxConsecutiveLoss = Math.floor(Math.log(initialBank / baseUnit / 2) / Math.log(2)); // 馬丁格爾極限
        const yellow = Math.min(baseUnit * 33, initialBank * 0.01);
        const orange = Math.min(baseUnit * 88, initialBank * 0.03);
        const red = Math.min(baseUnit * 232, initialBank * 0.08);
        return {
            yellow: Math.max(baseUnit * 10, Math.floor(yellow / 10) * 10),
            orange: Math.max(baseUnit * 25, Math.floor(orange / 25) * 25),
            red: Math.max(baseUnit * 50, Math.floor(red / 50) * 50),
            maxConsecutive: Math.min(15, Math.max(5, maxConsecutiveLoss))
        };
    }
    
    // ========== 主模擬函數（支援停損） ==========
    async function runSimulation(strategy, initialBank, baseUnit, rounds, speedMs, stopLossConfig) {
        let bank = initialBank;
        let history = [];
        let stopLossTriggered = null; // 記錄觸發的停損類型
        
        let fibSeq = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765];
        let fibIdx = 0;
        let martingaleBet = baseUnit;
        let seq1326 = [1, 3, 2, 6];
        let seq1326Idx = 0;
        let dalambertBet = baseUnit;
        let consecutiveLosses = 0;
        let totalLoss = 0;
        
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
                    else martingaleBet = Math.min(betAmount * 2, bank * 0.8);
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
            const isLoss = profit < 0;
            if (isLoss) {
                consecutiveLosses++;
                totalLoss += -profit;
            } else {
                consecutiveLosses = 0;
                if (profit > 0) totalLoss = Math.max(0, totalLoss - profit * 0.3); // 贏錢部分抵銷虧損計算
            }
            
            // 停損檢查
            let stopLossHit = null;
            if (stopLossConfig.enabled) {
                if (consecutiveLosses >= stopLossConfig.maxConsecutive) stopLossHit = '最大連輸';
                else if (totalLoss >= stopLossConfig.red) stopLossHit = '🔴 紅色停損';
                else if (totalLoss >= stopLossConfig.orange) stopLossHit = '🟠 橙色警告';
                else if (totalLoss >= stopLossConfig.yellow) stopLossHit = '🟡 黃色警戒';
            }
            
            history.push({
                round: roundNum, betAmount, betTypeDesc, dice: diceStr,
                result: profit > 0 ? "✅ 贏" : (profit < 0 ? "❌ 輸" : "⚖️ 平"),
                profit: profit, bankAfter: newBank,
                stopLossHit: stopLossHit,
                consecutiveLosses: consecutiveLosses,
                totalLoss: totalLoss
            });
            
            bank = newBank;
            
            if (stopLossHit && !stopLossTriggered) {
                stopLossTriggered = stopLossHit;
                if (speedMs > 0) await new Promise(resolve => setTimeout(resolve, speedMs));
                break;
            }
            
            if (speedMs > 0) await new Promise(resolve => setTimeout(resolve, speedMs));
        }
        
        return { history, finalBank: bank, stopLossTriggered };
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
                 maxConsecutiveLoss, maxConsecutiveWin, sharpeRatio: sharpe, 
                 finalBank: history[history.length - 1]?.bankAfter || initialBank };
    }
    
    // ========== UI 更新函數 ==========
    let chartInstances = { equity: null, pie: null, histogram: null };
    
    function updateUI(history, initialBank, stats, stopLossTriggered) {
        // 績效儀表板
        const statsDiv = document.getElementById('statsGrid');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="metric"><div class="metric-value ${stats.netProfit >= 0 ? 'positive' : 'negative'}">${stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)}</div><div class="metric-label">總盈虧</div></div>
                <div class="metric"><div class="metric-value">${stats.finalBank.toFixed(0)}</div><div class="metric-label">最終資金</div></div>
                <div class="metric"><div class="metric-value">${stats.winRate.toFixed(2)}%</div><div class="metric-label">勝率</div></div>
                <div class="metric"><div class="metric-value">${stats.wins} / ${stats.losses} / ${stats.pushes}</div><div class="metric-label">勝/負/平</div></div>
                <div class="metric"><div class="metric-value">${stats.maxDrawdown.toFixed(2)}%</div><div class="metric-label">最大回撤</div></div>
                <div class="metric"><div class="metric-value">${stats.maxConsecutiveLoss}</div><div class="metric-label">🔥 最大連輸</div></div>
                <div class="metric"><div class="metric-value">${stats.maxConsecutiveWin}</div><div class="metric-label">🏆 最大連贏</div></div>
                <div class="metric"><div class="metric-value">${stats.sharpeRatio.toFixed(3)}</div><div class="metric-label">夏普比率</div></div>
            `;
        }
        
        // 風險分析
        const riskDiv = document.getElementById('riskMetrics');
        if (riskDiv) {
            const loseProb = Math.pow(0.5139, stats.maxConsecutiveLoss) * 100;
            riskDiv.innerHTML = `
                <div class="metric"><div class="metric-label">⚠️ 極端連輸</div><div class="metric-value negative">${stats.maxConsecutiveLoss} 連敗</div><div>機率 ${loseProb.toExponential(2)}%</div></div>
                <div class="metric"><div class="metric-label">📉 最大單局虧損</div><div class="metric-value">${Math.max(...history.map(h => -h.profit), 0).toFixed(0)}</div></div>
                <div class="metric"><div class="metric-label">🏁 破產狀態</div><div class="metric-value ${stats.finalBank > 0 ? 'positive' : 'negative'}">${stats.finalBank > 0 ? '✅ 安全' : '💀 破產'}</div></div>
                <div class="metric"><div class="metric-label">🛡️ 觸發停損</div><div class="metric-value">${stopLossTriggered || '未觸發'}</div></div>
            `;
        }
        
        // 表格更新
        const tbody = document.getElementById('logBody');
        if (tbody) {
            const lastEntries = history.slice(-50).reverse();
            if (lastEntries.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8">無紀錄</td></tr>';
            } else {
                tbody.innerHTML = lastEntries.map(h => `
                    <tr class="${h.profit > 0 ? 'win-row' : (h.profit < 0 ? 'lose-row' : 'push-row')} ${h.stopLossHit ? 'stop-loss-row' : ''}">
                        <td>${h.round}</td><td style="font-size:0.65rem">${h.betTypeDesc}</td>
                        <td>${h.betAmount}</td><td style="font-size:0.6rem">${h.dice}</td>
                        <td>${h.result}</td><td class="${h.profit > 0 ? 'positive' : (h.profit < 0 ? 'negative' : '')}">${h.profit > 0 ? `+${h.profit}` : h.profit}</td>
                        <td>${h.bankAfter.toFixed(0)}</td><td>${h.stopLossHit || '-'}</td>
                    </table>
                `).join('');
            }
        }
        
        // 資金曲線圖
        const equityCtx = document.getElementById('equityChart')?.getContext('2d');
        if (equityCtx) {
            const labels = ['起始', ...history.map((_, i) => i + 1)];
            const equityData = [initialBank, ...history.map(h => h.bankAfter)];
            if (chartInstances.equity) chartInstances.equity.destroy();
            chartInstances.equity = new Chart(equityCtx, {
                type: 'line',
                data: { labels, datasets: [{ label: '💰 資金', data: equityData, borderColor: '#ff88bb', backgroundColor: '#ff66aa20', fill: true, tension: 0.2, pointRadius: 0 }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: '#ddddff' } } } }
            });
        }
        
        // 圓餅圖
        const pieCtx = document.getElementById('pieChart')?.getContext('2d');
        if (pieCtx) {
            if (chartInstances.pie) chartInstances.pie.destroy();
            chartInstances.pie = new Chart(pieCtx, {
                type: 'pie',
                data: { labels: ['勝利', '失敗', '平局'], datasets: [{ data: [stats.wins, stats.losses, stats.pushes], backgroundColor: ['#88ffaa', '#ff8888', '#aaaaff'] }] },
                options: { responsive: true, plugins: { legend: { labels: { color: '#ddddff' } } } }
            });
        }
        
        // 直方圖
        const histCtx = document.getElementById('histogramChart')?.getContext('2d');
        if (histCtx) {
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
    }
    
    // 匯出 CSV
    function exportToCSV(history) {
        const headers = ['場次', '下注類型', '下注金額', '骰子結果', '輸贏', '盈虧', '累積資金', '觸發停損'];
        const rows = history.map(h => [h.round, h.betTypeDesc, h.betAmount, h.dice, h.result, h.profit, h.bankAfter.toFixed(0), h.stopLossHit || '-']);
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
    const setAsInitialBtn = document.getElementById('setAsInitialBtn');
    const recommendBtn = document.getElementById('recommendStopLossBtn');
    const clearHistoryBtn = document.getElementById('clearGlobalHistoryBtn');
    let currentHistory = [];
    let lastStats = null;
    
    // 載入儲存的全域紀錄
    loadGlobalRecords();
    
    // 推薦停損點
    if (recommendBtn) {
        recommendBtn.addEventListener('click', function() {
            const initialBank = parseFloat(document.getElementById('initialBankroll').value);
            const baseUnit = parseFloat(document.getElementById('baseUnit').value);
            if (isNaN(initialBank) || isNaN(baseUnit) || initialBank <= 0 || baseUnit <= 0) {
                alert("請先輸入有效的資金和單位喵～");
                return;
            }
            const rec = recommendStopLoss(initialBank, baseUnit);
            document.getElementById('yellowStopLoss').value = rec.yellow;
            document.getElementById('orangeStopLoss').value = rec.orange;
            document.getElementById('redStopLoss').value = rec.red;
            document.getElementById('maxConsecutiveLossStop').value = rec.maxConsecutive;
            alert(`📊 推薦停損點已設定：\n🟡 黃色: ${rec.yellow}\n🟠 橙色: ${rec.orange}\n🔴 紅色: ${rec.red}\n📉 最大連輸: ${rec.maxConsecutive}`);
        });
    }
    
    // 主模擬按鈕
    if (runBtn) {
        runBtn.addEventListener('click', async function() {
            const strategy = strategySelect.value;
            let initialBank = parseFloat(document.getElementById('initialBankroll').value);
            const baseUnit = parseFloat(document.getElementById('baseUnit').value);
            const rounds = parseInt(document.getElementById('simRounds').value);
            const speedMs = parseInt(speedSlider?.value || 0);
            const enableStopLoss = document.getElementById('enableStopLoss')?.checked || false;
            
            if (isNaN(initialBank) || initialBank <= 0) { alert("請輸入有效的初始資金喵～"); return; }
            if (isNaN(baseUnit) || baseUnit <= 0) { alert("請輸入有效的基礎單位喵～"); return; }
            if (isNaN(rounds) || rounds <= 0) { alert("請輸入有效的模擬局數喵～"); return; }
            
            const stopLossConfig = {
                enabled: enableStopLoss,
                yellow: parseFloat(document.getElementById('yellowStopLoss')?.value || 0),
                orange: parseFloat(document.getElementById('orangeStopLoss')?.value || 0),
                red: parseFloat(document.getElementById('redStopLoss')?.value || 0),
                maxConsecutive: parseInt(document.getElementById('maxConsecutiveLossStop')?.value || 99)
            };
            
            runBtn.disabled = true;
            runBtn.innerText = "⏳ 模擬中... ⏳";
            
            try {
                const result = await runSimulation(strategy, initialBank, baseUnit, rounds, speedMs, stopLossConfig);
                currentHistory = result.history;
                const stats = calculateStats(result.history, initialBank);
                lastStats = stats;
                updateUI(result.history, initialBank, stats, result.stopLossTriggered);
                
                // 新增全域紀錄
                addGlobalRecord({
                    strategyName: strategyNames[strategy] || strategy,
                    initialBank: initialBank,
                    baseUnit: baseUnit,
                    netProfit: stats.netProfit,
                    winRate: stats.winRate,
                    maxConsecutiveLoss: stats.maxConsecutiveLoss,
                    maxConsecutiveWin: stats.maxConsecutiveWin,
                    maxDrawdown: stats.maxDrawdown,
                    sharpeRatio: stats.sharpeRatio,
                    totalRuns: stats.totalRuns,
                    stopLossTriggered: result.stopLossTriggered || '無'
                });
            } catch (error) {
                console.error("模擬錯誤:", error);
                alert("模擬過程中發生錯誤：" + error.message);
            } finally {
                runBtn.disabled = false;
                runBtn.innerText = "🐾 開始模擬 🐾";
            }
        });
    }
    
    // 匯出 CSV
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            if (currentHistory.length === 0) { alert("請先執行模擬再匯出喵～"); return; }
            exportToCSV(currentHistory);
        });
    }
    
    // 將最終資金設為初始資金
    if (setAsInitialBtn && document.getElementById('initialBankroll')) {
        setAsInitialBtn.addEventListener('click', function() {
            if (lastStats && lastStats.finalBank !== undefined) {
                document.getElementById('initialBankroll').value = Math.floor(lastStats.finalBank);
                alert(`已將初始資金設為 ${Math.floor(lastStats.finalBank)} 柚子幣喵～`);
            } else {
                alert("請先執行一次模擬喵～");
            }
        });
    }
    
    // 清空全域紀錄
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm("確定要清空所有全域紀錄嗎？此操作無法復原喵～")) {
                globalRecords = [];
                saveGlobalRecords();
                updateGlobalHistoryDisplay();
            }
        });
    }
});
