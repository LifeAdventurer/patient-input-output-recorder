let week = ['日', '一', '二', '三', '四', '五', '六'];
let date = new Date();
let Y = date.getFullYear();
let M = date.getMonth() + 1;
let D = date.getDate();
let h = date.getHours();
let m = date.getMinutes();
let s = date.getSeconds();


const update = {
  data() {
    return {
      date: Y + "." + M + "." + ("0" + D).substr(-2) + " (" + week[date.getDay()] + ")",
      time: ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2) + ":" + ("0" + s).substr(-2)
    };
  },
}
Vue.createApp(update).mount('#clock');
