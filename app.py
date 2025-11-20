import os
import re
import random
from flask import Flask, request, jsonify, render_template
from PyPDF2 import PdfReader
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# --- LEVEL 2: QUESTION BANK ---
QUESTIONS = [
    {
        "id": 1,
        "title": "The Friday Crisis",
        "text": "It is 4:55 PM on Friday. A client calls with a critical issue, but your team has already left. You have dinner plans. What do you do?",
        "keywords": ["client", "resolve", "stay", "communicate", "email", "monday", "apologize", "help", "listen"]
    },
    {
        "id": 2,
        "title": "The Stolen Credit",
        "text": "During a meeting, a coworker takes full credit for an idea you came up with together. The manager seems impressed. How do you react?",
        "keywords": ["private", "discuss", "calm", "credit", "contribution", "team", "future", "clarify"]
    }
]

# --- LEVEL 1 LOGIC (Resume) ---
def calculate_resume_score(text):
    text_lower = text.lower()
    score = 0
    feedback_list = []

    # 1. Contact Info (15 pts)
    if re.search(r'[\w\.-]+@[\w\.-]+', text): score += 10
    if re.search(r'\d{3}[-.]?\d{3}[-.]?\d{4}', text): score += 5

    # 2. Sections (20 pts)
    if 'education' in text_lower: score += 10
    if 'experience' in text_lower: score += 10

    # 3. Skills (40 pts)
    tech_skills = ['python', 'java', 'html', 'css', 'sql', 'react', 'node', 'aws', 'git', 'linux', 'excel', 'analysis']
    found_skills = len(set([s for s in tech_skills if s in text_lower]))
    score += min(found_skills * 5, 40)

    # 4. Soft Skills (15 pts)
    soft_skills = ['team', 'communication', 'leadership', 'managed', 'coordinated']
    score += min(len([s for s in soft_skills if s in text_lower]) * 3, 15)

    # 5. Length (10 pts)
    wc = len(text.split())
    if 200 <= wc <= 1000: score += 10
    
    # Character Class
    if found_skills > 4: char_class = "Tech Sorcerer 🧙‍♂️"
    elif score > 70: char_class = "Elite Professional ⚔️"
    else: char_class = "Novice Adventurer 🎒"

    return {
        "score": score,
        "char_class": char_class,
        "xp": score * 10,
        "feedback": "Great keyword density!" if score > 60 else "Add more technical keywords."
    }

# --- LEVEL 2 LOGIC (Situational Judgment) ---
def judge_answer(answer, question_id):
    answer_lower = answer.lower()
    word_count = len(answer.split())
    
    # Find the question to check specific keywords
    question = next((q for q in QUESTIONS if q['id'] == int(question_id)), QUESTIONS[0])
    target_keywords = question['keywords']
    
    # Scoring Logic
    keyword_matches = [k for k in target_keywords if k in answer_lower]
    match_count = len(keyword_matches)
    
    score = 0
    feedback = ""

    # 1. Length Check
    if word_count < 10:
        return {"score": 10, "feedback": "Too short. Elaborate on your thought process."}
    elif word_count > 15:
        score += 20

    # 2. Keyword Check
    if match_count >= 3:
        score += 60
        feedback = "Excellent! You showed empathy and problem-solving skills."
    elif match_count >= 1:
        score += 40
        feedback = "Good start, but try to be more specific about the solution."
    else:
        score += 10
        feedback = "Your answer lacked key actions (e.g., communicating, resolving)."

    # 3. Professionalism Check (Bonus)
    if "sorry" in answer_lower or "apologize" in answer_lower or "help" in answer_lower:
        score += 10
    
    return {
        "score": min(score, 100),
        "feedback": feedback,
        "xp": score * 5
    }

def extract_text_from_pdf(pdf_file):
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except: return ""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scan_resume', methods=['POST'])
def scan_resume():
    if 'resume' not in request.files: return jsonify({"error": "No file"}), 400
    file = request.files['resume']
    if file.filename == '': return jsonify({"error": "No file"}), 400
    
    text = extract_text_from_pdf(file)
    if not text: return jsonify({"error": "Empty PDF"}), 400
    
    return jsonify(calculate_resume_score(text))

@app.route('/api/get_level2_question', methods=['GET'])
def get_level2():
    # Return a random question
    question = random.choice(QUESTIONS)
    return jsonify(question)

@app.route('/api/judge_level2', methods=['POST'])
def judge_level2():
    data = request.json
    answer = data.get('answer', '')
    q_id = data.get('question_id', 1)
    
    result = judge_answer(answer, q_id)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
