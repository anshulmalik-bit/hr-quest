import os
import json
from flask import Flask, render_template, request, jsonify
from PyPDF2 import PdfReader
from openai import OpenAI
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

app = Flask(__name__)

# Initialize OpenAI Client
# NOTE: Make sure OPENAI_API_KEY is set in your Render Environment Variables
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_text_from_pdf(file_stream):
    """Helper function to extract text from uploaded PDF"""
    reader = PdfReader(file_stream)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

@app.route('/')
def index():
    """Renders the Game Lobby"""
    return render_template('index.html')

@app.route('/api/level1/scan', methods=['POST'])
def level1_scan():
    """Level 1: The Resume Scanner Endpoint"""
    
    # 1. Check if file exists
    if 'resume' not in request.files:
        return jsonify({"error": "No resume equipped!"}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # 2. Extract Text
    try:
        resume_text = extract_text_from_pdf(file)
        if len(resume_text) < 50:
            return jsonify({"error": "Resume text is too short or unreadable."}), 400
    except Exception as e:
        return jsonify({"error": "Failed to read PDF scroll."}), 500

    # 3. AI Logic (The Gamified Judge)
    prompt = f"""
    You are the Gatekeeper AI for a Corporate RPG video game.
    Analyze the following resume text and output a JSON object ONLY.
    
    The JSON must contain:
    - "ats_score": (Integer 0-100)
    - "class_archetype": (String, e.g., "Code Wizard", "Marketing Paladin", "Data Rogue")
    - "xp_gained": (Integer, equal to score * 15)
    - "strengths": (List of strings, max 2 items)
    - "boss_feedback": (String, a witty, constructive critique from a game boss)
    
    Resume Text:
    {resume_text[:3000]}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o", # Or "gpt-3.5-turbo" to save money
            messages=[
                {"role": "system", "content": "You are a JSON-speaking Game Master."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        # Parse the AI response
        ai_content = response.choices[0].message.content
        return jsonify(json.loads(ai_content))

    except Exception as e:
        return jsonify({"error": f"AI Connection Failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
