let week = ['日', '一', '二', '三', '四', '五', '六'];

const update = {
  data() {
    return {
      date: ' ',
      time: ' '
    }
  },    
  mounted() {
    setInterval(() => {
      let date = new Date();
      return this.date = date.getFullYear() + "." + (date.getMonth() + 1) + "." + ("0" + date.getDate()).substr(-2) + " (" + week[date.getDay()] + ")";
    }, 1000);
    setInterval(() => {
      let date = new Date();
      return this.time = ("0" + date.getHours()).substr(-2) + ":" + ("0" + date.getMinutes()).substr(-2) + ":" + ("0" + date.getSeconds()).substr(-2);
    }, 1000);
  },
}
Vue.createApp(update).mount('#clock');
