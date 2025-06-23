// 導入你的 calculateArrowIntercept 函數
// ...existing code...
// 請將 calculateArrowIntercept 函數內容複製到這裡（見你的 md 檔案）
// ...existing code...

// 互動表單與視覺化
document.getElementById('moveType').addEventListener('change', function() {
  document.getElementById('moveParams').style.display = this.value === "1" ? "" : "none";
});

document.getElementById('ballistics-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const firingPos = [parseFloat(xF.value), parseFloat(yF.value)];
  const targetInitialPos = [parseFloat(xT0.value), parseFloat(yT0.value)];
  const targetRadius = parseFloat(targetRadius.value);
  const arrowSpeed = parseFloat(arrowSpeed.value);
  const arrowWidth = parseFloat(arrowWidth.value);
  const arrowDelay = parseFloat(arrowDelay.value);
  const n = parseInt(moveType.value);
  let targetPathData;
  if (n === 1) {
    targetPathData = {
      n,
      coords: [[parseFloat(xPath1.value), parseFloat(yPath1.value)]],
      moveSpeed: parseFloat(moveSpeed.value)
    };
  } else {
    targetPathData = { n, coords: [], moveSpeed: 0 };
  }
  const result = calculateArrowIntercept(
    firingPos, targetInitialPos, targetPathData,
    arrowSpeed, arrowDelay, targetRadius, arrowWidth
  );
  if (result) {
    calcResult.innerHTML = `
      命中時間：${result.hitTime.toFixed(4)} 秒<br>
      目標命中座標：(${result.targetHitPos.map(x=>x.toFixed(2)).join(", ")})<br>
      撞擊點座標：(${result.impactPos.map(x=>x.toFixed(2)).join(", ")})
    `;
    drawBallistics(firingPos, targetInitialPos, targetPathData, result);
  } else {
    calcResult.innerHTML = "無法命中目標。";
    drawBallistics(firingPos, targetInitialPos, targetPathData, null);
  }
});

// 視覺化函數
function drawBallistics(firingPos, targetInitialPos, targetPathData, result) {
  const canvas = document.getElementById('ballistics-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // 簡單縮放與偏移
  const scale = 20, offsetX = 50, offsetY = 200;
  function tx(x) { return x*scale + offsetX; }
  function ty(y) { return offsetY - y*scale; }

  // 發射者
  ctx.fillStyle = "#2d3e50";
  ctx.beginPath();
  ctx.arc(tx(firingPos[0]), ty(firingPos[1]), 7, 0, 2*Math.PI);
  ctx.fill();
  ctx.fillText("發射者", tx(firingPos[0])+10, ty(firingPos[1]));

  // 目標初始
  ctx.strokeStyle = "#888";
  ctx.beginPath();
  ctx.arc(tx(targetInitialPos[0]), ty(targetInitialPos[1]), 12, 0, 2*Math.PI);
  ctx.stroke();
  ctx.fillText("目標初始", tx(targetInitialPos[0])+10, ty(targetInitialPos[1]));

  // 目標移動路徑
  if (targetPathData.n === 1) {
    ctx.strokeStyle = "#0a8";
    ctx.beginPath();
    ctx.moveTo(tx(targetInitialPos[0]), ty(targetInitialPos[1]));
    ctx.lineTo(tx(targetPathData.coords[0][0]), ty(targetPathData.coords[0][1]));
    ctx.stroke();
    ctx.fillText("目標路徑", tx(targetPathData.coords[0][0])+10, ty(targetPathData.coords[0][1]));
  }

  if (result) {
    // 命中時目標
    ctx.strokeStyle = "#e55";
    ctx.beginPath();
    ctx.arc(tx(result.targetHitPos[0]), ty(result.targetHitPos[1]), 12, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fillText("命中時目標", tx(result.targetHitPos[0])+10, ty(result.targetHitPos[1]));

    // 箭矢飛行線
    ctx.strokeStyle = "#36f";
    ctx.beginPath();
    ctx.moveTo(tx(firingPos[0]), ty(firingPos[1]));
    ctx.lineTo(tx(result.impactPos[0]), ty(result.impactPos[1]));
    ctx.stroke();

    // 撞擊點
    ctx.fillStyle = "#fa0";
    ctx.beginPath();
    ctx.arc(tx(result.impactPos[0]), ty(result.impactPos[1]), 6, 0, 2*Math.PI);
    ctx.fill();
    ctx.fillText("撞擊點", tx(result.impactPos[0])+10, ty(result.impactPos[1]));
  }
}

// 顯示核心 JS 程式碼
fetch('ballistics.js').then(r=>r.text()).then(code=>{
  document.getElementById('js-code').textContent = code;
});