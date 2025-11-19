from flask import Flask, request, jsonify, render_template, redirect, url_for, g
import os
import sqlite3
import uuid
import re
from werkzeug.utils import secure_filename
import requests

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'txt'}
DATABASE = 'results.db'
ADMIN_PASSWORD = 'teacherview123'  # change before deployment

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 4 * 1024 * 1024  # 4MB upload limit

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- Database helpers ---

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    db = get_db()
    db.executescript('''
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        resume_path TEXT,
        ats_score INTEGER,
        grammar_score INTEGER,
        answer_score INTEGER,
        total_score INTEGER,
        badges TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    db.commit()

# --- Simple resume text extractor (PDF) ---

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(path):
    try:
        import pdfplumber
    except Exception as e:
        return ''
    text = ''
    try:
        with pdfplumber.open(path) as pdf:
            for p in pdf.pages:
                text += p.extract_text() or ''
    except Exception:
        return ''
    return text

# --- ATS scoring: simple heuristics ---

KEY_SECTIONS = ['experience', 'education', 'skills', 'projects', 'certification', 'certifications', 'internship']
KEY_KEYWORDS = ['python', 'sql', 'excel', 'analysis', 'analytics', 'java', 'c++', 'kotlin', 'lead', 'manager', 'intern']

def calculate_ats_score(text):
    if not text:
        return 0
    t = text.lower()
    score = 0
    # sections
    sections_found = sum(1 for s in KEY_SECTIONS if s in t)
    score += min(sections_found, len(KEY_SECTIONS)) / len(KEY_SECTIONS) * 60  # 60% weight for sections
    # keywords
    keywords_found = sum(1 for k in KEY_KEYWORDS if k in t)
    score += min(keywords_found, len(KEY_KEYWORDS)) / len(KEY_KEYWORDS) * 40  # 40% for keywords
    return int(score)

# --- Grammar check using LanguageTool public API ---

LANGTOOL_API = 'https://api.languagetool.org/v2/check'

def grammar_score_for_text(text):
    if not text or len(text.strip()) < 3:
        return 0
    try:
        resp = requests.post(LANGTOOL_API, data={
            'text': text,
            'language': 'en-US'
        }, timeout=10)
        data = resp.json()
        matches = data.get('matches', [])
        # naive: fewer matches -> better score
        errors = len(matches)
        # baseline: assume up to 20 errors possible
        score = max(0, 100 - (errors * 5))
        return int(score)
    except Exception:
        # if API fails, return neutral score
        return 70

# --- Scoring logic ---

def compute_total(ats, grammar, answer_score):
    # weights: ATS 25, Grammar 25, Answers 50
    total = int(ats * 0.25 + grammar * 0.25 + answer_score * 0.5)
    return total

# badges logic

def badges_for_scores(ats, grammar, answers, time_bonus=False):
    badges = []
    if ats >= 70:
        badges.append('ATS Pro')
    if grammar >= 80:
        badges.append('Grammar Guru')
    if answers >= 80:
        badges.append('HR Expert')
    if time_bonus:
        badges.append('Fast Thinker')
    return badges

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_resume():
    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    file = request.files.get('resume')
    if not name:
        return jsonify({'error': 'Name required'}), 400
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Valid resume (PDF or TXT) required'}), 400

    filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(path)

    text = ''
    if filename.lower().endswith('.pdf'):
        text = extract_text_from_pdf(path)
    else:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                text = f.read()
        except Exception:
            text = ''

    ats = calculate_ats_score(text)

    # temporary store session-like data: we return a student_id that frontend will keep
    student_id = uuid.uuid4().hex

    db = get_db()
    db.execute('INSERT INTO students (id, name, email, resume_path, ats_score) VALUES (?, ?, ?, ?, ?)',
               (student_id, name, email, path, ats))
    db.commit()

    return jsonify({'student_id': student_id, 'ats_score': ats})

@app.route('/submit-answers', methods=['POST'])
def submit_answers():
    data = request.get_json() or {}
    student_id = data.get('student_id')
    answers = data.get('answers', [])  # list of strings
    times = data.get('times', [])  # optional list of times per question in seconds

    if not student_id:
        return jsonify({'error': 'student_id required'}), 400

    # combine answers for grammar checking and scoring
    combined = '\\n'.join(answers)
    grammar = grammar_score_for_text(combined)

    # simple answer scoring: count presence of keywords per question
    q_keywords = ['team', 'lead', 'conflict', 'deadline', 'project']
    score_per_question = []
    for a in answers:
        a_low = a.lower()
        found = sum(1 for k in q_keywords if k in a_low)
        # normalize per question to 0-100
        qscore = min(100, found * 33)  # if three keywords -> near 100
        score_per_question.append(qscore)

    # answer score as average
    answer_score = int(sum(score_per_question) / len(score_per_question)) if score_per_question else 0

    # time bonus if user answered quickly
    time_bonus = False
    if times:
        if all(t is not None and t <= 60 for t in times):
            time_bonus = True

    total = compute_total(ats=get_student_field(student_id, 'ats_score') or 0, grammar=grammar, answer_score=answer_score)
    badges = badges_for_scores(get_student_field(student_id, 'ats_score') or 0, grammar, answer_score, time_bonus)

    db = get_db()
    db.execute('UPDATE students SET grammar_score=?, answer_score=?, total_score=?, badges=? WHERE id=?',
               (grammar, answer_score, total, ','.join(badges), student_id))
    db.commit()

    return jsonify({'grammar_score': grammar, 'answer_score': answer_score, 'total_score': total, 'badges': badges})

@app.route('/admin', methods=['GET', 'POST'])
def admin_view():
    if request.method == 'POST':
        pwd = request.form.get('password','')
        if pwd != ADMIN_PASSWORD:
            return render_template('admin_login.html', error='Wrong password')
        db = get_db()
        cur = db.execute('SELECT * FROM students ORDER BY total_score DESC')
        rows = cur.fetchall()
        return render_template('admin_dashboard.html', students=rows)
    return render_template('admin_login.html')

@app.route('/api/results')
def api_results():
    # public results (sanitized)
    db = get_db()
    cur = db.execute('SELECT name, total_score, badges, timestamp FROM students ORDER BY total_score DESC')
    rows = [dict(r) for r in cur.fetchall()]
    return jsonify(rows)

# helper

def get_student_field(student_id, field):
    db = get_db()
    cur = db.execute(f'SELECT {field} FROM students WHERE id=?', (student_id,))
    r = cur.fetchone()
    return r[0] if r else None

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True)