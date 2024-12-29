/*
document.getElementById("list").innerHTML = "網站仍在完善中 請等待314159265358979年";
*/


/*
const element=document.querySelector('.text');
const text = window.getComputedStyle();
const tw= text.getPropertyValue('--textw')
*/

/*
document.getElementsByClassName("icon")[0].innerHTML += desiredText.link('../web/利姆露的網路領域-首頁.html');
*/






console.log("JavaScript 已加載");

document.addEventListener("DOMContentLoaded", function() {
 const jsT = document.getElementsByClassName("text")[0];  
 if (jsT) {
     const jsTC = jsT.innerText;
     const jsTN = jsTC.length;
     console.log('文本長度:', jsTN);

     document.documentElement.style.setProperty('--pnl', jsTN);

     const pnlValue = getComputedStyle(document.documentElement).getPropertyValue('--pnl');
     console.log('設置的 --pnl 值:', pnlValue);
 } else {
     console.error("未能找到元素 .text");
 }
});







/*
const textx = document.getElementsByClassName("text");
const textw = textx[0].offsetWidth + 'px';
console.log(textw)
const text = document.querySelector('.text');
text.style.setProperty('--textw', 'textw');

const text = document.querySelector('.text');
text.style.setProperty('--pnl', 'pnl');
*/

