Vue.createApp({
  data() {
    return {
      date: ' ',
      time: ' ',
      recordDate: ' ',
      weight: '未量測',
      count: 0,
      inputFood: 0,
      inputWater: 0,
      inputUrination: 0,
      inputDefecation: 0,
      inputWeight: '',
      records: [],
      foodSum: 0,
      waterSum: 0,
      urinationSum: 0,
      defecationSum: 0
    }
  },
  methods: {
    addData() {
      let d = new Date();
      let currentData = {
        "timeStamp": (("0" + d.getHours()).substr(-2) + ":" + ("0" + d.getMinutes()).substr(-2)),
        "food": this.inputFood,
        "water": this.inputWater,
        "unrination": this.inputUrination,
        "defecation": this.inputDefecation
      };
      this.records.push(currentData);
      
      this.foodSum += parseInt(this.inputFood);
      this.waterSum += parseInt(this.inputWater);
      this.urinationSum += parseInt(this.inputUrination);
      this.defecationSum += parseInt(this.inputDefecation);
      
      console.table(this.records);
      this.count = this.records.length;
    },
    addWeight() {
      if(isNaN(this.inputWeight) || this.inputWeight <= 0 || this.inputWeight > 300){
        alert('您輸入的體重不正常')
        return;
      }
      this.weight = Math.round(this.inputWeight * 100) / 100 + " kg";
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
