from flask import Flask, render_template, request, jsonify
import os
import random
import PyPDF2

app = Flask(__name__)

# --- Data & Config ---
LEVEL_2_QUESTIONS = [
    {
        "id": 1,
        "scenario": "A client is angry on Friday at 5 PM because their project is delayed. They are demanding an immediate fix.",
        "keywords": ["listen", "empathy", "apologize", "resolve", "monday", "calm"]
    },
    {
        "id": 2,
        "scenario": "Two team members are arguing over who should lead the new project. It's affecting team morale.",
        "keywords": ["mediate", "listen", "compromise", "strengths", "meeting", "roles"]
    },
    {
        "id": 3,
        "scenario": "You discover a mistake in a report you sent to the CEO yesterday.",
        "keywords": ["admit", "correct", "immediately", "apologize", "plan", "fix"]
    }
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scan_resume', methods=['POST'])
def scan_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + " "
        text = text.lower()

        score = 0
        feedback = []
        
        # Scoring Logic
        # 1. Contact Info
        if '@' in text or 'phone' in text or 'email' in text:
            score += 15
            feedback.append("Contact info found (+15)")
        
        # 2. Keywords
        keywords = ['python', 'sql', 'leadership', 'teamwork', 'communication', 'java', 'c++', 'project management']
        found_keywords = [kw for kw in keywords if kw in text]
        if found_keywords:
            score += 40
            feedback.append(f"Keywords found: {', '.join(found_keywords)} (+40)")
        
        # 3. Sections
        sections = ['education', 'experience', 'skills', 'projects']
        found_sections = [sec for sec in sections if sec in text]
        if found_sections:
            score += 20
            feedback.append(f"Sections found: {', '.join(found_sections)} (+20)")

        # Determine Class
        character_class = "Novice Recruiter"
        if "python" in text or "sql" in text or "code" in text:
            character_class = "Code Wizard"
        elif "leadership" in text or "management" in text:
            character_class = "Corporate Paladin"
        elif "design" in text or "creative" in text:
            character_class = "Creative Bard"

        return jsonify({
            "score": score,
            "feedback": feedback,
            "class": character_class
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_level2_question', methods=['GET'])
def get_level2_question():
    question = random.choice(LEVEL_2_QUESTIONS)
    return jsonify({
        "id": question["id"],
        "scenario": question["scenario"]
    })

@app.route('/api/judge_level2', methods=['POST'])
def judge_level2():
    data = request.json
    answer = data.get('answer', '').lower()
    question_id = data.get('id')
    
    question = next((q for q in LEVEL_2_QUESTIONS if q["id"] == question_id), None)
    
    if not question:
        return jsonify({"error": "Question not found"}), 404

    score = 0
    feedback = []

    # Length Check
    if len(answer.split()) > 15:
        score += 20
        feedback.append("Good length (+20)")
    else:
        feedback.append("Too short (-0)")

    # Keyword Matching
    matched = [kw for kw in question['keywords'] if kw in answer]
    score += len(matched) * 10
    if matched:
        feedback.append(f"Keywords matched: {', '.join(matched)} (+{len(matched)*10})")

    return jsonify({
        "score": score,
        "feedback": feedback
    })

@app.route('/api/judge_level3', methods=['POST'])
def judge_level3():
    data = request.json
    answer = data.get('answer', '').lower()
    
    score = 0
    feedback = []
    
    # STAR Method Check
    star_keywords = ['situation', 'task', 'action', 'result', 'handled', 'resolved', 'outcome']
    matched = [kw for kw in star_keywords if kw in answer]
    
    if len(matched) >= 3:
        score += 50
        feedback.append("STAR method detected (+50)")
    else:
        feedback.append("Try to structure as Situation, Task, Action, Result (+10)")
        score += 10

    # Empathy/Conflict Resolution
    soft_skills = ['listened', 'understood', 'calm', 'perspective', 'compromise']
    skill_match = [kw for kw in soft_skills if kw in answer]
    if skill_match:
        score += 30
        feedback.append(f"Good soft skills: {', '.join(skill_match)} (+30)")

    return jsonify({"score": score, "feedback": feedback})

@app.route('/api/judge_level4', methods=['POST'])
def judge_level4():
    data = request.json
    answer = data.get('answer', '').lower()
    
    score = 0
    feedback = []
    
    # Strategy Check
    strategy_keywords = ['prioritize', 'delegate', 'communicate', 'plan', 'timeline', 'negotiate']
    matched = [kw for kw in strategy_keywords if kw in answer]
    
    if len(matched) >= 2:
        score += 60
        feedback.append("Strategic thinking detected (+60)")
    else:
        score += 20
        feedback.append("Consider prioritization and communication (+20)")

    return jsonify({"score": score, "feedback": feedback})

@app.route('/api/judge_level5', methods=['POST'])
def judge_level5():
    data = request.json
    answer = data.get('answer', '').lower()
    
    score = 0
    feedback = []
    
    # Salary/Growth Check
    growth_keywords = ['growth', 'learn', 'long-term', 'contribute', 'market', 'fair']
    matched = [kw for kw in growth_keywords if kw in answer]
    
    if matched:
        score += 50
        feedback.append("Good growth mindset (+50)")
    else:
        score += 20
        feedback.append("Be specific about your goals (+20)")

    return jsonify({"score": score, "feedback": feedback})

if __name__ == '__main__':
    app.run(debug=True)
