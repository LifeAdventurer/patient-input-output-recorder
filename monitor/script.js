Vue.createApp({
  data() {
    return {
      account: '',
      password: '',
      authenticated: false,
      records: {},
      apiUrl: 'https://tobiichi3227.eu.org/',
    }
  },
  methods: {
    async fetchRecords() {
      const fetchUrl = `${this.apiUrl}?account=${this.account}&password=${this.password}`;
      try {
        const response = await fetch(fetchUrl, {
          method: 'GET',
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        return await response.json();
      } catch (error) {
        throw new Error(error.message);
      }
    },
    async authenticate() {
      const fetchedData = await this.fetchRecords();
      if (fetchedData.hasOwnProperty('message') && fetchedData.message === 'unauthorized') {
        alert('帳號或密碼不正確');
        this.account = '';
        this.password = '';
      } else {
        this.authenticated = true;
        this.records = fetchedData['account_records'];
        sessionStorage.setItem('account', this.account);
        sessionStorage.setItem('password', this.password);
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
      this.records = fetchedData['account_records'];
    }
  },
}).mount('#app');