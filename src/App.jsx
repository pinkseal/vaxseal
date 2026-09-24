import { Analytics } from "@vercel/analytics/react"
import { useState, useEffect, useContext, createContext } from "react";

// ─── STORAGE HELPER ──────────────────────────────────────────────────────────
// Uses window.storage (Claude artifact environment) when available,
// falls back to localStorage when running as a standalone deployed site.

const store = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const res = await window.storage.get(key);
        return res ? JSON.parse(res.value) : null;
      }
    } catch (e) { /* key not found or storage unavailable */ }
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }
    } catch (e) { /* ignore */ }
    return null;
  },
  async set(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value));
        return;
      }
    } catch (e) { /* ignore */ }
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) { /* ignore */ }
  },
  async remove(key) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.delete(key);
        return;
      }
    } catch (e) { /* ignore */ }
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) { /* ignore */ }
  },
};

// ─── LANGUAGE CONTEXT ────────────────────────────────────────────────────────
// RU/SR toggle. `t` holds static UI-chrome strings; data-heavy content lives
// in the *Data(lang) functions further down and is looked up with `lang`.

const LangContext = createContext({ lang: "ru", t: null, setLang: () => {} });
const useLang = () => useContext(LangContext);

const UI = {
  ru: {
    appName: "VaxPack",
    welcomeTitle: "VaxPack",
    welcomeLine1: "Переехал — разберись где и как сделать прививки.",
    welcomeLine2: "5 минут, и ты знаешь что нужно сделать и куда идти.",
    start: "Начать →",
    noSignup: "Без регистрации. Данные остаются у тебя.",

    quizBasicTitle: "Немного о тебе",
    quizBasicSubtitle: "Чтобы подобрать нужные прививки",
    ageLabel: "Сколько тебе лет?",
    agePlaceholder: "Например, 32",
    genderLabel: "Пол",
    female: "Женский 👩",
    male: "Мужской 👨",
    originLabel: "Откуда приехал?",
    cityLabel: "Где живёшь?",
    next: "Дальше →",
    back: "← Назад",

    quizVaxTitle: "Какие прививки помнишь?",
    quizVaxSubtitle: "Нажми ℹ чтобы узнать подробнее",
    legendDone: "✓ Делал",
    legendUnsure: "? Не уверен",
    legendNot: "✕ Не делал",

    quizChronicTitle: "Хронические заболевания?",
    quizChronicSubtitle: "Это влияет на то, какие прививки нужны и есть ли ограничения",
    vaxImpact: "💉 Влияние на вакцинацию",
    noChronic: "Нет хронических заболеваний",
    seeResult: "Посмотреть результат →",

    vaxInfoAbout: "О прививке",
    vaxInfoWhen: "🗓 Когда ставят",
    vaxInfoWho: "👤 Кому нужна",
    vaxInfoBooster: "🔄 Ревакцинация",
    vaxInfoNote: "💡 Важно знать",
    gotIt: "Понятно",

    statusNeeded: "Нужно сделать",
    statusBooster: "Пора обновить",
    statusCheck: "Проверить антитела",
    statusOk: "Скорее всего ок",
    done: "✓ Сделано",
    markDone: "Сделал ✓",
    undo: "Отменить",

    priority: "Приоритет",

    homeHealthPicture: "Твоя картина здоровья:",
    needed: "нужно",
    toUpdate: "обновить",
    toCheck: "проверить",
    ok: "ок",
    addVaccineTitle: "Добавить прививку",
    emergencyTitle: "Срочные вакцины",
    emergencySubtitle: "Укус собаки, порез о гвоздь, клещ и др.",
    tabVaccines: "Прививки",
    tabClinics: "Клиники",
    planVax: "📅 Запланировать вакцинацию",
    myPlans: "📅 Мои планы",
    needSection: "🔴 Нужно сделать",
    boosterSection: "🔄 Пора обновить",
    checkSection: "🟡 Проверить антитела",
    doneSection: "✅ Сделано",
    allGoodTitle: "С прививками всё отлично!",
    allGoodSubtitle: "Можешь добавить свои прививки кнопкой ＋ выше.",
    clinicPhrasesBtn: "Что сказать в поликлинике",
    clinicPhrasesHint: "Готовые фразы на сербском",
    mapsHint: "📍 Ведём в Google Maps с правильным запросом — там актуальные часы и отзывы.",
    findOnMaps: "🔍 Найти в Google Maps",

    navHome: "Вакцинация",
    navCity: "Город",
    navDonation: "Донор",
    navProfile: "Профиль",

    cityWhatsUp: "Что происходит с вакцинацией в городе",
    tabNews: "Новости города",
    tabReviews: "Отзывы",
    last30days: "За последние 30 дней вакцинировались",
    inYourCity: "человек в твоём городе · чаще всего:",
    demoNote: "⚠️ Данные пока демонстрационные. В рабочей версии — реальная статистика, отзывы и городские новости.",
    reviewsAbout: "💬 Отзывы о клиниках",
    didYouVax: "Сделал прививку?",
    reviewSoon: "Скоро здесь можно будет оставить свой отзыв и помочь другим выбрать клинику",
    newsSection: "📢 Новости и события",
    newsFuture: "💡 В рабочей версии новости будут подтягиваться от Дома здравља, Црвеног крста и местных служб.",
    doctorComments: "Комментарии врачей",
    openOnMap: "🗺 Открыть на карте",

    donationTitle: "🩸 Донорство крови",
    donationSubtitle: "Помоги другим и узнай свои показатели",
    tabInfo: "Информация",
    tabCenters: "Центры",
    requirements: "✅ Требования",
    benefits: "🎁 Что ты получаешь",
    intervals: "🔄 Интервалы между сдачами",
    restrictions: "⛔ Отводы",
    vaxAndDonationTitle: "Прививки и донорство",
    vaxAndDonationText: "После большинства прививок жди 2 недели перед сдачей крови. После краснухи или ветрянки — 4 недели. Уточняй в центре переливания.",
    bringId: "Возьми с собой паспорт или личную карту (лична карта). Сдача крови полностью бесплатна.",
    moreCenters: "Ещё центры в",
    findAllCenters: "🗺 Найти все центры на карте",
    free: "Бесплатно",

    profileTitle: "Личный кабинет",
    yearsOld: "лет",
    immuneProtection: "Иммунная защита",
    ofVaccinesOk: "прививок в порядке",
    myRecordsTitle: "Мои вакцинации и донорство",
    myRecordsSubtitle: "История прививок с датами и местами, записи о сдаче крови",
    updateData: "Обновить данные",
    updateDataSubtitle: "Пройти квиз заново — новые ответы дополнят историю, не сотрут",
    myData: "Мои данные",
    fAge: "Возраст",
    fGender: "Пол",
    fOrigin: "Откуда",
    fChronic: "Хроники",
    none: "Нет",
    cityOfResidence: "🏙 Город проживания",
    cityAffects: "Влияет на клиники, новости города и центры донорства",
    countryOfResidence: "🌍 Страна проживания",
    whoRecs: "Рекомендации ВОЗ —",
    whoRecsSubtitle: "Какие прививки нужны в этом регионе",
    achievements: "Достижения",
    ach1t: "Переехал — защитился", ach1d: "Прошёл квиз как эмигрант",
    ach2t: "Первый укол", ach2d: "Сделай первую прививку",
    ach3t: "Защита активирована", ach3d: "Сделай 3 прививки",
    ach4t: "Иммунный герой", ach4d: "Закрой все красные позиции",
    ach5t: "Добрый человек", ach5d: "Сдай кровь как донор",
    resetConfirm: "Удалить все данные и начать заново? Это нельзя отменить.",
    resetBtn: "🗑 Начать заново (удалит все данные)",

    recordsBack: "← Назад в профиль",
    recordsTitle: "Мои вакцинации и донорство",
    recordsSubtitle: "Личная история с датами и местами",
    doneVaxSection: "💉 Сделанные прививки",
    emptyVaxRecords: "Пока пусто. Добавь прививки кнопкой «＋ Добавить прививку» во вкладке «Вакцинация».",
    markedInQuiz: "отмечено в опросе",
    dateNotSet: "дата не указана",
    doneEdit: "Готово",
    donationSection: "🩸 Сдача крови",
    add: "＋ Добавить",
    cancel: "Отмена",
    whenDonated: "Когда сдавал?",
    whereOptional: "Где? (необязательно)",
    save: "Сохранить",
    noDonationRecords: "Записей о сдаче крови пока нет.",
    donationSingle: "Сдача крови",
    recordsFooter: "💡 Эта история хранится только у тебя. Удобно показать врачу или вспомнить, когда пора на ревакцинацию.",

    interval: "🔄",
    cost: "💰",

    addPlanTitle: "Запланировать вакцинацию",
    planVaxTab: "💉 Прививка",
    planDonTab: "🩸 Донорство",
    whichVaccine: "Какая прививка?",
    choose: "Выбери...",
    date: "Дата",
    time: "Время",
    clinicOptional: "Клиника / центр (необязательно)",
    clinicPlaceholder: "Например, Дом здравља Нови Сад",
    schedule: "Запланировать 📅",
    pushNote: "🔔 Push-напоминания появятся в полной версии. Пока — кнопка «В календарь» на каждом плане.",
    whenDone: "Когда сделал? (необязательно)",
    whereDone: "Где? (необязательно)",
    clinicName: "Название клиники",
    addAsDone: "Добавить как сделанную ✓",

    donation: "🩸",
    toCalendar: "📅 В календарь",
    went: "✓ Сходил",
    delete: "Удалить",
    datePast: "Дата прошла — сходил?",

    emergencyBanner: "⚠️ Это справочная информация. При серьёзных травмах звони",
    emergencyBanner2: "(скорая) или",
    emergencyBanner3: "(общий экстренный номер Сербии).",
    urgent: "Срочно",
    whatToDoNow: "Что делать сейчас",
    neededVaccines: "💉 Нужные вакцины",
    whereToGo: "📍 Куда обратиться в",
    findNearest: "🗺 Найти ближайший пункт",
    ambulance: "📞 Скорая помощь — 194",
    whatSituation: "Что случилось?",

    clinicPhrasesTitle: "Что сказать в поликлинике",
    clinicPhrasesSub: "🗣 Фразы на сербском",
    usefulToKnow: "💡 Полезно знать",
    copied: "✓ копировано",
    copy: "копировать",
  },
  sr: {
    appName: "VaxPack",
    welcomeTitle: "VaxPack",
    welcomeLine1: "Preselio/la si se — saznaj gde i kako da se vakcinišeš.",
    welcomeLine2: "5 minuta i znaćeš šta treba da uradiš i gde da odeš.",
    start: "Počni →",
    noSignup: "Bez registracije. Podaci ostaju kod tebe.",

    quizBasicTitle: "Malo o tebi",
    quizBasicSubtitle: "Da bismo predložili prave vakcine",
    ageLabel: "Koliko imaš godina?",
    agePlaceholder: "Na primer, 32",
    genderLabel: "Pol",
    female: "Žensko 👩",
    male: "Muško 👨",
    originLabel: "Odakle dolaziš?",
    cityLabel: "Gde živiš?",
    next: "Dalje →",
    back: "← Nazad",

    quizVaxTitle: "Kojih vakcina se sećaš?",
    quizVaxSubtitle: "Klikni na ℹ za više informacija",
    legendDone: "✓ Primljena",
    legendUnsure: "? Nisam siguran/na",
    legendNot: "✕ Nisam primio/la",

    quizChronicTitle: "Hronične bolesti?",
    quizChronicSubtitle: "Ovo utiče na to koje su vakcine potrebne i da li postoje ograničenja",
    vaxImpact: "💉 Uticaj na vakcinaciju",
    noChronic: "Nemam hroničnih bolesti",
    seeResult: "Pogledaj rezultat →",

    vaxInfoAbout: "O vakcini",
    vaxInfoWhen: "🗓 Kada se prima",
    vaxInfoWho: "👤 Kome je potrebna",
    vaxInfoBooster: "🔄 Revakcinacija",
    vaxInfoNote: "💡 Važno je znati",
    gotIt: "Razumem",

    statusNeeded: "Treba primiti",
    statusBooster: "Vreme je za obnovu",
    statusCheck: "Proveri antitela",
    statusOk: "Najverovatnije u redu",
    done: "✓ Urađeno",
    markDone: "Primio/la sam ✓",
    undo: "Poništi",

    priority: "Prioritet",

    homeHealthPicture: "Tvoja slika zdravlja:",
    needed: "potrebno",
    toUpdate: "obnoviti",
    toCheck: "proveriti",
    ok: "ok",
    addVaccineTitle: "Dodaj vakcinu",
    emergencyTitle: "Hitne vakcine",
    emergencySubtitle: "Ujed psa, posekotina od eksera, krpelj i dr.",
    tabVaccines: "Vakcine",
    tabClinics: "Ambulante",
    planVax: "📅 Zakaži vakcinaciju",
    myPlans: "📅 Moji planovi",
    needSection: "🔴 Treba primiti",
    boosterSection: "🔄 Vreme je za obnovu",
    checkSection: "🟡 Proveri antitela",
    doneSection: "✅ Urađeno",
    allGoodTitle: "Sa vakcinama je sve odlično!",
    allGoodSubtitle: "Možeš dodati svoje vakcine dugmetom ＋ iznad.",
    clinicPhrasesBtn: "Šta reći u ambulanti",
    clinicPhrasesHint: "Gotove fraze na srpskom",
    mapsHint: "📍 Vodimo te na Google Maps sa pravim upitom — tamo su aktuelno radno vreme i recenzije.",
    findOnMaps: "🔍 Pronađi na Google Maps",

    navHome: "Vakcinacija",
    navCity: "Grad",
    navDonation: "Donor",
    navProfile: "Profil",

    cityWhatsUp: "Šta se dešava sa vakcinacijom u gradu",
    tabNews: "Vesti iz grada",
    tabReviews: "Recenzije",
    last30days: "U poslednjih 30 dana vakcinisano je",
    inYourCity: "ljudi u tvom gradu · najčešće:",
    demoNote: "⚠️ Podaci su za sada demonstracioni. U radnoj verziji — prava statistika, recenzije i gradske vesti.",
    reviewsAbout: "💬 Recenzije ambulanti",
    didYouVax: "Vakcinisao/la si se?",
    reviewSoon: "Uskoro ćeš ovde moći da ostaviš svoju recenziju i pomogneš drugima da izaberu ambulantu",
    newsSection: "📢 Vesti i događaji",
    newsFuture: "💡 U radnoj verziji vesti će stizati iz Doma zdravlja, Crvenog krsta i lokalnih službi.",
    doctorComments: "Komentari lekara",
    openOnMap: "🗺 Otvori na mapi",

    donationTitle: "🩸 Davanje krvi",
    donationSubtitle: "Pomozi drugima i saznaj svoje pokazatelje",
    tabInfo: "Informacije",
    tabCenters: "Centri",
    requirements: "✅ Uslovi",
    benefits: "🎁 Šta dobijaš",
    intervals: "🔄 Razmaci između davanja",
    restrictions: "⛔ Privremene i trajne zabrane",
    vaxAndDonationTitle: "Vakcine i davanje krvi",
    vaxAndDonationText: "Posle većine vakcina sačekaj 2 nedelje pre davanja krvi. Posle rubeole ili varičele — 4 nedelje. Proveri u centru za transfuziju.",
    bringId: "Ponesi pasoš ili ličnu kartu. Davanje krvi je potpuno besplatno.",
    moreCenters: "Još centara u",
    findAllCenters: "🗺 Pronađi sve centre na mapi",
    free: "Besplatno",

    profileTitle: "Moj profil",
    yearsOld: "godina",
    immuneProtection: "Imunska zaštita",
    ofVaccinesOk: "vakcina je u redu",
    myRecordsTitle: "Moje vakcinacije i davanje krvi",
    myRecordsSubtitle: "Istorija vakcina sa datumima i mestima, evidencija davanja krvi",
    updateData: "Ažuriraj podatke",
    updateDataSubtitle: "Ponovo uradi kviz — novi odgovori dopunjuju istoriju, ne brišu je",
    myData: "Moji podaci",
    fAge: "Godine",
    fGender: "Pol",
    fOrigin: "Odakle",
    fChronic: "Hronične bolesti",
    none: "Nema",
    cityOfResidence: "🏙 Grad prebivališta",
    cityAffects: "Utiče na ambulante, gradske vesti i centre za davanje krvi",
    countryOfResidence: "🌍 Zemlja prebivališta",
    whoRecs: "Preporuke SZO —",
    whoRecsSubtitle: "Koje su vakcine potrebne u ovom regionu",
    achievements: "Postignuća",
    ach1t: "Preselio/la si se — zaštićen/a si", ach1d: "Prošao/la si kviz kao emigrant",
    ach2t: "Prva injekcija", ach2d: "Primi prvu vakcinu",
    ach3t: "Zaštita aktivirana", ach3d: "Primi 3 vakcine",
    ach4t: "Imunski heroj", ach4d: "Reši sve crvene stavke",
    ach5t: "Dobra duša", ach5d: "Daj krv kao donor",
    resetConfirm: "Obrisati sve podatke i početi ispočetka? Ovo se ne može poništiti.",
    resetBtn: "🗑 Počni ispočetka (briše sve podatke)",

    recordsBack: "← Nazad na profil",
    recordsTitle: "Moje vakcinacije i davanje krvi",
    recordsSubtitle: "Lična istorija sa datumima i mestima",
    doneVaxSection: "💉 Primljene vakcine",
    emptyVaxRecords: "Za sada prazno. Dodaj vakcine dugmetom „＋ Dodaj vakcinu” u kartici „Vakcinacija”.",
    markedInQuiz: "označeno u kvizu",
    dateNotSet: "datum nije naveden",
    doneEdit: "Gotovo",
    donationSection: "🩸 Davanje krvi",
    add: "＋ Dodaj",
    cancel: "Otkaži",
    whenDonated: "Kada si davao/la krv?",
    whereOptional: "Gde? (opciono)",
    save: "Sačuvaj",
    noDonationRecords: "Zapisa o davanju krvi za sada nema.",
    donationSingle: "Davanje krvi",
    recordsFooter: "💡 Ova istorija je sačuvana samo kod tebe. Zgodno je da je pokažeš lekaru ili se podsetiš kada je revakcinacija na redu.",

    interval: "🔄",
    cost: "💰",

    addPlanTitle: "Zakaži vakcinaciju",
    planVaxTab: "💉 Vakcina",
    planDonTab: "🩸 Davanje krvi",
    whichVaccine: "Koja vakcina?",
    choose: "Izaberi...",
    date: "Datum",
    time: "Vreme",
    clinicOptional: "Ambulanta / centar (opciono)",
    clinicPlaceholder: "Npr. Dom zdravlja Novi Sad",
    schedule: "Zakaži 📅",
    pushNote: "🔔 Push podsetnici stižu u punoj verziji. Za sada — dugme „U kalendar” na svakom planu.",
    whenDone: "Kada si primio/la? (opciono)",
    whereDone: "Gde? (opciono)",
    clinicName: "Naziv ambulante",
    addAsDone: "Dodaj kao urađeno ✓",

    donation: "🩸",
    toCalendar: "📅 U kalendar",
    went: "✓ Otišao/la sam",
    delete: "Obriši",
    datePast: "Datum je prošao — jesi li otišao/la?",

    emergencyBanner: "⚠️ Ovo su informativni podaci. Kod ozbiljnih povreda pozovi",
    emergencyBanner2: "(hitna pomoć) ili",
    emergencyBanner3: "(opšti hitni broj Srbije).",
    urgent: "Hitno",
    whatToDoNow: "Šta uraditi odmah",
    neededVaccines: "💉 Potrebne vakcine",
    whereToGo: "📍 Gde se obratiti u",
    findNearest: "🗺 Pronađi najbližu ustanovu",
    ambulance: "📞 Hitna pomoć — 194",
    whatSituation: "Šta se dogodilo?",

    clinicPhrasesTitle: "Šta reći u ambulanti",
    clinicPhrasesSub: "🗣 Fraze na srpskom",
    usefulToKnow: "💡 Korisno je znati",
    copied: "✓ kopirano",
    copy: "kopiraj",
  },
};

