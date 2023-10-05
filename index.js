let DATE = document.getElementById("DATE"); 
let TIME = document.getElementById("TIME"); 

function clock() {
  let date = new Date();
  let Y = date.getFullYear();
  let M = date.getMonth() + 1;
  let D = date.getDate();
  let h = date.getHours();
  let m = date.getMinutes();
  let s = date.getSeconds();
  DATE.textContent = Y + "-" + M + "-" + ("0" + D).substr(-2);
  TIME.textContent = ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2) + ":" + ("0" + s).substr(-2);
}

setInterval(clock, 1000)