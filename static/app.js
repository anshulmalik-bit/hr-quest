// LEVEL 1: RESUME SCAN
async function uploadResume() {
    const fileInput = document.getElementById('resumeInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("⚠️ No Armor Equipped!");
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
            // Hide Upload Form
            document.getElementById('level1-section').style.display = 'none';

            // Show Results
            document.getElementById('result-area').innerHTML = `
                <div class="level-complete-card">
                    <div class="header-banner">LEVEL 1 COMPLETE</div>
                    <div class="stats-container">
                        <div class="score-box"><div class="value">${data.score}</div><div class="label">ATS SCORE</div></div>
                        <div class="xp-box"><div class="value">+${data.xp}</div><div class="label">XP GAINED</div></div>
                    </div>
                    <div class="character-reveal"><h3>Class: ${data.char_class}</h3></div>
                    <div class="boss-feedback"><p>"${data.feedback}"</p></div>
                    <button class="next-level-btn" onclick="startLevel2()">ENTER LEVEL 2 ➡️</button>
                </div>
            `;
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error(error);
        alert("Connection Failed");
    }
}

// LEVEL 2: INIT
async function startLevel2() {
    // Hide Level 1 Results
    document.getElementById('result-area').innerHTML = "";
    
    // Update Title
    document.getElementById('level-title').innerText = "LEVEL 2: THE LOGIC LABYRINTH";

    // Show Level 2 Section
    document.getElementById('level2-section').style.display = 'block';
    document.getElementById('l2-scenario-title').innerText = "LOADING QUEST...";

    // Fetch Question
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

// LEVEL 2: SUBMIT
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

        // Hide Input
        document.getElementById('level2-section').style.display = 'none';

        // Show Results
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
