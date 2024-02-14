Vue.createApp({
  data() {
    return {
      password: '',
      authenticated: false,
      // time bar
      date: ' ',
      time: ' ',
      // record bar content
      inputFood: 0,
      inputWater: 0,
      inputUrination: 0,
      inputDefecation: 0,
      inputWeight: '',
      records: {},
      url: 'https://tobiichi3227.eu.org/'
    }
  },
  methods: {
    initRecords(currentDate) {
      let num = currentDate.split('_');
      this.records[currentDate] = {}
      this.records[currentDate]['data'] = [];
      this.records[currentDate]['recordDate'] = num[1] + '.' + num[2];
      this.records[currentDate]['foodSum'] = 0;
      this.records[currentDate]['waterSum'] = 0;
      this.records[currentDate]['urinationSum'] = 0;
      this.records[currentDate]['defecationSum'] = 0;
      this.records[currentDate]['weight'] = '未量測';
    },
    authenticate() {
      const fetchUrl = this.url + '?password=' + this.password;
      fetch(fetchUrl, {
        method: 'GET',
        mode: 'cors',
      })
        .then(response => {
          // fix this later
          // if (!response.ok) {
          //   throw new Error('Network response was not ok');
          // }
          return response.json();
        })
        .then(data => {
          if (data.hasOwnProperty('message') && data.message === 'wrong password') {
            alert('密碼錯誤')
            this.password = '';
          } else {
            this.authenticated = true;
            this.records = JSON.parse(data['record']);
          }
        })
        .catch(error => {
          console.error(error);
        });
    },
    postData() {
      const url = this.url;
      fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'password': this.password,
          'data': this.records
        })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to post data');
          }
          console.log('Data posted successfully');
        })
        .catch(error => {
          console.error(error);
        });
    },
    addData() {
      if (this.inputFood == 0 && this.inputWater == 0 && this.inputUrination == 0 && this.inputDefecation == 0) {
        // alert('您尚未輸入數據');
        return;
      }
      let d = new Date();
      let currentDate = d.getFullYear() + '_' + (d.getMonth() + 1) + '_' + ('0' + d.getDate()).substr(-2);
      if (!this.records[currentDate]) {
        this.initRecords(currentDate);
      }
      let currentData = {
        'time': (('0' + d.getHours()).substr(-2) + ':' + ('0' + d.getMinutes()).substr(-2)),
        'food': this.inputFood,
        'water': this.inputWater,
        'urination': this.inputUrination,
        'defecation': this.inputDefecation
      };
      this.records[currentDate]['data'].push(currentData);
      this.records[currentDate]['count'] = this.records[currentDate]['data'].length;
      // console.table(this.records[currentDate]);
      // sums
      this.records[currentDate]['foodSum'] += parseInt(this.inputFood);
      this.records[currentDate]['waterSum'] += parseInt(this.inputWater);
      this.records[currentDate]['urinationSum'] += parseInt(this.inputUrination);
      this.records[currentDate]['defecationSum'] += parseInt(this.inputDefecation);
      // init again
      this.inputFood = 0;
      this.inputWater = 0;
      this.inputUrination = 0;
      this.inputDefecation = 0;
      // post to database
      this.postData();
    },
    addWeight() {
      if (isNaN(this.inputWeight) || this.inputWeight <= 0 || this.inputWeight > 300) {
        alert('您輸入的體重不正常')
        return;
      }
      let d = new Date();
      let currentDate = d.getFullYear() + '_' + (d.getMonth() + 1) + '_' + ('0' + d.getDate()).substr(-2);
      if (!this.records[currentDate]) {
        this.initRecords(currentDate);
      }
      this.records[currentDate]['weight'] = Math.round(this.inputWeight * 100) / 100 + ' kg';
      // init again
      this.inputWeight = 0;
      // post to database
      this.postData();
    },
    // toggleAccordion() {

    // },
  },
  mounted() {
    let week = ['日', '一', '二', '三', '四', '五', '六'];
    // window.scrollTo(0, document.body.scrollHeight);
    setInterval(() => {
      let d = new Date();
      this.time = ('0' + d.getHours()).substr(-2) + ':' + ('0' + d.getMinutes()).substr(-2) + ':' + ('0' + d.getSeconds()).substr(-2);
      this.date = d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + ('0' + d.getDate()).substr(-2) + ' (' + week[d.getDay()] + ')';
    }, 1000);
  },
  // computed: {
  //   reversedRecord() {
  //     let dataArray = [];
  //     for (const date in this.records) {
  //       if (this.records.hasOwnProperty(date)) {
  //         dataArray.push({
  //           date: date,
  //           data: this.records[date]
  //         });
  //       }
  //     }

  //     dataArray.sort((a, b) => new Date(b.date) - new Date(a.date));
  //     return dataArray;
  //   }
  // }
}).mount('#app');