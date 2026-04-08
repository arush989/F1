// Team Data Mapping (Colors and Logos)
const teamData = {
    'red_bull': { color: 'var(--team-red_bull)', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Red_Bull_Racing_logo.svg/1200px-Red_Bull_Racing_logo.svg.png' },
    'ferrari': { color: 'var(--team-ferrari)', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c0/Scuderia_Ferrari_Logo.svg/1200px-Scuderia_Ferrari_Logo.svg.png' },
    'mclaren': { color: 'var(--team-mclaren)', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/66/McLaren_Racing_logo.svg/1200px-McLaren_Racing_logo.svg.png' },
    'mercedes': { color: 'var(--team-mercedes)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Mercedes_AMG_Petronas_F1_Logo.svg/1200px-Mercedes_AMG_Petronas_F1_Logo.svg.png' },
    'aston_martin': { color: 'var(--team-aston_martin)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Aston_Martin_Aramco_Cognizant_F1.svg/1200px-Aston_Martin_Aramco_Cognizant_F1.svg.png' },
    'alpine': { color: 'var(--team-alpine)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/BWT_Alpine_F1_Team_logo.svg/1200px-BWT_Alpine_F1_Team_logo.svg.png' },
    'williams': { color: 'var(--team-williams)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Williams_Racing_2020_logo.svg/1200px-Williams_Racing_2020_logo.svg.png' },
    'rb': { color: 'var(--team-rb)', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Visa_Cash_App_RB_F1_Team_logo.svg/1200px-Visa_Cash_App_RB_F1_Team_logo.svg.png' },
    'sauber': { color: 'var(--team-sauber)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Kick_Sauber_F1_Team_logo.svg/1200px-Kick_Sauber_F1_Team_logo.svg.png' },
    'haas': { color: 'var(--team-haas)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/MoneyGram_Haas_F1_Team_Logo.svg/1200px-MoneyGram_Haas_F1_Team_Logo.svg.png' }
};

const getTeamInfo = (constructorId) => {
    return teamData[constructorId] || { color: 'var(--text-secondary)', logo: '' };
};

// State
let driverStandingsData = [];
let constructorStandingsData = [];
let scheduleData = [];
let myChart = null;

// DOM Elements
const loader = document.getElementById('loader');
const navLinks = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view');

// Navigation Logic
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const viewId = link.getAttribute('data-view');
        views.forEach(view => {
            if (view.id === viewId) {
                view.classList.remove('hidden');
            } else {
                view.classList.add('hidden');
            }
        });
    });
});

// Fetch Data
async function fetchF1Data() {
    try {
        const [driversRes, constructorsRes, scheduleRes] = await Promise.all([
            fetch('https://api.jolpi.ca/ergast/f1/current/driverStandings.json'),
            fetch('https://api.jolpi.ca/ergast/f1/current/constructorStandings.json'),
            fetch('https://api.jolpi.ca/ergast/f1/current.json')
        ]);

        const driversJson = await driversRes.json();
        const constructorsJson = await constructorsRes.json();
        const scheduleJson = await scheduleRes.json();

        driverStandingsData = driversJson.MRData.StandingsTable.StandingsLists[0].DriverStandings;
        constructorStandingsData = constructorsJson.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
        scheduleData = scheduleJson.MRData.RaceTable.Races;

        renderDashboard();
        renderDrivers();
        renderConstructors();
        renderSchedule();

        loader.classList.remove('active');
    } catch (error) {
        console.error("Failed to fetch data", error);
        loader.innerHTML = '<p class="f1-red">Failed to load F1 Telemetry. Please try again later.</p>';
    }
}

