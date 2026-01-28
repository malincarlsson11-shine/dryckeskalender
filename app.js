/* ===========================================
   KONSTANTER OCH KONFIGURATION
   =========================================== */

// Hur många veckor kalendern ska omfatta
const TOTAL_WEEKS = 12;

// Hur många dagar innan kalendern raderas (5 dagar enligt kravspec)
const INACTIVITY_DAYS = 5;

// Namn på localStorage-nycklar (där vi sparar data i webbläsaren)
const STORAGE_KEY = 'dryckeskalender_data';
const LAST_ACTIVITY_KEY = 'dryckeskalender_last_activity';
const START_DATE_KEY = 'dryckeskalender_start_date';

// Namn på veckodagar (svenska)
const WEEKDAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

/* ===========================================
   INITIERING NÄR SIDAN LADDAS
   =========================================== */

// När sidan har laddats klart, kör denna funktion
window.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initierar applikationen
 * Kollar om användaren har en befintlig kalender eller ska skapa ny
 */
function initializeApp() {
    // Kolla om det finns sparad data i webbläsaren
    const savedData = localStorage.getItem(STORAGE_KEY);
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const startDate = localStorage.getItem(START_DATE_KEY);
    
    // Om det finns sparad data
    if (savedData && lastActivity && startDate) {
        // Kolla om det gått för länge sedan användaren var aktiv
        const daysSinceLastActivity = getDaysSinceDate(lastActivity);
        
        if (daysSinceLastActivity >= INACTIVITY_DAYS) {
            // För länge sedan! Radera kalendern och visa startsidan
            clearCalendarData();
            showWelcomeScreen();
        } else {
            // Användaren har varit aktiv nyligen, visa kalendern
            showCalendarScreen();
            loadCalendarData();
        }
    } else {
        // Ingen sparad data finns, visa startsidan
        showWelcomeScreen();
    }
}

/* ===========================================
   STARTA NY KALENDER
   =========================================== */

/**
 * Skapar en ny kalender när användaren klickar på "Starta min kalender"
 */
function startCalendar() {
    // Sätt startdatum till idag
    const today = new Date();
    const startDateString = formatDate(today);
    
    // Skapa tom datastruktur för alla 12 veckor
    const calendarData = {};
    for (let week = 1; week <= TOTAL_WEEKS; week++) {
        calendarData[`week${week}`] = {
            monday: '',
            tuesday: '',
            wednesday: '',
            thursday: '',
            friday: '',
            saturday: '',
            sunday: ''
        };
    }
    
    // Spara till localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calendarData));
    localStorage.setItem(START_DATE_KEY, startDateString);
    updateLastActivity();
    
    // Visa kalendervy
    showCalendarScreen();
    loadCalendarData();
}

/* ===========================================
   VISA/DÖLJ SKÄRMAR
   =========================================== */

/**
 * Visar välkomstskärmen och döljer kalendervy
 */
function showWelcomeScreen() {
    document.getElementById('welcome-screen').style.display = 'block';
    document.getElementById('calendar-screen').style.display = 'none';
}

/**
 * Visar kalendervyn och döljer välkomstskärm
 */
function showCalendarScreen() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('calendar-screen').style.display = 'block';
}

/* ===========================================
   LADDA OCH VISA KALENDERDATA
   =========================================== */

/**
 * Laddar och visar all kalenderdata från localStorage
 */
function loadCalendarData() {
    // Hämta sparad data
    const savedData = localStorage.getItem(STORAGE_KEY);
    const startDate = localStorage.getItem(START_DATE_KEY);
    
    if (!savedData || !startDate) {
        return;
    }
    
    // Konvertera från text (JSON) till JavaScript-objekt
    const calendarData = JSON.parse(savedData);
    
    // Visa startdatum
    document.getElementById('start-date-display').textContent = startDate;
    
    // Rensa tidigare innehåll
    const weeksContainer = document.getElementById('weeks-container');
    weeksContainer.innerHTML = '';
    
    // Skapa ett kort för varje vecka
    for (let weekNum = 1; weekNum <= TOTAL_WEEKS; weekNum++) {
        const weekData = calendarData[`week${weekNum}`];
        const weekCard = createWeekCard(weekNum, weekData);
        weeksContainer.appendChild(weekCard);
    }
}