// ─── DATA: VACCINES ──────────────────────────────────────────────────────────

function vaccinesData(lang) {
  const ru = [
    { id: "bcg", label: "БЦЖ (туберкулёз)", hint: "Шрам на левом плече — это оно", genders: ["male","female"],
      info: { ages: "При рождении, ревакцинация в 7 лет (в СНГ)", who: "Всем новорождённым. В СНГ была обязательной.", booster: "Не требуется во взрослом возрасте", note: "Если есть шрам на плече — почти наверняка была." }},
    { id: "dtp", label: "АКДС / АДС-М", hint: "Столбняк, дифтерия, коклюш", genders: ["male","female"],
      info: { ages: "3, 4, 5 мес → 18 мес → 7 лет → 14 лет → каждые 10 лет", who: "Всем. Ревакцинация каждые 10 лет.", booster: "Каждые 10 лет обязательно", note: "Самая часто пропускаемая прививка у взрослых эмигрантов." }},
    { id: "mmr", label: "Корь / Краснуха / Паротит", hint: "КПК — обычно 2 дозы в детстве", genders: ["male","female"],
      info: { ages: "12 месяцев и 6 лет (2 дозы)", who: "Всем детям. Взрослым без прививки — 2 дозы.", booster: "Не требуется если было 2 дозы", note: "В Сербии периодически вспышки кори — проверь наличие 2 доз." }},
    { id: "hepb", label: "Гепатит B", hint: "3 дозы, часто делали в школе", genders: ["male","female"],
      info: { ages: "При рождении, 1 мес, 6 мес (или в школьном возрасте)", who: "В нацкалендари стран СНГ введена в разные годы (Россия — 1996, Украина — 2000, Казахстан — 1998). Если родился раньше — возможно не делал.", booster: "Как правило не нужен при полном курсе из 3 доз", note: "Сдай анализ на anti-HBs чтобы проверить иммунитет." }},
    { id: "polio", label: "Полиомиелит", hint: "Капли или укол в детстве", genders: ["male","female"],
      info: { ages: "3, 4, 5 мес → 18 мес → 14 лет", who: "Всем детям. Взрослым без прививки — 3 дозы.", booster: "Обычно не нужен если полный курс в детстве", note: "Большинство приехавших из СНГ вакцинированы." }},
    { id: "varicella", label: "Ветрянка", hint: "Прививка или болел в детстве", genders: ["male","female"],
      info: { ages: "12–18 месяцев (2 дозы)", who: "Тем кто не болел и не привит. В СНГ часто болели естественным путём.", booster: "2 дозы если не болел", note: "Если болел в детстве — иммунитет на всю жизнь." }},
    { id: "flu", label: "Грипп", hint: "Делал в последние 12 месяцев", genders: ["male","female"],
      info: { ages: "Ежегодно, с 6 месяцев", who: "Всем, особенно людям 60+, беременным, хроникам.", booster: "Каждый год — вирус мутирует", note: "Сезон вакцинации: сентябрь–ноябрь. Доступно в аптеках без записи." }},
    { id: "covid", label: "COVID-19", hint: "Любая вакцина", genders: ["male","female"],
      info: { ages: "С 12 лет (основной курс + бустеры)", who: "Всем. Особенно важно для людей 60+ и хроников.", booster: "По рекомендациям ВОЗ ежегодно", note: "В Сербии доступны Pfizer, Moderna и другие." }},
    { id: "hpv", label: "ВПЧ (рак шейки матки / HPV)", hint: "Вирус папилломы человека", genders: ["female","male"],
      info: { ages: "9–14 лет (идеально), до 26 лет (рекомендовано), 27–45 лет (по показаниям)", who: "Женщинам до 26 лет — настоятельно. 27–45 — обсуди с гинекологом. Мужчинам до 26 лет.", booster: "2 дозы (до 15 лет) или 3 дозы (старше)", note: "В СНГ почти не делали. Защищает от рака шейки матки, горла, аноректального рака." }},
  ];
  const sr = [
    { id: "bcg", label: "BCG (tuberkuloza)", hint: "Ožiljak na levom ramenu — to je to", genders: ["male","female"],
      info: { ages: "Na rođenju, revakcinacija sa 7 godina (u zemljama ZND)", who: "Svim novorođenčadima. U zemljama ZND je bila obavezna.", booster: "Nije potrebna u odraslom dobu", note: "Ako postoji ožiljak na ramenu — skoro sigurno je primljena." }},
    { id: "dtp", label: "DTP / Td (tetanus, difterija, veliki kašalj)", hint: "Tetanus, difterija, veliki kašalj", genders: ["male","female"],
      info: { ages: "3, 4, 5 mes → 18 mes → 7 god → 14 god → na svakih 10 godina", who: "Svima. Revakcinacija na svakih 10 godina.", booster: "Obavezno na svakih 10 godina", note: "Vakcina koju odrasli emigranti najčešće preskaču." }},
    { id: "mmr", label: "Morbili / Rubela / Zauške (MMR)", hint: "MMR — obično 2 doze u detinjstvu", genders: ["male","female"],
      info: { ages: "12 meseci i 6 godina (2 doze)", who: "Svoj deci. Odraslima bez vakcine — 2 doze.", booster: "Nije potrebna ako je primljeno 2 doze", note: "U Srbiji se povremeno javljaju izbijanja morbila — proveri da li imaš 2 doze." }},
    { id: "hepb", label: "Hepatitis B", hint: "3 doze, često primljeno u školi", genders: ["male","female"],
      info: { ages: "Na rođenju, 1. mesec, 6. mesec (ili u školskom uzrastu)", who: "U nacionalne kalendare zemalja ZND uvedena je različitih godina (Rusija — 1996, Ukrajina — 2000, Kazahstan — 1998). Ako si rođen/a ranije — možda nisi primio/la.", booster: "Obično nije potreban uz punu seriju od 3 doze", note: "Uradi analizu na anti-HBs da proveriš imunitet." }},
    { id: "polio", label: "Dečja paraliza (polio)", hint: "Kapi ili injekcija u detinjstvu", genders: ["male","female"],
      info: { ages: "3, 4, 5 mes → 18 mes → 14 god", who: "Svoj deci. Odraslima bez vakcine — 3 doze.", booster: "Obično nije potrebna uz punu seriju iz detinjstva", note: "Većina ljudi iz zemalja ZND je vakcinisana." }},
    { id: "varicella", label: "Vodene boginje (varičela)", hint: "Vakcina ili preležano u detinjstvu", genders: ["male","female"],
      info: { ages: "12–18 meseci (2 doze)", who: "Onima koji nisu preležali ni vakcinisani. U zemljama ZND se često prirodno prebolevalo.", booster: "2 doze ako nije preležano", note: "Ako je prebolelo u detinjstvu — imunitet je doživotan." }},
    { id: "flu", label: "Grip", hint: "Primljena u poslednjih 12 meseci", genders: ["male","female"],
      info: { ages: "Godišnje, od 6. meseca života", who: "Svima, posebno osobama 60+, trudnicama, hroničnim bolesnicima.", booster: "Svake godine — virus mutira", note: "Sezona vakcinacije: septembar–novembar. Dostupno u apotekama bez zakazivanja." }},
    { id: "covid", label: "COVID-19", hint: "Bilo koja vakcina", genders: ["male","female"],
      info: { ages: "Od 12 godina (osnovna serija + buster doze)", who: "Svima. Posebno važno za osobe 60+ i hronične bolesnike.", booster: "Prema preporukama SZO, godišnje", note: "U Srbiji su dostupni Pfizer, Moderna i drugi." }},
    { id: "hpv", label: "HPV (rak grlića materice)", hint: "Humani papiloma virus", genders: ["female","male"],
      info: { ages: "9–14 godina (idealno), do 26. godine (preporučeno), 27–45 godina (po indikacijama)", who: "Ženama do 26 godina — izričito preporučeno. 27–45 — razgovaraj sa ginekologom. Muškarcima do 26 godina.", booster: "2 doze (do 15. godine) ili 3 doze (starijima)", note: "U zemljama ZND se skoro nije primenjivala. Štiti od raka grlića materice, grla i anorektalnog raka." }},
  ];
  return lang === "sr" ? sr : ru;
}

function originsData(lang) {
  return lang === "sr"
    ? ["Rusija", "Belorusija", "Ukrajina", "Kazahstan", "Druga zemlja ZND"]
    : ["Россия", "Беларусь", "Украина", "Казахстан", "Другая страна СНГ"];
}

function countriesData(lang) {
  return lang === "sr"
    ? [
        { code: "RS", name: "Srbija", who: "https://www.who.int/countries/srb" },
        { code: "ME", name: "Crna Gora", who: "https://www.who.int/countries/mne" },
        { code: "DE", name: "Nemačka", who: "https://www.who.int/countries/deu" },
        { code: "GE", name: "Gruzija", who: "https://www.who.int/countries/geo" },
        { code: "AM", name: "Jermenija", who: "https://www.who.int/countries/arm" },
        { code: "RS_other", name: "Druga zemlja", who: "https://www.who.int/teams/immunization-vaccines-and-biologicals" },
      ]
    : [
        { code: "RS", name: "Сербия", who: "https://www.who.int/countries/srb" },
        { code: "ME", name: "Черногория", who: "https://www.who.int/countries/mne" },
        { code: "DE", name: "Германия", who: "https://www.who.int/countries/deu" },
        { code: "GE", name: "Грузия", who: "https://www.who.int/countries/geo" },
        { code: "AM", name: "Армения", who: "https://www.who.int/countries/arm" },
        { code: "RS_other", name: "Другая страна", who: "https://www.who.int/teams/immunization-vaccines-and-biologicals" },
      ];
}

// ─── DATA: CHRONIC CONDITIONS (with vaccination notes) ───────────────────────

function chronicConditionsData(lang) {
  const ru = [
    { key: "diabetes", label: "Диабет", icon: "🍬",
      vaxNote: "Диабетикам особенно рекомендованы прививки от гриппа и пневмококка. Противопоказаний к вакцинации обычно нет, но при декомпенсации (высокий сахар) вакцинацию откладывают до стабилизации." },
    { key: "heart", label: "Болезни сердца / гипертония", icon: "🫀",
      vaxNote: "Сердечникам важны прививки от гриппа и пневмококка — инфекции повышают нагрузку на сердце. Сама гипертония не противопоказание. При острых состояниях вакцинацию откладывают." },
    { key: "asthma", label: "Астма / ХОБЛ", icon: "🫁",
      vaxNote: "При астме настоятельно рекомендованы прививки от гриппа и пневмококка. Вакцинацию проводят вне обострения. Если принимаешь высокие дозы системных стероидов — обсуди с врачом живые вакцины." },
    { key: "thyroid", label: "Болезни щитовидной железы", icon: "🦋",
      vaxNote: "Болезни щитовидки (гипо- и гипертиреоз, АИТ) не являются противопоказанием к вакцинации. При стабильном состоянии прививки делают по общему календарю." },
    { key: "immuno", label: "Иммунодефицит / иммуносупрессия", icon: "🛡️",
      vaxNote: "Важно: при иммунодефиците или приёме иммуносупрессантов ЖИВЫЕ вакцины (корь/краснуха/паротит, ветрянка, БЦЖ) могут быть противопоказаны. Инактивированные вакцины безопасны и особенно нужны. Обязательно консультируйся с врачом." },
    { key: "allergy", label: "Тяжёлые аллергии", icon: "🤧",
      vaxNote: "Если была анафилаксия на компонент вакцины (например, яичный белок, желатин) — нужна осторожность и наблюдение. Обычная аллергия (поллиноз, пищевая) не противопоказание. Вакцинацию делают под наблюдением врача." },
  ];
  const sr = [
    { key: "diabetes", label: "Dijabetes", icon: "🍬",
      vaxNote: "Dijabetičarima se posebno preporučuju vakcine protiv gripa i pneumokoka. Obično nema kontraindikacija za vakcinaciju, ali kod dekompenzacije (visok šećer) vakcinacija se odlaže do stabilizacije." },
    { key: "heart", label: "Srčana oboljenja / hipertenzija", icon: "🫀",
      vaxNote: "Srčanim bolesnicima su važne vakcine protiv gripa i pneumokoka — infekcije dodatno opterećuju srce. Sama hipertenzija nije kontraindikacija. Kod akutnih stanja vakcinacija se odlaže." },
    { key: "asthma", label: "Astma / HOBP", icon: "🫁",
      vaxNote: "Kod astme se izričito preporučuju vakcine protiv gripa i pneumokoka. Vakcinacija se sprovodi van perioda pogoršanja. Ako uzimaš visoke doze sistemskih steroida — konsultuj se sa lekarom oko živih vakcina." },
    { key: "thyroid", label: "Bolesti štitne žlezde", icon: "🦋",
      vaxNote: "Bolesti štitne žlezde (hipo- i hipertireoza, autoimuni tiroiditis) nisu kontraindikacija za vakcinaciju. Kod stabilnog stanja vakcine se daju po opštem kalendaru." },
    { key: "immuno", label: "Imunodeficijencija / imunosupresija", icon: "🛡️",
      vaxNote: "Važno: kod imunodeficijencije ili uzimanja imunosupresiva ŽIVE vakcine (MMR, varičela, BCG) mogu biti kontraindikovane. Inaktivisane vakcine su bezbedne i posebno potrebne. Obavezno se konsultuj sa lekarom." },
    { key: "allergy", label: "Teške alergije", icon: "🤧",
      vaxNote: "Ako je bilo anafilakse na sastojak vakcine (npr. belance jajeta, želatin) — potreban je oprez i praćenje. Obična alergija (polen, hrana) nije kontraindikacija. Vakcinacija se sprovodi pod nadzorom lekara." },
  ];
  return lang === "sr" ? sr : ru;
}

// ─── DATA: CHECKUPS ──────────────────────────────────────────────────────────

