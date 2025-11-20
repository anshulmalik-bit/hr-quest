document.addEventListener('DOMContentLoaded', () => {
    const resumeInput = document.getElementById('resumeInput');
    const fileNameDisplay = document.getElementById('file-name');
    const scanBtn = document.getElementById('start-scan-btn');
    
    const level1Area = document.getElementById('level-1-area');
    const resultsArea = document.getElementById('results-area');
    const loadingScreen = document.getElementById('loading-screen');
    const xpDisplay = document.getElementById('player-xp');

    // 1. Handle File Selection
    resumeInput.addEventListener('change', () => {
        if (resumeInput.files.length > 0) {
            fileNameDisplay.innerText = resumeInput.files[0].name;
            fileNameDisplay.style.color = "#00ff88";
            scanBtn.disabled = false; // Enable the button
        }
    });

    // 2. Handle Scan Button Click
    scanBtn.addEventListener('click', async () => {
        // UI Transition: Show Loading
        level1Area.classList.add('hidden');
        loadingScreen.classList.remove('hidden');

        const formData = new FormData();
        formData.append('resume', resumeInput.files[0]);

        try {
            // Send to Backend
            const response = await fetch('/api/level1/scan', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showResults(data);
            } else {
                alert("Error: " + data.error);
                location.reload();
            }
        } catch (err) {
            console.error(err);
            alert("Server connection failed.");
            location.reload();
        }
    });

    // 3. Display the Gamified Results
    function showResults(data) {
        loadingScreen.classList.add('hidden');
        resultsArea.classList.remove('hidden');

        // Update XP in Header
        xpDisplay.innerText = `XP: ${data.xp_gained}`;

        // Inject HTML
        resultsArea.innerHTML = `
            <div class="quest-card">
                <h2>LEVEL COMPLETE!</h2>
                
                <div class="score-circle">
                    ${data.ats_score}
                </div>
                
                <div class="archetype">Class: ${data.class_archetype}</div>
                
                <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px;">
                    ${data.strengths.map(s => `<span style="background:#333; padding:5px 10px; border-radius:4px; font-size:0.8rem;">💪 ${s}</span>`).join('')}
                </div>

                <div class="boss-box">
                    <strong>HR Boss says:</strong><br>
                    "${data.boss_feedback}"
                </div>

                <button onclick="location.reload()" class="action-btn" style="margin-top:20px;">
                    🔄 Try Again (Grind XP)
                </button>
            </div>
        `;
    }
});