/**
 * Skapar ett veckokort (HTML-element) för en specifik vecka
 * @param {number} weekNumber - Veckans nummer (1-12)
 * @param {object} weekData - Data för veckan (måndag-söndag)
 * @returns {HTMLElement} - HTML-element för veckokortet
 */
function createWeekCard(weekNumber, weekData) {
    // Skapa huvudelement för veckokortet
    const card = document.createElement('div');
    card.className = 'week-card';
    
    // Skapa header med veckonummer och summa
    const header = document.createElement('div');
    header.className = 'week-header';
    
    const title = document.createElement('div');
    title.className = 'week-title';
    title.textContent = `Vecka ${weekNumber}`;
    
    const sumDisplay = document.createElement('div');
    sumDisplay.className = 'week-sum';
    sumDisplay.id = `week${weekNumber}-sum`;
    
    header.appendChild(title);
    header.appendChild(sumDisplay);
    card.appendChild(header);
    
    // Skapa inputfält för varje dag
    const inputGroup = document.createElement('div');
    inputGroup.className = 'day-input-group';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach((day, index) => {
        const dayField = document.createElement('div');
        dayField.className = 'day-field';
        
        const label = document.createElement('label');
        label.className = 'day-label';
        label.textContent = WEEKDAYS[index];
        
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        input.className = 'day-input';
        input.id = `week${weekNumber}-${day}`;
        input.value = weekData[day];
        
        // Lyssna på ändringar och spara automatiskt
        input.addEventListener('input', function(e) {
            handleDayInput(weekNumber, day, e.target.value);
        });
        
        dayField.appendChild(label);
        dayField.appendChild(input);
        inputGroup.appendChild(dayField);
    });
    
    card.appendChild(inputGroup);
    
    // Skapa varningsområde (visas om någon dag saknas)
    const warningDiv = document.createElement('div');
    warningDiv.className = 'week-warning hidden';
    warningDiv.id = `week${weekNumber}-warning`;
    warningDiv.textContent = 'Någon dag är inte ifylld den här veckan.';
    card.appendChild(warningDiv);
    
    // Beräkna och visa summa direkt
    updateWeekSum(weekNumber);
    
    return card;
}

/* ===========================================
   HANTERA INMATNING AV DATA
   =========================================== */

/**
 * Hanterar när användaren skriver in ett värde i ett dagsfält
 * @param {number} weekNumber - Veckans nummer
 * @param {string} day - Dag (t.ex. 'monday')
 * @param {string} value - Värdet användaren skrev in
 */
function handleDayInput(weekNumber, day, value) {
    // Ta bort mellanslag
    value = value.trim();
    
    // Om fältet är tomt, tillåt det
    if (value === '') {
        saveDayValue(weekNumber, day, '');
        updateWeekSum(weekNumber);
        return;
    }
    
    // Ersätt komma med punkt för intern lagring
    let numericValue = value.replace(',', '.');
    
    // Validera att det är ett giltigt tal
    const number = parseFloat(numericValue);
    
    if (isNaN(number) || number < 0 || number > 99) {
        // Ogiltigt tal, återställ till sparat värde
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const savedValue = savedData[`week${weekNumber}`][day];
        document.getElementById(`week${weekNumber}-${day}`).value = savedValue;
        return;
    }
    
    // Begränsa till max 2 decimaler
    const roundedNumber = Math.round(number * 100) / 100;
    
    // Spara värdet
    saveDayValue(weekNumber, day, roundedNumber.toString());
    
    // Visa med komma (svensk standard)
    document.getElementById(`week${weekNumber}-${day}`).value = formatNumber(roundedNumber);
    
    // Uppdatera veckosumman
    updateWeekSum(weekNumber);
}

