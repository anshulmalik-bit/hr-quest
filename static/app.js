document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration & State ---
    const MESSAGES = {
        loading: "Taking a moment to analyze...",
        success: "Great insight. Let's move forward.",
        error: "Let's try that again. No rush.",
        uploading: "Reading your journey...",
        uploadSuccess: "Analysis Complete. Redirecting...",
        uploadError: "Could not read file. Please try a PDF."
    };

    // --- DOM Elements ---
    const root = document.documentElement;
    const sections = document.querySelectorAll('.snap-section');
    const motionToggle = document.getElementById('motion-toggle');
    const mainScroll = document.getElementById('main-scroll');

    // --- Theme Manager (for landing page scroll) ---
    const observerOptions = {
        root: mainScroll,
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                sections.forEach(s => s.classList.remove('active'));
                entry.target.classList.add('active');

                const theme = entry.target.getAttribute('data-theme');
                if (theme && theme !== 'dynamic') {
                    updateTheme(theme);
                }
            }
        });
    }, observerOptions);

    if (sections.length > 0) {
        sections.forEach(section => observer.observe(section));
    }

    function updateTheme(themeName) {
        root.style.setProperty('--bg-color', `var(--${themeName}-bg)`);
        root.style.setProperty('--accent-color', `var(--${themeName}-accent)`);
        root.style.setProperty('--text-color', `var(--${themeName}-text)`);
    }

    // --- Role Selection ---
    window.selectRole = (category, specialization) => {
        const display = document.getElementById('selected-role-display');
        if (display) display.textContent = `${specialization} (${category})`;

        // Store in session via a simple API call
        fetch('/api/set_role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, specialization })
        });

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
                statusText.textContent = MESSAGES.uploadSuccess;
                if (messageArea) messageArea.textContent = MESSAGES.uploadSuccess;
                feedbackArea.classList.remove('hidden');

                // Redirect to Level 1
                if (data.redirect) {
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);
                }
            } else {
                statusText.textContent = MESSAGES.uploadError;
            }
        } catch (e) {
            console.error(e);
            statusText.textContent = MESSAGES.uploadError;
        }
    };

    // --- Accessibility & Motion ---
    if (motionToggle) {
        motionToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.remove('reduced-motion');
            } else {
                document.body.classList.add('reduced-motion');
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
