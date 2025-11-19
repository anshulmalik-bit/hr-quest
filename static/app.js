let studentId = null;
let atsScore = 0;
let currentQuestion = 0;
const questions = [
  'Tell me about a time you led a team to meet a deadline. What did you do?',
  'How do you handle conflict with a teammate?',
  'Describe a project where you used analytics or data to make a decision.',
  'How would you prioritize tasks when everything is high-priority?',
  'Why should we hire you?'
];
const answers = [];
const times = [];
let questionStart = null;

// UI helpers
function showCard(id){
  document.querySelectorAll('.card').forEach(c=>c.classList.remove('active'))
  document.getElementById(id).classList.add('active')
  // update level badge
  const levelMap = {home:1, profile:2, interview:3, results:4}
  const lb = document.getElementById('levelBadge');
  if(lb) lb.textContent = 'Level ' + (levelMap[id]||1);
}

function setPoints(n){
  const el = document.querySelector('#points span');
  if(el) el.textContent = n;
}

// start
document.getElementById('startBtn').addEventListener('click', ()=> showCard('profile'))
document.getElementById('howBtn').addEventListener('click', ()=>{
  const h = document.getElementById('howBox');
  h.style.display = (h.style.display==='none')? 'block' : 'none';
})

// profile upload
document.getElementById('profileForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const resume = document.getElementById('resume').files[0];
  if(!name || !resume){alert('Name and resume required');return}
  const form = new FormData();
  form.append('name', name);
  form.append('email', email);
  form.append('resume', resume);

  try{
    const res = await fetch('/upload', {method:'POST', body: form});
    const data = await res.json();
    if(res.status !== 200){ alert(data.error || 'Upload failed'); return }
    studentId = data.student_id;
    atsScore = data.ats_score || 0;
    setPoints(Math.round(atsScore*0.25));
    const ar = document.getElementById('atsResult');
    if(ar){ ar.style.display = 'inline-block'; ar.textContent = `ATS Score: ${atsScore} — Points: ${Math.round(atsScore*0.25)}`; }
    // unlock next level
    setTimeout(()=> { showCard('interview'); startQuestion(0); }, 700);
  } catch(err){
    console.error('Upload failed', err);
    alert('Upload failed — check console')
  }
});

function startQuestion(i){
  currentQuestion = i;
  answers.length = 0; times.length = 0;
  showQuestion(i);
}

function showQuestion(i){
  const qa = document.getElementById('questionArea');
  if(!qa) return;
  qa.innerHTML = `
    <div class="qcard">
      <h4>Question ${i+1} of ${questions.length}</h4>
      <p>${questions[i]}</p>
      <textarea id="ansbox" rows="6" placeholder="Type your answer here (min 4 words)"></textarea>
    </div>`;
  questionStart = Date.now();
}

document.getElementById('nextQBtn').addEventListener('click', ()=>{
  const box = document.getElementById('ansbox');
  if(!box) return;
  // require minimum words
  const words = (box.value.trim().split(/\s+/).filter(Boolean)).length;
  if(words < 4){ alert('Please write at least 4 words before moving on.'); return }
  answers.push(box.value || '');
  const elapsed = Math.round((Date.now() - questionStart)/1000);
  times.push(elapsed);
  const next = currentQuestion + 1;
  if(next < questions.length){
    showQuestion(next);
    currentQuestion = next;
  } else {
    alert('All questions done — click Submit Answers')
  }
});

document.getElementById('submitAnswersBtn').addEventListener('click', async ()=>{
  const box = document.getElementById('ansbox');
  if(box) { answers.push(box.value || ''); times.push(Math.round((Date.now()-questionStart)/1000)); }
  const payload = { student_id: studentId, answers: answers, times: times };
  const res = await fetch('/submit-answers', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  const data = await res.json();
  if(res.status !== 200){ alert(data.error || 'Submit failed'); return }
  // compute total points locally too
  const totalPts = data.total_score || 0;
  setPoints(totalPts);
  showCard('results');
  const sc = document.getElementById('scoreCard');
  if(sc){
    sc.innerHTML = `
    <p>Name: <strong>${document.getElementById('name').value}</strong></p>
    <p>ATS Score: ${atsScore}</p>
    <p>Grammar Score: ${data.grammar_score}</p>
    <p>Answers Score: ${data.answer_score}</p>
    <h3>Total Score: ${data.total_score}/100</h3>
    <p>Badges: ${data.badges.join(', ') || 'None'}</p>
  `;
  }
});

// restart logic
document.getElementById('restartBtn').addEventListener('click', () => {
  studentId = null;
  atsScore = 0;
  currentQuestion = 0;
  answers.length = 0;
  times.length = 0;
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const resumeEl = document.getElementById('resume');
  if(nameEl) nameEl.value = '';
  if(emailEl) emailEl.value = '';
  if(resumeEl) resumeEl.value = '';
  const ar = document.getElementById('atsResult');
  if(ar) ar.style.display = 'none';
  setPoints(0);
  showCard('home');
});

// small UX: allow pressing Enter to move to next question (CTRL+Enter to submit)
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && !e.shiftKey){
    const active = document.querySelector('.card.active');
    if(active && active.id === 'interview'){
      e.preventDefault();
      document.getElementById('nextQBtn').click();
    }
  }
});