function getCheckups(age, gender, city, chronic, lang) {
  const L = lang === "sr";
  const checks = [];
  checks.push({ id: "bp", icon: "🫀", name: L?"Krvni pritisak":"Артериальное давление", freq: L?"Jednom godišnje":"Раз в год", why: L?"Hipertenzija godinama protiče bez simptoma. Norma: do 130/85.":"Гипертония протекает бессимптомно годами. Норма: до 130/85.", priority: age >= 35 ? "high" : "normal", genders: ["male","female"] });
  checks.push({ id: "cbc", icon: "🩸", name: L?"Kompletna krvna slika (KKS)":"Общий анализ крови (ОАК)", freq: L?"Jednom godišnje":"Раз в год", why: L?"Osnovni skrining: anemija, upala, imunski status.":"Базовый скрининг: анемия, воспаление, иммунный статус.", priority: "normal", genders: ["male","female"] });
  checks.push({ id: "glucose", icon: "🍬", name: L?"Glukoza u krvi (šećer)":"Глюкоза крови (сахар)", freq: L?"Jednom godišnje posle 30. godine":"Раз в год после 30 лет", why: L?"Dijabetes tipa 2 se često ne ispoljava godinama. Norma našte: 3.9–5.5 mmol/l.":"Диабет 2 типа часто не проявляется годами. Норма натощак: 3.9–5.5 ммоль/л.", priority: age >= 40 || chronic.diabetes ? "high" : "normal", genders: ["male","female"] });
  checks.push({ id: "cholesterol", icon: "💊", name: L?"Lipidni profil (holesterol)":"Липидный профиль (холестерин)", freq: L?"Jednom u 5 godina posle 20; jednom godišnje posle 40":"Раз в 5 лет после 20; раз в год после 40", why: L?"Visok holesterol je glavni faktor rizika za infarkt i moždani udar.":"Высокий холестерин — главный фактор риска инфаркта и инсульта.", priority: age >= 40 || chronic.heart ? "high" : "normal", genders: ["male","female"] });
  checks.push({ id: "dentist", icon: "🦷", name: L?"Stomatolog":"Стоматолог", freq: L?"Jednom u 6–12 meseci":"Раз в 6–12 месяцев", why: L?"Karijes i bolesti desni povezani su sa kardiovaskularnim rizicima.":"Кариес и болезни дёсен связаны с сердечно-сосудистыми рисками.", priority: "normal", genders: ["male","female"] });
  if (age >= 25) checks.push({ id: "thyroid", icon: "🦋", name: L?"TSH (štitna žlezda)":"ТТГ (щитовидная железа)", freq: L?"Jednom u 3–5 godina":"Раз в 3–5 лет", why: L?"Hipotireoza se maskira kao umor. Aktuelno posle stresa preseljenja.":"Гипотиреоз маскируется под усталость. Актуально после стресса переезда.", priority: chronic.thyroid ? "high" : "normal", genders: ["male","female"] });
  if (age >= 30) checks.push({ id: "liver", icon: "🫁", name: L?"ALT, AST (jetreni enzimi)":"АЛТ, АСТ (печёночные ферменты)", freq: L?"Jednom godišnje":"Раз в год", why: L?"Provera funkcije jetre. Važno kod promene ishrane posle preseljenja.":"Проверка функции печени. Важно при смене питания после переезда.", priority: "normal", genders: ["male","female"] });
  if (age >= 40) {
    checks.push({ id: "ecg", icon: "💓", name: L?"EKG":"ЭКГ", freq: L?"Jednom u 1–2 godine":"Раз в 1–2 года", why: L?"Skrining srčanih aritmija i ishemije.":"Скрининг сердечных аритмий и ишемии.", priority: chronic.heart ? "high" : "normal", genders: ["male","female"] });
    checks.push({ id: "vision", icon: "👁", name: L?"Vid / očni pritisak":"Зрение / внутриглазное давление", freq: L?"Jednom u 2 godine":"Раз в 2 года", why: L?"Glaukom počinje neprimetno.":"Глаукома начинается незаметно.", priority: "normal", genders: ["male","female"] });
  }
  if (age >= 45) checks.push({ id: "colonoscopy", icon: "🔬", name: L?"Analiza stolice na okultno krvarenje":"Анализ кала на скрытую кровь", freq: L?"Jednom godišnje":"Раз в год", why: L?"Prvi korak skrininga raka debelog creva.":"Первый шаг скрининга рака кишечника.", priority: "high", genders: ["male","female"] });
  if (age >= 50) checks.push({ id: "bone", icon: "🦴", name: L?"Denzitometrija (gustina kostiju)":"Денситометрия (плотность костей)", freq: L?"Jednom u 2 godine":"Раз в 2 года", why: L?"Osteoporoza protiče bez simptoma.":"Остеопороз протекает бессимптомно.", priority: "normal", genders: ["male","female"] });
  if (gender === "female") {
    if (age >= 21) checks.push({ id: "pap", icon: "🌸", name: L?"Citologija grlića materice (Pap test)":"Цитология шейки матки (Пап-тест)", freq: L?"Jednom u 3 godine (21–65 godina)":"Раз в 3 года (21–65 лет)", why: L?"Skrining raka grlića materice. Obavezan i bez simptoma.":"Скрининг рака шейки матки. Обязателен даже без симптомов.", priority: "high", genders: ["female"] });
    if (age >= 25) checks.push({ id: "gynecologist", icon: "👩‍⚕️", name: L?"Ginekolog (redovni pregled)":"Гинеколог (плановый осмотр)", freq: L?"Jednom godišnje":"Раз в год", why: L?"Bris, ultrazvuk karličnih organa, hormonska kontrola.":"Мазок, УЗИ органов малого таза, гормональный контроль.", priority: "normal", genders: ["female"] });
    if (age >= 40) checks.push({ id: "mammo", icon: "🎀", name: L?"Mamografija":"Маммография", freq: L?"Jednom u 1–2 godine":"Раз в 1–2 года", why: L?"Skrining raka dojke. Rana dijagnoza je ključna.":"Скрининг рака груди. Ранняя диагностика критична.", priority: "high", genders: ["female"] });
    if (age >= 18 && age <= 45) checks.push({ id: "ferritin", icon: "🩺", name: L?"Feritin i gvožđe":"Ферритин и железо", freq: L?"Jednom godišnje":"Раз в год", why: L?"Nedostatak gvožđa kod žena je veoma čest.":"Дефицит железа у женщин очень распространён.", priority: "normal", genders: ["female"] });
  }
  if (gender === "male") {
    if (age >= 40) checks.push({ id: "psa", icon: "🔵", name: L?"PSA (prostata)":"ПСА (простата)", freq: L?"Jednom godišnje posle 40":"Раз в год после 40", why: L?"Skrining raka prostate.":"Скрининг рака простаты.", priority: age >= 50 ? "high" : "normal", genders: ["male"] });
    if (age >= 35) checks.push({ id: "testosterone", icon: "💪", name: L?"Testosteron ukupni":"Тестостерон общий", freq: L?"Kod simptoma":"При симптомах", why: L?"Nivo opada posle 35. Utiče na srce, kosti, raspoloženje.":"Уровень снижается после 35. Влияет на сердце, кости, настроение.", priority: "normal", genders: ["male"] });
  }
  if (chronic.diabetes) {
    checks.push({ id: "hba1c", icon: "📊", name: L?"Glikozilirani hemoglobin (HbA1c)":"Гликированный гемоглобин (HbA1c)", freq: L?"Jednom u 3–6 meseci":"Раз в 3–6 мес", why: L?"Osnovni pokazatelj kontrole dijabetesa.":"Основной показатель контроля диабета.", priority: "high", genders: ["male","female"] });
    checks.push({ id: "kidney_dm", icon: "🫘", name: L?"Kreatinin, GFR (bubrezi)":"Креатинин, СКФ (почки)", freq: L?"Jednom u 6 meseci":"Раз в 6 мес", why: L?"Dijabetesna nefropatija — rana kontrola je ključna.":"Диабетическая нефропатия — ранний контроль критичен.", priority: "high", genders: ["male","female"] });
  }
  if (chronic.heart) checks.push({ id: "echo", icon: "💗", name: L?"EhoKG (ultrazvuk srca)":"ЭхоКГ (УЗИ сердца)", freq: L?"Jednom u 1–2 godine":"Раз в 1–2 года", why: L?"Procena funkcije zalistaka i pumpne funkcije srca.":"Оценка функции клапанов и насосной функции сердца.", priority: "high", genders: ["male","female"] });
  if (chronic.asthma) checks.push({ id: "spirometry", icon: "🫁", name: L?"Spirometrija (funkcija pluća)":"Спирометрия (функция лёгких)", freq: L?"Jednom godišnje":"Раз в год", why: L?"Procena bronhijalne prohodnosti.":"Оценка бронхиальной проходимости.", priority: "high", genders: ["male","female"] });
  if (chronic.thyroid) checks.push({ id: "tsh_t4", icon: "🦋", name: L?"TSH + slobodni T4":"ТТГ + Т4 свободный", freq: L?"Jednom u 6 meseci":"Раз в 6 мес", why: L?"Kontrola supstitucione terapije.":"Контроль заместительной терапии.", priority: "high", genders: ["male","female"] });
  checks.push({ id: "hepbc_screen", icon: "🧫", name: L?"Hepatitis B i C (antitela)":"Гепатит B и C (антитела)", freq: L?"Jednom, prilikom preseljenja":"Однократно при переезде", why: L?"Preporučuje se emigrantima pri promeni zdravstvenog sistema.":"Рекомендуется эмигрантам при смене системы здравоохранения.", priority: "normal", genders: ["male","female"] });
  return checks.filter(c => c.genders.includes(gender));
}

// ─── DATA: DONATION ──────────────────────────────────────────────────────────

function donationInfoData(lang) {
  if (lang === "sr") return {
    intro: "Davanje krvi je jednostavan način da pomogneš drugima i besplatno saznaš svoju krvnu grupu, hemoglobin i uradiš osnovni skrining na HIV, hepatitis B i C.",
    requirements: [
      { icon: "⚖️", text: "Težina od 50 kg" },
      { icon: "🎂", text: "Godine 18–65" },
      { icon: "💊", text: "Ne uzimati aspirin 3 dana pre davanja" },
      { icon: "🍷", text: "Ne konzumirati alkohol 48 sati pre" },
      { icon: "🌡️", text: "Zdrav/a na dan davanja (bez temperature, kijavice)" },
      { icon: "💉", text: "Ne davati krv 2 nedelje posle vakcine" },
      { icon: "🩸", text: "Hemoglobin: žene ≥120, muškarci ≥130 g/l" },
    ],
    restrictions: [
      "Posle tetovaže ili pirsinga — 6 meseci",
      "Posle hepatitisa A — 6 meseci",
      "Kod hepatitisa B ili C — trajna zabrana",
      "Kod HIV-a — trajna zabrana",
      "Trudnoća i dojenje — privremena zabrana",
      "Posle vađenja zuba — 10 dana",
    ],
    benefits: [
      { icon: "🔬", text: "Besplatna analiza krvi: grupa, Rh faktor, hemoglobin" },
      { icon: "🛡️", text: "Skrining na HIV, hepatitis B i C, sifilis" },
      { icon: "❤️", text: "Jedno davanje pomaže do 3 osobe" },
      { icon: "🏅", text: "Počasni davalac — pogodnosti posle 40 davanja (u zemljama ZND)" },
    ],
    intervals: [
      { type: "Cela krv", male: "jednom u 60 dana (maks. 5 puta/god.)", female: "jednom u 90 dana (maks. 4 puta/god.)" },
      { type: "Plazma", male: "jednom u 14 dana", female: "jednom u 14 dana" },
      { type: "Trombociti", male: "jednom u 14 dana", female: "jednom u 14 dana" },
    ],
  };
  return {
    intro: "Донорство крови — простой способ помочь другим и бесплатно узнать свою группу крови, гемоглобин и пройти базовый скрининг на ВИЧ, гепатиты B и C.",
    requirements: [
      { icon: "⚖️", text: "Вес от 50 кг" },
      { icon: "🎂", text: "Возраст 18–65 лет" },
      { icon: "💊", text: "Не принимать аспирин 3 дня до сдачи" },
      { icon: "🍷", text: "Не употреблять алкоголь 48 часов до" },
      { icon: "🌡️", text: "Здоров в день сдачи (нет температуры, насморка)" },
      { icon: "💉", text: "Не сдавать кровь 2 недели после прививки" },
      { icon: "🩸", text: "Гемоглобин: женщины ≥120, мужчины ≥130 г/л" },
    ],
    restrictions: [
      "После татуажа или пирсинга — 6 месяцев",
      "После гепатита A — 6 месяцев",
      "При гепатите B или C — пожизненный отвод",
      "При ВИЧ — пожизненный отвод",
      "Беременность и грудное вскармливание — временный отвод",
      "После удаления зуба — 10 дней",
    ],
    benefits: [
      { icon: "🔬", text: "Бесплатный анализ крови: группа, резус, гемоглобин" },
      { icon: "🛡️", text: "Скрининг на ВИЧ, гепатиты B и C, сифилис" },
      { icon: "❤️", text: "Одна сдача помогает до 3 человек" },
      { icon: "🏅", text: "Почётный донор — льготы после 40 сдач (в СНГ)" },
    ],
    intervals: [
      { type: "Цельная кровь", male: "раз в 60 дней (макс. 5 раз/год)", female: "раз в 90 дней (макс. 4 раза/год)" },
      { type: "Плазма", male: "раз в 14 дней", female: "раз в 14 дней" },
      { type: "Тромбоциты", male: "раз в 14 дней", female: "раз в 14 дней" },
    ],
  };
}

function donationCentersData(lang) {
  const L = lang === "sr";
  return {
    "Нови Сад": [
      { id: "ns_d1", name: "Завод за трансфузију крви Војводине", address: "Хajduk Veljkova 7", type: L?"Državni":"Государственный", hours: L?"Pon–Pet 7:00–13:00, Sub 7:00–12:00":"Пн–Пт 7:00–13:00, Сб 7:00–12:00", phone: "+381 21 484 3484", note: L?"Glavni transfuzijski centar Vojvodine. Ponesi pasoš ili ličnu kartu.":"Главный центр переливания Воеводины. Возьми паспорт или личную карту.", mapsQuery: "Zavod za transfuziju krvi Vojvodine Novi Sad" },
      { id: "ns_d2", name: "Клинички центар Војводине — трансфузија", address: "Хajduk Veljkova 1", type: L?"Državni":"Государственный", hours: L?"Pon–Pet 7:30–12:30":"Пн–Пт 7:30–12:30", phone: "+381 21 484 3300", note: L?"Pri kliničkom centru. Zgodno je kombinovati sa drugim analizama.":"При клиническом центре. Удобно совместить с другими анализами.", mapsQuery: "Klinicki centar Vojvodine transfuzija Novi Sad" },
      { id: "ns_d3", name: "Акције Црвеног крста Нови Сад", address: L?"Razne lokacije u gradu":"Различные площадки в городе", type: L?"Akcija":"Акция", hours: L?"Prema rasporedu akcija (obično vikendom)":"По расписанию акций (обычно выходные)", phone: "+381 21 422 244", note: L?"Terenska stanica Crvenog krsta. Prati raspored na ckcns.org.rs":"Выездные акции Красного Креста. Следи за расписанием на ckcns.org.rs", mapsQuery: "Crveni krst Novi Sad" },
    ],
    "Белград": [
      { id: "bg_d1", name: "Институт за трансфузију крви Србије", address: "Светог Саве 39, Врачар", type: L?"Državni":"Государственный", hours: L?"Pon–Pet 7:00–14:00, Sub 7:00–12:00":"Пн–Пт 7:00–14:00, Сб 7:00–12:00", phone: "+381 11 361 5631", note: L?"Glavni institut za transfuziju krvi Srbije. Ponesi pasoš.":"Главный институт переливания крови Сербии. Возьми паспорт.", mapsQuery: "Institut za transfuziju krvi Srbije Beograd" },
      { id: "bg_d2", name: "Клинички центар Србије — трансфузија", address: "Пастерова 2, Стари Град", type: L?"Državni":"Государственный", hours: L?"Pon–Pet 7:30–13:30":"Пн–Пт 7:30–13:30", phone: "+381 11 361 5151", note: L?"Pri glavnoj klinici zemlje. Veliki broj ljudi, dođi ranije.":"При главной клинике страны. Большой поток, приходи пораньше.", mapsQuery: "Klinicki centar Srbije transfuzija Beograd" },
      { id: "bg_d3", name: "КБЦ Земун — служба трансфузије", address: "Вукова 9, Земун", type: L?"Državni":"Государственный", hours: L?"Pon–Pet 7:00–13:00":"Пн–Пт 7:00–13:00", phone: "+381 11 377 0530", note: L?"Centar u Zemunu — dobra alternativa za stanovnike Novog Beograda.":"Центр в Земуне — хорошая альтернатива для жителей Нови Београда.", mapsQuery: "KBC Zemun transfuzija Beograd" },
    ],
  };
}

// ─── DATA: ФРАЗЫ ДЛЯ ПОЛИКЛИНИКИ ─────────────────────────────────────────────
// Сама секция всегда двуязычная (ru⇄sr) — это словарь для русскоязычных.
// Переводим только шапки/заголовки/советы под текущий интерфейсный язык.

const CLINIC_PHRASES_ITEMS = {
  groups: [
    {
      icon: "📋",
      title: { ru: "Записаться и прийти", sr: "Zakazivanje i dolazak" },
      items: [
        { ru: "Здравствуйте, я хочу сделать прививку.", sr: "Добар дан, желим да примим вакцину.", tr: "добар дан, желим да примим вакцину" },
        { ru: "Можно записаться на вакцинацию?", sr: "Могу ли да закажем вакцинацију?", tr: "могу ли да закажем вакцинацию" },
        { ru: "Я иностранец, у меня есть LBO (личный номер).", sr: "Ја сам странац, имам ЛБО (матични број).", tr: "я сам странац, имам ЛБО" },
        { ru: "У меня нет медицинской страховки. Сколько это стоит?", sr: "Немам здравствено осигурање. Колико кошта?", tr: "немам здравствено осигурање, колико кошта" },
      ],
    },
    {
      icon: "💉",
      title: { ru: "Объяснить что нужно", sr: "Objasniti šta je potrebno" },
      items: [
        { ru: "Мне нужна прививка от столбняка и дифтерии.", sr: "Потребна ми је вакцина против тетануса и дифтерије.", tr: "потребна ми е вакцина против тетануса и дифтерије" },
        { ru: "Мне нужна прививка от гриппа.", sr: "Желим вакцину против грипа.", tr: "желим вакцину против грипа" },
        { ru: "Мне нужна прививка от ВПЧ.", sr: "Потребна ми је ХПВ вакцина.", tr: "потребна ми е ХПВ вакцина" },
        { ru: "Я не знаю, какие прививки у меня были. Можно проверить?", sr: "Не знам које сам вакцине примио. Може ли провера?", tr: "не знам које сам вакцине примио, може ли провера" },
        { ru: "Можно сдать анализ на антитела?", sr: "Могу ли да урадим анализу на антитела?", tr: "могу ли да урадим анализу на антитела" },
      ],
    },
    {
      icon: "❓",
      title: { ru: "Важные вопросы", sr: "Važna pitanja" },
      items: [
        { ru: "Когда нужна следующая доза?", sr: "Када је потребна следећа доза?", tr: "када е потребна следећа доза" },
        { ru: "Есть ли побочные эффекты?", sr: "Има ли нежељених ефеката?", tr: "има ли нежељених ефеката" },
        { ru: "Можно ли мне эту прививку? У меня есть хроническое заболевание.", sr: "Могу ли да примим ову вакцину? Имам хронично обољење.", tr: "могу ли да примим ову вакцину, имам хронично обољење" },
        { ru: "Дайте, пожалуйста, справку о прививке.", sr: "Молим вас потврду о вакцинацији.", tr: "молим вас потврду о вакцинацији" },
      ],
    },
    {
      icon: "🚨",
      title: { ru: "Если что-то срочное", sr: "Ako je nešto hitno" },
      items: [
        { ru: "Меня укусила собака, мне срочно нужна помощь.", sr: "Ујела ме је пас, хитно ми треба помоћ.", tr: "уела ме е пас, хитно ми треба помоћ" },
        { ru: "Я порезался, нужна прививка от столбняка.", sr: "Посекао сам се, треба ми вакцина против тетануса.", tr: "посекао сам се, треба ми вакцина против тетануса" },
        { ru: "Где ближайший травмпункт?", sr: "Где је најближа хитна помоћ?", tr: "где е најближа хитна помоћ" },
      ],
    },
  ],
};

