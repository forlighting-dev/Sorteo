const participantsTextarea = document.getElementById('participants');
const drawButton = document.getElementById('drawButton');
const currentWinnerEl = document.getElementById('currentWinner');
const winnerListEl = document.getElementById('winnerList');
const winnerCountLabel = document.getElementById('winnerCountLabel');
const liveText = document.getElementById('liveText');
const winnerCountInput = document.getElementById('winnerCountInput');

const winnerOverlay = document.getElementById('winnerOverlay');
const winnerOverlayName = document.getElementById('winnerOverlayName');

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

function updateWinnerCount(current, total) {
  winnerCountLabel.textContent = `${current} / ${total} mostrados`;
}

function addWinnerToList(name, index) {
  const item = document.createElement('div');
  item.className = 'winner-item';

  const medalEmoji =
    index === 0 ? '🥇' :
    index === 1 ? '🥈' :
    index === 2 ? '🥉' : '🏅';

  item.innerHTML = `
    <div class="winner-medal">${medalEmoji}</div>
    <div class="winner-text">
      ${name}
      <div class="winner-position">Lugar #${index + 1}</div>
    </div>
  `;
  winnerListEl.appendChild(item);
}

async function animateSingleWinner(name, index, total) {
  liveText.textContent = `Seleccionando ganador #${index + 1}…`;

  const spinDuration = 1600; // ms
  const intervalSpeed = 90;
  const startTime = Date.now();

  const allNames = winnerListEl.dataset.allNames
    ? JSON.parse(winnerListEl.dataset.allNames)
    : [];

  const spinInterval = setInterval(() => {
    if (allNames.length === 0) return;
    const randomName = allNames[Math.floor(Math.random() * allNames.length)];
    currentWinnerEl.textContent = randomName;
  }, intervalSpeed);

  while (Date.now() - startTime < spinDuration) {
    await sleep(80);
  }

  clearInterval(spinInterval);

  winnerOverlayName.textContent = name;
  winnerOverlayName.classList.remove('animate');
  void winnerOverlayName.offsetWidth; 
  winnerOverlayName.classList.add('animate');

  winnerOverlay.classList.add('show');
  createConfettiBurst();
  setTimeout(createConfettiBurst, 600);

  currentWinnerEl.textContent = name;

  await sleep(1800);

  winnerOverlay.classList.remove('show');

  addWinnerToList(name, index);
  updateWinnerCount(index + 1, total);

  await sleep(500);
}

async function drawWinners() {
  const lines = participantsTextarea.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    showToast("Ingresa al menos un participante para realizar el sorteo.");
    return;
  }

  let requestedWinners = parseInt(winnerCountInput.value, 10);

  if (isNaN(requestedWinners) || requestedWinners <= 0) {
    requestedWinners = 1;
    winnerCountInput.value = "1";
  }

  if (lines.length < requestedWinners) {
    showToast(
      `Pediste ${requestedWinners} ganador(es), pero solo hay ${lines.length} participante(s). Se sortearán todos ellos.`,
      "ℹ️"
    );
  }

  const winnerTotal = Math.min(requestedWinners, lines.length);

  const shuffled = shuffle([...lines]);
  const winners = shuffled.slice(0, winnerTotal);

  winnerListEl.dataset.allNames = JSON.stringify(lines);

  winnerListEl.innerHTML = "";
  updateWinnerCount(0, winnerTotal);
  currentWinnerEl.textContent = 'Preparando sorteo…';
  liveText.textContent = 'Sorteo en progreso';
  drawButton.disabled = true;

  await sleep(500);

  for (let i = 0; i < winners.length; i++) {
    await animateSingleWinner(winners[i], i, winnerTotal);
  }

  liveText.textContent = 'Sorteo finalizado 🎉';
  drawButton.disabled = false;
}

drawButton.addEventListener('click', () => {
  drawWinners().catch(err => {
    console.error(err);
    drawButton.disabled = false;
    showToast("Ocurrió un error inesperado en el sorteo.", "💥");
  });
});
