import os
import re
from flask import Flask, request, jsonify, render_template
from PyPDF2 import PdfReader
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# --- ADVANCED ATS LOGIC ENGINE ---
def calculate_local_score(text):
    """
    Simulates a real corporate ATS (Applicant Tracking System).
    Scoring Breakdown (Total 100):
    - 15 pts: Contact Info (Email/Phone)
    - 20 pts: Structure (Education/Experience sections)
    - 40 pts: Hard Skills (Tech/Tools)
    - 15 pts: Soft Skills (Leadership/Teamwork)
    - 10 pts: Word Count Optimization (Not too short, not too long)
    """
    text_lower = text.lower()
    score = 0
    feedback_list = []

    # --- 1. CONTACT INFO CHECK (15 PTS) ---
    # Simple Regex for Email and Phone
    has_email = re.search(r'[\w\.-]+@[\w\.-]+', text)
    has_phone = re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text) or re.search(r'\b\d{10}\b', text)

    if has_email: score += 10
    else: feedback_list.append("⚠️ Critical: No email address found.")
    
    if has_phone: score += 5
    else: feedback_list.append("⚠️ Warning: No phone number detected.")

    # --- 2. SECTION SCANNING (20 PTS) ---
    # ATS looks for specific headers to parse data
    if any(x in text_lower for x in ['education', 'university', 'college', 'degree']):
        score += 10
    else:
        feedback_list.append("❌ Missing 'Education' section.")

    if any(x in text_lower for x in ['experience', 'work history', 'employment', 'internship']):
        score += 10
    else:
        feedback_list.append("❌ Missing 'Experience' or 'Work History' section.")

    # --- 3. HARD SKILLS MINING (40 PTS) ---
    # A larger bank of keywords common in modern job descriptions
    hard_skills_bank = [
        'python', 'java', 'javascript', 'c++', 'c#', 'html', 'css', 'react', 'angular', 'vue',
        'node', 'express', 'django', 'flask', 'fastapi', 'sql', 'mysql', 'postgresql', 'mongodb',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'jenkins', 'linux', 'agile', 'scrum',
        'excel', 'tableau', 'power bi', 'analysis', 'data', 'machine learning', 'ai', 'api', 'rest'
    ]
    
    found_skills = [skill for skill in hard_skills_bank if skill in text_lower]
    unique_skills_count = len(set(found_skills))
    
    # Logic: 8+ unique skills = max points (40). 1 skill = 5 points.
    skill_points = min(unique_skills_count * 5, 40)
    score += skill_points

    if unique_skills_count < 3:
        feedback_list.append("📉 Keyword density is low. Add more technical tools/languages.")

    # --- 4. SOFT SKILLS / ACTION VERBS (15 PTS) ---
    soft_skills_bank = [
        'leadership', 'communication', 'teamwork', 'problem-solving', 'adaptability',
        'managed', 'led', 'coordinated', 'developed', 'created', 'implemented', 'designed',
        'collaborated', 'mentored', 'strategy', 'planned'
    ]
    found_soft = [word for word in soft_skills_bank if word in text_lower]
    
    # Logic: 5+ soft skills/action verbs = max points (15)
    soft_points = min(len(set(found_soft)) * 3, 15)
    score += soft_points

    # --- 5. FORMATTING & LENGTH (10 PTS) ---
    word_count = len(text.split())
    if 200 <= word_count <= 1000:
        score += 10
    elif word_count < 200:
        score += 0
        feedback_list.append("⚠️ Resume is too short (under 200 words).")
    else:
        score += 5
        feedback_list.append("⚠️ Resume is quite long (over 1000 words). Ensure it's concise.")

    # --- FINAL CALCULATIONS ---
    
    # Determine Character Class based on highest density
    tech_count = len(found_skills)
    mgmt_count = len([w for w in found_soft if w in ['managed', 'led', 'strategy', 'planned']])
    
    if tech_count > mgmt_count + 2:
        char_class = "Full-Stack Sorcerer 🧙‍♂️"
    elif mgmt_count > tech_count:
        char_class = "Corporate Commander 🛡️"
    elif score > 80:
        char_class = "Elite Professional ⚔️"
    else:
        char_class = "Novice Adventurer 🎒"

    # Generate Main Boss Feedback
    if not feedback_list:
        main_feedback = "Flawless Victory! Your resume is perfectly optimized for ATS bots."
    elif score > 80:
        main_feedback = "Excellent build. Minor tweaks needed: " + feedback_list[0]
    elif score > 60:
        main_feedback = "Solid foundation, but the ATS bot is hesitant. " + feedback_list[0]
    else:
        main_feedback = "Critical failure imminent. " + " ".join(feedback_list[:2])

    return {
        "ats_score": score,
        "character_class": char_class,
        "xp_earned": score * 10,
        "feedback": main_feedback
    }

def extract_text_from_pdf(pdf_file):
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception:
        return ""

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
        resume_text = extract_text_from_pdf(file)
        
        if len(resume_text.strip()) == 0:
            return jsonify({"error": "PDF is empty or unreadable (image-based?). Try a text PDF."}), 400

        game_data = calculate_local_score(resume_text)
        return jsonify(game_data), 200

    except Exception as e:
        return jsonify({"error": f"System Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
