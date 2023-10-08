Vue.createApp({
  data() {
    return {
      date: ' ',
      time: ' ',
      recordDate: ' ',
      weight: '未量測',
      count: 0,
      inputWeight: ' ',
      records: []
    }
  },
  methods: {
    addData() {
      this.records.push(1);
      this.count = this.records.length;
    },
    addWeight() {
      if(isNaN(this.inputWeight) || this.inputWeight <= 0 || this.inputWeight > 300){
        alert('您輸入的體重不正常')
        return;
      }
      this.weight = this.inputWeight + " kg";
    }
  },
  mounted() {
    let week = ['日', '一', '二', '三', '四', '五', '六'];
    setInterval(() => {
      let d = new Date();
      this.time = ("0" + d.getHours()).substr(-2) + ":" + ("0" + d.getMinutes()).substr(-2) + ":" + ("0" + d.getSeconds()).substr(-2);
      this.date = d.getFullYear() + "." + (d.getMonth() + 1) + "." + ("0" + d.getDate()).substr(-2) + " (" + week[d.getDay()] + ")";
      this.recordDate = (d.getMonth() + 1) + "." + ("0" + d.getDate()).substr(-2);
    }, 1000);
  }
}).mount('#app');
