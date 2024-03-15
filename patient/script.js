Vue.createApp({
  data() {
    return {
      account: '',
      password: '',
      authenticated: false,
      // time bar
      date: ' ',
      time: ' ',
      // record bar content
      options: [
        { value: 50, label: '50' },
        { value: 100, label: '100' },
        { value: 150, label: '150' },
        { value: 200, label: '200' },
        { value: 250, label: '250' },
        { value: 300, label: '300' },
        { value: 350, label: '350' },
        { value: 400, label: '400' }
      ],
      inputFood: 0,
      inputWater: 0,
      inputUrination: 0,
      inputDefecation: 0,
      inputWeight: '',
      records: {},
      url: 'https://tobiichi3227.eu.org/',
      // url: 'http://127.0.0.1:8000/'
      selectedLanguage: 'zh-TW',
      supportedLanguages: [],
      curLangTexts: {},
    }
  },
  created() {
    this.loadSupportedLangs().then(supportedLangs => {
      this.supportedLanguages = supportedLangs;
    });
    this.loadLangTexts().then(langTexts => {
      this.curLangTexts = langTexts;
    });
    const languageCode = localStorage.getItem('selectedLanguageCode');
    if (languageCode !== null && languageCode !== undefined) {
      if (this.supportedLanguages.some(language => language.code === languageCode)) {
        this.selectedLanguage = languageCode;
      } else {
        localStorage.setItem('selectedLanguageCode', this.selectedLanguage);
      }
    }
  },
  methods: {
    initRecords(currentDate) {
      let num = currentDate.split('_');
      this.records[currentDate] = {}
      this.records[currentDate]['data'] = [];
      this.records[currentDate]['recordDate'] = num[1] + '/' + num[2];
      this.records[currentDate]['foodSum'] = 0;
      this.records[currentDate]['waterSum'] = 0;
      this.records[currentDate]['urinationSum'] = 0;
      this.records[currentDate]['defecationSum'] = 0;
      this.records[currentDate]['weight'] = 'NaN';
    },
    async loadSupportedLangs() {
      const response = await fetch('./supported_languages.json');
      const supportedLanguages = await response.json();
      return supportedLanguages;
    },
    async loadLangTexts() {
      const response = await fetch('./lang_texts.json');
      const langTexts = await response.json();
      return langTexts;
    },
    async fetchRecords() {
      const fetchUrl = this.url + '?account=' + this.account + '&password=' + this.password;
      return await fetch(fetchUrl, {
        method: 'GET',
        mode: 'cors',
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          // console.log(data);
          return data;
        })
        .catch(error => {
          console.error(error);
        });
    },
    async authenticate() {
      const fetchedData = await this.fetchRecords();
      // console.log(fetchedData)
      if (fetchedData.hasOwnProperty('message') && fetchedData.message === 'unauthorized') {
        alert(this.curLangText.account_or_password_incorrect)
        this.account = '';
        this.password = '';
      } else {
        this.authenticated = true;
        this.records = fetchedData['account_records'];
        sessionStorage.setItem('account', this.account);
        sessionStorage.setItem('password', this.password);
      }
    },
    confirmLogout() {
      if (confirm(this.curLangText.confirm_logout)) {
        this.account = '';
        this.password = '';
        this.authenticated = false;
        sessionStorage.removeItem('account');
        sessionStorage.removeItem('password');
      }
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
          'type': 'update record',
          'account': this.account,
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
      if (isNaN(this.inputWeight) || this.inputWeight < 0.01 || this.inputWeight > 300) {
        alert(this.curLangText.weight_abnormal)
        return;
      }
      let d = new Date();
      let currentDate = `${d.getFullYear()}_${(d.getMonth() + 1)}_${('0' + d.getDate()).substr(-2)}`;
      if (!this.records[currentDate]) {
        this.initRecords(currentDate);
      }
      this.records[currentDate]['weight'] = `${parseFloat(this.inputWeight).toFixed(2)} kg`;
      // init again
      this.inputWeight = 0;
      // post to database
      this.postData();
    },
    changeLanguage(languageCode) {
      this.selectedLanguage = languageCode;
      localStorage.setItem('selectedLanguageCode', languageCode);
    },
  },
  async mounted() {
    let account = sessionStorage.getItem('account');
    let password = sessionStorage.getItem('password');
    if (account !== null && account !== undefined && password !== null && password !== undefined) {
      this.authenticated = true;
      this.account = account;
      this.password = password;
      const fetchedData = await this.fetchRecords();
      // console.log(fetchedData);
      this.records = fetchedData['account_records'];
    }
    // window.scrollTo(0, document.body.scrollHeight);
    setInterval(() => {
      let d = new Date();
      let dayOfWeek = this.curLangText.day_of_week;
      this.time = ('0' + d.getHours()).substr(-2) + ':' + ('0' + d.getMinutes()).substr(-2) + ':' + ('0' + d.getSeconds()).substr(-2);
      this.date = d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + ('0' + d.getDate()).substr(-2) + ' (' + dayOfWeek[d.getDay()] + ')';
    }, 1000);
  },
  computed: {
    curLangText() {
      return this.curLangTexts[this.selectedLanguage];
    },
    // reversedRecord() {
    //   let dataArray = [];
    //   for (const date in this.records) {
    //     if (this.records.hasOwnProperty(date)) {
    //       dataArray.push({
    //         date: date,
    //         data: this.records[date]
    //       });
    //     }
    //   }

    //   dataArray.sort((a, b) => new Date(b.date) - new Date(a.date));
    //   return dataArray;
    // },
  }
}).mount('#app');