function clinicPhrasesData(lang) {
  const L = lang === "sr";
  return {
    intro: L
      ? "Ne znaš kako da objasniš šta ti treba? Evo gotovih fraza na srpskom — možeš pokazati ekran ili ih izgovoriti."
      : "Не знаешь как объяснить, что тебе нужно? Вот готовые фразы на сербском — можно показать с экрана или произнести.",
    groups: CLINIC_PHRASES_ITEMS.groups.map(g => ({ icon: g.icon, title: L ? g.title.sr : g.title.ru, items: g.items })),
    tips: L
      ? [
          "U državnoj ambulanti (Dom zdravlja) potreban je LBO — matični broj stranca. Bez njega — samo uz plaćanje ili hitna pomoć.",
          "Mnogi lekari u Srbiji razumeju engleski. Ako je teško — počni sa „Do you speak English?”",
          "Ponesi ličnu kartu ili pasoš, i ako imaš — staru knjižicu o vakcinaciji.",
          "Srpski i ruski su slični — ako govoriš sporo i jednostavno, često će te razumeti.",
        ]
      : [
          "В государственной поликлинике (Дом здравља) нужен LBO — личный номер иностранца. Без него — только платно или экстренная помощь.",
          "Многие врачи в Сербии понимают английский. Если сложно — начни с «Do you speak English?» (Да ли говорите енглески?)",
          "Возьми с собой личную карту или паспорт, и если есть — старую прививочную книжку.",
          "Сербский и русский похожи — если говорить медленно и просто, тебя часто поймут.",
        ],
  };
}

function citySearchData(lang) {
  const L = lang === "sr";
  return {
    "Нови Сад": [
      { id: "ns_vax",      label: L?"Vakcinacija — sve redom":"Вакцинация — всё подряд",        query: "vakcinacija Novi Sad",                  icon: "💉", hint: L?"Opšta pretraga mesta za vakcinaciju":"Общий поиск мест для прививок" },
      { id: "ns_dom",      label: L?"Dom zdravlja (državna ambulanta)":"Дом здравља (гос. поликлиника)", query: "Dom zdravlja Novi Sad",                 icon: "🏥", hint: L?"Besplatno uz LBO / matični broj":"Бесплатно по LBO / матичном броју" },
      { id: "ns_private",  label: L?"Privatne klinike":"Частные клиники",                 query: "privatna klinika vakcinacija Novi Sad", icon: "🏨", hint: L?"Bez LBO, brže, uz plaćanje":"Без LBO, быстрее, платно" },
      { id: "ns_pharmacy", label: L?"Apoteke (grip, COVID)":"Аптеки (грипп, COVID)",           query: "apoteka vakcinacija grip Novi Sad",     icon: "💊", hint: L?"Bez zakazivanja, sezonske vakcine":"Без записи, сезонные прививки" },
      { id: "ns_hpv",      label: L?"HPV vakcina":"ВПЧ-вакцина",                    query: "HPV vakcina ginekolog Novi Sad",        icon: "🌸", hint: L?"Ginekolog ili privatna klinika":"Гинеколог или частная клиника" },
      { id: "ns_travel",   label: L?"Putne vakcine":"Путевые прививки",                query: "putne vakcine Institut Novi Sad",       icon: "✈️", hint: L?"Žuta groznica, tifus i dr.":"Жёлтая лихорадка, тиф и др." },
    ],
    "Белград": [
      { id: "bg_vax",      label: L?"Vakcinacija — sve redom":"Вакцинация — всё подряд",        query: "vakcinacija Beograd",                   icon: "💉", hint: L?"Opšta pretraga mesta za vakcinaciju":"Общий поиск мест для прививок" },
      { id: "bg_dom",      label: L?"Dom zdravlja (državna ambulanta)":"Дом здравља (гос. поликлиника)", query: "Dom zdravlja Beograd",                  icon: "🏥", hint: L?"Besplatno uz LBO / matični broj":"Бесплатно по LBO / матичном броју" },
      { id: "bg_private",  label: L?"Privatne klinike":"Частные клиники",                 query: "privatna klinika vakcinacija Beograd",  icon: "🏨", hint: L?"Bez LBO, brže, uz plaćanje":"Без LBO, быстрее, платно" },
      { id: "bg_pharmacy", label: L?"Apoteke (grip, COVID)":"Аптеки (грипп, COVID)",           query: "apoteka vakcinacija grip Beograd",      icon: "💊", hint: L?"Bez zakazivanja, sezonske vakcine":"Без записи, сезонные прививки" },
      { id: "bg_hpv",      label: L?"HPV vakcina":"ВПЧ-вакцина",                    query: "HPV vakcina ginekolog Beograd",         icon: "🌸", hint: L?"Ginekolog ili privatna klinika":"Гинеколог или частная клиника" },
      { id: "bg_travel",   label: L?"Putne vakcine":"Путевые прививки",                query: "putne vakcine Institut Beograd",        icon: "✈️", hint: L?"Žuta groznica, tifus i dr.":"Жёлтая лихорадка, тиф и др." },
    ],
  };
}

// ─── DATA: CITY STATS & REVIEWS (демо) ───────────────────────────────────────

function cityStatsData(lang) {
  const L = lang === "sr";
  return {
    "Нови Сад": { vaccinated30d: 1247, trend: "+12%", topVaccine: L?"Grip":"Грипп" },
    "Белград":  { vaccinated30d: 4891, trend: "+8%",  topVaccine: L?"Grip":"Грипп" },
  };
}

function cityReviewsData(lang) {
  if (lang === "sr") return {
    "Нови Сад": [
      { id:1, name:"Ana",    emoji:"👩", vaccine:"Grip",     clinic:"Dom zdravlja Novi Sad", rating:5, text:"Besplatno uz LBO, red je trajao 20-ak minuta. Sve brzo i bez nerviranja.", date:"pre 3 dana" },
      { id:2, name:"Igor",   emoji:"🧑", vaccine:"Td (tetanus)", clinic:"Privatna klinika u centru", rating:4, text:"Bez LBO su me primili odmah, platio sam ~1000 dinara. Lekar je govorio engleski.", date:"pre nedelju dana" },
      { id:3, name:"Marija", emoji:"👩‍🦰", vaccine:"HPV",      clinic:"Ginekolog, privatni centar", rating:5, text:"Primila sam prvu dozu HPV vakcine. Skupo (~4000 din), ali u državnoj nije bilo.", date:"pre 2 nedelje" },
      { id:4, name:"Pavle",  emoji:"👨", vaccine:"Hepatitis B",  clinic:"Dom zdravlja Liman", rating:4, text:"Zakazao sam onlajn, došao — uradili su. Trebalo je potvrda LBO.", date:"pre 3 nedelje" },
    ],
    "Белград": [
      { id:5, name:"Olga",   emoji:"👩‍🦳", vaccine:"Grip",    clinic:"Apoteka u centru", rating:5, text:"Direktno u apoteci bez zakazivanja, 600 dinara. Trajalo je 10 minuta.", date:"pre 2 dana" },
      { id:6, name:"Dmitrij",emoji:"👨‍🦱", vaccine:"COVID-19", clinic:"Dom zdravlja Stari Grad", rating:4, text:"Besplatno, ali sam morao da sačekam. Ponesite ličnu kartu.", date:"pre 5 dana" },
      { id:7, name:"Jelena", emoji:"👩", vaccine:"MMR (morbili)", clinic:"Euromedik Novi Beograd", rating:5, text:"Uradila sam antitela, ispalo je da mi treba revakcinacija. Uradili su isti dan.", date:"pre nedelju dana" },
    ],
  };
  return {
    "Нови Сад": [
      { id:1, name:"Анна",   emoji:"👩", vaccine:"Грипп",     clinic:"Дом здравља Нови Сад", rating:5, text:"Бесплатно по LBO, очередь минут 20. Всё быстро и без нервов.", date:"3 дня назад" },
      { id:2, name:"Игорь",  emoji:"🧑", vaccine:"Td (столбняк)", clinic:"Частная клиника в центре", rating:4, text:"Без LBO приняли сразу, заплатил ~1000 динар. Врач говорил по-английски.", date:"неделю назад" },
      { id:3, name:"Мария",  emoji:"👩‍🦰", vaccine:"ВПЧ",      clinic:"Гинеколог, частный центр", rating:5, text:"Сделала первую дозу ВПЧ. Дорого (~4000 дин), но в гос. не было.", date:"2 недели назад" },
      { id:4, name:"Павел",  emoji:"👨", vaccine:"Гепатит B",  clinic:"Дом здравља Лиман", rating:4, text:"Записался онлайн, пришёл — сделали. Нужна была справка LBO.", date:"3 недели назад" },
    ],
    "Белград": [
      { id:5, name:"Ольга",  emoji:"👩‍🦳", vaccine:"Грипп",    clinic:"Аптека в центре", rating:5, text:"Прямо в аптеке без записи, 600 динар. Заняло 10 минут.", date:"2 дня назад" },
      { id:6, name:"Дмитрий",emoji:"👨‍🦱", vaccine:"COVID-19", clinic:"Дом здравља Стари Град", rating:4, text:"Бесплатно, но пришлось подождать. Принесите личную карту.", date:"5 дней назад" },
      { id:7, name:"Елена",  emoji:"👩", vaccine:"MMR (корь)", clinic:"Euromedik Нови Београд", rating:5, text:"Сдала антитела, оказалось нужна ревакцинация. Сделали в тот же день.", date:"неделю назад" },
    ],
  };
}

function emergencyCasesData(lang) {
  if (lang === "sr") return [
    {
      id: "dog_bite", icon: "🐕", title: "Ujeo pas ili mačka", urgent: true,
      subtitle: "Rizik od besnila i tetanusa",
      action: "Odmah operi ranu vodom i sapunom 15 minuta. Javi se u hitnu pomoć ISTOG DANA — besnilo je smrtonosno, ali sprečivo pravovremenom vakcinacijom.",
      vaccines: [
        { name: "Antirabična vakcina (protiv besnila)", detail: "Serija od nekoliko doza po šemi 0–3–7–14–28 dana. Počni što pre.", critical: true },
        { name: "Tetanusni anatoksin", detail: "Ako je poslednja vakcina protiv tetanusa bila pre više od 5 godina ili je nepoznata.", critical: true },
        { name: "Antirabični imunoglobulin", detail: "Kod dubokih ujeda — daje se u prvim satima zajedno sa vakcinom.", critical: false },
      ],
      where: "Hitna pomoć, Institut za javno zdravlje",
      whereQuery: "hitna pomoc antirabicna vakcina",
    },
    {
      id: "rusty_nail", icon: "🔩", title: "Posekao/la se ili nagazio/la na ekser", urgent: true,
      subtitle: "Rizik od tetanusa",
      action: "Operi ranu, ukloni prljavštinu. Duboke, prljave rane (rđa, zemlja) opasne su zbog tetanusa. Javi se u roku od 24 sata, posebno ako je vakcina zastarela.",
      vaccines: [
        { name: "Tetanusni anatoksin (Td/Tdap)", detail: "Ako je prošlo više od 5 godina od poslednje vakcine — potrebna je hitna doza. Ako je prošlo više od 10 godina ili status nije poznat — obavezno.", critical: true },
        { name: "Antitetanusni imunoglobulin", detail: "Kod velikih zaprljanih rana i nepoznatog vakcinalnog statusa.", critical: false },
      ],
      where: "Hitna pomoć, Dom zdravlja",
      whereQuery: "hitna pomoc Dom zdravlja",
    },
    {
      id: "deep_wound", icon: "🩹", title: "Duboka ili prljava rana", urgent: true,
      subtitle: "Rizik od tetanusa i infekcije",
      action: "Zaustavi krvarenje, operi ranu. Kod dubokih rana, opekotina, promrzlina postoji rizik od tetanusa. Proveri kada je bila poslednja vakcina.",
      vaccines: [
        { name: "Tetanusni anatoksin (Td)", detail: "Hitna revakcinacija ako je prošlo više od 5 godina.", critical: true },
      ],
      where: "Hitna pomoć, Dom zdravlja",
      whereQuery: "hitna pomoc Dom zdravlja",
    },
    {
      id: "tick_bite", icon: "🦟", title: "Ujed krpelja", urgent: false,
      subtitle: "Rizik od encefalitisa i borelioze",
      action: "Pažljivo ukloni krpelja pincetom, ne gnječeći ga. Sačuvaj ga za analizu ako je moguće. Prati mesto uboda 2–4 nedelje (crvenilo u obliku prstena = borelioza).",
      vaccines: [
        { name: "Imunoglobulin protiv krpeljnog encefalitisa", detail: "Efikasan samo u prvih 72–96 sati. Srbija je oblast niskog rizika za encefalitis, ali je aktuelno kod putovanja u endemske zone.", critical: false },
        { name: "Vakcina protiv krpeljnog encefalitisa", detail: "Ovo je preventiva za budućnost, ne hitna mera. Serija od 3 doze za one koji su često u prirodi.", critical: false },
      ],
      note: "Za boreliozu (Lajmska bolest) ne postoji vakcina — kod pojave prstenastog crvenila potrebni su antibiotici, javi se lekaru.",
      where: "Institut za javno zdravlje, infektolog",
      whereQuery: "Institut za javno zdravlje infektolog",
    },
    {
      id: "blood_contact", icon: "🩸", title: "Kontakt sa tuđom krvlju", urgent: true,
      subtitle: "Rizik od hepatitisa B i HIV-a",
      action: "Ubod tuđom iglom, krv na povređenoj koži ili sluzokoži. Operi mesto kontakta. Javi se HITNO — postekspoziciona profilaksa HIV-a efikasna je samo u prvih 72 sata.",
      vaccines: [
        { name: "Vakcina protiv hepatitisa B + imunoglobulin", detail: "Ako nisi vakcinisan/a protiv hepatitisa B — hitna vakcinacija u prva 24 sata.", critical: true },
        { name: "Postekspoziciona profilaksa HIV-a (PEP)", detail: "Nije vakcina, već terapija tabletama. Počni u prva 72 sata, u idealnom slučaju — u prva 2 sata.", critical: true },
      ],
      where: "Infektivna klinika, centar za HIV",
      whereQuery: "infektivna klinika HIV profilaksa",
    },
    {
      id: "travel_urgent", icon: "✈️", title: "Hitno putovanje u rizičan region", urgent: false,
      subtitle: "Tropske infekcije",
      action: "Putuješ u Afriku, Aziju, Južnu Ameriku? Neke zemlje pri ulasku zahtevaju sertifikat o vakcinaciji (npr. protiv žute groznice).",
      vaccines: [
        { name: "Žuta groznica", detail: "Obavezna za niz zemalja. Sertifikat važi 10 dana posle vakcine — planiraj unapred.", critical: false },
        { name: "Hepatitis A, trbušni tifus", detail: "Preporučene za većinu tropskih destinacija.", critical: false },
        { name: "Malarija (prevencija)", detail: "Nije vakcina — tablete, počinju se pre putovanja. Konsultuj se sa lekarom.", critical: false },
      ],
      where: "Institut za javno zdravlje — putne vakcine",
      whereQuery: "putne vakcine zuta groznica Institut",
    },
  ];
  return [
    {
      id: "dog_bite", icon: "🐕", title: "Укусила собака или кошка", urgent: true,
      subtitle: "Риск бешенства и столбняка",
      action: "Немедленно промой рану водой с мылом 15 минут. Обратись в травмпункт или скорую В ТОТ ЖЕ ДЕНЬ — бешенство смертельно, но предотвратимо при своевременной вакцинации.",
      vaccines: [
        { name: "Антирабическая вакцина (от бешенства)", detail: "Курс из нескольких доз по схеме 0–3–7–14–28 дней. Начать как можно скорее.", critical: true },
        { name: "Столбнячный анатоксин", detail: "Если последняя прививка от столбняка была более 5 лет назад или неизвестна.", critical: true },
        { name: "Антирабический иммуноглобулин", detail: "При глубоких укусах — вводится в первые часы вместе с вакциной.", critical: false },
      ],
      where: "Травмпункт (хитна помоћ), Институт за јавно здравље",
      whereQuery: "hitna pomoc antirabicna vakcina",
    },
    {
      id: "rusty_nail", icon: "🔩", title: "Порезался / наступил на гвоздь", urgent: true,
      subtitle: "Риск столбняка",
      action: "Промой рану, удали грязь. Глубокие, грязные раны (ржавый металл, земля) опасны столбняком. Обратись в течение 24 часов, особенно если прививка устарела.",
      vaccines: [
        { name: "Столбнячный анатоксин (Td/Tdap)", detail: "Если прошло более 5 лет с последней прививки — нужна экстренная доза. Если более 10 лет или статус неизвестен — обязательно.", critical: true },
        { name: "Противостолбнячный иммуноглобулин", detail: "При обширных загрязнённых ранах и неизвестном прививочном статусе.", critical: false },
      ],
      where: "Травмпункт (хитна помоћ), Дом здравља",
      whereQuery: "hitna pomoc Dom zdravlja",
    },
    {
      id: "deep_wound", icon: "🩹", title: "Глубокая или грязная рана", urgent: true,
      subtitle: "Риск столбняка и инфекции",
      action: "Остановите кровотечение, промойте. При глубоких ранах, ожогах, обморожениях есть риск столбняка. Оцените давность последней прививки.",
      vaccines: [
        { name: "Столбнячный анатоксин (Td)", detail: "Экстренная ревакцинация если прошло более 5 лет.", critical: true },
      ],
      where: "Травмпункт, Дом здравља",
      whereQuery: "hitna pomoc Dom zdravlja",
    },
    {
      id: "tick_bite", icon: "🦟", title: "Укусил клещ", urgent: false,
      subtitle: "Риск энцефалита и боррелиоза",
      action: "Аккуратно удали клеща пинцетом, не раздавливая. Сохрани его для анализа если возможно. Следи за местом укуса 2–4 недели (покраснение-мишень = боррелиоз).",
      vaccines: [
        { name: "Иммуноглобулин против клещевого энцефалита", detail: "Эффективен только в первые 72–96 часов. Сербия — низкий риск энцефалита, но при поездках в эндемичные зоны актуально.", critical: false },
        { name: "Вакцина от клещевого энцефалита", detail: "Это профилактика на будущее, не экстренная мера. Курс из 3 доз для тех, кто часто на природе.", critical: false },
      ],
      note: "От боррелиоза (болезни Лайма) вакцины нет — при появлении кольцевидного покраснения нужны антибиотики, обратись к врачу.",
      where: "Институт за јавно здравље, инфекционист",
      whereQuery: "Institut za javno zdravlje infektolog",
    },
    {
      id: "blood_contact", icon: "🩸", title: "Контакт с чужой кровью", urgent: true,
      subtitle: "Риск гепатита B и ВИЧ",
      action: "Укол чужой иглой, попадание крови на повреждённую кожу или слизистые. Промой место. Обратись СРОЧНО — постконтактная профилактика ВИЧ эффективна только в первые 72 часа.",
      vaccines: [
        { name: "Вакцина от гепатита B + иммуноглобулин", detail: "Если ты не привит от гепатита B — экстренная вакцинация в первые 24 часа.", critical: true },
        { name: "Постконтактная профилактика ВИЧ (ПКП)", detail: "Не вакцина, а курс таблеток. Начать в первые 72 часа, лучше — в первые 2 часа.", critical: true },
      ],
      where: "Инфекционная больница, центр СПИД",
      whereQuery: "infektivna klinika HIV profilaksa",
    },
    {
      id: "travel_urgent", icon: "✈️", title: "Срочная поездка в опасный регион", urgent: false,
      subtitle: "Тропические инфекции",
      action: "Едешь в Африку, Азию, Южную Америку? Некоторые страны требуют сертификат о прививках на въезде (например, жёлтая лихорадка).",
      vaccines: [
        { name: "Жёлтая лихорадка", detail: "Обязательна для ряда стран. Сертификат действует через 10 дней после прививки — планируй заранее.", critical: false },
        { name: "Гепатит A, брюшной тиф", detail: "Рекомендованы для большинства тропических направлений.", critical: false },
        { name: "Малярия (профилактика)", detail: "Не вакцина — таблетки, начинать до поездки. Проконсультируйся с врачом.", critical: false },
      ],
      where: "Институт за јавно здравље — путевые прививки",
      whereQuery: "putne vakcine zuta groznica Institut",
    },
  ];
}

