// --- PARALLAX EFFECT FOR "HR" TEXT ---
document.addEventListener('mousemove', (e) => {
    // Only run if landing page is visible
    const landingPage = document.getElementById('landing-page');
    if (!landingPage || landingPage.style.display === 'none') return;

    const title = document.querySelector('.main-title');
    if (title) {
        const movementStrength = 30; // Lower = more movement
        const width = movementStrength / window.innerWidth;
        const height = movementStrength / window.innerHeight;
        
        const pageX = e.pageX - (window.innerWidth / 2);
        const pageY = e.pageY - (window.innerHeight / 2);
        
        const newvalueX = width * pageX * -1 - 25;
        const newvalueY = height * pageY * -1 - 50;
        
        // Apply transform
        title.style.transform = `translate(${newvalueX}px, ${newvalueY}px)`;
    }
});

// --- LANDING PAGE TRANSITION ---
function enterGame() {
    const landing = document.getElementById('landing-page');
    const game = document.getElementById('game-container');
    
    landing.style.transition = "opacity 0.5s ease";
    landing.style.opacity = "0";
    
    setTimeout(() => {
        landing.style.display = "none";
        game.style.display = "flex";
        setTimeout(() => { game.style.opacity = "1"; }, 50);
    }, 500);
}

// --- GAME LOGIC (Level 1) ---
async function uploadResume() {
    const fileInput = document.getElementById('resumeInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("⚠️ No Armor Equipped! Please select a PDF.");
        return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    document.getElementById('game-status').innerText = "⚔️ ANALYZING ARMOR STATS...";

    try {
        const response = await fetch('/api/scan_resume', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById('level1-section').style.display = 'none';

            document.getElementById('result-area').innerHTML = `
                <div class="level-complete-card">
                    <div class="header-banner" style="background:#e0f2f1; color:#00695c; padding:5px 15px; border-radius:20px; display:inline-block; margin-bottom:15px; font-weight:bold;">LEVEL 1 COMPLETE</div>
                    <div class="stats-container">
                        <div class="score-box"><div class="value">${data.ats_score}</div><div class="label">ATS SCORE</div></div>
                        <div class="xp-box"><div class="value">+${data.xp_earned}</div><div class="label">XP GAINED</div></div>
                    </div>
                    <div class="character-reveal"><h3 style="color:#00bcd4">Class: ${data.character_class}</h3></div>
                    <div class="boss-feedback"><p>"${data.feedback}"</p></div>
                    <button class="next-level-btn" onclick="startLevel2()">ENTER LEVEL 2 ➡️</button>
                </div>
            `;
        } else {
            alert("Error: " + data.error);
            document.getElementById('game-status').innerText = "";
        }
    } catch (error) {
        console.error(error);
        alert("Connection Failed. Is the server running?");
        document.getElementById('game-status').innerText = "";
    }
}

// --- LEVEL 2 LOGIC ---
async function startLevel2() {
    document.getElementById('result-area').innerHTML = "";
    document.getElementById('level-title').innerText = "LEVEL 2: THE LOGIC LABYRINTH";
    document.getElementById('level2-section').style.display = 'block';
    document.getElementById('l2-scenario-title').innerText = "LOADING QUEST...";

    try {
        const res = await fetch('/api/get_level2_question');
        const q = await res.json();
        
        document.getElementById('l2-scenario-title').innerText = q.title;
        document.getElementById('l2-scenario-text').innerText = q.text;
        document.getElementById('l2-question-id').value = q.id;
        
    } catch (e) {
        console.error(e);
    }
}

async function submitLevel2() {
    const answer = document.getElementById('l2-answer').value;
    const q_id = document.getElementById('l2-question-id').value;

    if (answer.length < 5) {
        alert("Please type a longer answer.");
        return;
    }

    document.getElementById('l2-status').innerText = "🧠 JUDGING LOGIC...";

    try {
        const res = await fetch('/api/judge_level2', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ answer: answer, question_id: q_id })
        });
        const data = await res.json();

        document.getElementById('level2-section').style.display = 'none';

        document.getElementById('result-area').innerHTML = `
            <div class="level-complete-card">
                <div class="header-banner">LEVEL 2 COMPLETE</div>
                <div class="stats-container">
                    <div class="score-box"><div class="value">${data.score}</div><div class="label">LOGIC SCORE</div></div>
                    <div class="xp-box"><div class="value">+${data.xp}</div><div class="label">XP GAINED</div></div>
                </div>
                <div class="boss-feedback"><p>"${data.feedback}"</p></div>
                <button class="next-level-btn" onclick="alert('Level 3 Coming Soon!')">CLAIM REWARD 🏆</button>
            </div>
        `;

    } catch (e) {
        console.error(e);
    }
}
