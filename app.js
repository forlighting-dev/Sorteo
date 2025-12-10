const participantsTextarea = document.getElementById('participants');
const drawButton = document.getElementById('drawButton');

const setupScreen = document.getElementById('setupScreen');
const drawScreen = document.getElementById('drawScreen');
const backButton = document.getElementById('backButton');

const rouletteViewport = document.getElementById('rouletteViewport');
const rouletteListEl = document.getElementById('rouletteList');

const selectWinnerButton = document.getElementById('selectWinnerButton');
const drawHelperText = document.getElementById('drawHelperText');

const winnerOverlay = document.getElementById('winnerOverlay');
const winnerOverlayName = document.getElementById('winnerOverlayName');
const closeWinnerBtn = document.getElementById('closeWinnerBtn');
const attendedCheckbox = document.getElementById('attendedCheckbox');

const downloadExcelBtn = document.getElementById('downloadExcelBtn');

let allParticipants = [];
let remainingParticipants = [];
let winnersHistory = [];
let isSelecting = false;

function showToast(message, icon = "⚠️") {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span>${message}</span>
    <span class="toast-close">✕</span>
  `;
  document.body.appendChild(toast);
  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 260);
  }, 3500);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function updateStatus() {
  selectWinnerButton.disabled = isSelecting;
  downloadExcelBtn.disabled = winnersHistory.length === 0;
}

function renderBaseRouletteList() {
  rouletteListEl.innerHTML = '';
  remainingParticipants.forEach(p => {
    const item = document.createElement('div');
    item.className = 'roulette-item';
    item.dataset.id = p.id.toString();
    item.textContent = p.name;
    rouletteListEl.appendChild(item);
  });
  rouletteListEl.style.transition = 'none';
  rouletteListEl.style.transform = 'translateY(0px)';
}

function openWinnerOverlay(winnerObj) {
  winnerOverlayName.innerHTML = `
    <div class="winner-name">${winnerObj.name}</div>
    <div class="winner-department">${winnerObj.department || 'Sin departamento'}</div>
  `;
  winnerOverlay.classList.add('show');
  winnerOverlay.setAttribute('aria-hidden', 'false');
  attendedCheckbox.checked = false;
  
  const winnerNameElement = winnerOverlayName.querySelector('.winner-name');
  winnerNameElement.classList.remove('animate');
  void winnerNameElement.offsetWidth;
  winnerNameElement.classList.add('animate');
}

function closeWinnerOverlay() {
  winnerOverlay.classList.remove('show');
  winnerOverlay.setAttribute('aria-hidden', 'true');
  
  const lastWinner = winnersHistory[winnersHistory.length - 1];
  if (lastWinner) {
    lastWinner.attended = attendedCheckbox.checked;
  }
  
  renderBaseRouletteList();
  updateStatus();
  
  isSelecting = false;
  selectWinnerButton.disabled = false;
}

function downloadWinnersCSV() {
  if (winnersHistory.length === 0) {
    showToast('No hay ganadores para exportar.', 'ℹ️');
    return;
  }
  const lines = [];
  lines.push(['Nombre', 'Departamento', 'Asistio']);
  winnersHistory.forEach(w => {
    lines.push([
      `"${w.name.replace(/"/g,'""')}"`,
      `"${(w.department || '').replace(/"/g,'""')}"`,
      w.attended ? 'Si' : 'No'
    ]);
  });
  const csv = lines.map(row => row.join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dt = new Date();
  const stamp = dt.toISOString().slice(0,19).replace('T','_').replace(/:/g,'-');
  a.download = `ganadores_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function showConfettiBurst() {
  const colors = ['#f97316', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#ec4899'];
  const pieces = 120;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 8 + Math.random() * 6;
    const left = Math.random() * 100;
    const duration = 2.4 + Math.random() * 1.8;
    piece.style.left = left + 'vw';
    piece.style.width = size + 'px';
    piece.style.height = (size + 4) + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = duration + 's';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), duration * 1000);
  }
}

async function selectRandomWinner() {
  if (isSelecting) return;
  
  isSelecting = true;
  selectWinnerButton.disabled = true;

  if (remainingParticipants.length === 0) {
    showToast("No hay participantes disponibles.", "ℹ️");
    isSelecting = false;
    selectWinnerButton.disabled = false;
    return;
  }

  const randomIndex = Math.floor(Math.random() * remainingParticipants.length);
  const winnerObj = remainingParticipants[randomIndex];

  const targetAnimationTime = 10000;
  const minItemsPerSecond = 15;
  const minTotalItems = Math.ceil((targetAnimationTime / 1000) * minItemsPerSecond);
  const loops = Math.max(6, Math.ceil(minTotalItems / remainingParticipants.length));

  const extendedList = [];
  for (let i = 0; i < loops; i++) {
    extendedList.push(...remainingParticipants);
  }

  rouletteListEl.innerHTML = '';
  extendedList.forEach(p => {
    const it = document.createElement('div');
    it.className = 'roulette-item';
    it.dataset.id = p.id.toString();
    it.textContent = p.name;
    rouletteListEl.appendChild(it);
  });

  await sleep(40);

  const items = rouletteListEl.querySelectorAll('.roulette-item');
  if (items.length === 0) { 
    isSelecting = false; 
    selectWinnerButton.disabled = false; 
    return; 
  }

  const rowHeight = items[0].offsetHeight;
  const viewportHeight = rouletteViewport.clientHeight;
  const highlightOffset = viewportHeight / 2 - rowHeight / 2;

  const baseIndex = remainingParticipants.findIndex(p => p.id === winnerObj.id);
  const perLoop = remainingParticipants.length;
  const targetIndex = (loops - 1) * perLoop + baseIndex;
  const finalTranslate = -(targetIndex * rowHeight - highlightOffset);

  const spinDurationMs = 10000;
  rouletteListEl.style.transition = 'none';
  rouletteListEl.style.transform = 'translateY(0px)';

  await sleep(10);

  rouletteListEl.style.transition = `transform ${spinDurationMs}ms cubic-bezier(0.1, 0.7, 0.1, 1)`;
  rouletteListEl.style.transform = `translateY(${finalTranslate}px)`;

  await sleep(spinDurationMs + 500);

  openWinnerOverlay(winnerObj);
  await showConfettiBurst();
  setTimeout(showConfettiBurst, 550);

  winnersHistory.push({
    id: winnerObj.id,
    name: winnerObj.name,
    department: winnerObj.department,
    timestamp: (new Date()).toLocaleString(),
    attended: false
  });

  remainingParticipants.splice(randomIndex, 1);
}

function startDraw() {
  const lines = participantsTextarea.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    showToast("Ingresa al menos un participante para realizar el sorteo.");
    return;
  }

  allParticipants = lines.map((line, index) => {
    const parts = line.split(',').map(part => part.trim());
    return {
      id: index + 1,
      name: parts[0] || 'Sin nombre',
      department: parts[1] || 'Sin departamento'
    };
  });

  remainingParticipants = shuffle([...allParticipants]);
  
  updateStatus();
  renderBaseRouletteList();
  
  setupScreen.classList.add('hidden');
  drawScreen.classList.remove('hidden');
  
  document.body.classList.remove('setup-mode');
  document.body.classList.add('draw-mode');
}

function resetToSetup() {
  allParticipants = [];
  remainingParticipants = [];
  isSelecting = false;
  rouletteListEl.innerHTML = '';
  updateStatus();
  drawScreen.classList.add('hidden');
  setupScreen.classList.remove('hidden');
  
  winnerOverlay.classList.remove('show');
  
  document.body.classList.remove('draw-mode');
  document.body.classList.add('setup-mode');
}

document.body.classList.add('setup-mode');

drawButton.addEventListener('click', () => {
  startDraw();
});

selectWinnerButton.addEventListener('click', () => {
  selectRandomWinner().catch(err => { 
    console.error(err); 
    isSelecting = false; 
    selectWinnerButton.disabled = false; 
    showToast("Error seleccionando ganador","💥"); 
  });
});

backButton.addEventListener('click', () => {
  resetToSetup();
});

attendedCheckbox.addEventListener('change', (e) => {
  const lastWinner = winnersHistory[winnersHistory.length - 1];
  if (lastWinner) {
    lastWinner.attended = e.target.checked;
    updateStatus();
  }
});

closeWinnerBtn.addEventListener('click', () => {
  closeWinnerOverlay();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && winnerOverlay.classList.contains('show')) {
    closeWinnerOverlay();
  }
});

winnerOverlay.addEventListener('click', (e) => {
  if (e.target === winnerOverlay) {
    closeWinnerOverlay();
  }
});

downloadExcelBtn.addEventListener('click', () => {
  downloadWinnersCSV();
});

updateStatus();