function cityNewsData(lang) {
  if (lang === "sr") return {
    "Нови Сад": [
      { id:100, icon:"⚠️", title:"Izbijanje velikog kašlja u Srbiji", tag:"Izbijanje", tagColor:"bg-red-100 text-red-600",
        text:"Institut za javno zdravlje beleži porast slučajeva velikog kašlja (pertusis) širom zemlje. Lekari podsećaju: odraslima je potrebna revakcinacija Tdap na svakih 10 godina — dečja vakcina ne štiti doživotno.",
        date:"aktuelno", place:"cela Srbija",
        link:"https://www.batut.org.rs", linkLabel:"Komentari lekara (Institut Batut)" },
      { id:101, icon:"⚠️", title:"Slučajevi morbila u regionu", tag:"Izbijanje", tagColor:"bg-red-100 text-red-600",
        text:"U Srbiji i susednim zemljama se povremeno registruju izbijanja morbila zbog smanjenog obuhvata vakcinacijom. Proveri da imaš 2 doze MMR — jedna doza iz detinjstva možda nije dovoljna.",
        date:"aktuelno", place:"Srbija i Balkan",
        link:"https://www.who.int/europe/news-room", linkLabel:"Komentari lekara (SZO Evropa)" },
      { id:1, icon:"🚐", title:"Mobilna stanica za davanje krvi", tag:"Davanje krvi", tagColor:"bg-red-100 text-red-600",
        text:"Terenska stanica Zavoda za transfuziju primaće davaoce na Trgu slobode. Ponesi ličnu kartu, ne dolazi našte — lagan doručak je obavezan.",
        date:"Sub, 28. jun, 9:00–14:00", place:"Trg slobode", mapsQuery:"Trg slobode Novi Sad" },
      { id:2, icon:"💉", title:"Besplatna vakcinacija protiv gripa", tag:"Besplatno", tagColor:"bg-emerald-100 text-emerald-600",
        text:"Dom zdravlja počinje sezonsku kampanju protiv gripa. Besplatno za sve sa LBO, za rizične grupe (60+, hronični bolesnici) — bez čekanja u redu.",
        date:"od 1. oktobra", place:"Dom zdravlja Novi Sad", mapsQuery:"Dom zdravlja Novi Sad" },
      { id:3, icon:"🩸", title:"Akcija „Kap krvi” Crvenog krsta", tag:"Davanje krvi", tagColor:"bg-red-100 text-red-600",
        text:"Gradska akcija Crvenog krsta povodom Dana davalaca krvi. Svi davaoci dobijaju rezultate analiza i mali poklon.",
        date:"Ned, 6. jul, 10:00–16:00", place:"Spens (SPC Vojvodina)", mapsQuery:"SPENS Novi Sad" },
      { id:4, icon:"🌸", title:"Nedelja edukacije o HPV-u", tag:"Prevencija", tagColor:"bg-violet-100 text-violet-600",
        text:"Institut za javno zdravlje sprovodi besplatne konsultacije o HPV vakcinaciji za žene do 26 godina. Zakazivanje telefonom.",
        date:"14–20. jul", place:"Institut za javno zdravlje Vojvodine", mapsQuery:"Institut za javno zdravlje Vojvodine" },
    ],
    "Белград": [
      { id:102, icon:"⚠️", title:"Izbijanje velikog kašlja u Srbiji", tag:"Izbijanje", tagColor:"bg-red-100 text-red-600",
        text:"Institut za javno zdravlje beleži porast slučajeva velikog kašlja (pertusis) širom zemlje. Lekari podsećaju: odraslima je potrebna revakcinacija Tdap na svakih 10 godina.",
        date:"aktuelno", place:"cela Srbija",
        link:"https://www.batut.org.rs", linkLabel:"Komentari lekara (Institut Batut)" },
      { id:103, icon:"⚠️", title:"Slučajevi morbila u regionu", tag:"Izbijanje", tagColor:"bg-red-100 text-red-600",
        text:"U Srbiji i susednim zemljama se povremeno registruju izbijanja morbila. Proveri da imaš 2 doze MMR — jedna doza iz detinjstva možda nije dovoljna.",
        date:"aktuelno", place:"Srbija i Balkan",
        link:"https://www.who.int/europe/news-room", linkLabel:"Komentari lekara (SZO Evropa)" },
      { id:5, icon:"🚐", title:"Mobilna stanica za davanje krvi", tag:"Davanje krvi", tagColor:"bg-red-100 text-red-600",
        text:"Terenska stanica Instituta za transfuziju krvi radiće kod Hrama Svetog Save. Davaoci dobijaju besplatan čekap krvi.",
        date:"Sub, 28. jun, 9:00–15:00", place:"Hram Svetog Save", mapsQuery:"Hram Svetog Save Beograd" },
      { id:6, icon:"💉", title:"Besplatna vakcinacija protiv gripa", tag:"Besplatno", tagColor:"bg-emerald-100 text-emerald-600",
        text:"Počinje sezonska kampanja u domovima zdravlja širom grada. Besplatno za sve sa LBO. Rizičnim grupama se preporučuje da ne odlažu.",
        date:"od 1. oktobra", place:"Domovi zdravlja Beograd", mapsQuery:"Dom zdravlja Beograd" },
      { id:7, icon:"🩸", title:"Maraton davanja krvi u Novom Beogradu", tag:"Davanje krvi", tagColor:"bg-red-100 text-red-600",
        text:"Trodnevna akcija u TC Ušće. Zgodno je kombinovati sa kupovinom — punkt za davanje krvi radi direktno u tržnom centru.",
        date:"4–6. jul, 10:00–18:00", place:"TC Ušće", mapsQuery:"Usce Shopping Center Beograd" },
      { id:8, icon:"🦟", title:"Informacija: prevencija od krpelja", tag:"Sezonsko", tagColor:"bg-amber-100 text-amber-600",
        text:"Sezona aktivnosti krpelja. Institut podseća na vakcinaciju protiv krpeljnog encefalitisa za one koji su često u prirodi.",
        date:"aktuelno tokom leta", place:"Institut za javno zdravlje", mapsQuery:"Institut za javno zdravlje Beograd" },
    ],
  };
  return {
    "Нови Сад": [
      { id:100, icon:"⚠️", title:"Вспышка коклюша в Сербии", tag:"Вспышка", tagColor:"bg-red-100 text-red-600",
        text:"Институт јавног здравља фиксирует рост случаев коклюша (велики кашаљ) по стране. Врачи напоминают: взрослым нужна ревакцинация Tdap каждые 10 лет — детская прививка не защищает пожизненно.",
        date:"актуально", place:"вся Сербия",
        link:"https://www.batut.org.rs", linkLabel:"Комментарии врачей (Институт Батут)" },
      { id:101, icon:"⚠️", title:"Случаи кори в регионе", tag:"Вспышка", tagColor:"bg-red-100 text-red-600",
        text:"В Сербии и соседних странах периодически регистрируются вспышки кори из-за снижения охвата вакцинацией. Проверь, что у тебя 2 дозы КПК — одной дозы из детства может быть недостаточно.",
        date:"актуально", place:"Сербия и Балканы",
        link:"https://www.who.int/europe/news-room", linkLabel:"Комментарии врачей (ВОЗ Европа)" },
      { id:1, icon:"🚐", title:"Мобильная донорская машина", tag:"Донорство", tagColor:"bg-red-100 text-red-600",
        text:"Выездная станция Завода за трансфузију примет доноров на Тргу слободе. Возьми личную карту, приходи натощак нельзя — лёгкий завтрак обязателен.",
        date:"Сб, 28 июня, 9:00–14:00", place:"Трг слободе", mapsQuery:"Trg slobode Novi Sad" },
      { id:2, icon:"💉", title:"Бесплатная вакцинация от гриппа", tag:"Бесплатно", tagColor:"bg-emerald-100 text-emerald-600",
        text:"Дом здравља начинает сезонную кампанию против гриппа. Бесплатно для всех с LBO, для групп риска (60+, хроники) — без очереди.",
        date:"с 1 октября", place:"Дом здравља Нови Сад", mapsQuery:"Dom zdravlja Novi Sad" },
      { id:3, icon:"🩸", title:"Акция «Капля крови» Црвеног крста", tag:"Донорство", tagColor:"bg-red-100 text-red-600",
        text:"Городская акция Красного Креста в честь Дня донора. Все доноры получают результаты анализов и небольшой подарок.",
        date:"Вс, 6 июля, 10:00–16:00", place:"Спенс (СПЦ Војводина)", mapsQuery:"SPENS Novi Sad" },
      { id:4, icon:"🌸", title:"Неделя осведомлённости о ВПЧ", tag:"Профилактика", tagColor:"bg-violet-100 text-violet-600",
        text:"Институт јавног здравља проводит бесплатные консультации по ВПЧ-вакцинации для женщин до 26 лет. Запись по телефону.",
        date:"14–20 июля", place:"Институт за јавно здравље Војводине", mapsQuery:"Institut za javno zdravlje Vojvodine" },
    ],
    "Белград": [
      { id:102, icon:"⚠️", title:"Вспышка коклюша в Сербии", tag:"Вспышка", tagColor:"bg-red-100 text-red-600",
        text:"Институт јавног здравља фиксирует рост случаев коклюша (велики кашаљ) по стране. Врачи напоминают: взрослым нужна ревакцинация Tdap каждые 10 лет.",
        date:"актуально", place:"вся Сербия",
        link:"https://www.batut.org.rs", linkLabel:"Комментарии врачей (Институт Батут)" },
      { id:103, icon:"⚠️", title:"Случаи кори в регионе", tag:"Вспышка", tagColor:"bg-red-100 text-red-600",
        text:"В Сербии и соседних странах периодически регистрируются вспышки кори. Проверь, что у тебя 2 дозы КПК — одной дозы из детства может быть недостаточно.",
        date:"актуально", place:"Сербия и Балканы",
        link:"https://www.who.int/europe/news-room", linkLabel:"Комментарии врачей (ВОЗ Европа)" },
      { id:5, icon:"🚐", title:"Мобильная донорская машина", tag:"Донорство", tagColor:"bg-red-100 text-red-600",
        text:"Выездная станция Института за трансфузију крви будет работать у Храма Светог Саве. Доноры получают бесплатный чекап крови.",
        date:"Сб, 28 июня, 9:00–15:00", place:"Храм Светог Саве", mapsQuery:"Hram Svetog Save Beograd" },
      { id:6, icon:"💉", title:"Бесплатная вакцинация от гриппа", tag:"Бесплатно", tagColor:"bg-emerald-100 text-emerald-600",
        text:"Старт сезонной кампании в домовима здравља по всему городу. Бесплатно для всех с LBO. Группам риска рекомендуют не откладывать.",
        date:"с 1 октября", place:"Домови здравља Београд", mapsQuery:"Dom zdravlja Beograd" },
      { id:7, icon:"🩸", title:"Марафон донорства в Нови Београде", tag:"Донорство", tagColor:"bg-red-100 text-red-600",
        text:"Трёхдневная акция в ТЦ Ушће. Удобно совместить с покупками — донорский пункт работает прямо в торговом центре.",
        date:"4–6 июля, 10:00–18:00", place:"ТЦ Ušće", mapsQuery:"Usce Shopping Center Beograd" },
      { id:8, icon:"🦟", title:"Информация: профилактика от клещей", tag:"Сезонное", tagColor:"bg-amber-100 text-amber-600",
        text:"Сезон активности клещей. Институт напоминает о вакцинации от клещевого энцефалита для тех, кто часто бывает на природе.",
        date:"актуально летом", place:"Институт за јавно здравље", mapsQuery:"Institut za javno zdravlje Beograd" },
    ],
  };
}

// ─── VACCINE LOGIC ───────────────────────────────────────────────────────────

function getRecommendations(age, gender, origin, done, dontKnow, notDone = [], lang = "ru") {
  const L = lang === "sr";
  const recs = [];
  const st = (id, def = "check") =>
    done.includes(id) ? "ok" : notDone.includes(id) ? "needed" : dontKnow.includes(id) ? def : def;

  // Год введения гепатита B в нацкалендарь по странам (RU origin values are the canonical ids)
  const HEPB_YEAR = {
    "Россия": "1996", "Беларусь": "1996", "Украина": "2000",
    "Казахстан": "1998", "Другая страна СНГ": null,
    "Rusija": "1996", "Belorusija": "1996", "Ukrajina": "2000",
    "Kazahstan": "1998", "Druga zemlja ZND": null,
  };
  const originGenRu = origin === "Россия" ? "России" : origin === "Беларусь" ? "Беларуси"
    : origin === "Украина" ? "Украине" : origin === "Казахстан" ? "Казахстане" : null;
  const originLocSr = origin === "Rusija" ? "Rusiji" : origin === "Belorusija" ? "Belorusiji"
    : origin === "Ukrajina" ? "Ukrajini" : origin === "Kazahstan" ? "Kazahstanu" : null;
  const hepbYear = HEPB_YEAR[origin];
  const hepbWhy = L
    ? ((hepbYear && originLocSr)
        ? `Serija od 3 doze. U ${originLocSr} je uvedena u nacionalni kalendar od ${hepbYear}. godine — ako si rođen/a ranije, možda nisi primio/la. Uradi analizu na anti-HBs.`
        : "Serija od 3 doze. U različitim zemljama ZND je uvedena u nacionalni kalendar različitih godina — ako si rođen/a pre ~1995, možda nisi primio/la. Uradi analizu na anti-HBs.")
    : ((hepbYear && originGenRu)
        ? `3-дозовая серия. В ${originGenRu} ввели в нацкалендарь с ${hepbYear} г — если родился раньше, возможно не делал. Сдай анализ на anti-HBs.`
        : "3-дозовая серия. В разных странах СНГ ввели в нацкалендарь в разные годы — если родился до ~1995, возможно не делал. Сдай анализ на anti-HBs.");

  const VACCINES = vaccinesData(lang);
  VACCINES.filter(v => !(v.id === "hpv" && age > 45)).forEach(v => {
    if (v.id === "bcg")       recs.push({ ...v, status: st("bcg"), why: L?"Obavezna je u Srbiji. Većina ljudi iz zemalja ZND ima zaštitu — vredi proveriti antitela (Mantoux test).":"Обязательна в Сербии. Большинство из СНГ имеют защиту — стоит проверить антитела (тест Манту).", interval: L?"Jednom u detinjstvu":"Однократно в детстве", cost: L?"Besplatno":"Бесплатно" });
    if (v.id === "dtp")       recs.push({ ...v, status: done.includes("dtp") && age <= 28 ? "ok" : done.includes("dtp") ? "booster" : st("dtp","needed"), why: done.includes("dtp") && age > 28 ? (L?"Odraslima je potrebna revakcinacija Td/Tdap na svakih 10 godina. Ako je poslednja doza bila u školi — rok je odavno istekao.":"Взрослым нужна ревакцинация Td/Tdap каждые 10 лет. Если последняя доза была в школе — срок давно вышел.") : (L?"Revakcinacija na svakih 10 godina. Vakcina koju odrasli najčešće preskaču.":"Ревакцинация каждые 10 лет. Самая часто пропускаемая прививка у взрослых."), interval: L?"Na svakih 10 godina":"Каждые 10 лет", cost: L?"~800–1200 din.":"~800–1200 дин." });
    if (v.id === "mmr")       recs.push({ ...v, status: done.includes("mmr") && age > 35 ? "booster" : st("mmr"), why: done.includes("mmr") && age > 35 ? (L?"U zemljama ZND je druga doza MMR uvedena krajem 90-ih. Ako si vakcinisan/a u ranom detinjstvu — možda je primljena samo jedna doza. Preporuka za odrasle: druga doza ili analiza na IgG antitela na morbile.":"В СНГ вторая доза КПК введена в конце 90-х. Если прививался в раннем детстве — могла быть только одна доза. Рекомендация для взрослых: вторая доза или анализ на антитела IgG к кори.") : (L?"U Srbiji se dešavaju izbijanja morbila. Potrebne su 2 doze — ako nisi siguran/na, bolje je uraditi analizu na antitela.":"В Сербии бывают вспышки кори. Нужно 2 дозы — если не уверен, лучше сдать антитела."), interval: L?"2 doze (ako nije primljeno)":"2 дозы (если не было)", cost: L?"Besplatno preko osiguranja":"Бесплатно по страховке" });
    if (v.id === "hepb")      recs.push({ ...v, status: st("hepb"), why: hepbWhy, interval: L?"3 doze: 0–1–6 mes":"3 дозы: 0–1–6 мес", cost: L?"Besplatno uz LBO":"Бесплатно по LBO" });
    if (v.id === "polio")     recs.push({ ...v, status: st("polio","ok"), why: L?"Većina ljudi iz zemalja ZND je vakcinisana u detinjstvu.":"Большинство из СНГ привиты в детстве.", interval: L?"Puna serija jednokratno":"Полный курс однократно", cost: L?"Besplatno":"Бесплатно" });
    if (v.id === "varicella") recs.push({ ...v, status: st("varicella","ok"), why: L?"Ako je prebolelo u detinjstvu — imunitet je doživotan. Ako nije — 2 doze.":"Если болел в детстве — иммунитет на всю жизнь. Если нет — 2 дозы.", interval: L?"2 doze (ako nije prebolelo)":"2 дозы (если не болел)", cost: L?"~1500–2000 din.":"~1500–2000 дин." });
    if (v.id === "flu")       recs.push({ ...v, status: done.includes("flu") ? "ok" : "needed", why: L?"Godišnja vakcinacija. Sezona — septembar–novembar.":"Ежегодная вакцинация. Сезон — сентябрь–ноябрь.", interval: L?"Svake godine":"Каждый год", cost: L?"~500–800 din.":"~500–800 дин." });
    if (v.id === "covid")     recs.push({ ...v, status: st("covid","check"), why: L?"Preporučena od strane SZO. U Srbiji su dostupni Pfizer i drugi.":"Рекомендована ВОЗ. В Сербии доступны Pfizer и другие.", interval: L?"Prema preporukama SZO":"По рекомендациям ВОЗ", cost: L?"Besplatno":"Бесплатно" });
    if (v.id === "hpv")       recs.push({ ...v, status: st("hpv", age <= 26 ? "needed" : "check"), why: age <= 26 ? (L?"Izričito se preporučuje do 26. godine. U zemljama ZND se skoro nije primenjivala.":"Настоятельно рекомендуется до 26 лет. В СНГ почти не делали.") : (L?"Posle 26. godine — razgovaraj sa ginekologom. Efikasna je do 45. godine.":"После 26 лет — обсуди с гинекологом. Эффективна до 45 лет."), interval: age <= 15 ? (L?"2 doze u razmaku od 6 meseci":"2 дозы с интервалом 6 мес") : (L?"3 doze: 0–2–6 mes":"3 дозы: 0–2–6 мес"), cost: L?"~3000–5000 din.":"~3000–5000 дин." });
  });
  return recs;
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function statusCfg(t) {
  return {
    needed: { bg: "bg-red-50",    border: "border-red-200",    badge: "bg-red-100 text-red-700",        label: t.statusNeeded },
    booster:{ bg: "bg-sky-50",    border: "border-sky-200",    badge: "bg-sky-100 text-sky-700",        label: t.statusBooster },
    check:  { bg: "bg-amber-50",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",    label: t.statusCheck },
    ok:     { bg: "bg-emerald-50",border: "border-emerald-200",badge: "bg-emerald-100 text-emerald-700",label: t.statusOk },
  };
}

function ProgressBar({ step, total }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-teal-500" : "bg-slate-200"}`} />
      ))}
    </div>
  );
}

