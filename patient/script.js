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
      restrictionText: "",
      options: [
        { value: 50, label: "50" },
        { value: 100, label: "100" },
        { value: 150, label: "150" },
        { value: 200, label: "200" },
        { value: 250, label: "250" },
        { value: 300, label: "300" },
        { value: 350, label: "350" },
        { value: 400, label: "400" },
      ],
      dietaryItems: ["food", "water", "urination", "defecation"],
      inputFood: 0,
      inputWater: 0,
      inputUrination: 0,
      inputDefecation: 0,
      customInputFood: "",
      customInputWater: "",
      customInputUrination: "",
      inputWeight: 0,
      showNotification: false,
      records: {},
      selectedLanguage: "zh-TW",
      supportedLanguages: [],
      curLangTexts: {},
      showScrollButton: false,
      removingRecord: false,
    };
  },
  async created() {
    this.apiUrl = "https://lifeadventurer.tfcis.org/";
    // this.apiUrl = "http://localhost:8000/";
    this.dietaryItems = ["food", "water", "urination", "defecation"];
    this.confirming = false;
    await this.loadAPIEvents();
    await this.loadSupportedLanguages();
    await this.loadLangTexts();
    this.loadSelectedLanguage();
  },
  methods: {
    initRecords(currentDate) {
      const num = currentDate.split("_");
      this.records[currentDate] = {
        data: [],
        count: 0,
        recordDate: `${num[1]}/${num[2]}`,
        foodSum: 0,
        waterSum: 0,
        urinationSum: 0,
        defecationSum: 0,
        weight: "NaN",
      };
    },
    async loadAPIEvents() {
      const response = await fetch("./events.json")
      this.events = await response.json()
    },
    async loadSupportedLanguages() {
      const response = await fetch("./supported_languages.json");
      this.supportedLanguages = await response.json();
    },
    async loadLangTexts() {
      const response = await fetch("./lang_texts.json");
      this.curLangTexts = await response.json();
    },
    loadSelectedLanguage() {
      const languageCode = localStorage.getItem("selectedLanguageCode");
      if (
        languageCode &&
        this.supportedLanguages.some(
          (language) => language.code === languageCode
        )
      ) {
        this.selectedLanguage = languageCode;
      } else {
        localStorage.setItem("selectedLanguageCode", this.selectedLanguage);
      }
    },
    async fetchRecords() {
      const fetchUrl = this.apiUrl;
      try {
        const response = await fetch(fetchUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: this.events.FETCH_RECORD,
            account: this.account,
            password: this.password,
            patient: this.account,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch records.");
        }

        console.log("Successfully fetched the records.");
        return await response.json();
      } catch (error) {
        throw new Error(error.message);
      }
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    processRestrictionText() {
      if (
        !isNaN(this.records["limitAmount"]) &&
        String(this.records["limitAmount"]).trim() !== ""
      ) {
        const text = [];
        if (
          this.records["foodCheckboxChecked"] &&
          this.records["waterCheckboxChecked"]
        ) {
          text.push(this.curLangText.limit_food_and_water_to_no_more_than);
        } else if (this.records["foodCheckboxChecked"]) {
          text.push(this.curLangText.limit_food_to_no_more_than);
        } else if (this.records["waterCheckboxChecked"]) {
          text.push(this.curLangText.limit_water_to_no_more_than);
        }
        text.push(this.records["limitAmount"], this.curLangText.grams);
        this.restrictionText = text.join("");
      }
    },
    async authenticate() {
      const fetchedData = await this.fetchRecords();
      if (Object.prototype.hasOwnProperty.call(fetchedData, "message")) {
        switch (fetchedData.message) {
          case this.events.messages.ACCT_NOT_EXIST:
            alert(this.curLangText.nonexistent_account);
            this.account = "";
            this.password = "";
            break;
          case this.events.messages.AUTH_FAIL_PASSWORD:
            alert(this.curLangText.incorrect_password);
            this.password = "";
            break;
          case this.events.messages.INVALID_ACCT_TYPE:
            alert(this.curLangText.account_without_permission);
            this.account = "";
            this.password = "";
            break;
          default:
            this.authenticated = true;
            this.records = fetchedData["account_records"];
            this.processRestrictionText();
            sessionStorage.setItem("account", this.account);
            sessionStorage.setItem("password", this.password);
        }
      }
    },
    getFoodSumColor() {
      let exceed = false;
      if (this.records["foodCheckboxChecked"]) {
        exceed =
          this.records[this.currentDateYY_MM_DD]["foodSum"] +
            (this.records["waterCheckboxChecked"]
              ? this.records[this.currentDateYY_MM_DD]["waterSum"]
              : 0) >
          this.records["limitAmount"];
      }
      return exceed ? "red" : "inherit";
    },
    getWaterSumColor() {
      let exceed = false;
      if (this.records["waterCheckboxChecked"]) {
        exceed =
          this.records[this.currentDateYY_MM_DD]["waterSum"] +
            (this.records["foodCheckboxChecked"]
              ? this.records[this.currentDateYY_MM_DD]["foodSum"]
              : 0) >
          this.records["limitAmount"];
      }
      return exceed ? "red" : "inherit";
    },
    confirmLogout() {
      if (confirm(this.curLangText.confirm_logout)) {
        this.account = "";
        this.password = "";
        this.authenticated = false;
        sessionStorage.removeItem("account");
        sessionStorage.removeItem("password");
      }
    },
    async updateRecords() {
      try {
        const response = await fetch(this.apiUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: this.events.UPDATE_RECORD,
            account: this.account,
            password: this.password,
            patient: this.account,
            data: this.records,
          }),
        });

        if (!response.ok) {
          console.error("Network response was not ok, failed to post patient records.");
          return false;
        }

        const { message } = await response.json();
        if (message === this.events.messages.UPDATE_RECORD_SUCCESS) {
          console.log("Patient records posted successfully");
          return true;
        } else {
          console.error("Error:", message);
          return false;
        }
      } catch (error) {
        console.error("Error during posting patient records:", error);
        return false;
      }
    },
    hideNotification() {
      this.showNotification = false;
    },
    handleCustomInput() {
      if (this.inputFood === "custom") {
        const intValue = parseInt(this.customInputFood);
        if (isNaN(intValue) || intValue < 0) return false;
        this.inputFood = intValue;
        this.customInputFood = "";
      }
      if (this.inputWater === "custom") {
        const intValue = parseInt(this.customInputWater);
        if (isNaN(intValue) || intValue < 0) return false;
        this.inputWater = intValue;
        this.customInputWater = "";
      }
      if (this.inputUrination === "custom") {
        const intValue = parseInt(this.customInputUrination);
        if (isNaN(intValue) || intValue < 0) return false;
        this.inputUrination = intValue;
        this.customInputUrination = "";
      }
      return true;
    },
    async addData() {
      const d = new Date();
      const currentDate = `${d.getFullYear()}_${d.getMonth() + 1}_${(
        "0" + d.getDate()
      ).slice(-2)}`;
      // Food, Water, Urination, Defecation
      if (!this.handleCustomInput()) {
        alert(this.curLangText.please_enter_a_positive_integer);
        return;
      }
      if (
        this.inputFood ||
        this.inputWater ||
        this.inputUrination ||
        this.inputDefecation
      ) {
        if (!this.records[currentDate]) {
          this.initRecords(currentDate);
        }
        const currentData = {
          time: `${("0" + d.getHours()).slice(-2)}:${(
            "0" + d.getMinutes()
          ).slice(-2)}`,
          food: parseInt(this.inputFood),
          water: parseInt(this.inputWater),
          urination: parseInt(this.inputUrination),
          defecation: parseInt(this.inputDefecation),
        };
        const lastRecord = this.records[currentDate]["data"].pop();
        if (lastRecord !== undefined) {
          if (lastRecord["time"] === currentData["time"]) {
            for (dietaryItem of this.dietaryItems) {
              lastRecord[dietaryItem] += currentData[dietaryItem];
            }
            this.records[currentDate]["data"].push(lastRecord);
          } else {
            this.records[currentDate]["data"].push(lastRecord);
            this.records[currentDate]["data"].push(currentData);
          }
        } else {
          this.records[currentDate]["data"].push(currentData);
        }
        this.records[currentDate]["count"] =
          this.records[currentDate]["data"].length;
        // sums
        this.records[currentDate]["foodSum"] += parseInt(this.inputFood);
        this.records[currentDate]["waterSum"] += parseInt(this.inputWater);
        this.records[currentDate]["urinationSum"] += parseInt(
          this.inputUrination
        );
        this.records[currentDate]["defecationSum"] += parseInt(
          this.inputDefecation
        );
        // init again
        this.inputFood = 0;
        this.inputWater = 0;
        this.inputUrination = 0;
        this.inputDefecation = 0;
        this.customInputFood = "";
        this.customInputWater = "";
        this.customInputUrination = "";
        // post to database
        if (await this.updateRecords()) {
          this.showNotification = true;
          setTimeout(() => {
            this.hideNotification();
          }, 2000);
        }
      }
      if (this.inputWeight === 0) {
        return;
      }
      const inputWeight = parseFloat(this.inputWeight);
      if (isNaN(inputWeight) || inputWeight < 0.01 || inputWeight > 300) {
        alert(this.curLangText.weight_abnormal);
      } else {
        if (!this.records[currentDate]) {
          this.initRecords(currentDate);
        }
        this.records[currentDate]["weight"] = `${
          Math.round(inputWeight * 100) / 100
        } kg`;
        // init again
        this.inputWeight = 0;
        // post to database
        if ((await this.updateRecords()) && this.showNotification === false) {
          this.showNotification = true;
          setTimeout(() => {
            this.hideNotification();
          }, 2000);
        }
      }
    },
    changeLanguage(languageCode) {
      this.selectedLanguage = languageCode;
      localStorage.setItem("selectedLanguageCode", languageCode);
      this.processRestrictionText();
    },
    async removeRecord(target) {
      this.confirming = true;
      if (confirm(this.curLangText.confirm_remove_record)) {
        this.removingRecord = true;
        const [date, index] = target.attributes.id.textContent.split("-");

        const record = this.records[date]["data"][index];
        this.records[date]["count"] -= 1;
        for (dietaryItem of this.dietaryItems) {
          this.records[date][`${dietaryItem}Sum`] -= record[dietaryItem];
        }
        this.records[date]["data"].splice(index, 1);

        await this.updateRecords();
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
      const dayOfWeek = this.curLangText.day_of_week;
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
      if (this.authenticated && !this.confirming) {
        const fetchedData = await this.fetchRecords();
        if (
          !this.confirming &&
          Object.prototype.hasOwnProperty.call(fetchedData, "message") &&
          fetchedData.message === this.events.messages.FETCH_RECORD_SUCCESS
        ) {
          this.records = fetchedData["account_records"];
          this.processRestrictionText();
        }
      }
    }, 3000);

    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  computed: {
    curLangText() {
      return this.curLangTexts[this.selectedLanguage];
    },
    reversedRecord() {
      const reversedData = {};
      const keysToFilter = [
        "isEditing",
        "limitAmount",
        "foodCheckboxChecked",
        "waterCheckboxChecked",
      ];
      Object.keys(this.records)
        .reverse()
        .forEach((key) => {
          if (!keysToFilter.includes(key)) {
            reversedData[key] = this.records[key];
          }
        });
      return reversedData;
    },
  },
}).mount("#app");
