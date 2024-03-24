Vue.createApp({
  data() {
    return {
      account: '',
      password: '',
      showPassword: false,
      authenticated: false,
      currentDate: '',
      currentTime: '',
      patientRecords: {},
      patientAccounts: [],
      currentDateMMDD: '', 
      apiUrl: 'https://tobiichi3227.eu.org/',
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
        alert('帳號或密碼不正確');
        this.account = '';
        this.password = '';
      } else if (fetchedData.hasOwnProperty('message') && fetchedData.message === 'Incorrect account type') {
        alert('此帳號沒有管理權限')
        this.account = '';
        this.password = '';
      } else {
        this.authenticated = true;
        this.patientRecords = fetchedData['patient_records'];
        this.patientAccounts = fetchedData['patient_accounts'];
        sessionStorage.setItem('account', this.account);
        sessionStorage.setItem('password', this.password);
      }
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
      this.authenticated = true;
      this.account = account;
      this.password = password;
      const fetchedData = await this.fetchRecords();
      if (fetchedData.hasOwnProperty('message') && fetchedData.message === 'Unauthorized') {
        alert('帳號或密碼不正確');
        this.authenticated = false;
        this.account = '';
        this.password = '';
      } else if (fetchedData.hasOwnProperty('message') && fetchedData.message === 'Incorrect account type') {
        alert('此帳號沒有管理權限')
        this.authenticated = false;
        this.account = '';
        this.password = '';
      } else {
        this.patientRecords = fetchedData['patient_records'];
        this.patientAccounts = fetchedData['patient_accounts'];
      }
    }
    setInterval(() => {
      const d = new Date();
      const dayOfWeek = ["日", "一", "二", "三", "四", "五", "六"];
      this.currentDate = d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + ('0' + d.getDate()).slice(-2) + ' (' + dayOfWeek[d.getDay()] + ')';
      this.currentTime = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
      this.currentDateYY_MM_DD = `${d.getFullYear()}_${(d.getMonth() + 1)}_${('0' + d.getDate()).slice(-2)}`;
    }, 1000);
  },
}).mount('#app');