function LangToggle({ className = "" }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-semibold ${className}`}>
      <button onClick={() => setLang("ru")} className={`px-2.5 py-1 rounded-full transition-all ${lang==="ru" ? "bg-white text-teal-700 shadow-sm" : "text-slate-400"}`}>RU</button>
      <button onClick={() => setLang("sr")} className={`px-2.5 py-1 rounded-full transition-all ${lang==="sr" ? "bg-white text-teal-700 shadow-sm" : "text-slate-400"}`}>SR</button>
    </div>
  );
}

function VaccineInfoModal({ vaccine, onClose }) {
  const { t } = useLang();
  if (!vaccine) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div><div className="text-xs text-teal-600 font-semibold uppercase tracking-wider mb-1">{t.vaxInfoAbout}</div><div className="text-lg font-bold text-slate-900">{vaccine.label}</div></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 ml-2">✕</button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="bg-teal-50 rounded-2xl p-3"><div className="text-xs font-bold text-teal-700 mb-1">{t.vaxInfoWhen}</div><div className="text-sm text-slate-700">{vaccine.info.ages}</div></div>
          <div className="bg-slate-50 rounded-2xl p-3"><div className="text-xs font-bold text-slate-600 mb-1">{t.vaxInfoWho}</div><div className="text-sm text-slate-700">{vaccine.info.who}</div></div>
          <div className="bg-amber-50 rounded-2xl p-3"><div className="text-xs font-bold text-amber-700 mb-1">{t.vaxInfoBooster}</div><div className="text-sm text-slate-700">{vaccine.info.booster}</div></div>
          {vaccine.info.note && <div className="border border-slate-200 rounded-2xl p-3"><div className="text-xs font-bold text-slate-500 mb-1">{t.vaxInfoNote}</div><div className="text-sm text-slate-600">{vaccine.info.note}</div></div>}
        </div>
        <button onClick={onClose} className="w-full mt-4 bg-teal-600 text-white font-semibold py-3 rounded-2xl text-sm">{t.gotIt}</button>
      </div>
    </div>
  );
}

function VaccineCard({ rec, done, onToggleDone }) {
  const { t } = useLang();
  const cfg = statusCfg(t)[rec.status];
  const isDone = done.includes(rec.id);
  if (rec.status === "ok") return null;
  return (
    <div className={`rounded-2xl border p-4 ${isDone ? "border-emerald-200 bg-emerald-50 opacity-70" : `${cfg.bg} ${cfg.border}`} transition-all`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDone ? "bg-emerald-100 text-emerald-700" : cfg.badge} mb-1.5 inline-block`}>{isDone ? t.done : cfg.label}</span>
          <div className="font-semibold text-slate-900 text-sm">{rec.name || rec.label}</div>
        </div>
        <button onClick={() => onToggleDone(rec.id)} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isDone ? "bg-slate-100 text-slate-500" : "bg-teal-600 text-white hover:bg-teal-700"}`}>
          {isDone ? t.undo : t.markDone}
        </button>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mb-3">{rec.why}</p>
      <div className="flex gap-3 text-xs text-slate-500"><span>{t.interval} {rec.interval}</span><span>{t.cost} {rec.cost}</span></div>
    </div>
  );
}

function CheckupCard({ check, done, onToggle }) {
  const { t } = useLang();
  const isDone = done.includes(check.id);
  return (
    <div className={`rounded-2xl border p-4 transition-all ${isDone ? "border-emerald-200 bg-emerald-50 opacity-70" : check.priority === "high" ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-xl flex-shrink-0 mt-0.5">{check.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <div className="text-sm font-semibold text-slate-900">{check.name}</div>
            {check.priority === "high" && !isDone && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{t.priority}</span>}
          </div>
          <div className="text-xs text-slate-500 mb-1">🔄 {check.freq}</div>
          <div className="text-xs text-slate-600 leading-relaxed">{check.why}</div>
        </div>
        <button onClick={() => onToggle(check.id)} className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${isDone ? "bg-slate-100 text-slate-500" : "bg-teal-600 text-white hover:bg-teal-700"}`}>
          {isDone ? "↩" : "✓"}
        </button>
      </div>
    </div>
  );
}

function SearchCard({ item }) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.query)}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50 transition-all group">
      <span className="text-2xl flex-shrink-0">{item.icon}</span>
      <div className="flex-1"><div className="text-sm font-semibold text-slate-900 group-hover:text-teal-800">{item.label}</div><div className="text-xs text-slate-400 mt-0.5">{item.hint}</div></div>
      <svg className="w-4 h-4 text-slate-300 group-hover:text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
    </a>
  );
}

function DonationCenterCard({ center }) {
  const { t } = useLang();
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.mapsQuery)}`;
  const typeColor = (center.type === "Государственный" || center.type === "Državni") ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700";
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor} mb-1.5 inline-block`}>{center.type}</span>
          <div className="font-semibold text-slate-900 text-sm">{center.name}</div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline mt-0.5">
            📍 {center.address}
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg flex-shrink-0">{t.free}</span>
      </div>
      <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 mb-3 leading-relaxed">{center.note}</div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>⏰ {center.hours}</span>
        <a href={`tel:${center.phone}`} className="text-teal-600 font-medium hover:underline">{center.phone}</a>
      </div>
    </div>
  );
}

function EmergencyModal({ basic, onClose }) {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState(null);
  const city = basic.city;
  const EMERGENCY_CASES = emergencyCasesData(lang);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-slate-50 rounded-t-3xl w-full max-w-sm shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0 border-b border-slate-200 bg-white rounded-t-3xl">
          <div className="flex items-center gap-2">
            {selected && <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 mr-1">←</button>}
            <div>
              <div className="text-xs text-red-500 font-bold uppercase tracking-wider">🚨 {t.emergencyTitle}</div>
              <div className="text-base font-bold text-slate-900">{selected ? selected.title : t.whatSituation}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 flex-shrink-0">✕</button>
        </div>

        <div className="overflow-auto p-4 flex flex-col gap-3">
          {!selected && (<>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700 leading-relaxed">
              {t.emergencyBanner} <span className="font-bold">194</span> {t.emergencyBanner2} <span className="font-bold">112</span> {t.emergencyBanner3}
            </div>
            {EMERGENCY_CASES.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all hover:border-red-300 ${c.urgent ? "bg-white border-red-200" : "bg-white border-slate-200"}`}>
                <span className="text-2xl flex-shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{c.title}</span>
                    {c.urgent && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{t.urgent}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.subtitle}</div>
                </div>
                <span className="text-slate-300">›</span>
              </button>
            ))}
          </>)}

          {selected && (<>
            <div className={`rounded-2xl p-4 ${selected.urgent ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">{t.whatToDoNow}</div>
              <div className="text-sm leading-relaxed">{selected.action}</div>
            </div>

            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{t.neededVaccines}</div>
            {selected.vaccines.map((v, i) => (
              <div key={i} className={`rounded-2xl border p-3.5 ${v.critical ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
                <div className="flex items-start gap-2">
                  {v.critical && <span className="text-red-500 flex-shrink-0 mt-0.5">●</span>}
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{v.name}</div>
                    <div className="text-xs text-slate-600 leading-relaxed mt-0.5">{v.detail}</div>
                  </div>
                </div>
              </div>
            ))}

            {selected.note && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                💡 {selected.note}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.whereToGo} {city}</div>
              <div className="text-sm text-slate-700 mb-3">{selected.where}</div>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.whereQuery + " " + city)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-red-700 transition-all">
                {t.findNearest}
              </a>
            </div>

            <div className="bg-slate-100 rounded-xl p-3 text-center">
              <a href="tel:194" className="text-sm font-bold text-red-600">{t.ambulance}</a>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

function PhrasesModal({ onClose }) {
  const { t, lang } = useLang();
  const [copied, setCopied] = useState(null);
  const CLINIC_PHRASES = clinicPhrasesData(lang);
  const copy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-slate-50 rounded-t-3xl w-full max-w-sm shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0 border-b border-slate-200 bg-white rounded-t-3xl">
          <div>
            <div className="text-xs text-teal-600 font-bold uppercase tracking-wider">{t.clinicPhrasesSub}</div>
            <div className="text-base font-bold text-slate-900">{t.clinicPhrasesTitle}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 flex-shrink-0">✕</button>
        </div>
        <div className="overflow-auto p-4 flex flex-col gap-4">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">{CLINIC_PHRASES.intro}</div>

          {CLINIC_PHRASES.groups.map((g, gi) => (
            <div key={gi}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{g.icon} {g.title}</div>
              <div className="flex flex-col gap-2">
                {g.items.map((item, i) => {
                  const id = `${gi}-${i}`;
                  return (
                    <button key={i} onClick={() => copy(item.sr, id)}
                      className="bg-white rounded-2xl border border-slate-200 p-3.5 text-left hover:border-teal-300 transition-all">
                      <div className="text-xs text-slate-400 mb-1">{item.ru}</div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">{item.sr}</div>
                        <span className={`text-xs flex-shrink-0 px-2 py-1 rounded-lg font-medium transition-all ${copied === id ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                          {copied === id ? t.copied : t.copy}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 italic">[{item.tr}]</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.usefulToKnow}</div>
            <div className="flex flex-col gap-2">
              {CLINIC_PHRASES.tips.map((tip, i) => (
                <div key={i} className="text-xs text-slate-600 leading-relaxed flex gap-2"><span className="text-teal-500 flex-shrink-0">•</span><span>{tip}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PLANS: планирую пойти ───────────────────────────────────────────────────

function makeCalendarLink(plan, lang) {
  const d = plan.date.replace(/-/g, "");
  const t = (plan.time || "09:00").replace(":", "");
  const start = `${d}T${t}00`;
  const endH = String(Math.min(23, parseInt((plan.time || "09:00").split(":")[0]) + 1)).padStart(2, "0");
  const end = `${d}T${endH}${(plan.time || "09:00").split(":")[1]}00`;
  const title = plan.type === "donation" ? (lang==="sr"?"Davanje krvi 🩸":"Сдача крови 🩸") : `${lang==="sr"?"Vakcina":"Прививка"}: ${plan.label} 💉`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VaxSeal//RU", "BEGIN:VEVENT",
    `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${title}`,
    plan.clinic ? `LOCATION:${plan.clinic}` : "",
    "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", `DESCRIPTION:${title}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
}

function PlanCard({ plan, onComplete, onDelete }) {
  const { t, lang } = useLang();
  const fmt = d => d ? new Date(d + "T00:00").toLocaleDateString(lang==="sr"?"sr":"ru", { weekday:"short", day:"numeric", month:"long" }) : "";
  const isPast = plan.date && new Date(plan.date + "T23:59") < new Date();
  return (
    <div className={`rounded-2xl border p-4 ${isPast ? "border-amber-300 bg-amber-50" : "border-violet-200 bg-violet-50"}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{plan.type === "donation" ? "🩸" : "💉"}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900">{plan.type === "donation" ? t.donationSingle : plan.label}</div>
          <div className="text-xs text-slate-600 mt-0.5">🗓 {fmt(plan.date)}{plan.time ? ` ${lang==="sr"?"u":"в"} ${plan.time}` : ""}</div>
          {plan.clinic && <div className="text-xs text-slate-500 mt-0.5">📍 {plan.clinic}</div>}
          {isPast && <div className="text-xs text-amber-600 font-medium mt-1">{t.datePast}</div>}
          <div className="flex gap-2 mt-2.5 flex-wrap">
            <button onClick={() => onComplete(plan.id)} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-teal-700 transition-all">{t.went}</button>
            <a href={makeCalendarLink(plan, lang)} download={`vaxseal-${plan.id}.ics`}
              className="text-xs bg-white border border-violet-200 text-violet-700 px-3 py-1.5 rounded-lg font-medium hover:bg-violet-100 transition-all">{t.toCalendar}</a>
            <button onClick={() => onDelete(plan.id)} className="text-xs text-slate-400 px-2 py-1.5 hover:text-red-500 transition-all">{t.delete}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddPlanModal({ onClose, onAdd }) {
  const { t, lang } = useLang();
  const VACCINES = vaccinesData(lang);
  const [type, setType] = useState("vaccine");
  const [vaxId, setVaxId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [clinic, setClinic] = useState("");
  const valid = date && (type === "donation" || vaxId);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="text-lg font-bold text-slate-900">{t.addPlanTitle}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {[["vaccine",t.planVaxTab],["donation",t.planDonTab]].map(([v,l]) => (
              <button key={v} onClick={() => setType(v)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${type === v ? "border-violet-500 bg-violet-50 text-violet-800" : "border-slate-200 text-slate-600"}`}>{l}</button>
            ))}
          </div>
          {type === "vaccine" && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.whichVaccine}</label>
              <select value={vaxId} onChange={e => setVaxId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                <option value="">{t.choose}</option>
                {VACCINES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.date}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.time}</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.clinicOptional}</label>
            <input type="text" value={clinic} onChange={e => setClinic(e.target.value)} placeholder={t.clinicPlaceholder}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
        </div>
        <button onClick={() => {
          const label = type === "vaccine" ? ((VACCINES.find(v => v.id === vaxId) || {}).label || "") : t.donationSingle;
          onAdd({ type, vaxId: type === "vaccine" ? vaxId : null, label, date, time, clinic });
          onClose();
        }} disabled={!valid}
          className="w-full mt-4 bg-violet-600 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 hover:bg-violet-700 transition-all">
          {t.schedule}
        </button>
        <div className="text-xs text-slate-400 text-center mt-2">{t.pushNote}</div>
      </div>
    </div>
  );
}

function AddVaccineModal({ onClose, onAdd }) {
  const { t, lang } = useLang();
  const VACCINES = vaccinesData(lang);
  const [vaxId, setVaxId] = useState("");
  const [date, setDate] = useState("");
  const [clinic, setClinic] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="text-lg font-bold text-slate-900">{t.addVaccineTitle}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.whichVaccine}</label>
            <select value={vaxId} onChange={e => setVaxId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
              <option value="">{t.choose}</option>
              {VACCINES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.whenDone}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.whereDone}</label>
            <input type="text" value={clinic} onChange={e => setClinic(e.target.value)} placeholder={t.clinicName}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
        </div>
        <button onClick={() => { if (vaxId) { onAdd(vaxId, date, clinic); onClose(); } }} disabled={!vaxId}
          className="w-full mt-4 bg-teal-600 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 hover:bg-teal-700 transition-all">
          {t.addAsDone}
        </button>
      </div>
    </div>
  );
}

// ─── SCREENS: QUIZ ───────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }) {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="flex justify-center mb-4"><LangToggle /></div>
        <div className="text-6xl mb-6">💉</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">{t.welcomeTitle}</h1>
        <p className="text-slate-500 mb-2">{t.welcomeLine1}</p>
        <p className="text-slate-400 text-sm mb-10">{t.welcomeLine2}</p>
        <button onClick={onStart} className="w-full bg-teal-600 text-white font-semibold py-4 rounded-2xl hover:bg-teal-700 active:scale-95 transition-all shadow-lg shadow-teal-200">{t.start}</button>
        <p className="text-xs text-slate-400 mt-4">{t.noSignup}</p>
      </div>
    </div>
  );
}

