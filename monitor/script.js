Vue.createApp({
  data() {
    return {
      account: '',
      password: '',
      showPassword: false,
      authenticated: false,
      currentDate: '',
      currentTime: '',
      currentDateYY_MM_DD: '',
      patientRecords: {},
      patientAccounts: [],
      filteredPatientAccounts: [],
      searchQuery: '',
      currentDateMMDD: '',
      keysToFilter: {
        'isEditing': false,
        'limitAmount': '',
        'foodCheckboxChecked': false,
        'waterCheckboxChecked': false
      },
      isEditing: false,
      restrictionContext: {},
      apiUrl: 'https://tobiichi3227.eu.org/',
      showScrollButton: false,
    }
  },
  methods: {
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
            'type': 'fetch monitoring account records',
            'account': this.account,
            'password': this.password,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch record');
        }

        console.log('Successfully fetched the record');
        return await response.json();
      } catch (error) {
        throw new Error(error.message);
      }
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    async postData(patientAccount) {
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
            'type': 'update patient record from monitor',
            'account': this.account,
            'password': this.password,
            'patient_account': patientAccount,
            'data': this.patientRecords[patientAccount],
          }),
        });

        if (!response.ok) {
          console.error('Network response was not ok, failed to post data');
          return false;
        }

        const { message } = await response.json();
        if (message === 'Update Success') {
          console.log('Data posted successfully');
          return true;
        } else {
          console.error('Error:', message);
          return false;
        }
      } catch (error) {
        console.error('Error during posting data:', error);
        return false;
      }
    },
    async authenticate() {
      const fetchedData = await this.fetchRecords();
      if (fetchedData.hasOwnProperty('message')) {
        switch (fetchedData.message) {
          case 'Nonexistent account':
            alert('帳號不存在');
            this.account = '';
            this.password = '';
            break;
          case 'Incorrect password':
            alert('密碼錯誤');
            this.password = '';
            break;
          case 'Incorrect account type':
            alert('此帳號沒有管理權限');
            this.account = '';
            this.password = '';
            break;
          default:
            this.authenticated = true;
            this.patientRecords = fetchedData['patient_records'];
            this.patientAccounts = fetchedData['patient_accounts'];
            this.patientAccounts.forEach(patientAccount => {
              let modified = false;
              Object.entries(this.keysToFilter).forEach(([key, value]) => {
                if (!(key in this.patientRecords[patientAccount])) {
                  this.patientRecords[patientAccount][key] = value;
                  modified = true;
                }
              });
              if (modified) {
                this.postData(patientAccount);
              }
              this.updateRestrictionContext(patientAccount);
            });

            this.filteredPatientAccounts = this.patientAccounts;
            sessionStorage.setItem('account', this.account);
            sessionStorage.setItem('password', this.password);
        }
      }
    },
    searchPatient: _.debounce(function() {
      if (this.searchQuery.trim() === '') {
        this.filteredPatientAccounts = this.patientAccounts;
        return;
      }
      this.filteredPatientAccounts = this.patientAccounts.filter(patientAccount => {
        return patientAccount.toLowerCase().includes(this.searchQuery.toLowerCase());
      });
    }, 200),
    getFirstAndLastDates(patientAccount) {
      const keys = Object.keys(this.patientRecords[patientAccount]).filter(key => {
        return !(key in this.keysToFilter);
      });
      if (keys.length === 0) {
        return '無紀錄';
      }
      const firstDate = keys[0].replace(/_/g, '/');
      const lastDate = keys[keys.length - 1].replace(/_/g, '/');
      return `${firstDate} ~ ${lastDate}`;
    },
    updateRestrictionContext(patientAccount) {
      let context;
      if (this.patientRecords[patientAccount]['foodCheckboxChecked'] && this.patientRecords[patientAccount]['waterCheckboxChecked']) {
        context = `限制進食加喝水不超過${this.patientRecords[patientAccount]['limitAmount']}公克`
      } else if (this.patientRecords[patientAccount]['foodCheckboxChecked']) {
        context = `限制進食不超過${this.patientRecords[patientAccount]['limitAmount']}公克`
      } else {
        context = `限制喝水不超過${this.patientRecords[patientAccount]['limitAmount']}公克`
      }
      this.restrictionContext[patientAccount] = context;
    },
    toggleEdit(patientAccount) {
      if (this.patientRecords[patientAccount]['isEditing'] && !this.patientRecords[patientAccount]['foodCheckboxChecked'] && !this.patientRecords[patientAccount]['waterCheckboxChecked']) {
        alert('請勾選選項');
        return;
      }
      this.patientRecords[patientAccount]['isEditing'] = !this.patientRecords[patientAccount]['isEditing'];
      if (!this.patientRecords[patientAccount]['isEditing']) {
        this.updateRestrictionContext(patientAccount);
        this.postData(patientAccount);
        this.isEditing = false;
      } else {
        this.isEditing = true;
      }
    },
    handleInput(value, patientAccount) {
      this.patientRecords[patientAccount]['limitAmount'] = parseInt(value);
    },
    confirmLogout() {
      if (confirm('請確認是否要登出')) {
        this.account = '';
        this.password = '';
        this.authenticated = false;
        sessionStorage.removeItem('account');
        sessionStorage.removeItem('password');
      }
    },
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    },
    handleScroll() {
      if (window.scrollY > 20) {
        this.showScrollButton = true;
      } else {
        this.showScrollButton = false;
      }
    },
  },
  async mounted() {
    const url = new URL(location.href);
    const params = url.searchParams;
    let account = params.has('acct') ? params.get('acct') : sessionStorage.getItem('account');
    let password = params.has('pw') ? params.get('pw') : sessionStorage.getItem('password');

    if (account && password) {
      this.authenticated = false;
      this.account = account;
      this.password = password;
      await this.authenticate();
    }

    setInterval(() => {
      const d = new Date();
      const dayOfWeek = ["日", "一", "二", "三", "四", "五", "六"];
      this.currentDate = `${d.getFullYear()}.${d.getMonth() + 1}.${('0' + d.getDate()).slice(-2)} (${dayOfWeek[d.getDay()]})`;
      this.currentTime = `${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}:${('0' + d.getSeconds()).slice(-2)}`;
      this.currentDateYY_MM_DD = `${d.getFullYear()}_${d.getMonth() + 1}_${('0' + d.getDate()).slice(-2)}`;
    }, 1000);

    setInterval(async () => {
      if (this.authenticated && !this.isEditing) {
        const fetchedData = await this.fetchRecords();
        if (fetchedData.hasOwnProperty('message') && fetchedData.message === 'Fetch Success') {
          this.patientRecords = fetchedData['patient_records'];
        }
      }
    }, 3000);

    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  computed: {
    reversedPatientRecords() {
      const reversedData = {};
      Object.keys(this.patientRecords).forEach((patientAccount) => {
        const reversedRecord = {};
        Object.keys(this.patientRecords[patientAccount]).reverse().forEach((key) => {
          reversedRecord[key] = this.patientRecords[patientAccount][key];
        });
        reversedData[patientAccount] = reversedRecord;
      });
      return reversedData;
    },
  },
}).mount('#app');