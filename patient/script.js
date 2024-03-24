Vue.createApp({
  data() {
    return {
      account: '',
      password: '',
      showPassword: false,
      authenticated: false,
      currentDate: '',
      currentTime: '',
      options: [
        {value: 50, label: '50'},
        {value: 100, label: '100'},
        {value: 150, label: '150'},
        {value: 200, label: '200'},
        {value: 250, label: '250'},
        {value: 300, label: '300'},
        {value: 350, label: '350'},
        {value: 400, label: '400'},
      ],
      inputFood: 0,
      inputWater: 0,
      inputUrination: 0,
      inputDefecation: 0,
      inputWeight: 0,
      records: {},
      apiUrl: 'https://tobiichi3227.eu.org/',
      selectedLanguage: 'zh-TW',
      supportedLanguages: [],
      curLangTexts: {},
    };
  },
  async created() {
    this.loadSupportedLanguages();
    this.loadLangTexts();
    this.loadSelectedLanguage();
  },
  methods: {
    initRecords(currentDate) {
      const num = currentDate.split('_');
      this.records[currentDate] = {
        data: [],
        count: 0,
        recordDate: `${num[1]}/${num[2]}`,
        foodSum: 0,
        waterSum: 0,
        urinationSum: 0,
        defecationSum: 0,
        weight: 'NaN',
      };
    },
    async loadSupportedLanguages() {
      const response = await fetch('./supported_languages.json');
      this.supportedLanguages = await response.json();
    },
    async loadLangTexts() {
      const response = await fetch('./lang_texts.json');
      this.curLangTexts = await response.json();
    },
    loadSelectedLanguage() {
      const languageCode = localStorage.getItem('selectedLanguageCode');
      if (languageCode !== null && languageCode !== undefined) {
        if (this.supportedLanguages.some((language) => language.code === languageCode)) {
          this.selectedLanguage = languageCode;
        } else {
          localStorage.setItem('selectedLanguageCode', this.selectedLanguage);
        }
      }
    },
    async fetchRecords() {
      const fetchUrl = this.apiUrl;
      try {
        const response = await fetch(fetchUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            'type': 'fetch patient records',
            'account': this.account,
            'password': this.password,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch record');
        }

        console.log('Successfully fetched the record');
        return await response.json();
      } catch (error) {
        throw new Error(error.message)
      }
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    async authenticate() {
      const fetchedData = await this.fetchRecords();
      if (fetchedData.hasOwnProperty('message') && fetchedData.message === 'Unauthorized') {
        alert(this.curLangText.account_or_password_incorrect);
        this.account = '';
        this.password = '';
      } else if (fetchedData.hasOwnProperty('message') && fetchedData.message === 'Incorrect account type') {
        alert(this.curLangText.account_without_permission);
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
    async postData() {
      const url = this.apiUrl;
      try {
        const response = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            'type': 'update record',
            'account': this.account,
            'password': this.password,
            'data': this.records,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to post data');
        }

        console.log('Data posted successfully');
      } catch (error) {
        throw new Error(error.message)
      }
    },
    async addData() {
      const d = new Date();
      const currentDate = `${d.getFullYear()}_${(d.getMonth() + 1)}_${('0' + d.getDate()).slice(-2)}`;
      // Food, Water, Urination, Defecation
      if (this.inputFood !== 0 || this.inputWater !== 0 || this.inputUrination !== 0 || this.inputDefecation !== 0) {
        if (!this.records[currentDate]) {
          this.initRecords(currentDate);
        }
        const currentData = {
          'time': `${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}`,
          'food': this.inputFood,
          'water': this.inputWater,
          'urination': this.inputUrination,
          'defecation': this.inputDefecation,
        };
        this.records[currentDate]['data'].push(currentData);
        this.records[currentDate]['count'] = this.records[currentDate]['data'].length;
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
        await this.postData();
      }
      const inputWeight = parseFloat(this.inputWeight);
      if (Number.isFinite(inputWeight) && inputWeight !== 0 && (inputWeight < 0.01 || inputWeight > 300)) {
        alert(this.curLangText.weight_abnormal);
      } else if (Number.isFinite(inputWeight) && inputWeight !== 0) {
        if (!this.records[currentDate]) {
          this.initRecords(currentDate);
        }
        this.records[currentDate]['weight'] = `${Math.round(inputWeight * 100) / 100} kg`;
        // init again
        this.inputWeight = 0;
        // post to database
        await this.postData();
      }
    },
    changeLanguage(languageCode) {
      this.selectedLanguage = languageCode;
      localStorage.setItem('selectedLanguageCode', languageCode);
    },
    async removeRecord(target) {
      if (confirm(this.curLangText.confirm_remove_record)) {
        let [date, index] = target.attributes.id.textContent.split('-');

        index = parseInt(index);
        const record = this.records[date]['data'][index];
        this.records[date]['count'] -= 1;
        this.records[date]['defecationSum'] -= record['defecation'];
        this.records[date]['foodSum'] -= record['food'];
        this.records[date]['urinationSum'] -= record['urination'];
        this.records[date]['waterSum'] -= record['water'];
        this.records[date]['data'].splice(index, 1);

        await this.postData();
      }
    },
  },
  async mounted() {
    const url = new URL(location.href);
    const params = url.searchParams;
    let account = null; let password = null;
    if (params.has('acct') && params.has('pw')) {
      account = params.get('acct');
      password = params.get('pw');
    }

    if (account === null && password === null) {
      account = sessionStorage.getItem('account');
      password = sessionStorage.getItem('password');
    }

    if (account !== null && account !== undefined && password !== null && password !== undefined) {
      this.authenticated = false;
      this.account = account;
      this.password = password;
      await this.authenticate();
    }
    setInterval(() => {
      const d = new Date();
      const dayOfWeek = this.curLangText.day_of_week;
      this.currentDate = d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + ('0' + d.getDate()).slice(-2) + ' (' + dayOfWeek[d.getDay()] + ')';
      this.currentTime = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
    }, 1000);
  },
  computed: {
    curLangText() {
      return this.curLangTexts[this.selectedLanguage];
    },
    reversedRecord() {
      const reversedData = {};
      Object.keys(this.records).reverse().forEach((key) => {
        reversedData[key] = this.records[key];
      });
      return reversedData;
    },
  },
}).mount('#app');