/**
 * Sparar ett värde för en specifik dag
 * @param {number} weekNumber - Veckans nummer
 * @param {string} day - Dag
 * @param {string} value - Värde att spara
 */
function saveDayValue(weekNumber, day, value) {
    // Hämta befintlig data
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    
    // Uppdatera värdet
    savedData[`week${weekNumber}`][day] = value;
    
    // Spara tillbaka till localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    
    // Uppdatera senaste aktivitet
    updateLastActivity();
}

/* ===========================================
   BERÄKNA OCH VISA VECKOSUMMOR
   =========================================== */

/**
 * Beräknar och visar summan för en vecka
 * @param {number} weekNumber - Veckans nummer
 */
function updateWeekSum(weekNumber) {
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const weekData = savedData[`week${weekNumber}`];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    let sum = 0;
    let hasEmptyDay = false;
    let hasAnyValue = false;
    
    // Summera alla dagar
    days.forEach(day => {
        const value = weekData[day];
        
        if (value === '') {
            hasEmptyDay = true;
        } else {
            hasAnyValue = true;
            const number = parseFloat(value);
            if (!isNaN(number)) {
                sum += number;
            }
        }
    });
    
    // Visa summan
    const sumDisplay = document.getElementById(`week${weekNumber}-sum`);
    
    if (hasAnyValue) {
        const roundedSum = Math.round(sum * 100) / 100;
        sumDisplay.textContent = `Summa: ${formatNumber(roundedSum)} glas`;
    } else {
        sumDisplay.textContent = '';
    }
    
    // Visa varning om någon dag saknas
    const warningDiv = document.getElementById(`week${weekNumber}-warning`);
    
    if (hasAnyValue && hasEmptyDay) {
        warningDiv.classList.remove('hidden');
    } else {
        warningDiv.classList.add('hidden');
    }
}

/* ===========================================
   MODAL (STANDARDGLAS-INFORMATION)
   =========================================== */

/**
 * Öppnar modalen med standardglas-information
 */
function openModal() {
    const modal = document.getElementById('standard-glass-modal');
    modal.classList.add('active');
    
    // Förhindra scrollning på body när modal är öppen
    document.body.style.overflow = 'hidden';
}

/**
 * Stänger modalen
 */
function closeModal() {
    const modal = document.getElementById('standard-glass-modal');
    modal.classList.remove('active');
    
    // Återställ scrollning
    document.body.style.overflow = '';
}

/**
 * Stänger modalen om användaren klickar utanför modalboxen
 */
function closeModalOnOverlay(event) {
    if (event.target.id === 'standard-glass-modal') {
        closeModal();
    }
}

/* ===========================================
   HJÄLPFUNKTIONER
   =========================================== */

/**
 * Uppdaterar tidsstämpel för senaste aktivitet
 */
function updateLastActivity() {
    const now = new Date();
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toISOString());
}

/**
 * Raderar all kalenderdata
 */
function clearCalendarData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(START_DATE_KEY);
}

/**
 * Formaterar ett tal med komma som decimalavskiljare
 * @param {number} number - Talet att formatera
 * @returns {string} - Formaterad sträng
 */
function formatNumber(number) {
    return number.toString().replace('.', ',');
}

/**
 * Formaterar ett datum till svensk standard (ÅÅÅÅ-MM-DD)
 * @param {Date} date - Datum att formatera
 * @returns {string} - Formaterad datumsträng
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Beräknar hur många dagar det gått sedan ett visst datum
 * @param {string} dateString - Datum i ISO-format
 * @returns {number} - Antal dagar
 */
function getDaysSinceDate(dateString) {
    const pastDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - pastDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
