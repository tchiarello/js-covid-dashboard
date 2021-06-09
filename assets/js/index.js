const intl = new Intl.NumberFormat();

let confirmed = document.querySelector("#confirmed");
let deaths = document.querySelector("#deaths");
let recovered = document.querySelector("#recovered");
let active = document.querySelector("#active");

let dailyConfirmed = document.querySelector("#daily-confirmed");
let dailyDeaths = document.querySelector("#daily-deaths");
let dailyRecovered = document.querySelector("#daily-recovered");
let dailyActive = document.querySelector("#daily-active");

let confirmedArrowDown = document.querySelector("#confirmed-arrow-down");
let confirmedArrowUp = document.querySelector("#confirmed-arrow-up");
let deathsArrowDown = document.querySelector("#deaths-arrow-down");
let deathsArrowUp = document.querySelector("#deaths-arrow-up");
let recoveredArrowDown = document.querySelector("#recovered-arrow-down");
let recoveredArrowUp = document.querySelector("#recovered-arrow-up");
let activeArrowDown = document.querySelector("#active-arrow-down");
let activeArrowUp = document.querySelector("#active-arrow-up");

let message = document.querySelector("#message");

let allCountries = document.querySelector("#all-countries");
let date = document.querySelector("#today");

let countries;
let summary;

function getPreviousDate(date = new Date(), amount = 1) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - amount);

  return yesterday;
}

function getDateOnly(date = new Date()) {
  const iso = date.toISOString();
  return iso.substr(0, iso.indexOf("T"));
}

function setCovidNumbers(
  totalConfirmed,
  totalDeaths,
  totalRecovered,
  totalActive
) {
  confirmed.innerHTML = intl.format(totalConfirmed);
  deaths.innerHTML = intl.format(totalDeaths);
  recovered.innerHTML = intl.format(totalRecovered);
  active.innerHTML = intl.format(totalActive);
}

function resetDailyNumbers() {
  dailyConfirmed.innerHTML = "";
  dailyDeaths.innerHTML = "";
  dailyRecovered.innerHTML = "";
  dailyActive.innerHTML = "";
}

function resetTotalNumbers() {
  confirmed.innerHTML = "";
  deaths.innerHTML = "";
  recovered.innerHTML = "";
  active.innerHTML = "";
}

async function getCountries() {
  const res = await fetch("https://api.covid19api.com/countries");
  const json = await res.json();

  return json;
}

async function getSummary() {
  const res = await fetch("https://api.covid19api.com/summary");
  const json = await res.json();

  return json;
}

async function onLoadPage() {
  summary = await getSummary();
  countries = await getCountries();

  const {
    TotalConfirmed,
    TotalDeaths,
    TotalRecovered,
    NewConfirmed,
  } = summary.Global;
  setCovidNumbers(TotalConfirmed, TotalDeaths, TotalRecovered, NewConfirmed);

  const countryOptions = countries.reduce((acc, curr) => {
    acc += `<option value="${curr.ISO2}">${curr.Country}</option>`;
    return acc;
  }, "");

  allCountries.innerHTML += countryOptions;
}
onLoadPage();

async function handleStatusChange() {
  const countryValue = allCountries.value;
  const dateValue = date.value;

  confirmedArrowDown.style.display = "none";
  confirmedArrowUp.style.display = "none";
  deathsArrowDown.style.display = "none";
  deathsArrowUp.style.display = "none";
  recoveredArrowDown.style.display = "none";
  recoveredArrowUp.style.display = "none";
  activeArrowDown.style.display = "none";
  activeArrowUp.style.display = "none";

  if (countryValue === "Global") {
    const {
      TotalConfirmed,
      TotalDeaths,
      TotalRecovered,
      NewConfirmed,
    } = summary.Global;
    setCovidNumbers(TotalConfirmed, TotalDeaths, TotalRecovered, NewConfirmed);

    resetDailyNumbers();
  } else {
    const dateTo = dateValue ? new Date(dateValue) : new Date();
    const fromDate = getPreviousDate(dateTo, 2);
    const res = await fetch(
      `https://api.covid19api.com/country/${countryValue}?from=${getDateOnly(
        fromDate
      )}&to=${getDateOnly(dateTo)}`
    );

    const [dayBeforeYesterday, yesterday, today] = await res.json();

    if (!today && !yesterday) {
      resetDailyNumbers();
      resetTotalNumbers();
      message.style.display = "block";
    } else if (!today) {
      resetDailyNumbers();
      message.style.display = "none";
    } else {
      message.style.display = "none";

      dailyConfirmed.innerHTML = intl.format(
        today.Confirmed - yesterday.Confirmed
      );
      dailyDeaths.innerHTML = intl.format(today.Deaths - yesterday.Deaths);
      dailyRecovered.innerHTML = intl.format(
        today.Recovered - yesterday.Recovered
      );
      dailyActive.innerHTML = intl.format(today.Active - yesterday.Active);

      today.Confirmed - yesterday.Confirmed >
      yesterday.Confirmed - dayBeforeYesterday.Confirmed
        ? (confirmedArrowUp.style.display = "block")
        : (confirmedArrowDown.style.display = "block");

      today.Deaths - yesterday.Deaths >
      yesterday.Deaths - dayBeforeYesterday.Deaths
        ? (deathsArrowUp.style.display = "block")
        : (deathsArrowDown.style.display = "block");

      today.Recovered - yesterday.Recovered >
      yesterday.Recovered - dayBeforeYesterday.Recovered
        ? (recoveredArrowUp.style.display = "block")
        : (recoveredArrowDown.style.display = "block");

      today.Active - yesterday.Active >
      yesterday.Active - dayBeforeYesterday.Active
        ? (activeArrowUp.style.display = "block")
        : (activeArrowDown.style.display = "block");

      const { Confirmed, Deaths, Recovered, Active } = today;
      setCovidNumbers(Confirmed, Deaths, Recovered, Active);
    }
  }
}

allCountries.addEventListener("change", handleStatusChange);
date.addEventListener("change", handleStatusChange);
