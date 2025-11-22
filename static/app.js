document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingPage = document.getElementById('landing-page');
    const gameContainer = document.getElementById('game-container');
    const startBtn = document.getElementById('start-btn');

    // Level 1 Elements
    const level1 = document.getElementById('level-1');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('resume-upload');
    const l1Result = document.getElementById('level-1-result');
    const nextL2Btn = document.getElementById('next-l2-btn');

    // Level 2 Elements
    const level2 = document.getElementById('level-2');
    const scenarioText = document.getElementById('scenario-text');
    const logicAnswer = document.getElementById('logic-answer');
    const submitLogicBtn = document.getElementById('submit-logic-btn');
    const l2Result = document.getElementById('level-2-result');
    const nextL3Btn = document.getElementById('next-l3-btn');

    // Level 3 Elements
    const level3 = document.getElementById('level-3');
    const recordBtn = document.getElementById('record-btn');
    const transcriptionBox = document.getElementById('transcription-box');
    const transcriptionText = document.getElementById('transcription-text');
    const l3Result = document.getElementById('level-3-result');
    const restartBtn = document.getElementById('restart-btn');

    // State
    let currentLevel = 1;
    let totalScore = 0;
    let level2QuestionId = null;

    // --- Navigation ---
    startBtn.addEventListener('click', () => {
        landingPage.classList.remove('active');
        landingPage.classList.add('hidden');

        gameContainer.classList.remove('hidden');
        gameContainer.classList.add('active');
    });

    // --- Level 1: Resume Scanner ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary-dark)';
        dropZone.style.transform = 'scale(1.02)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#cbd5e1';
        dropZone.style.transform = 'scale(1)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#cbd5e1';
        dropZone.style.transform = 'scale(1)';
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        }
    });

    function handleFileUpload(file) {
        const formData = new FormData();
        formData.append('resume', file);

        // Show loading state
        dropZone.innerHTML = '<div class="spinner"></div><h3>Analyzing Resume...</h3><p>Please wait, the AI is reading your file.</p>';

        fetch('/api/scan_resume', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    resetDropZone();
                    return;
                }

                // Update Score Circle
                const scoreDisplay = document.getElementById('l1-score-display');
                scoreDisplay.textContent = data.score;

                // Update Circle Stroke Dasharray for animation
                const circle = document.querySelector('.circle');
                const percentage = data.score; // Assuming score is 0-100
                circle.style.strokeDasharray = `${percentage}, 100`;

                document.getElementById('l1-class').textContent = data.class;

                const feedbackList = document.getElementById('l1-feedback');
                feedbackList.innerHTML = '';
                data.feedback.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    feedbackList.appendChild(li);
                });

                totalScore += data.score;
                dropZone.classList.add('hidden');
                l1Result.classList.remove('hidden');
            })
            .catch(err => {
                console.error(err);
                resetDropZone();
            });
    }

    function resetDropZone() {
        dropZone.innerHTML = '<div class="upload-icon">📂</div><h3>Drop your PDF here</h3><p>or click to browse</p>';
    }

    nextL2Btn.addEventListener('click', () => {
        level1.classList.add('hidden');
        level2.classList.remove('hidden');
        loadLevel2Question();
    });

    // --- Level 2: Logic Labyrinth ---
    function loadLevel2Question() {
        fetch('/api/get_level2_question')
            .then(res => res.json())
            .then(data => {
                scenarioText.textContent = data.scenario;
                level2QuestionId = data.id;
            });
    }

    submitLogicBtn.addEventListener('click', () => {
        const answer = logicAnswer.value;
        if (!answer.trim()) {
            alert("Please enter an answer.");
            return;
        }

        fetch('/api/judge_level2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: level2QuestionId, answer: answer })
        })
            .then(res => res.json())
            .then(data => {
                document.getElementById('l2-score').textContent = data.score;

                const feedbackList = document.getElementById('l2-feedback');
                feedbackList.innerHTML = '';
                data.feedback.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    feedbackList.appendChild(li);
                });

                totalScore += data.score;
                submitLogicBtn.classList.add('hidden');
                logicAnswer.disabled = true;
                l2Result.classList.remove('hidden');
            });
    });

    nextL3Btn.addEventListener('click', () => {
        level2.classList.add('hidden');
        level3.classList.remove('hidden');
    });

    // --- Level 3: Final Boss (Voice) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        recordBtn.addEventListener('click', () => {
            recognition.start();
            recordBtn.classList.add('recording');
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            transcriptionText.textContent = transcript;
            transcriptionBox.classList.remove('hidden');
            analyzeSpeech(transcript);
        };

        recognition.onend = () => {
            recordBtn.classList.remove('recording');
        };

        recognition.onerror = (event) => {
            console.error(event.error);
            recordBtn.classList.remove('recording');
            alert("Microphone access denied or error occurred.");
        };

    } else {
        recordBtn.disabled = true;
        alert("Speech Recognition not supported in this browser.");
    }

    function analyzeSpeech(text) {
        let score = 0;
        const words = text.split(' ');
        const fillerWords = ['um', 'uh', 'like', 'you know'];

        if (words.length > 20) score += 30;
        else if (words.length > 10) score += 10;

        let fillerCount = 0;
        fillerWords.forEach(word => {
            if (text.toLowerCase().includes(word)) fillerCount++;
        });

        score -= (fillerCount * 5);
        if (score < 0) score = 0;

        totalScore += score;

        document.getElementById('l3-score').textContent = score;

        let verdict = "";
        const verdictBadge = document.getElementById('final-verdict');

        if (totalScore > 80) {
            verdict = "HIRED";
            verdictBadge.style.background = "#4ade80";
            verdictBadge.style.color = "#064e3b";
        } else if (totalScore > 50) {
            verdict = "CONSIDERED";
            verdictBadge.style.background = "#facc15";
            verdictBadge.style.color = "#713f12";
        } else {
            verdict = "REJECTED";
            verdictBadge.style.background = "#f87171";
            verdictBadge.style.color = "#7f1d1d";
        }

        verdictBadge.textContent = verdict;

        recordBtn.classList.add('hidden');
        l3Result.classList.remove('hidden');
    }

    restartBtn.addEventListener('click', () => {
        location.reload();
    });

    // Parallax Effect
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 2) / 100;
        const y = (window.innerHeight - e.pageY * 2) / 100;

        document.querySelectorAll('.parallax-target').forEach(el => {
            el.style.transform = `translateX(${x}px) translateY(${y}px)`;
        });
    });
});
