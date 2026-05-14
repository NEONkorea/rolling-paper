/* ══════════════════════════════════════
   script.js — 성시현 선생님 롤링페이퍼
   Google Sheets 백엔드 버전
══════════════════════════════════════ */

/* ──────────────────────────────────────
   ✏️ Apps Script 웹 앱 URL
   배포 후 받은 URL을 아래에 붙여넣으세요!
────────────────────────────────────── */
const API_URL = 'https://script.google.com/macros/s/AKfycbw3Cp2FdL2QAfTjqLK75uizF82WIcKsexUAsQ8WgaFvA-eC2VOwx2GqA7zGjBO1D2kP/exec';
// 예시: 'https://script.google.com/macros/s/AKfy.../exec'

/* ── 상태 변수 ── */
let selectedColor = 'yellow';
let letters = [];

/* ══════════════════════════════════════
   코드 레인 (배경 애니메이션)
══════════════════════════════════════ */
function initCodeRain() {
  const container = document.getElementById('codeRain');
  const chars = '01アイウエオabcdefif(){}[];=>const let var function return class while for'.split('');
  for (let i = 0; i < 28; i++) {
    const col = document.createElement('div');
    col.className = 'rain-col';
    col.style.left = (i * 3.7) + '%';
    col.style.animationDuration = (8 + Math.random() * 12) + 's';
    col.style.animationDelay    = (Math.random() * 15) + 's';
    let txt = '';
    for (let j = 0; j < 40; j++) {
      txt += chars[Math.floor(Math.random() * chars.length)] + '\n';
    }
    col.textContent = txt;
    container.appendChild(col);
  }
}

/* ══════════════════════════════════════
   색상 선택
══════════════════════════════════════ */
function selectColor(el) {
  document.querySelectorAll('.color-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor = el.dataset.color;
}

/* ══════════════════════════════════════
   HTML 이스케이프 (XSS 방지)
══════════════════════════════════════ */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ══════════════════════════════════════
   편지 목록 불러오기 (Google Sheets GET)
══════════════════════════════════════ */
async function fetchLetters() {
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    letters = Array.isArray(data) ? data : [];
    renderLetters();
  } catch (err) {
    console.error('편지 불러오기 실패:', err);
  }
}

/* ══════════════════════════════════════
   포스트잇 렌더링
══════════════════════════════════════ */
function renderLetters() {
  const grid     = document.getElementById('postitsGrid');
  const emptyMsg = document.getElementById('emptyMsg');
  grid.querySelectorAll('.postit').forEach(el => el.remove());

  if (letters.length === 0) {
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';

    letters.forEach((letter, idx) => {
      const rot = (Math.random() * 6 - 3).toFixed(2);
      const div = document.createElement('div');
      div.className = `postit ${letter.color}`;
      div.style.setProperty('--rot', rot + 'deg');
      div.style.transform      = `rotate(${rot}deg)`;
      div.style.animationDelay = (idx * 0.07) + 's';

      const safeMsg = escapeHtml(letter.message).replace(/\n/g, '<br>');
      div.innerHTML = `
        <div class="postit-pin"></div>
        <div class="postit-message">${safeMsg}</div>
        <div class="postit-date">${letter.date}</div>
      `;
      div.addEventListener('click', () => openModal(letter));
      grid.appendChild(div);
    });
  }

  document.getElementById('letterCount').textContent =
    `// 총 ${letters.length}개의 편지가 붙어 있습니다.`;
}

/* ══════════════════════════════════════
   편지 제출 → Google Sheets POST
══════════════════════════════════════ */
async function submitLetter() {
  const messageEl = document.getElementById('inputMessage');
  const message   = messageEl.value.trim();
  if (!message) { shakeInput(messageEl); return; }

  const now  = new Date();
  const date = `${now.getMonth() + 1}/${now.getDate()}`;
  const letter = { message, color: selectedColor, date, timestamp: Date.now() };

  // 즉시 로컬에 추가해서 화면에 먼저 보여줌 (빠른 피드백)
  letters.push(letter);
  renderLetters();
  messageEl.value = '';
  spawnChalkDust();
  showToast('✓ 편지가 칠판에 붙었습니다!');
  setTimeout(() => {
    document.getElementById('boardSurface').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);

  // 백그라운드에서 Sheets에 저장
  try {
    await fetch(API_URL, {
      method:  'POST',
      body:    JSON.stringify(letter),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('저장 실패:', err);
    showToast('⚠ 저장 실패. 새로고침 후 다시 시도해 주세요.');
  }
}

/* ══════════════════════════════════════
   입력 오류 흔들기
══════════════════════════════════════ */
function shakeInput(el) {
  el.style.borderColor = 'rgba(248, 113, 113, 0.6)';
  el.style.boxShadow   = '0 0 0 3px rgba(248, 113, 113, 0.15)';
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1500);
}

/* ══════════════════════════════════════
   분필 가루 파티클
══════════════════════════════════════ */
function spawnChalkDust() {
  const btn    = document.querySelector('.submit-btn');
  const rect   = btn.getBoundingClientRect();
  const colors = ['#f0ede0', '#f5e642', '#7ec8e3', '#f4a7b9', '#c8e6c0'];
  for (let i = 0; i < 20; i++) {
    const d = document.createElement('div');
    d.className = 'chalk-dust';
    const size = 3 + Math.random() * 5;
    d.style.width      = size + 'px';
    d.style.height     = size + 'px';
    d.style.background = colors[Math.floor(Math.random() * colors.length)];
    d.style.left       = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 100) + 'px';
    d.style.top        = (rect.top  + (Math.random() - 0.5) * 40) + 'px';
    const angle = Math.random() * 2 * Math.PI;
    const dist  = 40 + Math.random() * 80;
    d.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
    d.style.setProperty('--dy', (Math.sin(angle) * dist) + 'px');
    d.style.animationDuration = (0.8 + Math.random() * 0.8) + 's';
    d.style.animationDelay    = (Math.random() * 0.2) + 's';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2000);
  }
}

/* ══════════════════════════════════════
   토스트 알림
══════════════════════════════════════ */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ══════════════════════════════════════
   모달
══════════════════════════════════════ */
function openModal(letter) {
  const overlay = document.getElementById('modalOverlay');
  const card    = document.getElementById('modalCard');
  card.className = `modal-card ${letter.color}`;
  document.getElementById('modalAuthor').style.display = 'none';
  const safeMsg = escapeHtml(letter.message).replace(/\n/g, '<br>');
  document.getElementById('modalMessage').innerHTML = safeMsg;
  overlay.classList.add('open');
}

function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) {
    document.getElementById('modalOverlay').classList.remove('open');
  }
}

/* ══════════════════════════════════════
   Ctrl + Enter 단축키
══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey) submitLetter();
});

/* ══════════════════════════════════════
   스크롤 페이드인
══════════════════════════════════════ */
function initScrollFade() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════
   초기화
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initCodeRain();
  initScrollFade();
  fetchLetters();   // Sheets에서 편지 불러오기
});