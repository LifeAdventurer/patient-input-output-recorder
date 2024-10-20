Vue.createApp({
  data() {
    return {
      account: "",
      password: "",
      showPassword: false,
      authenticated: false,
      currentDate: "",
      currentTime: "",
      currentDateYY_MM_DD: "",
      dietaryItems: ["food", "water", "urination", "defecation"],
      // Patient
      patientRecords: {},
      patientAccounts: [], // monitoredPatients
      unmonitoredPatients: [],
      patientAccountsWithPasswords: [],
      filteredPatientAccounts: [],
      // QR Code
      qrCodePatient: "",
      qrCodePatientPassword: "",
      //
      searchQuery: "",
      currentDateMMDD: "",
      editingRecordIndex: -1,
      editingRecordPatientAccount: "",
      restrictionText: {},
      showScrollButton: false,
      removingRecord: false,
      // signUpModal
      signUpPatientAccount: "",
      signUpPatientPassword: "",
      signUpPatientSubmitted: false,
    };
  },
  created() {
    this.apiUrl = "https://lifeadventurer.tfcis.org/";
    // this.apiUrl = "http://localhost:8000/";
    this.dietaryItems = ["food", "water", "urination", "defecation"];
    this.keysToFilter = {
      isEditing: false,
      limitAmount: "",
      foodCheckboxChecked: false,
      waterCheckboxChecked: false,
    };
    this.isEditingRestriction = false;
    this.tempPatientRecord = {};
    this.currentEditingPatient = "";
    this.confirming = false;
  },
  methods: {
    async loadAPIEvents() {
      const response = await fetch("./events.json")
      this.events = await response.json()
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    async postRequest(payload) {
      try {
        const response = await fetch(this.apiUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to post request.");
        }

        console.log("Successfully posted the request.");
        return await response.json();
      } catch (error) {
        throw new Error(error.message);
      }
    },
    processFetchedData(fetchedData) {
      this.patientRecords = fetchedData["patient_records"];
      this.patientAccountsWithPasswords = fetchedData["patient_accounts"];
      this.patientAccounts = this.patientAccountsWithPasswords.map(account => account[0]);
      this.patientAccounts.forEach((patientAccount) => {
        let modified = false;
        Object.entries(this.keysToFilter).forEach(([key, value]) => {
          if (!(key in this.patientRecords[patientAccount])) {
            this.patientRecords[patientAccount][key] = value;
            modified = true;
          }
        });
        if (modified) {
          this.updateRecords(patientAccount);
        }
        this.updateRestrictionText(patientAccount);
      });
    },
    async updateRecords(patientAccount) {
      const payload = {
        event: this.events.UPDATE_RECORD,
        account: this.account,
        password: this.password,
        patient: patientAccount,
        data: this.patientRecords[patientAccount],
      };
      const { message } = await this.postRequest(payload);
      if (message === this.events.messages.UPDATE_RECORD_SUCCESS) {
        console.log(message);
      } else {
        console.error("Error:", message);
      }
    },
    async fetchUnmonitoredPatients() {
      const payload = {
        event: this.events.FETCH_UNMONITORED_PATIENTS,
        account: this.account,
        password: this.password,
      };
      const response = await this.postRequest(payload);
      if (response.message === this.events.messages.FETCH_UNMONITORED_PATIENTS_SUCCESS) {
        this.unmonitoredPatients = response["unmonitored_patients"].map(patient => patient[1]);
      } else {
        console.error(response.message);
      }
    },
    async addPatientToMonitor(index) {
      const payload = {
        event: this.events.ADD_PATIENT,
        account: this.account,
        password: this.password,
        patient: this.unmonitoredPatients[index],
      };
      const { message } = await this.postRequest(payload);
      if (message === this.events.messages.ADD_PATIENT_SUCCESS) {
        console.log(message);
        await this.fetchUnmonitoredPatients();
      } else {
        console.error(message);
      }
    },
    async authenticate() {
      const fetchedData = await this.postRequest({
          event: this.events.FETCH_MONITORING_PATIENTS,
          account: this.account,
          password: this.password,
      });
      if (Object.prototype.hasOwnProperty.call(fetchedData, "message")) {
        switch (fetchedData.message) {
          case this.events.messages.ACCT_NOT_EXIST:
            alert("帳號不存在");
            this.account = "";
            this.password = "";
            break;
          case this.events.messages.AUTH_FAIL_PASSWORD:
            alert("密碼錯誤");
            this.password = "";
            break;
          case this.events.messages.INVALID_ACCT_TYPE:
            alert("此帳號沒有管理權限");
            this.account = "";
            this.password = "";
            break;
          default:
            this.authenticated = true;
            sessionStorage.setItem("account", this.account);
            sessionStorage.setItem("password", this.password);

            this.processFetchedData(fetchedData);
            this.filteredPatientAccounts = this.patientAccounts;
            await this.fetchUnmonitoredPatients()
        }
      }
    },
    async signUpPatient() {
      this.signUpPatientSubmitted = true;

      const form = document.getElementById("signUpModal").querySelector("form");

      if (form.checkValidity()) {
        const payload = {
          event: this.events.SIGN_UP_PATIENT,
          account: this.account,
          password: this.password,
          patient: this.signUpPatientAccount,
          patient_password: this.signUpPatientPassword,
        };
        const response = await this.postRequest(payload);
        if (response.message === this.events.messages.ACCT_ALREADY_EXISTS) {
          alert("此帳號已被註冊。");
          this.signUpPatientAccount = "";
          this.signUpPatientPassword = "";
        } else {
          alert("註冊成功。");
          const signUpModal = document.getElementById("signUpModal");
          const modalInstance = bootstrap.Modal.getInstance(signUpModal);
          modalInstance.hide();

          // Reset form and state
          this.signUpPatientAccount = "";
          this.signUpPatientPassword = "";
          this.signUpPatientSubmitted = false;
        }
      }
    },
    searchPatient: _.debounce(function () {
      if (this.searchQuery.trim() === "") {
        this.filteredPatientAccounts = this.patientAccounts;
        return;
      }
      this.filteredPatientAccounts = this.patientAccounts.filter(
        (patientAccount) => {
          return patientAccount
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase());
        }
      );
    }, 200),
    getFirstAndLastDates(patientAccount) {
      const keys = Object.keys(this.patientRecords[patientAccount]).filter(
        (key) => {
          return !(key in this.keysToFilter);
        }
      );
      if (keys.length === 0) {
        return "無紀錄";
      }
      const firstDate = keys[0].replace(/_/g, "/");
      const lastDate = keys[keys.length - 1].replace(/_/g, "/");
      return `${firstDate} ~ ${lastDate}`;
    },
    openQrCodeModal(index) {
      const account = this.filteredPatientAccounts[index];
      const [patient, patient_password] = this.patientAccountsWithPasswords.find(p => p[0] === account);
      this.qrCodePatient = patient;
      this.qrCodePatientPassword = patient_password;

      const qrCodeContainer = document.getElementById("qrCodeContainer");
      qrCodeContainer.innerHTML = "";
      const qrData = `https://lifeadventurer.github.io/patient-input-output-recorder/patient/?acct=${patient}&pw=${patient_password}`;
      const qrCode = new QRCode(qrCodeContainer);
      qrCode.makeCode(qrData);

      const qrCodeModal = document.getElementById("qrCodeModal");
      const modalInstance = new bootstrap.Modal(qrCodeModal);
      modalInstance.show();
    },
    updateRestrictionText(patientAccount) {
      const limitAmount = String(
        this.patientRecords[patientAccount]["limitAmount"]
      ).trim();
      if (!isNaN(limitAmount) && limitAmount !== "") {
        let text;
        if (
          this.patientRecords[patientAccount]["foodCheckboxChecked"] &&
          this.patientRecords[patientAccount]["waterCheckboxChecked"]
        ) {
          text = `限制進食加喝水不超過${this.patientRecords[patientAccount]["limitAmount"]}公克`;
        } else if (this.patientRecords[patientAccount]["foodCheckboxChecked"]) {
          text = `限制進食不超過${this.patientRecords[patientAccount]["limitAmount"]}公克`;
        } else if (
          this.patientRecords[patientAccount]["waterCheckboxChecked"]
        ) {
          text = `限制喝水不超過${this.patientRecords[patientAccount]["limitAmount"]}公克`;
        }
        this.restrictionText[patientAccount] = text;
      } else {
        this.restrictionText[patientAccount] = "";
      }
    },
    toggleRestrictionEdit(patientAccount) {
      const limitAmount = String(
        this.patientRecords[patientAccount]["limitAmount"]
      ).trim();
      if (this.patientRecords[patientAccount]["isEditing"]) {
        if (
          !this.patientRecords[patientAccount]["foodCheckboxChecked"] &&
          !this.patientRecords[patientAccount]["waterCheckboxChecked"]
        ) {
          if (isNaN(limitAmount)) {
            alert("請勾選選項並輸入數字");
            return;
          } else if (limitAmount !== "") {
            alert("請勾選選項");
            return;
          }
        } else if (isNaN(limitAmount) || limitAmount === "") {
          alert("請輸入數字");
          return;
        } else if (limitAmount.startsWith("-") || limitAmount.startsWith(".")) {
          alert("請輸入正整數");
          return;
        }
      }
      this.patientRecords[patientAccount]["isEditing"] =
        !this.patientRecords[patientAccount]["isEditing"];
      if (!this.patientRecords[patientAccount]["isEditing"]) {
        if (limitAmount !== "") {
          this.updateRestrictionText(patientAccount);
          this.currentEditingPatient = "";
        }
        this.updateRecords(patientAccount);
        this.isEditingRestriction = false;
      } else {
        this.isEditingRestriction = true;
        if (
          this.currentEditingPatient !== "" &&
          patientAccount !== this.currentEditingPatient
        ) {
          this.patientRecords[this.currentEditingPatient]["isEditing"] = false;
          this.updateRestrictionText(this.currentEditingPatient);
          this.updateRecords(this.currentEditingPatient);
        }
        this.currentEditingPatient = patientAccount;
      }
    },
    async toggleRecordEdit(target, patientAccount) {
      const [date, recordIndex] = target.attributes.id.textContent.split("-");
      const record =
        this.patientRecords[patientAccount][date]["data"][recordIndex];
      if (this.editingRecordIndex === -1) {
        this.editingRecordIndex = parseInt(recordIndex);
        this.editingRecordPatientAccount = patientAccount;
        for (dietaryItem of this.dietaryItems) {
          this.tempPatientRecord[dietaryItem] = record[dietaryItem];
        }
      } else {
        this.editingRecordIndex = -1;
        this.editingRecordPatientAccount = "";
        for (dietaryItem of this.dietaryItems) {
          if (record[dietaryItem] === "") {
            record[dietaryItem] = 0;
          }
          this.patientRecords[patientAccount][date][`${dietaryItem}Sum`] +=
            record[dietaryItem] - this.tempPatientRecord[dietaryItem];
        }
        await this.updateRecords(patientAccount);
        if (
          this.dietaryItems.every((dietaryItem) => record[dietaryItem] === 0)
        ) {
          await this.removeRecord(target, patientAccount);
        }
      }
    },
    handleInput(value, patientAccount) {
      const intValue = parseInt(value);
      if (!isNaN(intValue)) {
        this.patientRecords[patientAccount]["limitAmount"] = intValue;
      }
    },
    getFoodSumColor(patientAccount) {
      let exceed = false;
      const patientRecord = this.patientRecords[patientAccount];
      if (patientRecord["foodCheckboxChecked"]) {
        exceed =
          patientRecord[this.currentDateYY_MM_DD]["foodSum"] +
            (patientRecord["waterCheckboxChecked"]
              ? patientRecord[this.currentDateYY_MM_DD]["waterSum"]
              : 0) >
          patientRecord["limitAmount"];
      }
      return exceed ? "red" : "inherit";
    },
    getWaterSumColor(patientAccount) {
      let exceed = false;
      const patientRecord = this.patientRecords[patientAccount];
      if (patientRecord["waterCheckboxChecked"]) {
        exceed =
          patientRecord[this.currentDateYY_MM_DD]["waterSum"] +
            (patientRecord["foodCheckboxChecked"]
              ? patientRecord[this.currentDateYY_MM_DD]["foodSum"]
              : 0) >
          patientRecord["limitAmount"];
      }
      return exceed ? "red" : "inherit";
    },
    confirmLogout() {
      if (confirm("請確認是否要登出")) {
        this.account = "";
        this.password = "";
        this.authenticated = false;
        sessionStorage.removeItem("account");
        sessionStorage.removeItem("password");
      }
    },
    async removeRecord(target, patientAccount) {
      this.confirming = true;
      const [date, index] = target.attributes.id.textContent.split("-");
      const record = this.patientRecords[patientAccount][date]["data"][index];
      const confirmMessageLines = [
        "請確認是否移除這筆資料:",
        `床號: ${patientAccount}`,
        `日期: ${date.replaceAll("_", "/")}`,
        `時間: ${record['time']}`,
        `進食: ${record['food']}`,
        `喝水: ${record['water']}`,
        `排尿: ${record['urination']}`,
        `排便: ${record['defecation']}`
      ];
      const confirmMessage = confirmMessageLines.join('\n');
      if (confirm(confirmMessage)) {
        this.removingRecord = true;

        this.patientRecords[patientAccount][date]["count"] -= 1;
        for (dietaryItem of this.dietaryItems) {
          this.patientRecords[patientAccount][date][`${dietaryItem}Sum`] -=
            record[dietaryItem];
        }
        this.patientRecords[patientAccount][date]["data"].splice(index, 1);

        await this.updateRecords(patientAccount);
        this.removingRecord = false;
      }
      this.confirming = false;
    },
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
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
    await this.loadAPIEvents();
    const url = new URL(location.href);
    const params = url.searchParams;
    const account = params.has("acct")
      ? params.get("acct")
      : sessionStorage.getItem("account");
    const password = params.has("pw")
      ? params.get("pw")
      : sessionStorage.getItem("password");

    if (account && password) {
      this.authenticated = false;
      this.account = account;
      this.password = password;
      await this.authenticate();
    }

    setInterval(() => {
      const d = new Date();
      const dayOfWeek = ["日", "一", "二", "三", "四", "五", "六"];
      this.currentDate = `${d.getFullYear()}.${d.getMonth() + 1}.${(
        "0" + d.getDate()
      ).slice(-2)} (${dayOfWeek[d.getDay()]})`;
      this.currentTime = `${("0" + d.getHours()).slice(-2)}:${(
        "0" + d.getMinutes()
      ).slice(-2)}:${("0" + d.getSeconds()).slice(-2)}`;
      this.currentDateYY_MM_DD = `${d.getFullYear()}_${d.getMonth() + 1}_${(
        "0" + d.getDate()
      ).slice(-2)}`;
    }, 1000);

    setInterval(async () => {
      if (
        this.authenticated &&
        !this.isEditingRestriction &&
        this.editingRecordIndex === -1 &&
        !this.confirming
      ) {
        const fetchedData = await this.postRequest({
          event: this.events.FETCH_MONITORING_PATIENTS,
          account: this.account,
          password: this.password,
        });
        if (
          !this.confirming &&
          Object.prototype.hasOwnProperty.call(fetchedData, "message") &&
          fetchedData.message === this.events.messages.FETCH_MONITORING_PATIENTS_SUCCESS
        ) {
          this.processFetchedData(fetchedData);
          this.searchPatient();
        }
      }
      await this.fetchUnmonitoredPatients();
    }, 3000);

    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  computed: {
    reversedPatientRecords() {
      const reversedData = {};
      Object.keys(this.patientRecords).forEach((patientAccount) => {
        const reversedRecord = {};
        Object.keys(this.patientRecords[patientAccount])
          .reverse()
          .forEach((key) => {
            if (!(key in this.keysToFilter)) {
              reversedRecord[key] = this.patientRecords[patientAccount][key];
            }
          });
        reversedData[patientAccount] = reversedRecord;
      });
      return reversedData;
    },
  },
}).mount("#app");
