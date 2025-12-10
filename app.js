const participantsTextarea = document.getElementById('participants');
const drawButton = document.getElementById('drawButton');
const winnerCountInput = document.getElementById('winnerCountInput');

const setupScreen = document.getElementById('setupScreen');
const drawScreen = document.getElementById('drawScreen');
const backButton = document.getElementById('backButton');

const rouletteViewport = document.getElementById('rouletteViewport');
const rouletteListEl = document.getElementById('rouletteList');

const selectWinnerButton = document.getElementById('selectWinnerButton');
const winnersSoFarEl = document.getElementById('winnersSoFar');
const winnersTotalEl = document.getElementById('winnersTotal');
const participantsRemainingEl = document.getElementById('participantsRemaining');
const drawHelperText = document.getElementById('drawHelperText');

const winnerOverlay = document.getElementById('winnerOverlay');
const winnerOverlayName = document.getElementById('winnerOverlayName');

let allParticipants = [];
let remainingParticipants = [];
let winners = [];
let requestedWinners = 0;
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

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Confeti intenso
function createConfettiBurst() {
  const colors = ['#f97316', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#ec4899'];
  const pieces = 130;

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 8 + Math.random() * 6;
    const left = Math.random() * 100;
    const duration = 2.8 + Math.random() * 2.0;

    piece.style.left = left + 'vw';
    piece.style.width = size + 'px';
    piece.style.height = (size + 4) + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = duration + 's';

    document.body.appendChild(piece);

    setTimeout(() => piece.remove(), duration * 1000);
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateStatus() {
  winnersSoFarEl.textContent = winners.length.toString();
  winnersTotalEl.textContent = requestedWinners.toString();
  participantsRemainingEl.textContent = remainingParticipants.length.toString();

  if (winners.length >= requestedWinners || remainingParticipants.length === 0) {
    selectWinnerButton.disabled = true;
    drawHelperText.textContent = 'Sorteo terminado. Puedes volver atrás para un nuevo sorteo.';
  } else {
    selectWinnerButton.disabled = false;
    drawHelperText.textContent = 'La ruleta girará y se detendrá en un ganador al azar.';
  }
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

async function showWinnerOverlay(name) {
  winnerOverlayName.textContent = name;
  winnerOverlayName.classList.remove('animate');
  void winnerOverlayName.offsetWidth; // reflow
  winnerOverlayName.classList.add('animate');

  winnerOverlay.classList.add('show');
  createConfettiBurst();
  setTimeout(createConfettiBurst, 600);

  await sleep(1800);

  winnerOverlay.classList.remove('show');
}

async function selectRandomWinner() {
  if (isSelecting) return;

  if (remainingParticipants.length === 0) {
    showToast("Ya no hay participantes restantes.", "ℹ️");
    return;
  }
  if (winners.length >= requestedWinners) {
    showToast("Ya alcanzaste el número máximo de ganadores.", "ℹ️");
    updateStatus();
    return;
  }

  isSelecting = true;
  selectWinnerButton.disabled = true;

  // Elegimos ganador al azar de los que quedan
  const randomIndex = Math.floor(Math.random() * remainingParticipants.length);
  const winnerObj = remainingParticipants[randomIndex];

  // Construimos lista extendida para que dé varias vueltas
  const loops = 4;
  const extendedList = [];
  for (let i = 0; i < loops; i++) {
    extendedList.push(...remainingParticipants);
  }

  rouletteListEl.innerHTML = '';
  extendedList.forEach(p => {
    const item = document.createElement('div');
    item.className = 'roulette-item';
    item.dataset.id = p.id.toString();
    item.textContent = p.name;
    rouletteListEl.appendChild(item);
  });

  await sleep(50); // dejar que el DOM mida alturas

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

  // 🔥 Duración total del giro: 10 segundos
  const spinDurationMs = 10000;

  // Posición inicial
  rouletteListEl.style.transition = 'none';
  rouletteListEl.style.transform = 'translateY(0px)';

  // Siguiente frame: activamos transición y movemos
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Curva con inicio rápido y frenado MUY suave al final
      rouletteListEl.style.transition =
        `transform ${spinDurationMs}ms cubic-bezier(0.08, 0.8, 0.12, 1)`;
      rouletteListEl.style.transform = `translateY(${finalTranslate}px)`;
    });
  });

  // Esperamos a que termine el giro (un poco más por seguridad)
  await sleep(spinDurationMs + 600);

  // Overlay del ganador
  await showWinnerOverlay(winnerObj.name);

  // Actualizar estructuras: sacar ganador de la lista
  winners.push(winnerObj);
  remainingParticipants.splice(randomIndex, 1);
  updateStatus();

  // Volver a mostrar ruleta base con los que quedan
  renderBaseRouletteList();

  isSelecting = false;
}

/* --------- Flujo principal --------- */

async function startDraw() {
  const lines = participantsTextarea.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    showToast("Ingresa al menos un participante para realizar el sorteo.");
    return;
  }

  let requested = parseInt(winnerCountInput.value, 10);
  if (isNaN(requested) || requested <= 0) {
    requested = 1;
    winnerCountInput.value = '1';
  }

  if (lines.length < requested) {
    showToast(
      `Pediste ${requested} ganador(es), pero solo hay ${lines.length} participante(s). Se sortearán todos ellos.`,
      "ℹ️"
    );
  }

  requestedWinners = Math.min(requested, lines.length);

  allParticipants = lines.map((name, index) => ({
    id: index + 1,
    name
  }));

  remainingParticipants = shuffle([...allParticipants]);
  winners = [];

  renderBaseRouletteList();
  updateStatus();

  setupScreen.classList.add('hidden');
  drawScreen.classList.remove('hidden');
}

function resetToSetup() {
  allParticipants = [];
  remainingParticipants = [];
  winners = [];
  requestedWinners = 0;
  isSelecting = false;

  rouletteListEl.innerHTML = '';
  winnersSoFarEl.textContent = '0';
  winnersTotalEl.textContent = '0';
  participantsRemainingEl.textContent = '0';
  drawHelperText.textContent = 'La ruleta girará y se detendrá en un ganador al azar.';

  drawScreen.classList.add('hidden');
  setupScreen.classList.remove('hidden');
}

/* --------- Event listeners --------- */

drawButton.addEventListener('click', () => {
  startDraw().catch(err => {
    console.error(err);
    showToast("Ocurrió un error al iniciar el sorteo.", "💥");
  });
});

selectWinnerButton.addEventListener('click', () => {
  selectRandomWinner().catch(err => {
    console.error(err);
    isSelecting = false;
    selectWinnerButton.disabled = false;
    showToast("Ocurrió un error al seleccionar el ganador.", "💥");
  });
});

backButton.addEventListener('click', () => {
  resetToSetup();
});
