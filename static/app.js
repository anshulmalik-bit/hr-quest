document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration & State ---
    const MESSAGES = {
        loading: "Taking a moment to analyze...",
        success: "Great insight. Let's move forward.",
        error: "Let's try that again. No rush.",
        uploading: "Reading your journey...",
        uploadSuccess: "Analysis Complete. Impressive background.",
        uploadError: "Could not read file. Please try a PDF."
    };

    const STATE = {
        roleCategory: null,
        roleSpecialization: null,
        currentLevel: 0,
        totalScore: 0,
        tokens: [],
        motionMode: 'full' // full, reduced, static
    };

    // --- DOM Elements ---
    const root = document.documentElement;
    const sections = document.querySelectorAll('.snap-section');
    const motionToggle = document.getElementById('motion-toggle');
    const mainScroll = document.getElementById('main-scroll');
    const progressBar = document.getElementById('global-progress'); // Note: Not in HTML yet, but good for future
    const tokenDisplay = document.getElementById('final-tokens'); // Using final tokens container for now

    // --- Theme Manager ---
    const observerOptions = {
        root: mainScroll,
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Update Active Class
                sections.forEach(s => s.classList.remove('active'));
                entry.target.classList.add('active');

                // Update Theme
                const theme = entry.target.getAttribute('data-theme');
                if (theme && theme !== 'dynamic') {
                    updateTheme(theme);
                } else if (theme === 'dynamic' && STATE.roleCategory) {
                    const roleThemeMap = {
                        'MBA': 'pastel-yellow',
                        'B.Tech': 'pastel-red',
                        'Data': 'pastel-green'
                    };
                    updateTheme(roleThemeMap[STATE.roleCategory] || 'pastel-blue');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    function updateTheme(themeName) {
        root.style.setProperty('--bg-color', `var(--${themeName}-bg)`);
        root.style.setProperty('--accent-color', `var(--${themeName}-accent)`);
        root.style.setProperty('--text-color', `var(--${themeName}-text)`);
    }

    // --- Role Selection ---
    window.selectRole = (category, specialization) => {
        STATE.roleCategory = category;
        STATE.roleSpecialization = specialization;

        const display = document.getElementById('selected-role-display');
        if (display) display.textContent = `${specialization} (${category})`;

        // Scroll to Upload Section
        document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
    };

    // --- Resume Upload ---
    window.uploadResume = async () => {
        const fileInput = document.getElementById('resume-upload');
        const statusText = document.getElementById('upload-status');
        const feedbackArea = document.getElementById('upload-feedback');
        const messageArea = document.getElementById('upload-message');

        if (!fileInput.files.length) return;

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('resume', file);

        statusText.textContent = MESSAGES.uploading;

        try {
            const response = await fetch('/api/scan_resume', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                STATE.totalScore += data.score; // Base score
                statusText.textContent = "Upload Complete";
                messageArea.textContent = MESSAGES.uploadSuccess;
                feedbackArea.classList.remove('hidden');
            } else {
                statusText.textContent = MESSAGES.uploadError;
            }
        } catch (e) {
            console.error(e);
            statusText.textContent = MESSAGES.uploadError;
        }
    };

    // --- Level Navigation ---
    window.startLevel = (level) => {
        STATE.currentLevel = level;

        // Hide all levels first
        document.querySelectorAll('.level-section').forEach(el => el.classList.add('hidden'));

        // Show current level
        const levelEl = document.getElementById(`level-${level}`);
        if (levelEl) {
            levelEl.classList.remove('hidden');
            levelEl.scrollIntoView({ behavior: 'smooth' });

            // Update Theme explicitly for level
            const theme = levelEl.getAttribute('data-theme');
            if (theme) updateTheme(theme);

            // Load specific content
            if (level === 2) loadLevel2Question();
            if (level === 6) showFinalResults();
        }
    };

    window.nextLevel = (nextLevelIdx) => {
        startLevel(nextLevelIdx);
    };

    // --- Gamification ---
    window.awardToken = (tokenName) => {
        if (STATE.tokens.includes(tokenName)) return;
        STATE.tokens.push(tokenName);

        // Create visual token
        const token = document.createElement('div');
        token.classList.add('token-chip');
        token.textContent = `🏅 ${tokenName}`;
        token.style.cssText = `
            display: inline-block;
            padding: 5px 10px;
            background: var(--accent-color);
            color: white;
            border-radius: 15px;
            margin: 5px;
            animation: popIn 0.5s var(--ease-spring);
        `;

        // Add to final display
        if (tokenDisplay) tokenDisplay.appendChild(token);
    };

    // --- Level 1: Introduction ---
    window.startRecording = (level) => {
        const btn = document.querySelector(`#level-${level} .btn-record`);
        if (btn) btn.style.transform = "scale(1.2)";

        setTimeout(() => {
            if (btn) btn.style.transform = "scale(1)";
            document.getElementById(`l${level}-feedback`).classList.remove('hidden');
            if (level === 1) awardToken('Confidence');
            if (level === 5) awardToken('Maturity');
        }, 2000);
    };

    // --- Level 2: Technical ---
    function loadLevel2Question() {
        fetch('/api/get_level2_question')
            .then(res => res.json())
            .then(data => {
                const el = document.getElementById('l2-question');
                if (el) el.textContent = data.scenario;
            });
    }

    window.submitLevel2 = async () => {
        const answer = document.getElementById('l2-answer').value;
        if (!answer.trim()) return alert(MESSAGES.error);

        // Mocking backend call for Level 2 as per original app.py structure
        // Ideally this would be a fetch call like others
        const id = 1; // Mock ID

        try {
            const response = await fetch('/api/judge_level2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, answer: answer })
            });
            const data = await response.json();
            STATE.totalScore += data.score;

            document.getElementById('l2-feedback').classList.remove('hidden');
            awardToken('Clarity');
        } catch (e) {
            console.error(e);
        }
    };

    // --- Level 3: Behavioral ---
    window.submitLevel3 = async () => {
        const answer = document.getElementById('l3-answer').value;
        if (!answer.trim()) return alert(MESSAGES.error);

        try {
            const response = await fetch('/api/judge_level3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: answer })
            });
            const data = await response.json();
            STATE.totalScore += data.score;

            document.getElementById('l3-feedback').classList.remove('hidden');
            awardToken('Professionalism');
        } catch (e) {
            console.error(e);
        }
    };

    // --- Level 4: Situational ---
    window.submitLevel4 = async () => {
        const answer = document.getElementById('l4-answer').value;
        if (!answer.trim()) return alert(MESSAGES.error);

        try {
            const response = await fetch('/api/judge_level4', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: answer })
            });
            const data = await response.json();
            STATE.totalScore += data.score;

            document.getElementById('l4-feedback').classList.remove('hidden');
            awardToken('Agility');
        } catch (e) {
            console.error(e);
        }
    };

    // --- Level 6: Final Results ---
    function showFinalResults() {
        const scoreDisplay = document.getElementById('final-score-display');
        const verdictDisplay = document.getElementById('final-verdict-display');

        // Normalize score (mock logic for now, assuming max around 300)
        const finalScore = Math.min(100, Math.round((STATE.totalScore / 300) * 100) + 50); // Boost for demo

        if (scoreDisplay) scoreDisplay.textContent = finalScore;
        if (verdictDisplay) verdictDisplay.textContent = finalScore > 80 ? "HIRED" : "CONSIDERED";

        renderGrowthGraph();
    }

    function renderGrowthGraph() {
        const svg = document.getElementById('growth-graph');
        if (!svg) return;

        // Create a smooth curve
        const width = 500;
        const height = 150;
        const points = [
            [0, height],
            [100, height - 40],
            [200, height - 60],
            [300, height - 90],
            [400, height - 120],
            [500, 20]
        ];

        let pathD = `M ${points[0][0]} ${points[0][1]}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cp1x = prev[0] + (curr[0] - prev[0]) / 2;
            const cp1y = prev[1];
            const cp2x = prev[0] + (curr[0] - prev[0]) / 2;
            const cp2y = curr[1];
            pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr[0]} ${curr[1]}`;
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathD);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "var(--accent-color)");
        path.setAttribute("stroke-width", "4");
        path.setAttribute("stroke-linecap", "round");

        // Animate
        const length = 1000;
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        path.style.transition = "stroke-dashoffset 2s ease-out";

        svg.innerHTML = '';
        svg.appendChild(path);

        setTimeout(() => {
            path.style.strokeDashoffset = 0;
        }, 100);
    }

    // --- Accessibility & Motion ---
    if (motionToggle) {
        motionToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.remove('reduced-motion');
                STATE.motionEnabled = true;
            } else {
                document.body.classList.add('reduced-motion');
                STATE.motionEnabled = false;
            }
        });
    }

    // Parallax Effect
    document.addEventListener('mousemove', (e) => {
        if (document.body.classList.contains('reduced-motion')) return;

        const shapes = document.querySelectorAll('.ambient-shape');
        const x = (window.innerWidth - e.pageX * 2) / 100;
        const y = (window.innerHeight - e.pageY * 2) / 100;

        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.02;
            shape.style.transform = `translate(${x * speed * 50}px, ${y * speed * 50}px)`;
        });
    });

});