// Render Dashboard
function renderDashboard() {
    // Driver Leader
    const driverLeader = driverStandingsData[0];
    const driverTeam = driverLeader.Constructors[0].constructorId;
    const dInfo = getTeamInfo(driverTeam);

    const driverEl = document.getElementById('leader-driver').querySelector('.leader-content');
    driverEl.parentElement.style.setProperty('--team-color', dInfo.color);
    driverEl.parentElement.style.borderLeft = `4px solid ${dInfo.color}`;
    driverEl.innerHTML = `
        <div class="leader-avatar team-color-border" style="--team-color: ${dInfo.color}">${driverLeader.position}</div>
        <div class="leader-info">
            <h2 class="team-color-text">${driverLeader.Driver.givenName} ${driverLeader.Driver.familyName}</h2>
            <p>${driverLeader.Constructors[0].name} • ${driverLeader.points} pts</p>
        </div>
    `;

    // Team Leader
    const teamLeader = constructorStandingsData[0];
    const tInfo = getTeamInfo(teamLeader.Constructor.constructorId);

    const teamEl = document.getElementById('leader-team').querySelector('.leader-content');
    teamEl.parentElement.style.setProperty('--team-color', tInfo.color);
    teamEl.parentElement.style.borderLeft = `4px solid ${tInfo.color}`;
    
    let logoHtml = tInfo.logo ? `<img src="${tInfo.logo}" style="height:40px; filter: drop-shadow(0px 0px 5px rgba(255,255,255,0.2))">` : `<div class="leader-avatar">${teamLeader.position}</div>`;

    teamEl.innerHTML = `
        <div style="margin-right: 1rem;">${logoHtml}</div>
        <div class="leader-info">
            <h2 class="team-color-text">${teamLeader.Constructor.name}</h2>
            <p>${teamLeader.points} pts • ${teamLeader.wins} wins</p>
        </div>
    `;

    // Next Race
    const now = new Date();
    let nextRace = scheduleData.find(race => new Date(race.date) >= now);
    if (!nextRace) nextRace = scheduleData[scheduleData.length - 1]; // Fallback to last race

    const raceEl = document.getElementById('next-race').querySelector('.leader-content');
    raceEl.parentElement.style.borderLeft = `4px solid var(--text-secondary)`;
    raceEl.innerHTML = `
        <div class="leader-info" style="width:100%">
            <h2 style="color:var(--text-primary); font-size:1.4rem;">${nextRace.raceName}</h2>
            <p>${nextRace.Circuit.circuitName}, ${nextRace.Circuit.Location.locality}</p>
            <p style="margin-top:0.5rem; color:var(--f1-red); font-weight:600;">${new Date(nextRace.date).toLocaleDateString()}</p>
        </div>
    `;

    // Chart
    renderChart();
}

function renderChart() {
    const ctx = document.getElementById('pointsChart').getContext('2d');
    
    // Top 10 Drivers
    const top10 = driverStandingsData.slice(0, 10);
    const labels = top10.map(d => d.Driver.familyName);
    const data = top10.map(d => parseInt(d.points));
    
    // Map colors
    const colors = top10.map(d => {
        const cId = d.Constructors[0].constructorId;
        // Basic parsing since css variables don't evaluate in canvas context without getComputedStyle
        return getComputedColor(getTeamInfo(cId).color) || '#94a3b8';
    });

    if (myChart) myChart.destroy();

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Points',
                data: data,
                backgroundColor: colors,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function getComputedColor(varName) {
    if (!varName.startsWith('var')) return varName;
    const match = varName.match(/var\((.+)\)/);
    if (match) {
        return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
    }
    return null;
}

// Render Drivers
function renderDrivers() {
    const list = document.getElementById('drivers-list');
    list.innerHTML = '';

    driverStandingsData.forEach(d => {
        const cId = d.Constructors[0].constructorId;
        const info = getTeamInfo(cId);

        const item = document.createElement('div');
        item.className = 'standing-item glass-panel';
        item.style.setProperty('--team-color', info.color);

        let logoHtml = info.logo ? `<div class="team-logo"><img src="${info.logo}" alt="${d.Constructors[0].name}"></div>` : '';

        item.innerHTML = `
            <div class="pos">${d.position}</div>
            <div class="driver-detail">
                ${logoHtml}
                <div>
                    <div class="driver-name">${d.Driver.givenName} ${d.Driver.familyName}</div>
                    <div class="team-name">${d.Constructors[0].name}</div>
                </div>
            </div>
            <div class="points">${d.points}</div>
        `;
        list.appendChild(item);
    });
}

// Render Constructors
function renderConstructors() {
    const list = document.getElementById('constructors-list');
    list.innerHTML = '';

    constructorStandingsData.forEach(c => {
        const info = getTeamInfo(c.Constructor.constructorId);

        const item = document.createElement('div');
        item.className = 'constructor-item glass-panel';
        item.style.borderTop = `4px solid ${info.color}`;

        let logoHtml = info.logo ? `<div class="team-logo"><img src="${info.logo}" alt="${c.Constructor.name}"></div>` : '';

        item.innerHTML = `
            ${logoHtml}
            <div class="constructor-info">
                <div>
                    <h2 style="color:${info.color}">${c.Constructor.name}</h2>
                    <p style="color:var(--text-secondary)">Pos: ${c.position} • Wins: ${c.wins}</p>
                </div>
                <div class="points" style="font-size:2rem">${c.points}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

// Render Schedule
function renderSchedule() {
    const timeline = document.getElementById('schedule-timeline');
    timeline.innerHTML = '';

    const now = new Date();

    scheduleData.forEach(race => {
        const raceDate = new Date(race.date);
        const isCompleted = raceDate < now;

        const item = document.createElement('div');
        item.className = `race-event glass-panel ${isCompleted ? 'completed' : ''}`;

        item.innerHTML = `
            <div class="race-date">${raceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div class="race-name">${race.raceName}</div>
            <div class="race-location">${race.Circuit.circuitName}, ${race.Circuit.Location.country}</div>
        `;
        timeline.appendChild(item);
    });
}

// Init
fetchF1Data();
