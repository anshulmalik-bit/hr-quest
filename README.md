# HR-Quest — Virtual HR Interview Simulator

## What is this
A classroom gamified HR interview simulator. Students upload resume, answer interview questions, receive ATS, grammar and interview scores, collect badges and appear on a leaderboard.

## Quick start (local)
1. Create a folder and add project files (as provided).
2. Create a Python virtualenv and activate it:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run the Flask app:
   ```bash
   python app.py
   ```
4. Open `http://127.0.0.1:5000/` in your browser.

Notes:
- The project uses the public LanguageTool API for grammar checks. It works without a key but rate limits may apply. For offline usage, you can remove grammar checks or self-host LanguageTool.
- Change the `ADMIN_PASSWORD` in `app.py` before sharing.
- To deploy, use services like Render/Heroku for the Flask backend and GitHub Pages/Netlify for a static frontend (if you decouple them). For simplicity this is a single-app Flask server serving the frontend.

## Files
- `app.py` — Flask backend
- `templates/index.html` — frontend HTML
- `static/style.css` — styling
- `static/app.js` — frontend logic
- `results.db` — created automatically on first run

## Next improvements
- Add authentication per student
- Add richer ATS parsing with ML or third-party ATS libraries
- Add voice-based interview (speech-to-text)
- Add per-question rubrics and manual review by teacher