// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log("HR Quest System Online 🟢");
});

async function uploadResume() {
    // 1. Get the file from the input
    const fileInput = document.getElementById('resumeInput');
    const file = fileInput.files[0];

    // 2. Input Validation
    if (!file) {
        alert("⚠️ No Armor Equipped! Please select a PDF file.");
        return;
    }

    // 3. Prepare the data for Python
    const formData = new FormData();
    formData.append('resume', file); // This key 'resume' matches request.files['resume'] in Flask

    // 4. Show Loading State (Gamified)
    const statusDiv = document.getElementById('game-status');
    const resultArea = document.getElementById('result-area');
    
    statusDiv.innerHTML = `
        <div class="loading-text">
            <span class="blink">⚔️ ANALYZING ARMOR STATS...</span>
        </div>
    `;
    statusDiv.style.color = "#ffd700"; // Gold color

    try {
        // 5. Send to Backend (FIXED URL HERE)
        const response = await fetch('/api/scan_resume', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // 6. Handle Success
        if (response.ok) {
            statusDiv.innerHTML = ""; // Clear loading text
            
            // Hide the upload form to reduce clutter
            document.querySelector('.upload-section').style.display = 'none';

            // Inject the Gamified Result Card
            resultArea.innerHTML = `
                <div class="level-complete-card" style="animation: slideUp 0.5s ease;">
                    <div class="header-banner">LEVEL 1 COMPLETE</div>
                    
                    <div class="stats-container">
                        <div class="score-box">
                            <div class="label">ATS SCORE</div>
                            <div class="value" style="color: ${getScoreColor(data.ats_score)}">
                                ${data.ats_score}/100
                            </div>
                        </div>
                        
                        <div class="xp-box">
                            <div class="label">XP GAINED</div>
                            <div class="value">+${data.xp_earned} XP</div>
                        </div>
                    </div>

                    <div class="character-reveal">
                        <h3>🔓 Class Unlocked: <span style="color: #00ff00">${data.character_class}</span></h3>
                    </div>

                    <div class="boss-feedback">
                        <p><strong>HR BOSS SAYS:</strong></p>
                        <p>"${data.feedback}"</p>
                    </div>

                    <button class="next-level-btn" onclick="startLevel2()">
                        ENTER LEVEL 2: THE INTERVIEW ➡️
                    </button>
                </div>
            `;
            
            // Optional: Play a success sound here if you have one
            // new Audio('/static/sounds/levelup.mp3').play();

        } else {
            // Handle Server Errors (e.g., PDF corrupted)
            statusDiv.innerHTML = `❌ SYSTEM ERROR: ${data.error}`;
            statusDiv.style.color = "red";
        }

    } catch (error) {
        // Handle Network Errors
        console.error('Error:', error);
        statusDiv.innerHTML = "❌ CONNECTION LOST. Check server logs.";
        statusDiv.style.color = "red";
    }
}

// Helper function to color-code the score
function getScoreColor(score) {
    if (score >= 80) return "#00ff00"; // Green (High)
    if (score >= 50) return "#ffd700"; // Gold (Mid)
    return "#ff4444"; // Red (Low)
}

function startLevel2() {
    alert("Level 2 (The Interview) is under construction! 🚧");
    // logic to redirect or show the chat interface would go here
}