function QuizBasic({ data, onChange, onNext }) {
  const { t, lang } = useLang();
  const ORIGINS = originsData(lang);
  const CITY_SEARCH = citySearchData(lang);
  const valid = data.age && data.origin && data.city && data.gender;
  return (
    <div className="min-h-screen bg-white flex flex-col p-6 max-w-sm mx-auto pb-8">
      <div className="flex justify-end mb-2"><LangToggle /></div>
      <ProgressBar step={1} total={4} />
      <h2 className="text-xl font-bold text-slate-900 mb-1">{t.quizBasicTitle}</h2>
      <p className="text-sm text-slate-500 mb-6">{t.quizBasicSubtitle}</p>
      <div className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t.ageLabel}</label>
        <input type="number" min={14} max={80} value={data.age} onChange={e => onChange({ ...data, age: e.target.value })} placeholder={t.agePlaceholder}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
      <div className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t.genderLabel}</label>
        <div className="flex gap-2">
          {[["female",t.female],["male",t.male]].map(([v,l]) => (
            <button key={v} onClick={() => onChange({ ...data, gender: v })}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${data.gender === v ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-700"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t.originLabel}</label>
        <div className="flex flex-col gap-2">
          {ORIGINS.map(o => (
            <button key={o} onClick={() => onChange({ ...data, origin: o })}
              className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${data.origin === o ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-700"}`}>{o}</button>
          ))}
        </div>
      </div>
      <div className="mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t.cityLabel}</label>
        <div className="flex gap-2">
          {Object.keys(CITY_SEARCH).map(city => (
            <button key={city} onClick={() => onChange({ ...data, city })}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${data.city === city ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-700"}`}>{city}</button>
          ))}
        </div>
      </div>
      <button onClick={onNext} disabled={!valid} className="w-full bg-teal-600 text-white font-semibold py-4 rounded-2xl disabled:opacity-30 transition-all">{t.next}</button>
    </div>
  );
}

function QuizVaccines({ done, dontKnow, notDone, onChange, onNext, onBack }) {
  const { t, lang } = useLang();
  const VACCINES = vaccinesData(lang);
  const { setDone, setDk, setNot } = onChange;
  const [infoVaccine, setInfoVaccine] = useState(null);
  return (
    <div className="min-h-screen bg-white flex flex-col p-6 max-w-sm mx-auto">
      <div className="flex justify-end mb-2"><LangToggle /></div>
      <ProgressBar step={2} total={4} />
      <h2 className="text-xl font-bold text-slate-900 mb-1">{t.quizVaxTitle}</h2>
      <p className="text-sm text-slate-500 mb-4">{t.quizVaxSubtitle}</p>
      <div className="flex gap-2 mb-4 text-xs flex-wrap">
        <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium">{t.legendDone}</span>
        <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">{t.legendUnsure}</span>
        <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-medium">{t.legendNot}</span>
      </div>
      <div className="flex flex-col gap-2 mb-6">
        {VACCINES.map(v => {
          const isDone = done.includes(v.id), isUnsure = dontKnow.includes(v.id), isNot = notDone.includes(v.id);
          return (
            <div key={v.id} className={`rounded-xl border transition-all ${isDone ? "border-teal-400 bg-teal-50" : isUnsure ? "border-amber-300 bg-amber-50" : isNot ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-2 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><div className="text-sm font-medium text-slate-800">{v.label}</div>
                    <button onClick={() => setInfoVaccine(v)} className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center hover:bg-teal-100 hover:text-teal-700">ℹ</button>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{v.hint}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setDone(isDone ? done.filter(x=>x!==v.id):[...done,v.id]); setDk(dontKnow.filter(x=>x!==v.id)); setNot(notDone.filter(x=>x!==v.id)); }}
                    className={`w-8 h-8 rounded-lg text-sm font-bold ${isDone?"bg-teal-500 text-white":"bg-slate-100 text-slate-400"}`}>✓</button>
                  <button onClick={() => { setDk(isUnsure ? dontKnow.filter(x=>x!==v.id):[...dontKnow,v.id]); setDone(done.filter(x=>x!==v.id)); setNot(notDone.filter(x=>x!==v.id)); }}
                    className={`w-8 h-8 rounded-lg text-sm font-bold ${isUnsure?"bg-amber-400 text-white":"bg-slate-100 text-slate-400"}`}>?</button>
                  <button onClick={() => { setNot(isNot ? notDone.filter(x=>x!==v.id):[...notDone,v.id]); setDone(done.filter(x=>x!==v.id)); setDk(dontKnow.filter(x=>x!==v.id)); }}
                    className={`w-8 h-8 rounded-lg text-sm font-bold ${isNot?"bg-red-400 text-white":"bg-slate-100 text-slate-400"}`}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-auto">
        <button onClick={onBack} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-4 rounded-2xl">{t.back}</button>
        <button onClick={onNext} className="flex-grow bg-teal-600 text-white font-semibold py-4 rounded-2xl">{t.next}</button>
      </div>
      <VaccineInfoModal vaccine={infoVaccine} onClose={() => setInfoVaccine(null)} />
    </div>
  );
}

function QuizChronic({ data, onChange, onNext, onBack }) {
  const { t, lang } = useLang();
  const CHRONIC_CONDITIONS = chronicConditionsData(lang);
  const noChronic = !CHRONIC_CONDITIONS.some(c => data[c.key]);
  const toggle = key => onChange({ ...data, [key]: !data[key] });
  const setNone = () => { const cleared = {}; CHRONIC_CONDITIONS.forEach(c => cleared[c.key] = false); onChange(cleared); };
  return (
    <div className="min-h-screen bg-white flex flex-col p-6 max-w-sm mx-auto pb-8">
      <div className="flex justify-end mb-2"><LangToggle /></div>
      <ProgressBar step={3} total={4} />
      <h2 className="text-xl font-bold text-slate-900 mb-1">{t.quizChronicTitle}</h2>
      <p className="text-sm text-slate-500 mb-5">{t.quizChronicSubtitle}</p>
      <div className="flex flex-col gap-2.5 mb-6">
        {CHRONIC_CONDITIONS.map(c => {
          const isActive = data[c.key];
          return (
            <div key={c.key}>
              <button onClick={() => toggle(c.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all ${isActive ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-700"}`}>
                <span className="text-lg">{c.icon}</span><span className="flex-1">{c.label}</span>
                {isActive && <span className="text-teal-500">✓</span>}
              </button>
              {isActive && (
                <div className="mt-1.5 mb-1 ml-2 bg-amber-50 border-l-2 border-amber-300 rounded-r-xl p-3">
                  <div className="text-xs font-bold text-amber-700 mb-1">{t.vaxImpact}</div>
                  <div className="text-xs text-slate-600 leading-relaxed">{c.vaxNote}</div>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={setNone}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all ${noChronic ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-700"}`}>
          <span className="text-lg">✅</span><span className="flex-1">{t.noChronic}</span>
          {noChronic && <span className="text-teal-500">✓</span>}
        </button>
      </div>
      <div className="flex gap-3 mt-auto">
        <button onClick={onBack} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-4 rounded-2xl">{t.back}</button>
        <button onClick={onNext} className="flex-grow bg-teal-600 text-white font-semibold py-4 rounded-2xl">{t.seeResult}</button>
      </div>
    </div>
  );
}

// ─── SCREEN: HOME ────────────────────────────────────────────────────────────

function HomeScreen({ basic, done, dontKnow, notDone, doneDynamic, setDoneDynamic, onAddVaccine, onRetake, onMarkDone, onUnmarkDone, plans, onAddPlan, onDeletePlan, onCompletePlan }) {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState("vaccines");
  const [doneCheckups, setDoneCheckups] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const age = Number(basic.age);
  const recs = getRecommendations(age, basic.gender, basic.origin, done, dontKnow, notDone, lang);
  const checkups = getCheckups(age, basic.gender, basic.city, basic.chronic, lang);
  const citySearchItems = citySearchData(lang)[basic.city] || [];
  const needed = recs.filter(r => r.status === "needed" && !doneDynamic.includes(r.id));
  const booster = recs.filter(r => r.status === "booster" && !doneDynamic.includes(r.id));
  const check  = recs.filter(r => r.status === "check"  && !doneDynamic.includes(r.id));
  const doneVax = recs.filter(r => doneDynamic.includes(r.id));
  const okCount = recs.filter(r => r.status === "ok").length;
  const toggleDone    = id => {
    if (doneDynamic.includes(id)) { setDoneDynamic(p => p.filter(x=>x!==id)); onUnmarkDone(id); }
    else { setDoneDynamic(p => [...p, id]); const rec = recs.find(r => r.id === id); onMarkDone(id, rec ? (rec.name || rec.label) : id); }
  };
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><span className="text-xl">💉</span><span className="font-bold text-slate-900">{t.appName}</span></div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">📍 {basic.city}</span>
            <LangToggle />
          </div>
        </div>
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-3.5 text-white relative">
          <button onClick={() => setShowAdd(true)} title={t.addVaccineTitle}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white text-lg font-bold flex items-center justify-center transition-all leading-none">＋</button>
          <div className="text-xs opacity-80 mb-1.5">{t.homeHealthPicture}</div>
          <div className="flex gap-3.5">
            <div><div className="text-lg font-bold">{needed.length}</div><div className="text-xs opacity-75">{t.needed}</div></div>
            <div><div className="text-lg font-bold">{booster.length}</div><div className="text-xs opacity-75">{t.toUpdate}</div></div>
            <div><div className="text-lg font-bold">{check.length}</div><div className="text-xs opacity-75">{t.toCheck}</div></div>
            <div><div className="text-lg font-bold">{okCount + doneDynamic.length}</div><div className="text-xs opacity-75">{t.ok}</div></div>
          </div>
        </div>
      </div>
      <div className="px-4 pt-3 flex-shrink-0">
        <button onClick={() => setShowEmergency(true)} className="w-full flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold py-3.5 px-4 rounded-2xl text-sm hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-200">
          <span className="text-xl">🚨</span>
          <div className="text-left flex-1">
            <div>{t.emergencyTitle}</div>
            <div className="text-xs text-red-100 font-normal">{t.emergencySubtitle}</div>
          </div>
          <span className="text-red-200">›</span>
        </button>
      </div>
      <div className="flex bg-white border-b border-slate-100 flex-shrink-0 mt-3">
        {[{id:"vaccines",label:t.tabVaccines},{id:"clinics",label:t.tabClinics}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab===tab.id?"border-teal-500 text-teal-700":"border-transparent text-slate-400"}`}>{tab.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
        {activeTab === "vaccines" && (<>
          <button onClick={() => setShowAddPlan(true)} className="w-full flex items-center justify-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 font-semibold py-3 rounded-2xl text-sm hover:bg-violet-100 transition-all">
            {t.planVax}
          </button>
          {plans.length > 0 && (<>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.myPlans}</div>
            {plans.map(p => <PlanCard key={p.id} plan={p} onComplete={onCompletePlan} onDelete={onDeletePlan} />)}
          </>)}
          {needed.length>0 && <><div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.needSection}</div>{needed.map(r=><VaccineCard key={r.id} rec={r} done={doneDynamic} onToggleDone={toggleDone}/>)}</>}
          {booster.length>0 && <><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">{t.boosterSection}</div>{booster.map(r=><VaccineCard key={r.id} rec={r} done={doneDynamic} onToggleDone={toggleDone}/>)}</>}
          {check.length>0  && <><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">{t.checkSection}</div>{check.map(r=><VaccineCard key={r.id} rec={r} done={doneDynamic} onToggleDone={toggleDone}/>)}</>}
          {doneVax.length>0 && <><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">{t.doneSection}</div>{doneVax.map(r=><VaccineCard key={r.id} rec={r} done={doneDynamic} onToggleDone={toggleDone}/>)}</>}
          {needed.length===0 && check.length===0 && booster.length===0 && <div className="text-center py-10"><div className="text-5xl mb-3">🎉</div><div className="font-bold text-slate-900 mb-1">{t.allGoodTitle}</div><div className="text-sm text-slate-500">{t.allGoodSubtitle}</div></div>}
        </>)}
        {activeTab === "clinics" && (<>
          <button onClick={() => setShowPhrases(true)} className="w-full flex items-center gap-3 bg-teal-50 border border-teal-200 text-teal-700 font-semibold py-3.5 px-4 rounded-2xl text-sm hover:bg-teal-100 transition-all">
            <span className="text-xl">🗣</span>
            <div className="text-left flex-1">
              <div>{t.clinicPhrasesBtn}</div>
              <div className="text-xs text-teal-500 font-normal">{t.clinicPhrasesHint}</div>
            </div>
            <span className="text-teal-300">›</span>
          </button>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-slate-600">{t.mapsHint}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.findOnMaps}</div>
          {citySearchItems.map(item => <SearchCard key={item.id} item={item}/>)}
        </>)}
      </div>
      {showAdd && <AddVaccineModal onClose={() => setShowAdd(false)} onAdd={onAddVaccine} />}
      {showEmergency && <EmergencyModal basic={basic} onClose={() => setShowEmergency(false)} />}
      {showPhrases && <PhrasesModal onClose={() => setShowPhrases(false)} />}
      {showAddPlan && <AddPlanModal onClose={() => setShowAddPlan(false)} onAdd={onAddPlan} />}
    </div>
  );
}

// ─── SCREEN: CITY (статистика + отзывы) ──────────────────────────────────────

function CityScreen({ basic }) {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState("news");
  const stats = cityStatsData(lang)[basic.city] || { vaccinated30d: 0, trend: "—", topVaccine: "—" };
  const reviews = cityReviewsData(lang)[basic.city] || [];
  const news = cityNewsData(lang)[basic.city] || [];
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-xl font-bold text-slate-900">🏙 {basic.city}</div>
          <LangToggle />
        </div>
        <div className="text-sm text-slate-500">{t.cityWhatsUp}</div>
      </div>
      <div className="flex bg-white border-b border-slate-100 flex-shrink-0">
        {[{id:"news",label:t.tabNews},{id:"reviews",label:t.tabReviews}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab===tab.id?"border-teal-500 text-teal-700":"border-transparent text-slate-400"}`}>{tab.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-4 text-white">
          <div className="text-xs opacity-80 mb-1">{t.last30days}</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">{stats.vaccinated30d.toLocaleString(lang==="sr"?"sr":"ru")}</div>
            <div className="text-sm bg-white/20 px-2 py-0.5 rounded-full">{stats.trend}</div>
          </div>
          <div className="text-xs opacity-75 mt-1">{t.inYourCity} {stats.topVaccine}</div>
        </div>

        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-600 leading-relaxed">
          {t.demoNote}
        </div>

        {activeTab === "reviews" && (<>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.reviewsAbout}</div>
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl flex-shrink-0">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{r.name}</span>
                    <span className="text-xs text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>
                  </div>
                  <div className="text-xs text-slate-400">{r.date}</div>
                </div>
              </div>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">💉 {r.vaccine}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">📍 {r.clinic}</span>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed">{r.text}</div>
            </div>
          ))}
          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <div className="text-sm text-slate-500 mb-1">{t.didYouVax}</div>
            <div className="text-xs text-slate-400">{t.reviewSoon}</div>
          </div>
        </>)}

        {activeTab === "news" && (<>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.newsSection}</div>
          {news.map(n => (
            <div key={n.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-semibold text-slate-900">{n.title}</span>
                    {n.tag && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${n.tagColor}`}>{n.tag}</span>}
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed mb-1.5">{n.text}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {n.date && <span>🗓 {n.date}</span>}
                    {n.place && <span>📍 {n.place}</span>}
                  </div>
                  {n.link && (
                    <a href={n.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-red-600 font-medium hover:underline mt-1.5 mr-3">💬 {n.linkLabel || t.doctorComments}</a>
                  )}
                  {n.mapsQuery && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.mapsQuery)}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-600 font-medium hover:underline mt-1.5">{t.openOnMap}</a>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 leading-relaxed">
            {t.newsFuture}
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─── SCREEN: DONATION ────────────────────────────────────────────────────────

function DonationScreen({ basic }) {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState("info");
  const DONATION_INFO = donationInfoData(lang);
  const centers = donationCentersData(lang)[basic.city] || [];
  const gender = basic.gender;
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-xl font-bold text-slate-900">{t.donationTitle}</div>
          <LangToggle />
        </div>
        <div className="text-sm text-slate-500">{t.donationSubtitle}</div>
      </div>
      <div className="flex bg-white border-b border-slate-100 flex-shrink-0">
        {[{id:"info",label:t.tabInfo},{id:"centers",label:t.tabCenters}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab===tab.id?"border-red-400 text-red-600":"border-transparent text-slate-400"}`}>{tab.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {activeTab === "info" && (<>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><div className="text-sm text-slate-700 leading-relaxed">{DONATION_INFO.intro}</div></div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.requirements}</div>
            <div className="flex flex-col gap-2">{DONATION_INFO.requirements.map((r,i)=><div key={i} className="flex items-center gap-2.5 text-sm text-slate-700"><span>{r.icon}</span><span>{r.text}</span></div>)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.benefits}</div>
            <div className="flex flex-col gap-2">{DONATION_INFO.benefits.map((b,i)=><div key={i} className="flex items-start gap-2.5 text-sm text-slate-700"><span className="flex-shrink-0">{b.icon}</span><span>{b.text}</span></div>)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.intervals}</div>
            <div className="flex flex-col gap-2">{DONATION_INFO.intervals.map((iv,i)=><div key={i} className="text-sm"><span className="font-semibold text-slate-800">{iv.type}: </span><span className="text-slate-600">{gender==="female"?iv.female:iv.male}</span></div>)}</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">{t.restrictions}</div>
            <div className="flex flex-col gap-1.5">{DONATION_INFO.restrictions.map((r,i)=><div key={i} className="text-xs text-slate-600 flex gap-2"><span className="flex-shrink-0 text-amber-500">—</span><span>{r}</span></div>)}</div>
          </div>
          <div className="bg-red-600 rounded-2xl p-4 text-white">
            <div className="font-semibold mb-1">{t.vaxAndDonationTitle}</div>
            <div className="text-sm opacity-90 leading-relaxed">{t.vaxAndDonationText}</div>
          </div>
        </>)}
        {activeTab === "centers" && (<>
          <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 leading-relaxed">{t.bringId}</div>
          {centers.map(c => <DonationCenterCard key={c.id} center={c} />)}
          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <div className="text-sm text-slate-500 mb-2">{t.moreCenters} {basic.city}</div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("donacija krvi " + basic.city)}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-teal-600 font-semibold hover:underline">{t.findAllCenters}</a>
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─── SCREEN: PROFILE ─────────────────────────────────────────────────────────

function ProfileScreen({ basic, onChange, done, dontKnow, notDone, doneDynamic, onOpenRecords, onFullReset, onRetake }) {
  const { t, lang } = useLang();
  const age = Number(basic.age);
  const recs = getRecommendations(age, basic.gender, basic.origin, done, dontKnow, notDone, lang);
  const needed = recs.filter(r => r.status === "needed" && !doneDynamic.includes(r.id));
  const ok     = recs.filter(r => r.status === "ok" || doneDynamic.includes(r.id));
  const check  = recs.filter(r => r.status === "check" && !doneDynamic.includes(r.id));
  const pct = Math.round(ok.length / recs.length * 100);
  const CHRONIC_CONDITIONS = chronicConditionsData(lang);
  const chronics = CHRONIC_CONDITIONS.filter(c => basic.chronic[c.key]).map(c => c.label);
  const CITY_SEARCH = citySearchData(lang);
  const COUNTRIES = countriesData(lang);
  const country = COUNTRIES.find(c => c.code === basic.country);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-3xl">{basic.gender==="female"?"👩":"👨"}</div>
            <div><div className="font-bold text-slate-900 text-lg">{t.profileTitle}</div><div className="text-sm text-slate-500">{basic.city} · {age} {t.yearsOld}</div></div>
          </div>
          <LangToggle />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-4 text-white flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="white" strokeWidth="6" strokeDasharray={`${2*Math.PI*26}`} strokeDashoffset={`${2*Math.PI*26*(1-pct/100)}`} strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct}%</div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-0.5">{t.immuneProtection}</div>
            <div className="text-xs opacity-80">{ok.length} / {recs.length} {t.ofVaccinesOk}</div>
            <div className="text-xs opacity-70 mt-0.5">{needed.length} {t.needed} · {check.length} {t.toCheck}</div>
          </div>
        </div>

        <button onClick={onOpenRecords}
          className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 hover:border-teal-300 hover:bg-teal-50 transition-all text-left">
          <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center text-xl flex-shrink-0">📋</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">{t.myRecordsTitle}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.myRecordsSubtitle}</div>
          </div>
          <span className="text-slate-300 text-lg">›</span>
        </button>

        <button onClick={onRetake}
          className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 hover:border-teal-300 hover:bg-teal-50 transition-all text-left">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">🔄</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">{t.updateData}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.updateDataSubtitle}</div>
          </div>
          <span className="text-slate-300 text-lg">›</span>
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.myData}</div>
          {[
            {label:t.fAge,value:`${age} ${t.yearsOld}`},
            {label:t.fGender,value:basic.gender==="female"?t.female.split(" ")[0]:t.male.split(" ")[0]},
            {label:t.fOrigin,value:basic.origin||"—"},
            {label:t.fChronic,value:chronics.length>0?chronics.join(", "):t.none},
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">{row.label}</span><span className="text-slate-900 font-medium text-right ml-4">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.cityOfResidence}</div>
          <div className="flex gap-2">
            {Object.keys(CITY_SEARCH).map(city => (
              <button key={city} onClick={() => onChange({ ...basic, city })}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${basic.city===city ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}>
                {city}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-400 mt-2">{t.cityAffects}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.countryOfResidence}</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {COUNTRIES.map(c => (
              <button key={c.code} onClick={() => onChange({ ...basic, country: c.code })}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${basic.country===c.code ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {c.name}
              </button>
            ))}
          </div>
          {country && (
            <a href={country.who} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 bg-teal-50 border border-teal-200 rounded-xl p-3 hover:bg-teal-100 transition-all">
              <div>
                <div className="text-sm font-semibold text-teal-800">{t.whoRecs} {country.name}</div>
                <div className="text-xs text-teal-600 mt-0.5">{t.whoRecsSubtitle}</div>
              </div>
              <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.achievements}</div>
          {[
            {icon:"🗺️",label:t.ach1t,desc:t.ach1d,done:true},
            {icon:"💉",label:t.ach2t,desc:t.ach2d,done:ok.length>=1},
            {icon:"💪",label:t.ach3t,desc:t.ach3d,done:ok.length>=3},
            {icon:"⭐",label:t.ach4t,desc:t.ach4d,done:needed.length===0},
            {icon:"🩸",label:t.ach5t,desc:t.ach5d,done:false},
          ].map(a => (
            <div key={a.label} className={`flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 ${!a.done?"opacity-35":""}`}>
              <span className="text-2xl">{a.icon}</span>
              <div className="flex-1"><div className="text-sm font-semibold text-slate-900">{a.label}</div><div className="text-xs text-slate-500">{a.desc}</div></div>
              {a.done && <span className="text-teal-500 text-lg">✓</span>}
            </div>
          ))}
        </div>

        <button onClick={() => { if (window.confirm(t.resetConfirm)) onFullReset(); }}
          className="w-full border border-red-100 text-red-400 font-medium py-3 rounded-2xl text-xs hover:bg-red-50 transition-all mt-1">
          {t.resetBtn}
        </button>
      </div>
    </div>
  );
}

// ─── SCREEN: RECORDS (мои вакцинации и донорство) ────────────────────────────

function RecordsScreen({ vaxRecords, donationRecords, onBack, onAddDonation, onSetDate }) {
  const { t, lang } = useLang();
  const [showAddDon, setShowAddDon] = useState(false);
  const [donDate, setDonDate] = useState("");
  const [donCenter, setDonCenter] = useState("");
  const [editingDate, setEditingDate] = useState(null);
  const fmt = d => d ? new Date(d).toLocaleDateString(lang==="sr"?"sr":"ru", { day:"numeric", month:"long", year:"numeric" }) : t.dateNotSet;
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-5 pt-6 pb-4 flex-shrink-0">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 mb-2">{t.recordsBack}</button>
        <div className="text-xl font-bold text-slate-900">{t.recordsTitle}</div>
        <div className="text-sm text-slate-500">{t.recordsSubtitle}</div>
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">

        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.doneVaxSection}</div>
          {vaxRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center text-sm text-slate-400">
              {t.emptyVaxRecords}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {vaxRecords.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">💉</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-semibold text-slate-900">{r.label}</div>
                        {r.auto && <span className="text-xs bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full font-medium">{t.markedInQuiz}</span>}
                      </div>
                      {editingDate === r.id ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <input type="date" value={r.date || ""} autoFocus
                            onChange={e => { onSetDate(r.id, e.target.value); }}
                            className="text-xs border border-teal-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400" />
                          <button onClick={() => setEditingDate(null)} className="text-xs text-teal-600 font-semibold hover:underline">{t.doneEdit}</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingDate(r.id)} className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 transition-colors group">
                          🗓 {fmt(r.date)}
                          <span className="text-slate-300 group-hover:text-teal-500">✏️</span>
                        </button>
                      )}
                      {r.clinic && <div className="text-xs text-slate-500 mt-0.5">📍 {r.clinic}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.donationSection}</div>
            <button onClick={() => setShowAddDon(!showAddDon)} className="text-xs text-teal-600 font-semibold hover:underline">
              {showAddDon ? t.cancel : t.add}
            </button>
          </div>

          {showAddDon && (
            <div className="bg-white rounded-2xl border border-teal-200 p-4 mb-2 flex flex-col gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t.whenDonated}</label>
                <input type="date" value={donDate} onChange={e => setDonDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t.whereOptional}</label>
                <input type="text" value={donCenter} onChange={e => setDonCenter(e.target.value)} placeholder={t.clinicName}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <button onClick={() => { onAddDonation(donDate, donCenter); setDonDate(""); setDonCenter(""); setShowAddDon(false); }}
                className="bg-teal-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-all">
                {t.save}
              </button>
            </div>
          )}

          {donationRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center text-sm text-slate-400">
              {t.noDonationRecords}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {donationRecords.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">🩸</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{t.donationSingle}</div>
                      <div className="text-xs text-slate-500 mt-0.5">🗓 {fmt(r.date)}</div>
                      {r.center && <div className="text-xs text-slate-500 mt-0.5">📍 {r.center}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 leading-relaxed">
          {t.recordsFooter}
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [lang, setLangState] = useState("ru");
  const [screen, setScreen] = useState("welcome");
  const [mainTab, setMainTab] = useState("home");
  const [isRetake, setIsRetake] = useState(false);
  const [showRecords, setShowRecords] = useState(false);

  const emptyBasic = { age:"", origin:"", city:"", gender:"", country:"RS", chronic:{} };
  const [basic, setBasic] = useState(emptyBasic);
  const [done,     setDone]     = useState([]);
  const [dontKnow, setDontKnow] = useState([]);
  const [notDone,  setNotDone]  = useState([]);
  const [doneDynamic, setDoneDynamic] = useState([]); // marked done in-session
  const [vaxRecords, setVaxRecords] = useState([]); // {vaxId, label, date, clinic}
  const [donationRecords, setDonationRecords] = useState([]); // {date, center}
  const [plans, setPlans] = useState([]); // {id, type:'vaccine'|'donation', vaxId?, label, date, time, clinic}

  // temp state during quiz (so retake can merge)
  const [quizDone, setQuizDone] = useState([]);
  const [quizDk, setQuizDk]     = useState([]);
  const [quizNot, setQuizNot]   = useState([]);

  const setLang = (l) => { setLangState(l); if (loaded) store.set("vaxpack-lang", l); };

  // ── Load saved data on first mount ──
  useEffect(() => {
    (async () => {
      const savedLang = await store.get("vaxpack-lang");
      const savedProfile = await store.get("vaxpack-profile");
      const savedVaccines = await store.get("vaxpack-vaccines");
      const savedRecords = await store.get("vaxpack-records");
      const savedPlans = await store.get("vaxpack-plans");

      if (savedLang === "ru" || savedLang === "sr") setLangState(savedLang);
      if (savedProfile && savedProfile.age) {
        setBasic({ ...emptyBasic, ...savedProfile });
        setScreen("result");
      }
      if (savedVaccines) {
        setDone(savedVaccines.done || []);
        setDontKnow(savedVaccines.dontKnow || []);
        setNotDone(savedVaccines.notDone || []);
        setDoneDynamic(savedVaccines.doneDynamic || []);
      }
      if (savedRecords) {
        setVaxRecords(savedRecords.vaxRecords || []);
        setDonationRecords(savedRecords.donationRecords || []);
      }
      if (savedPlans) setPlans(savedPlans);
      setLoaded(true);
    })();
  }, []);

  // ── Save on change (skip until initial load finishes) ──
  useEffect(() => { if (loaded) store.set("vaxpack-profile", basic); }, [basic, loaded]);
  useEffect(() => { if (loaded) store.set("vaxpack-vaccines", { done, dontKnow, notDone, doneDynamic }); }, [done, dontKnow, notDone, doneDynamic, loaded]);
  useEffect(() => { if (loaded) store.set("vaxpack-records", { vaxRecords, donationRecords }); }, [vaxRecords, donationRecords, loaded]);
  useEffect(() => { if (loaded) store.set("vaxpack-plans", plans); }, [plans, loaded]);

  const startQuiz = (retake) => {
    setIsRetake(retake);
    if (retake) { setQuizDone([...done]); setQuizDk([...dontKnow]); setQuizNot([...notDone]); }
    else { setQuizDone([]); setQuizDk([]); setQuizNot([]); }
    setScreen("vaccines_quiz");
  };

  // Sync vaccine records from a "done" list — adds quiz-marked vaccines to history
  const syncRecordsFromDone = (doneList) => {
    setVaxRecords(prev => {
      const existingIds = new Set(prev.map(r => r.vaxId));
      const VACCINES = vaccinesData(lang);
      const additions = doneList
        .filter(id => !existingIds.has(id))
        .map((id, i) => {
          const label = (VACCINES.find(v => v.id === id) || {}).label || id;
          return { vaxId: id, label, date: "", clinic: "", auto: true, id: Date.now() + i };
        });
      return [...additions, ...prev];
    });
  };

  const finishQuiz = () => {
    // Retake: quiz was PRE-FILLED with current answers, so its state is the full truth.
    // Nothing gets lost (old answers were the starting point), corrections apply.
    setDone([...quizDone]); setDontKnow([...quizDk]); setNotDone([...quizNot]);
    syncRecordsFromDone(quizDone);
    setScreen("result"); setMainTab("home"); setIsRetake(false);
  };

  // Add a single vaccine from the "+" modal — merges, never resets
  const addVaccine = (vaxId, date, clinic) => {
    setDone(p => Array.from(new Set([...p, vaxId])));
    setDontKnow(p => p.filter(x => x !== vaxId));
    setNotDone(p => p.filter(x => x !== vaxId));
    setDoneDynamic(p => p.filter(x => x !== vaxId));
    const VACCINES = vaccinesData(lang);
    const label = (VACCINES.find(v => v.id === vaxId) || {}).label || vaxId;
    setVaxRecords(p => [{ vaxId, label, date: date || "", clinic: clinic || "", id: Date.now() }, ...p]);
  };

  const addDonation = (date, center) => {
    setDonationRecords(p => [{ date: date || "", center: center || "", id: Date.now() }, ...p]);
  };

  // ── Plans: планирую пойти ──
  const addPlan = (plan) => {
    setPlans(p => [...p, { ...plan, id: Date.now() }].sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time)));
  };
  const deletePlan = (planId) => setPlans(p => p.filter(x => x.id !== planId));
  const completePlan = (planId) => {
    const plan = plans.find(x => x.id === planId);
    if (!plan) return;
    if (plan.type === "vaccine" && plan.vaxId) {
      // отметить прививку сделанной + записать в историю с датой и клиникой из плана
      setDone(p => Array.from(new Set([...p, plan.vaxId])));
      setDontKnow(p => p.filter(x => x !== plan.vaxId));
      setNotDone(p => p.filter(x => x !== plan.vaxId));
      setVaxRecords(p => p.some(r => r.vaxId === plan.vaxId && r.date === plan.date) ? p
        : [{ vaxId: plan.vaxId, label: plan.label, date: plan.date, clinic: plan.clinic || "", id: Date.now() }, ...p]);
    } else if (plan.type === "donation") {
      setDonationRecords(p => [{ date: plan.date, center: plan.clinic || "", id: Date.now() }, ...p]);
    }
    deletePlan(planId);
  };

  // Marking a vaccine "сделал" on a card → auto-add to records
  const markDone = (vaxId, label) => {
    setVaxRecords(p => p.some(r => r.vaxId === vaxId && r.auto) ? p : [{ vaxId, label, date: "", clinic: "", auto: true, id: Date.now() }, ...p]);
  };
  const unmarkDone = (vaxId) => {
    setVaxRecords(p => p.filter(r => !(r.vaxId === vaxId && r.auto)));
  };
  const setRecordDate = (recordId, date) => {
    setVaxRecords(p => p.map(r => r.id === recordId ? { ...r, date } : r));
  };

  const fullReset = () => {
    setScreen("welcome"); setMainTab("home"); setIsRetake(false);
    setBasic(emptyBasic);
    setDone([]); setDontKnow([]); setNotDone([]); setDoneDynamic([]);
    setVaxRecords([]); setDonationRecords([]); setPlans([]);
    setQuizDone([]); setQuizDk([]); setQuizNot([]);
    store.remove("vaxpack-profile");
    store.remove("vaxpack-vaccines");
    store.remove("vaxpack-records");
    store.remove("vaxpack-plans");
  };

  const t = UI[lang];
  const langCtx = { lang, t, setLang };

  // ── Wait for initial load before rendering anything ──
  if (!loaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-4xl animate-pulse">💉</div>
      </div>
    );
  }

  return (
    <LangContext.Provider value={langCtx}>
      <Analytics />
      {(() => {
        // ── Onboarding flow ──
        if (screen === "welcome")  return <WelcomeScreen onStart={() => setScreen("basic")} />;
        if (screen === "basic")    return <QuizBasic data={basic} onChange={setBasic} onNext={() => { setQuizDone([]); setQuizDk([]); setQuizNot([]); setScreen("vaccines_quiz"); }} />;

        // ── Vaccine quiz (used for both first-time and retake) ──
        if (screen === "vaccines_quiz") return (
          <QuizVaccines done={quizDone} dontKnow={quizDk} notDone={quizNot}
            onChange={{ setDone:setQuizDone, setDk:setQuizDk, setNot:setQuizNot }}
            onNext={() => isRetake ? finishQuiz() : setScreen("chronic")}
            onBack={() => isRetake ? (setScreen("result"), setIsRetake(false)) : setScreen("basic")} />
        );

        if (screen === "chronic") return (
          <QuizChronic data={basic.chronic} onChange={(c) => setBasic({ ...basic, chronic: c })}
            onNext={() => {
              const md = Array.from(new Set([...done, ...quizDone]));
              const mk = Array.from(new Set([...dontKnow, ...quizDk])).filter(id => !md.includes(id));
              const mn = Array.from(new Set([...notDone, ...quizNot])).filter(id => !md.includes(id) && !mk.includes(id));
              setDone(md); setDontKnow(mk); setNotDone(mn);
              syncRecordsFromDone(md);
              setScreen("result"); setMainTab("home");
            }}
            onBack={() => setScreen("vaccines_quiz")} />
        );

        // ── Main app with bottom nav ──
        if (screen === "result") {
          if (showRecords) {
            return (
              <div className="flex flex-col h-screen max-w-sm mx-auto bg-slate-50 overflow-hidden" style={{ height: "100dvh" }}>
                <RecordsScreen vaxRecords={vaxRecords} donationRecords={donationRecords} onAddDonation={addDonation} onSetDate={setRecordDate} onBack={() => setShowRecords(false)} />
              </div>
            );
          }
          return (
            <div className="flex flex-col h-screen max-w-sm mx-auto bg-slate-50 overflow-hidden" style={{ height: "100dvh" }}>
              {mainTab === "home"     && <HomeScreen     basic={basic} done={done} dontKnow={dontKnow} notDone={notDone} doneDynamic={doneDynamic} setDoneDynamic={setDoneDynamic} onAddVaccine={addVaccine} onRetake={() => startQuiz(true)} onMarkDone={markDone} onUnmarkDone={unmarkDone} plans={plans} onAddPlan={addPlan} onDeletePlan={deletePlan} onCompletePlan={completePlan} />}
              {mainTab === "city"     && <CityScreen     basic={basic} />}
              {mainTab === "donation" && <DonationScreen basic={basic} />}
              {mainTab === "profile"  && <ProfileScreen  basic={basic} onChange={setBasic} done={done} dontKnow={dontKnow} notDone={notDone} doneDynamic={doneDynamic} onOpenRecords={() => setShowRecords(true)} onFullReset={fullReset} onRetake={() => startQuiz(true)} />}
              <div className="bg-white border-t border-slate-200 flex px-1 pb-2 pt-1 flex-shrink-0">
                {[
                  { id:"home",     label:t.navHome, icon:"💉" },
                  { id:"city",     label:t.navCity,   icon:"🏙" },
                  { id:"donation", label:t.navDonation,   icon:"🩸" },
                  { id:"profile",  label:t.navProfile, icon:"👤" },
                ].map(tab => (
                  <button key={tab.id} onClick={() => { setMainTab(tab.id); setShowRecords(false); }}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors ${mainTab===tab.id?"text-teal-600":"text-slate-400 hover:text-slate-600"}`}>
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-[11px] font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}
    </LangContext.Provider>
  );
}
