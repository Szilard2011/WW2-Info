document.addEventListener('DOMContentLoaded', () => {
    // Global variables and DOM elements
    const langSwitcher = document.getElementById('language-switcher');
    const mainNavLinks = document.querySelectorAll('#main-navigation .nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const currentYearSpan = document.getElementById('currentYear');

    // Simulation settings elements (Homepage)
    const simSideSelect = document.getElementById('sim-side');
    const simFocusSelect = document.getElementById('sim-focus');
    const simDifficultyRadios = document.querySelectorAll('input[name="sim-difficulty"]');
    const applySettingsBtn = document.getElementById('apply-settings-btn');
    const settingsFeedback = document.getElementById('settings-feedback');

    // Simulation tab elements
    const displaySimSide = document.getElementById('display-sim-side');
    const displaySimFocus = document.getElementById('display-sim-focus');
    const displaySimDifficulty = document.getElementById('display-sim-difficulty');

    const scenarioDisplayArea = document.getElementById('scenario-display-area');
    const scenarioTitlePlaceholder = document.getElementById('scenario-title-placeholder');
    const scenarioImageElement = document.getElementById('scenario-image');
    const scenarioImagePlaceholderDiv = scenarioDisplayArea.querySelector('.scenario-img-placeholder');
    const scenarioDescriptionPlaceholder = document.getElementById('scenario-description-placeholder');
    const scenarioChooseOptionText = document.getElementById('scenario-choose-option-text');
    const scenarioChoicesContainer = document.getElementById('scenario-choices-container');

    const outcomeDisplayArea = document.getElementById('outcome-display-area');
    const outcomeDescription = document.getElementById('outcome-description');
    const restartScenarioBtn = document.getElementById('restart-scenario-btn');

    let translations = {};
    let currentLanguage = localStorage.getItem('preferredLanguage') || 'hu';
    let currentSimSettings = JSON.parse(localStorage.getItem('simSettings')) || {};

    // --- INITIALIZATION ---
    async function initializeApp() {
        await loadTranslations();
        setLanguage(currentLanguage);
        
        if (currentSimSettings && currentSimSettings.side) {
            updateSimSettingsInputs();
        } else {
            currentSimSettings = {
                side: 'allies',
                focus: 'europe',
                difficulty: 'easy'
            };
            updateSimSettingsInputs();
        }
        setupEventListeners();
        showSection('home');
        updateCurrentYear(); // This will set it from JS, not hardcoded in HTML
        updateSimulationTabDisplay();
    }

    // --- TRANSLATION HANDLING ---
    async function loadTranslations() {
        try {
            const response = await fetch('translations.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            translations = await response.json();
        } catch (error) {
            console.error("Could not load translations:", error);
            translations = { [currentLanguage]: { "site_title": "WW2 Simulator (Error)" } };
        }
    }

    function setLanguage(lang) {
        currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);
        document.documentElement.lang = lang;

        langSwitcher.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.dataset.translate;
            const langTranslations = translations[lang] || {};
            if (langTranslations[key] !== undefined) {
                const translationText = langTranslations[key];
                if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button') || el.tagName === 'BUTTON') {
                    el.value = translationText; // For input buttons
                    if (el.tagName === 'BUTTON') el.textContent = translationText; // For button elements
                } else if (el.tagName === 'TITLE') {
                    el.textContent = translationText;
                } else {
                    el.innerHTML = translationText;
                }
            }
        });
        updateSimulationTabDisplay();
    }

    // --- NAVIGATION HANDLING ---
    function showSection(sectionId) {
        contentSections.forEach(section => {
            section.classList.toggle('active-content', section.id === `${sectionId}-content`);
        });
        mainNavLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });
        if (sectionId === 'simulation') {
            updateSimulationTabDisplay();
        }
    }

    // --- FOOTER YEAR UPDATE ---
    function updateCurrentYear() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }

    // --- SIMULATION SETTINGS HANDLING (HOMEPAGE) ---
    function updateSimSettingsInputs() {
        if (!currentSimSettings) currentSimSettings = {}; 
        
        simSideSelect.value = currentSimSettings.side || 'allies';
        simFocusSelect.value = currentSimSettings.focus || 'europe';
        
        let difficultySet = false;
        simDifficultyRadios.forEach(radio => {
            if (radio.value === (currentSimSettings.difficulty || 'easy')) {
                radio.checked = true;
                difficultySet = true;
            } else {
                radio.checked = false;
            }
        });
        if (!difficultySet && simDifficultyRadios.length > 0) { // Ensure 'easy' is checked if no valid setting
             simDifficultyRadios.forEach(radio => {
                if (radio.value === 'easy') radio.checked = true;
            });
        }
    }

    function handleApplySettings() {
        currentSimSettings.side = simSideSelect.value;
        currentSimSettings.focus = simFocusSelect.value;
        simDifficultyRadios.forEach(radio => {
            if (radio.checked) {
                currentSimSettings.difficulty = radio.value;
            }
        });
        localStorage.setItem('simSettings', JSON.stringify(currentSimSettings));

        const messageKey = "settings_applied_message";
        settingsFeedback.textContent = (translations[currentLanguage] && translations[currentLanguage][messageKey]) || "Settings saved!";
        setTimeout(() => { settingsFeedback.textContent = ''; }, 3000);

        updateSimulationTabDisplay();
    }

    // --- SIMULATION TAB DISPLAY UPDATE ---
    function updateSimulationTabDisplay() {
        if (!translations[currentLanguage] || !currentSimSettings) return;

        const langTranslations = translations[currentLanguage] || {};

        displaySimSide.textContent = langTranslations[`side_${currentSimSettings.side}`] || currentSimSettings.side || '-';
        displaySimFocus.textContent = langTranslations[`focus_${currentSimSettings.focus}`] || currentSimSettings.focus || '-';
        displaySimDifficulty.textContent = langTranslations[`difficulty_${currentSimSettings.difficulty}`] || currentSimSettings.difficulty || '-';

        loadScenario();
    }

    function getScenarioKey(settings) {
        if (!settings || !settings.side || !settings.focus) return null;

        if (settings.side === 'allies' && settings.focus === 'europe') return 'allies_europe_1944';
        if (settings.side === 'axis' && settings.focus === 'eastern_front') return 'axis_eastern_front_1942';
        if (settings.side === 'allies' && settings.focus === 'pacific') return 'allies_pacific_1942';
        if (settings.side === 'axis' && settings.focus === 'pacific') return 'axis_pacific_1941';
        return null;
    }

    function loadScenario() {
        outcomeDisplayArea.style.display = 'none';
        scenarioDisplayArea.style.display = 'block';
        scenarioChooseOptionText.style.display = 'none';
        scenarioChoicesContainer.innerHTML = '';

        const langTranslations = translations[currentLanguage] || {};

        if (!currentSimSettings || !currentSimSettings.side || !currentSimSettings.focus || !currentSimSettings.difficulty) {
            scenarioTitlePlaceholder.textContent = langTranslations['simulation_scenario_title'] || "Scenario";
            scenarioDescriptionPlaceholder.innerHTML = langTranslations['settings_not_set_simulation'] || "Please set simulation parameters on the Homepage first.";
            scenarioImageElement.style.display = 'none';
            scenarioImagePlaceholderDiv.style.display = 'flex';
            scenarioImagePlaceholderDiv.innerHTML = '';
            return;
        }
        
        const scenarioBaseKey = getScenarioKey(currentSimSettings);

        if (!scenarioBaseKey || !langTranslations[`scenario_${scenarioBaseKey}_title`]) {
            scenarioTitlePlaceholder.textContent = langTranslations['simulation_scenario_title'] || "Scenario";
            scenarioDescriptionPlaceholder.innerHTML = langTranslations['scenario_not_available'] || "No scenario available for this combination of settings. Please choose different settings on the Homepage.";
            scenarioImageElement.style.display = 'none';
            scenarioImagePlaceholderDiv.style.display = 'flex';
            scenarioImagePlaceholderDiv.innerHTML = '';
            return;
        }

        scenarioImagePlaceholderDiv.innerHTML = '';

        scenarioTitlePlaceholder.textContent = langTranslations[`scenario_${scenarioBaseKey}_title`];
        scenarioDescriptionPlaceholder.innerHTML = langTranslations[`scenario_${scenarioBaseKey}_desc`];

        const imageName = `scenario_${scenarioBaseKey}.png`;
        scenarioImageElement.src = `images/${imageName}`;
        scenarioImageElement.alt = langTranslations[`scenario_${scenarioBaseKey}_title`] || "Scenario Image";

        scenarioImagePlaceholderDiv.style.display = 'flex';
        scenarioImageElement.style.display = 'none';

        scenarioImageElement.onload = () => {
            scenarioImageElement.style.display = 'block';
            scenarioImagePlaceholderDiv.style.display = 'none';
        };
        scenarioImageElement.onerror = () => {
            console.warn(`Image not found: images/${imageName}`);
            scenarioImageElement.style.display = 'none';
            scenarioImagePlaceholderDiv.style.display = 'flex';
        };

        let hasChoices = false;
        for (let i = 1; i <= 2; i++) {
            const choiceKey = `scenario_${scenarioBaseKey}_choice${i}`;
            if (langTranslations[choiceKey]) {
                hasChoices = true;
                const button = document.createElement('button');
                button.classList.add('btn'); // ADDING .btn CLASS FOR STYLING
                // button.classList.add('btn-secondary'); // Optional: if you want specific color for choice buttons
                button.innerHTML = langTranslations[choiceKey];
                button.dataset.choice = i;
                button.addEventListener('click', handleScenarioChoice);
                scenarioChoicesContainer.appendChild(button);
            }
        }

        if (hasChoices) {
            scenarioChooseOptionText.style.display = 'block';
        }
    }

    function handleScenarioChoice(event) {
        const choiceNumber = event.target.dataset.choice;
        const scenarioBaseKey = getScenarioKey(currentSimSettings);
        const difficulty = currentSimSettings.difficulty;
        const langTranslations = translations[currentLanguage] || {};

        const outcomeKey = `scenario_${scenarioBaseKey}_outcome${choiceNumber}_${difficulty}`;
        let outcomeText = langTranslations[outcomeKey];

        if (!outcomeText) {
            const normalOutcomeKey = `scenario_${scenarioBaseKey}_outcome${choiceNumber}_normal`;
            outcomeText = langTranslations[normalOutcomeKey] || "Outcome not found.";
        }

        outcomeDescription.innerHTML = outcomeText;
        scenarioDisplayArea.style.display = 'none';
        outcomeDisplayArea.style.display = 'block';
    }

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        if (langSwitcher) {
            langSwitcher.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-lang]');
                if (button) {
                    setLanguage(button.dataset.lang);
                }
            });
        }

        mainNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showSection(link.dataset.section);
            });
        });

        if (applySettingsBtn) {
            applySettingsBtn.addEventListener('click', handleApplySettings);
        }

        if (restartScenarioBtn) {
            restartScenarioBtn.addEventListener('click', () => {
                showSection('home');
            });
        }
    }

    // Start the application
    initializeApp();
});
