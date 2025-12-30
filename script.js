document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dashboard = document.getElementById('dashboard');
    const logFormScreen = document.getElementById('log-form');
    const logEntryBtn = document.getElementById('log-entry-btn');
    const backToDashBtn = document.getElementById('back-to-dash');
    const dailyForm = document.getElementById('daily-form');
    const categorySummary = document.getElementById('category-summary');
    const greeting = document.getElementById('greeting');
    const currentDateDisplay = document.getElementById('current-date');



    // Navigation Logic
    const showScreen = (id) => {
        [dashboard, logFormScreen].forEach(s => s.classList.remove('active'));
        if (id === 'dashboard') dashboard.classList.add('active');
        else logFormScreen.classList.add('active');
    };

    logEntryBtn.addEventListener('click', () => {
        dailyForm.reset(); // Clear previous selections
        // default date to today
        const dateInput = document.getElementById('entry-date');
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateInput) dateInput.value = todayStr;
        // load existing entry for today (if any)
        loadEntryToForm(todayStr);
        showScreen('form');
    });
    backToDashBtn.addEventListener('click', () => showScreen('dashboard'));

    // Data Management
    const getEntries = () => {
        try {
            const rawEntries = JSON.parse(localStorage.getItem('midnight_entries') || '[]');
            return rawEntries;
        } catch (e) {
            console.error("Error reading from localStorage", e);
            return [];
        }
    };

    const saveEntry = (entry) => {
        const entries = getEntries();
        const index = entries.findIndex(e => e.date === entry.date);
        if (index > -1) entries[index] = entry;
        else entries.push(entry);

        localStorage.setItem('midnight_entries', JSON.stringify(entries));
        updateDashboard('yesterday');
    };

    // UI Updates
    const updateDashboard = (range = 'yesterday') => {
        const entries = getEntries();
        const todayStr = new Date().toISOString().split('T')[0];

        let targetDateStr = todayStr;
        if (range === 'yesterday') {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            targetDateStr = d.toISOString().split('T')[0];
        }

        const targetEntry = entries.find(e => e.date === targetDateStr) || {
            reading: false, meditation: false, facialMassage: false, scalpMassage: false,
            nightPills: false, dayPills: false, soakedNutrishot: false, water3Ltrs: false,
            workout: false, brushTeeth: false, bath: false, takeNutrishot: false,
            boiledDaal: false, teaCoffee: false, news: false, situationPractice: false, mathsAptitude: false
        };

        // Show/hide elements based on range
        const categoryCardsContainer = document.getElementById('category-summary');
        const chartContainer = document.querySelector('.chart-container');
        const rangeMetrics = document.getElementById('range-metrics-container');

        const missedHabitsSection = document.getElementById('missed-habits-section');

        if (range === 'yesterday') {
            // Show boxes, hide heatmap and range metrics
            categoryCardsContainer.style.display = 'grid';
            chartContainer.style.display = 'none';
            rangeMetrics.style.display = 'none';
            rangeMetrics.style.display = 'none';
            // hide mini meters for yesterday
            chartContainer.classList && chartContainer.classList.remove('show-mini');
            const bioCharts = document.getElementById('biometric-charts');
            if (bioCharts) bioCharts.style.display = 'none';

            renderSummaryCards(targetEntry);
            renderAIIntelligenceReport(targetEntry);
        } else {
            // Show heatmap and range metrics, hide boxes
            categoryCardsContainer.style.display = 'none';
            chartContainer.style.display = 'block';
            rangeMetrics.style.display = 'flex';
            // show mini meters for weekly/monthly
            chartContainer.classList && chartContainer.classList.add('show-mini');
            // Show biometric charts
            const bioCharts = document.getElementById('biometric-charts');
            if (bioCharts) bioCharts.style.display = 'flex';

            if (missedHabitsSection) missedHabitsSection.style.display = 'none';

            // Calculate range metrics
            calculateRangePerformance(entries, range);
            renderBiometricCharts(entries, range);
        }

        updateMetrics(entries);
        renderCharts(entries, range);
    };

    const calculateRangePerformance = (entries, range) => {
        const daysCount = range === 'weekly' ? 7 : 30;
        const today = new Date();
        const rangeDates = [];
        for (let i = 0; i < daysCount; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            rangeDates.push(d.toISOString().split('T')[0]);
        }

        const rangeEntries = entries.filter(e => rangeDates.includes(e.date));
        const totalPossibleHabits = daysCount * Object.keys(habitData).length;

        let completedHabits = 0;
        let daysWithActivity = 0;

        rangeEntries.forEach(entry => {
            let dayCompleted = 0;
            Object.keys(habitData).forEach(habitKey => {
                if (entry[habitKey] === true) {
                    completedHabits++;
                    dayCompleted++;
                }
            });
            if (dayCompleted > 0) daysWithActivity++;
        });

        const disciplineScore = totalPossibleHabits > 0 ? Math.round((completedHabits / totalPossibleHabits) * 100) : 0;
        const consistencyScore = Math.round((daysWithActivity / daysCount) * 100);

        updateRangeMeters(disciplineScore, consistencyScore);
    };

    const updateRangeMeters = (discipline, consistency) => {
        const dFill = document.getElementById('discipline-meter-fill');
        const cFill = document.getElementById('consistency-meter-fill');
        const dVal = document.getElementById('discipline-val');
        const cVal = document.getElementById('range-consistency-val');

        if (dFill) dFill.setAttribute('stroke-dasharray', `${discipline}, 100`);
        if (cFill) cFill.setAttribute('stroke-dasharray', `${consistency}, 100`);
        if (dVal) dVal.textContent = `${discipline}%`;
        if (cVal) cVal.textContent = `${consistency}%`;

        // update mini meters if present
        const mdFill = document.getElementById('mini-discipline-meter-fill');
        const mcFill = document.getElementById('mini-consistency-meter-fill');
        const mdVal = document.getElementById('mini-discipline-val');
        const mcVal = document.getElementById('mini-range-consistency-val');

        if (mdFill) mdFill.setAttribute('stroke-dasharray', `${discipline}, 100`);
        if (mcFill) mcFill.setAttribute('stroke-dasharray', `${consistency}, 100`);
        if (mdVal) mdVal.textContent = `${discipline}%`;
        if (mcVal) mcVal.textContent = `${consistency}%`;
    };

    const updateMetrics = (entries) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentEntries = entries.filter(e => new Date(e.date) >= thirtyDaysAgo);

        // Consistency = % of days with at least one 'true' habit
        const loggedDays = recentEntries.length;
        const consistency = Math.round((loggedDays / 30) * 100);

        // Calculate current streak
        const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        let streak = 0;
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        // If today isn't logged, start check from yesterday
        const todayStr = checkDate.toISOString().split('T')[0];
        if (!sorted.find(e => e.date === todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        for (const entry of sorted) {
            const entryStr = entry.date;
            const checkStr = checkDate.toISOString().split('T')[0];

            if (entryStr === checkStr) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        document.getElementById('consistency-val').textContent = `${consistency}%`;
        document.getElementById('streak-val').textContent = `${streak} Day${streak !== 1 ? 's' : ''}`;
    };

    const renderSummaryCards = (entry) => {
        const categories = [
            // Night Log
            { id: 'reading', label: 'Reading', icon: '📖' },
            { id: 'meditation', label: 'Meditation', icon: '🧘' },
            { id: 'facialMassage', label: 'Facial Massage', icon: '✨' },
            { id: 'scalpMassage', label: 'Scalp Massage', icon: '💆' },
            { id: 'nightPills', label: 'Night Pills', icon: '💊' },
            { id: 'dayPills', label: 'Day Pills', icon: '💊' },
            { id: 'soakedNutrishot', label: 'Soaked Nutrishot', icon: '🥜' },
            { id: 'water3Ltrs', label: '3L Water', icon: '💧' },
            // Day Log
            { id: 'workout', label: 'Workout', icon: '💪' },
            { id: 'brushTeeth', label: 'Brush Teeth', icon: '🦷' },
            { id: 'bath', label: 'Bath', icon: '🚿' },
            { id: 'takeNutrishot', label: 'NutriShot', icon: '🥗' },
            { id: 'boiledDaal', label: 'Boiled Daal', icon: '🍲' },
            { id: 'teaCoffee', label: 'Tea/Coffee', icon: '☕' },
            { id: 'news', label: 'News', icon: '📰' },
            { id: 'situationPractice', label: 'Situation Test', icon: '🎯' },
            { id: 'mathsAptitude', label: 'Maths/Aptitude', icon: '🔢' }
        ];

        categorySummary.innerHTML = categories.map((cat, index) => {
            const isYes = entry[cat.id] === true;
            return `
                <div class="cat-card ${isYes ? 'status-yes' : 'status-no'}" style="animation-delay: ${index * 0.05}s">
                    <div class="cat-info">
                        <span class="cat-icon">${cat.icon}</span>
                        <h4>${cat.label}</h4>
                        <span class="val status-text">${isYes ? 'YES' : 'NO'}</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    const habitData = {
        reading: { label: 'Reading', icon: '📖', significance: 'Mental growth and knowledge expansion are stunted when you skip your daily read.' },
        meditation: { label: 'Meditation', icon: '🧘', significance: 'Missing meditation increases mental clutter and reduces your ability to focus under pressure.' },
        facialMassage: { label: 'Facial Massage', icon: '✨', significance: 'Skipping self-care impacts your long-term skin health and rejuvenation process.' },
        scalpMassage: { label: 'Scalp Massage', icon: '💆', significance: 'Direct blood flow to the brain and root health are neglected when this is missed.' },
        nightPills: { label: 'Night Pills', icon: '💊', significance: 'Biological support and recovery are interrupted by missing your nightly supplement.' },
        dayPills: { label: 'Day Pills', icon: '💊', significance: 'Daily metabolic efficiency depends on consistent supplement intake.' },
        soakedNutrishot: { label: 'Soaked Nutrishot', icon: '🥜', significance: 'Vital micronutrients and essential fats are missing from your system.' },
        water3Ltrs: { label: '3L Water', icon: '💧', significance: 'Dehydration slows down every cellular process and reduces overall energy levels.' },
        workout: { label: 'Workout', icon: '💪', significance: 'Strength and discipline are built through consistency; skipping today is a step backward.' },
        brushTeeth: { label: 'Brush Teeth', icon: '🦷', significance: 'Oral hygiene is non-negotiable for long-term health and confidence.' },
        bath: { label: 'Bath', icon: '🚿', significance: 'Physical and mental reset through hygiene is essential for a productive mindset.' },
        takeNutrishot: { label: 'NutriShot', icon: '🥗', significance: 'Missing your raw nutrient intake impacts digestion and natural energy peaks.' },
        boiledDaal: { label: 'Boiled Daal', icon: '🍲', significance: 'Lean protein is the building block of your recovery; your body is now in deficit.' },
        teaCoffee: { label: 'Tea/Coffee', icon: '☕', significance: 'Missing your ritual can affect your planned cognitive performance windows.' },
        news: { label: 'News', icon: '📰', significance: 'Staying uninformed makes you less competitive and aware of the global landscape.' },
        situationPractice: { label: 'Situation Test', icon: '🎯', significance: 'Mental agility and tactical thinking are skills that fade without daily practice.' },
        mathsAptitude: { label: 'Maths/Aptitude', icon: '🔢', significance: 'Logical reasoning and speed are sharpened daily; skipping today dulls your edge.' }
    };

    const generateAIProse = (score, missedCount) => {
        if (missedCount === 0) return "Absolute peak Performance. Your discipline yesterday was surgical. Every biological and mental objective was neutralized. You are evolving at a high velocity.";
        if (score > 80) return "Formidable consistency. Despite a few minor tactical gaps, you maintained high operational efficiency. The trajectory remains overwhelmingly positive.";
        if (score > 50) return "Standard operational level. You are maintaining foundation, but the lack of secondary habit completion is creating a drag on your overall momentum. Level up.";
        if (score > 20) return "Critical Warning. Your discipline is fracturing. Significant gaps in yesterday's performance are stalling your progress. Immediate course correction required.";
        return "Complete System Failure. Yesterday's metric data indicates 0% intentionality. You must re-engage with your objectives immediately to prevent reset.";
    };

    const renderAIIntelligenceReport = (entry) => {
        const missedSection = document.getElementById('missed-habits-section');
        const missedList = document.getElementById('missed-habits-list');
        const aiInsightText = document.getElementById('ai-insight-text');
        const aiPerformanceVal = document.getElementById('ai-performance-val');

        if (!missedSection || !missedList) return;

        const totalHabits = Object.keys(habitData).length;
        const habitsPerformed = Object.keys(habitData).filter(key => entry[key] === true).length;
        const missedHabits = Object.keys(habitData).filter(key => entry[key] !== true);

        const efficiencyScore = totalHabits > 0 ? Math.round((habitsPerformed / totalHabits) * 100) : 0;

        missedSection.style.display = 'block';
        aiPerformanceVal.textContent = `${efficiencyScore}%`;
        aiInsightText.textContent = generateAIProse(efficiencyScore, missedHabits.length);

        if (missedHabits.length > 0) {
            missedList.innerHTML = missedHabits.map((key, index) => {
                const data = habitData[key];
                return `
                    <div class="missed-card" style="animation-delay: ${index * 0.05}s">
                        <div class="missed-icon">${data.icon}</div>
                        <div class="missed-content">
                            <h5>${data.label}</h5>
                            <p>${data.significance}</p>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            missedList.innerHTML = `
                <div class="missed-card" style="grid-column: 1/-1; border-color: #69f0ae; background: rgba(105, 240, 174, 0.05);">
                    <div class="missed-icon" style="background: rgba(105, 240, 174, 0.1);">🏆</div>
                    <div class="missed-content">
                        <h5 style="color: #69f0ae;">PERFORMANCE PEAK</h5>
                        <p>No tactical gaps detected. Every single habit objective was met with high precision.</p>
                    </div>
                </div>
            `;
        }
    };

    const renderCharts = (entries, range) => {
        const container = document.getElementById('heatmapContainer');
        container.innerHTML = '';

        // Determine the number of days to display based on range
        const daysCount = range === 'yesterday' ? 7 : (range === 'weekly' ? 7 : 30);

        // Generate date labels
        const dateLabels = [];
        const today = new Date();
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dateLabels.push(d.toISOString().split('T')[0]);
        }

        // Core areas configuration with sections
        const coreAreas = [
            // Night Log
            { key: null, label: '🌙 NIGHT LOG', isHeader: true },
            { key: 'reading', label: 'Reading' },
            { key: 'meditation', label: 'Meditation' },
            { key: 'facialMassage', label: 'Facial Massage' },
            { key: 'scalpMassage', label: 'Scalp Massage' },
            { key: 'nightPills', label: 'Night Pills' },
            { key: 'dayPills', label: 'Day Pills' },
            { key: 'soakedNutrishot', label: 'Soaked Nutrishot' },
            { key: 'water3Ltrs', label: '3L Water' },
            // Day Log
            { key: null, label: '☀️ DAY LOG', isHeader: true },
            { key: 'workout', label: 'Workout' },
            { key: 'brushTeeth', label: 'Brush Teeth' },
            { key: 'bath', label: 'Bath' },
            { key: 'takeNutrishot', label: 'NutriShot' },
            { key: 'boiledDaal', label: 'Boiled Daal' },
            { key: 'teaCoffee', label: 'Tea/Coffee' },
            { key: 'news', label: 'News' },
            { key: 'situationPractice', label: 'Situation Test' },
            { key: 'mathsAptitude', label: 'Maths/Aptitude' }
        ];

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'heatmap-tooltip';
        document.body.appendChild(tooltip);

        // Create heatmap rows
        coreAreas.forEach(area => {
            // If it's a header row, create a section header
            if (area.isHeader) {
                const headerRow = document.createElement('div');
                headerRow.className = 'heatmap-section-header';
                headerRow.textContent = area.label;
                container.appendChild(headerRow);
                return;
            }
            const row = document.createElement('div');
            row.className = 'heatmap-row';

            // Label
            const label = document.createElement('div');
            label.className = 'heatmap-label';
            label.textContent = area.label;
            row.appendChild(label);

            // Cells container
            const cellsContainer = document.createElement('div');
            cellsContainer.className = 'heatmap-cells';

            dateLabels.forEach(date => {
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';

                const entry = entries.find(e => e.date === date);
                const value = entry && entry[area.key] === true ? 'yes' : (entry ? 'no' : 'empty');
                cell.classList.add(value);

                // Tooltip on hover
                cell.addEventListener('mouseenter', (e) => {
                    const d = new Date(date);
                    const dateStr = d.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    const status = value === 'yes' ? 'YES ✓' : (value === 'no' ? 'NO ✗' : 'No Data');
                    tooltip.textContent = `${dateStr} - ${area.label}: ${status}`;
                    tooltip.style.display = 'block';
                    tooltip.style.left = e.pageX + 10 + 'px';
                    tooltip.style.top = e.pageY - 30 + 'px';
                });

                cell.addEventListener('mousemove', (e) => {
                    tooltip.style.left = e.pageX + 10 + 'px';
                    tooltip.style.top = e.pageY - 30 + 'px';
                });

                cell.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });

                cellsContainer.appendChild(cell);
            });

            row.appendChild(cellsContainer);
            container.appendChild(row);
        });

        // Add date labels at the bottom
        const datesRow = document.createElement('div');
        datesRow.className = 'heatmap-dates';

        // Show every nth date based on range to avoid crowding
        const skipInterval = 1;

        dateLabels.forEach((date, index) => {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'heatmap-date';

            if (index % skipInterval === 0 || index === dateLabels.length - 1) {
                const d = new Date(date);
                dateDiv.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            datesRow.appendChild(dateDiv);
        });

        container.appendChild(datesRow);
        container.appendChild(datesRow);
    };

    const renderBiometricCharts = (entries, range) => {
        const weightCanvas = document.getElementById('weightChart');
        const waistCanvas = document.getElementById('waistChart');

        if (!weightCanvas || !waistCanvas) return;

        // Destroy existing charts if they exist
        if (window.weightChartInstance) window.weightChartInstance.destroy();
        if (window.waistChartInstance) window.waistChartInstance.destroy();

        const daysCount = range === 'weekly' ? 7 : 30;
        const today = new Date();
        const labels = [];
        const weightData = [];
        const waistData = [];

        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));

            const entry = entries.find(e => e.date === dateStr);
            weightData.push(entry && entry.weight ? entry.weight : null);
            waistData.push(entry && entry.waist ? entry.waist : null);
        }

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    displayColors: false
                }
            },
            scales: {
                x: { display: false },
                y: {
                    display: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 9 } }
                }
            },
            elements: {
                point: { radius: 2, hitRadius: 10 },
                line: { tension: 0.4, borderWidth: 2 }
            }
        };

        // Render Weight Chart
        window.weightChartInstance = new Chart(weightCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weight',
                    data: weightData,
                    borderColor: '#2979ff', // Blue
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    fill: true,
                    spanGaps: true
                }]
            },
            options: {
                ...commonOptions,
                plugins: { ...commonOptions.plugins, title: { display: true, text: 'Weight', color: '#aaa', font: { size: 10 } } }
            }
        });

        // Render Waist Chart
        window.waistChartInstance = new Chart(waistCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Waist',
                    data: waistData,
                    borderColor: '#ff9100', // Orange
                    backgroundColor: 'rgba(255, 145, 0, 0.1)',
                    fill: true,
                    spanGaps: true
                }]
            },
            options: {
                ...commonOptions,
                plugins: { ...commonOptions.plugins, title: { display: true, text: 'Waist', color: '#aaa', font: { size: 10 } } }
            }
        });
    };

    // Form Event Handler
    dailyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(dailyForm);
        const selectedDate = formData.get('entryDate') || new Date().toISOString().split('T')[0];
        const entry = {
            date: selectedDate,
            // Night Log
            reading: formData.get('reading') === 'true',
            meditation: formData.get('meditation') === 'true',
            facialMassage: formData.get('facialMassage') === 'true',
            scalpMassage: formData.get('scalpMassage') === 'true',
            nightPills: formData.get('nightPills') === 'true',
            dayPills: formData.get('dayPills') === 'true',
            soakedNutrishot: formData.get('soakedNutrishot') === 'true',
            water3Ltrs: formData.get('water3Ltrs') === 'true',
            // Day Log
            workout: formData.get('workout') === 'true',
            brushTeeth: formData.get('brushTeeth') === 'true',
            bath: formData.get('bath') === 'true',
            takeNutrishot: formData.get('takeNutrishot') === 'true',
            boiledDaal: formData.get('boiledDaal') === 'true',
            teaCoffee: formData.get('teaCoffee') === 'true',
            news: formData.get('news') === 'true',
            situationPractice: formData.get('situationPractice') === 'true',
            mathsAptitude: formData.get('mathsAptitude') === 'true',
            weight: formData.get('weight') ? parseFloat(formData.get('weight')) : null,
            waist: formData.get('waist') ? parseFloat(formData.get('waist')) : null,
            notes: formData.get('notes')
        };

        saveEntry(entry);
        showScreen('dashboard');
    });

    // Collect current form values into an entry object (without saving)
    const getCurrentFormEntry = () => {
        const formData = new FormData(dailyForm);
        const selectedDate = formData.get('entryDate') || new Date().toISOString().split('T')[0];
        const entry = { date: selectedDate };
        Object.keys(habitData).forEach(k => {
            entry[k] = formData.get(k) === 'true';
        });
        entry.notes = formData.get('notes');
        return entry;
    };

    // Sync entry to Google Sheets via Apps Script web app endpoint
    const syncToGoogleSheet = async (entry) => {
        try {
            // Default to the user's Web App endpoint, allow user to override
            let endpoint = localStorage.getItem('sheetsEndpoint') || 'https://script.google.com/macros/s/AKfycbycuXi5fjPFYCtqBKOTuOrnsRNAdhBoFZn5otC9njiaoL2x_rJb2iJqOJN3H7DY3zb_/exec';
            const useDefault = window.confirm('Use default Google Apps Script endpoint? (Cancel to provide a custom URL)');
            if (!useDefault) {
                const customEndpoint = window.prompt('Enter your custom Apps Script Web App URL (must be a Web App deployment, not a library):');
                if (!customEndpoint) return;
                endpoint = customEndpoint;
            }
            localStorage.setItem('sheetsEndpoint', endpoint);

            console.log('Syncing to endpoint:', endpoint);
            const res = await fetch(endpoint, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });

            let data = {};
            try {
                data = await res.json();
            } catch (e) {
                data = { success: res.ok };
            }

            if (!res.ok && !data.success) {
                throw new Error(data.error || `Server returned ${res.status}: ${res.statusText}`);
            }
            alert('✓ Synced successfully to Google Sheet.');
        } catch (err) {
            console.error('Sync error details:', err);
            const msg = err.message || String(err);
            // Provide troubleshooting hint
            let hint = '';
            if (msg.includes('CORS') || msg.includes('fetch')) {
                hint = '\n\nTroubleshooting: Make sure your Apps Script is deployed as a Web App (not a library), and access is set to "Anyone".';
            }
            alert('Sync failed: ' + msg + hint);
        }
    };

    // Wire up Sync button
    const syncBtn = document.getElementById('sync-to-sheet-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            const entry = getCurrentFormEntry();
            // Save locally first for consistency
            saveEntry(entry);
            syncToGoogleSheet(entry);
        });
    }

    // Initial Setup
    const updateTimeContext = () => {
        const hr = new Date().getHours();
        if (hr < 12) greeting.textContent = "Good Morning, Shubham";
        else if (hr < 18) greeting.textContent = "Good Afternoon, Shubham";
        else greeting.textContent = "Good Evening, Shubham";

        currentDateDisplay.textContent = new Date().toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    // Load an entry into the form (used when user picks a date)
    const loadEntryToForm = (dateStr) => {
        const entries = getEntries();
        const entry = entries.find(e => e.date === dateStr);
        // clear radios to default 'false'
        if (!entry) {
            dailyForm.reset();
            // ensure date remains selected
            const dateInput = document.getElementById('entry-date');
            if (dateInput) dateInput.value = dateStr;
            return;
        }

        // populate form fields
        Object.keys(habitData).forEach(key => {
            const yesInput = document.querySelector(`#daily-form input[name="${key}"][value="true"]`);
            const noInput = document.querySelector(`#daily-form input[name="${key}"][value="false"]`);
            if (entry[key] === true && yesInput) yesInput.checked = true;
            else if (noInput) noInput.checked = true;
        });

        const notesInput = dailyForm.querySelector('textarea[name="notes"]');
        if (notesInput) notesInput.value = entry.notes || '';

        const dateInput = document.getElementById('entry-date');
        if (dateInput) dateInput.value = dateStr;

        // Biometrics
        const weightInput = document.getElementById('weight-input');
        const waistInput = document.getElementById('waist-input');
        if (weightInput) weightInput.value = entry.weight || '';
        if (waistInput) waistInput.value = entry.waist || '';
    };

    // When date field changes, load saved entry for that date
    const dateField = document.getElementById('entry-date');
    if (dateField) {
        dateField.addEventListener('change', (e) => {
            const v = e.target.value;
            if (v) loadEntryToForm(v);
        });
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateDashboard(e.target.dataset.range);
        });
    });

    updateTimeContext();
    updateDashboard();
    // Register service worker for PWA + push support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').then(() => {
            console.log('Service worker registered');
        }).catch(err => console.warn('SW registration failed', err));
    }

    // Enable reminders button: request Notification permission
    const enableRemBtn = document.getElementById('enable-reminders-btn');
    if (enableRemBtn) {
        enableRemBtn.addEventListener('click', async () => {
            if (!('Notification' in window)) return alert('Notifications not supported in this browser.');
            const perm = await Notification.requestPermission();
            if (perm === 'granted') alert('Notifications enabled. To receive push reminders you will need to configure a push server (e.g., Firebase). See README.');
            else alert('Notifications not granted.');
        });
    }
});
