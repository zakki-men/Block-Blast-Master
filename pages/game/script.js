// script.js — Halaman Game

// --- Konfigurasi dan Variabel Global Game ---
const BOARD_ROWS = 8;
const BOARD_COLS = 8;
let CELL_SIZE_PX = 30;
const PREVIEW_CELL_SIZE_PX = 20;

let gameBoard = [];
let currentScore = 0;
let bestScore = localStorage.getItem("blockBlastBestScore")
  ? parseInt(localStorage.getItem("blockBlastBestScore"))
  : 0;
let nextBlocks = [];
let isPaused = false;
let gameActive = true;

// Variabel untuk Drag-and-Drop
let isDragging = false;
let currentDraggingBlockData = null;
let currentDraggingBlockIndex = -1;
let currentDraggingBlockDOM = null;
let originalDraggedSlotDOM = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let currentBlockGhost = null;

// --- Referensi Elemen DOM ---
const gameBoardElement = document.getElementById("game-board");
const nextBlocksContainer = document.getElementById("next-blocks-container");
const currentScoreDisplay = document.getElementById("current-score");
const bestScoreDisplay = document.getElementById("best-score-display-game");

const pauseButton = document.getElementById("pause-button");
const resumeButton = document.getElementById("resume-button");
const restartButton = document.getElementById("restart-button");
const settingsButton = document.getElementById("settings-button");

const settingsModal = document.getElementById("settings-modal");
const closeModalButtonBottom = document.getElementById("close-modal");
const closeModalButtonTop = document.getElementById("close-modal-top");

const gameMusic = document.getElementById("game-music");
const blockClearSound = document.getElementById("block-clear-sound");
const placeBlockSound = document.getElementById("place-block-sound");
const musicVolumeSlider = document.getElementById("music-volume");
const sfxVolumeSlider = document.getElementById("sfx-volume");

// --- Definisi Bentuk Blok ---
const BLOCK_SHAPES = {
  single_1: [[1]],

  domino_horizontal: [[1, 1]],
  domino_vertical: [[1], [1]],

  square_2x2: [
    [1, 1],
    [1, 1],
  ],

  line_vertical_3: [[1], [1], [1]],
  line_vertical_4: [[1], [1], [1], [1]],
  line_vertical_5: [[1], [1], [1], [1], [1]],

  line_horizontal_3: [[1, 1, 1]],
  line_horizontal_4: [[1, 1, 1, 1]],
  line_horizontal_5: [[1, 1, 1, 1, 1]],

  diagonal_3: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  diagonal_4: [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ],
  diagonal_5: [
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
  ],

  solid_block_6: [
    [1, 1, 1],
    [1, 1, 1],
  ],

  L_3x3_right: [
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  L_3x3_left: [
    [0, 0, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],

  L_small_rot1: [
    [1, 0],
    [1, 1],
  ],
  L_small_rot2: [
    [1, 1],
    [1, 0],
  ],
  L_small_rot3: [
    [1, 1],
    [0, 1],
  ],
  L_small_rot4: [
    [0, 1],
    [1, 1],
  ],

  Z_shape: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  S_shape: [
    [0, 1, 1],
    [1, 1, 0],
  ],

  T_shape: [
    [1, 1, 1],
    [0, 1, 0],
  ],
};

const BLOCK_NAMES = Object.keys(BLOCK_SHAPES);

const BLOCK_COLORS = [
  "block-color-1",
  "block-color-2",
  "block-color-3",
  "block-color-4",
  "block-color-5",
  "block-color-6",
  "block-color-7",
];

// --- Fungsi Pembantu Bounding Box ---
function getBlockBoundingBox(shape) {
  let minRow = shape.length;
  let minCol = shape[0].length;
  let maxRow = -1;
  let maxCol = -1;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        minRow = Math.min(minRow, r);
        minCol = Math.min(minCol, c);
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  if (maxRow === -1) {
    return { minRow: 0, minCol: 0, maxRow: 0, maxCol: 0, width: 0, height: 0 };
  }

  return {
    minRow,
    minCol,
    maxRow,
    maxCol,
    width: maxCol - minCol + 1,
    height: maxRow - minRow + 1,
  };
}

// --- Fungsi play suara ---
function playSoundSafely(audioElement) {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch((e) => {
    console.warn("Suara belum bisa diputar:", e);
  });
}

// --- Inisialisasi Game ---
function initGame() {
  currentScore = 0;
  gameBoard = [];
  nextBlocks = [];
  gameActive = true;
  isPaused = false;
  updateScoreDisplay();
  updateBestScoreDisplay();

  document.documentElement.style.setProperty("--BOARD_ROWS", BOARD_ROWS);
  document.documentElement.style.setProperty("--BOARD_COLS", BOARD_COLS);

  adjustCellSize();

  document.documentElement.style.setProperty(
    "--preview-cell-size",
    `${PREVIEW_CELL_SIZE_PX}px`
  );

  createGameBoard();
  generateNewBlocks();
  renderNextBlocks();

  if (pauseButton) pauseButton.classList.remove("hidden");
  if (resumeButton) resumeButton.classList.add("hidden");

  if (gameMusic) {
    gameMusic.play().catch((e) =>
      console.warn("Musik belum bisa diputar otomatis:", e)
    );
  }

  document.addEventListener(
    "click",
    () => {
      if (gameMusic && gameMusic.paused && gameActive && !isPaused) {
        gameMusic.play().catch(() => {});
      }
    },
    { once: true }
  );

  loadVolumeSettings();

  if (settingsModal) settingsModal.classList.add("hidden");

  checkGameOver();
}

function adjustCellSize() {
  const gameBoardWrapper = document.getElementById("game-board-wrapper");

  if (gameBoardWrapper) {
    const wrapperPadding =
      parseFloat(getComputedStyle(gameBoardWrapper).paddingLeft) * 2;
    const wrapperBorder =
      parseFloat(getComputedStyle(gameBoardWrapper).borderLeftWidth) * 2;

    if (window.innerWidth <= 767) {
      const maxBoardWrapperWidth = Math.min(window.innerWidth - 40, 400);
      const availableWidth = maxBoardWrapperWidth - wrapperPadding - wrapperBorder;
      CELL_SIZE_PX = Math.max(Math.floor(availableWidth / BOARD_COLS), 30);
    } else if (window.innerWidth <= 1199) {
      CELL_SIZE_PX = 45;
    } else {
      CELL_SIZE_PX = 50;
    }
  } else {
    if (window.innerWidth <= 767) {
      CELL_SIZE_PX = Math.max(
        Math.floor((window.innerWidth * 0.8) / BOARD_COLS),
        30
      );
    } else {
      CELL_SIZE_PX = 45;
    }
  }

  document.documentElement.style.setProperty("--cell-size", `${CELL_SIZE_PX}px`);

  if (gameBoardElement) {
    gameBoardElement.style.width = `calc(var(--cell-size) * var(--BOARD_COLS))`;
    gameBoardElement.style.height = `calc(var(--cell-size) * var(--BOARD_ROWS))`;
    gameBoardElement.style.gridTemplateColumns = `repeat(${BOARD_COLS}, var(--cell-size))`;
    gameBoardElement.style.gridTemplateRows = `repeat(${BOARD_ROWS}, var(--cell-size))`;
  }
}

window.addEventListener("resize", adjustCellSize);

function loadVolumeSettings() {
  const savedMusicVolume = localStorage.getItem("blockBlastMusicVolume");
  const savedSfxVolume = localStorage.getItem("blockBlastSfxVolume");

  if (musicVolumeSlider && gameMusic) {
    musicVolumeSlider.value =
      savedMusicVolume !== null ? parseFloat(savedMusicVolume) : 0.5;
    gameMusic.volume = musicVolumeSlider.value;
  }
  if (sfxVolumeSlider && blockClearSound && placeBlockSound) {
    sfxVolumeSlider.value =
      savedSfxVolume !== null ? parseFloat(savedSfxVolume) : 0.75;
    blockClearSound.volume = sfxVolumeSlider.value;
    placeBlockSound.volume = sfxVolumeSlider.value;
  }
}

function saveVolumeSettings() {
  if (musicVolumeSlider)
    localStorage.setItem("blockBlastMusicVolume", musicVolumeSlider.value);
  if (sfxVolumeSlider)
    localStorage.setItem("blockBlastSfxVolume", sfxVolumeSlider.value);
}

// --- Papan Game ---
function createGameBoard() {
  gameBoardElement.innerHTML = "";
  gameBoardElement.style.gridTemplateColumns = `repeat(${BOARD_COLS}, var(--cell-size))`;
  gameBoardElement.style.gridTemplateRows = `repeat(${BOARD_ROWS}, var(--cell-size))`;

  for (let r = 0; r < BOARD_ROWS; r++) {
    gameBoard[r] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = document.createElement("div");
      cell.classList.add("grid-cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      gameBoardElement.appendChild(cell);
      gameBoard[r][c] = 0;
    }
  }
}

function drawGameBoard() {
  const cells = gameBoardElement.children;
  let cellIndex = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = cells[cellIndex];
      cell.innerHTML = "";
      cell.classList.remove(...BLOCK_COLORS, "highlight-cell", "invalid-placement");

      if (gameBoard[r][c] !== 0) {
        const blockDiv = document.createElement("div");
        blockDiv.classList.add("placed-block", BLOCK_COLORS[gameBoard[r][c] - 1]);
        cell.appendChild(blockDiv);
      }
      cellIndex++;
    }
  }
}

// --- Manajemen Blok ---
function generateNewBlocks() {
  nextBlocks = [];
  for (let i = 0; i < 3; i++) {
    const randomBlockName =
      BLOCK_NAMES[Math.floor(Math.random() * BLOCK_NAMES.length)];
    const randomColorIndex = Math.floor(Math.random() * BLOCK_COLORS.length);
    nextBlocks.push({
      shape: BLOCK_SHAPES[randomBlockName],
      color: BLOCK_COLORS[randomColorIndex],
      name: randomBlockName,
    });
  }
}

function renderNextBlocks() {
  nextBlocksContainer.innerHTML = "";
  nextBlocks.forEach((blockData, index) => {
    const slot = document.createElement("div");
    slot.classList.add("next-block-slot");
    slot.dataset.blockIndex = index;

    if (blockData === null) {
      slot.classList.add("empty");
    } else {
      const blockPreview = document.createElement("div");
      blockPreview.classList.add("draggable-block-preview");

      const boundingBox = getBlockBoundingBox(blockData.shape);

      blockPreview.style.gridTemplateColumns = `repeat(${boundingBox.width}, ${PREVIEW_CELL_SIZE_PX}px)`;
      blockPreview.style.gridTemplateRows = `repeat(${boundingBox.height}, ${PREVIEW_CELL_SIZE_PX}px)`;

      for (let r = 0; r < blockData.shape.length; r++) {
        for (let c = 0; c < blockData.shape[r].length; c++) {
          if (blockData.shape[r][c] === 1) {
            const cell = document.createElement("div");
            cell.classList.add("block-cell-preview", blockData.color);
            cell.style.gridRowStart = r - boundingBox.minRow + 1;
            cell.style.gridColumnStart = c - boundingBox.minCol + 1;
            blockPreview.appendChild(cell);
          }
        }
      }
      slot.appendChild(blockPreview);
    }
    nextBlocksContainer.appendChild(slot);
  });
}

function isValidPlacement(shape, startRow, startCol) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        const boardRow = startRow + r;
        const boardCol = startCol + c;
        if (
          boardRow < 0 ||
          boardRow >= BOARD_ROWS ||
          boardCol < 0 ||
          boardCol >= BOARD_COLS ||
          gameBoard[boardRow][boardCol] !== 0
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function placeBlock(shape, colorClass, startRow, startCol) {
  const colorValue = BLOCK_COLORS.indexOf(colorClass) + 1;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        gameBoard[startRow + r][startCol + c] = colorValue;
      }
    }
  }
  drawGameBoard();
  const cellsInBlock = shape.reduce(
    (count, row) => count + row.filter((cell) => cell === 1).length,
    0
  );
  updateScore(cellsInBlock * 5);
}

function updateGhostPlacement(shape, targetRow, targetCol) {
  removeGhostPlacement();

  const cells = gameBoardElement.children;
  currentBlockGhost = [];
  let validPlacement = true;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        const boardRow = targetRow + r;
        const boardCol = targetCol + c;

        if (
          boardRow < 0 ||
          boardRow >= BOARD_ROWS ||
          boardCol < 0 ||
          boardCol >= BOARD_COLS ||
          gameBoard[boardRow][boardCol] !== 0
        ) {
          validPlacement = false;
        }

        const cellIndex = boardRow * BOARD_COLS + boardCol;
        if (cells[cellIndex]) {
          currentBlockGhost.push(cells[cellIndex]);
        }
      }
    }
  }

  currentBlockGhost.forEach((cell) => {
    cell.classList.add(validPlacement ? "highlight-cell" : "invalid-placement");
  });
}

function removeGhostPlacement() {
  if (currentBlockGhost) {
    currentBlockGhost.forEach((cell) => {
      cell.classList.remove("highlight-cell", "invalid-placement");
    });
    currentBlockGhost = null;
  }
}

// =========================================================
// DRAG AND DROP
// Helper: hitung offset sel dari posisi klik di preview
// =========================================================

/**
 * FIX UTAMA: dragOffsetX/Y disimpan dalam satuan piksel BOARD (CELL_SIZE_PX),
 * bukan piksel preview (PREVIEW_CELL_SIZE_PX).
 * Ini memastikan pembagian / CELL_SIZE_PX di ghost & drop menghasilkan
 * indeks sel yang tepat.
 */
function calcDragOffset(clientX, clientY, slot) {
  const blockPreviewInSlot = slot.querySelector(".draggable-block-preview");
  if (!blockPreviewInSlot) return;

  const slotRect = blockPreviewInSlot.getBoundingClientRect();

  // Offset dalam piksel preview (0 … width/height preview)
  const previewClickX = Math.max(0, clientX - slotRect.left);
  const previewClickY = Math.max(0, clientY - slotRect.top);

  // Konversi ke piksel board agar pembagian / CELL_SIZE_PX benar
  dragOffsetX = (previewClickX / PREVIEW_CELL_SIZE_PX) * CELL_SIZE_PX;
  dragOffsetY = (previewClickY / PREVIEW_CELL_SIZE_PX) * CELL_SIZE_PX;
}

function buildDraggingDOM(blockData, clientX, clientY) {
  const dom = document.createElement("div");
  dom.classList.add("draggable-block-preview", "dragging");

  const boundingBox = getBlockBoundingBox(blockData.shape);

  dom.style.gridTemplateColumns = `repeat(${boundingBox.width}, ${CELL_SIZE_PX}px)`;
  dom.style.gridTemplateRows = `repeat(${boundingBox.height}, ${CELL_SIZE_PX}px)`;

  for (let r = 0; r < blockData.shape.length; r++) {
    for (let c = 0; c < blockData.shape[r].length; c++) {
      if (blockData.shape[r][c] === 1) {
        const cell = document.createElement("div");
        cell.classList.add("block-cell-preview", blockData.color);
        cell.style.gridRowStart = r - boundingBox.minRow + 1;
        cell.style.gridColumnStart = c - boundingBox.minCol + 1;
        dom.appendChild(cell);
      }
    }
  }

  dom.style.position = "fixed";
  dom.style.zIndex = "1000";
  dom.style.left = `${clientX - dragOffsetX}px`;
  dom.style.top = `${clientY - dragOffsetY}px`;

  return dom;
}

// ---- mousedown ----
gameBoardElement.addEventListener("mousedown", (e) => {
  if (!gameActive || isPaused || e.target.closest(".placed-block")) return;
});

nextBlocksContainer.addEventListener("mousedown", (e) => {
  if (!gameActive || isPaused) return;

  const slot = e.target.closest(".next-block-slot");
  if (!slot || slot.classList.contains("empty")) return;

  const index = parseInt(slot.dataset.blockIndex);
  if (nextBlocks[index] === null) return;

  currentDraggingBlockData = nextBlocks[index];
  currentDraggingBlockIndex = index;
  originalDraggedSlotDOM = slot;

  // FIX: hitung offset dengan skala yang benar
  calcDragOffset(e.clientX, e.clientY, slot);

  isDragging = true;
  originalDraggedSlotDOM.style.visibility = "hidden";

  currentDraggingBlockDOM = buildDraggingDOM(
    currentDraggingBlockData,
    e.clientX,
    e.clientY
  );
  document.body.appendChild(currentDraggingBlockDOM);
});

// ---- touchstart ----
gameBoardElement.addEventListener(
  "touchstart",
  (e) => {
    if (!gameActive || isPaused || e.target.closest(".placed-block")) return;
  },
  { passive: true }
);

nextBlocksContainer.addEventListener(
  "touchstart",
  (e) => {
    if (!gameActive || isPaused) return;

    const slot = e.target.closest(".next-block-slot");
    if (!slot || slot.classList.contains("empty")) return;

    const index = parseInt(slot.dataset.blockIndex);
    if (nextBlocks[index] === null) return;

    currentDraggingBlockData = nextBlocks[index];
    currentDraggingBlockIndex = index;
    originalDraggedSlotDOM = slot;

    const touch = e.touches[0];

    // FIX: hitung offset dengan skala yang benar
    calcDragOffset(touch.clientX, touch.clientY, slot);

    isDragging = true;
    originalDraggedSlotDOM.style.visibility = "hidden";

    currentDraggingBlockDOM = buildDraggingDOM(
      currentDraggingBlockData,
      touch.clientX,
      touch.clientY
    );
    document.body.appendChild(currentDraggingBlockDOM);
  },
  { passive: false }
);

// ---- mousemove ----
document.addEventListener("mousemove", (e) => {
  if (!isDragging || !gameActive || isPaused) return;

  currentDraggingBlockDOM.style.left = `${e.clientX - dragOffsetX}px`;
  currentDraggingBlockDOM.style.top = `${e.clientY - dragOffsetY}px`;

  const targetCell = document.elementFromPoint(e.clientX, e.clientY);
  if (targetCell && targetCell.closest("#game-board")) {
    const gridCell = targetCell.closest(".grid-cell");
    if (gridCell) {
      const row = parseInt(gridCell.dataset.row);
      const col = parseInt(gridCell.dataset.col);

      const boundingBox = getBlockBoundingBox(currentDraggingBlockData.shape);
      const offsetCellX = Math.floor(dragOffsetX / CELL_SIZE_PX);
      const offsetCellY = Math.floor(dragOffsetY / CELL_SIZE_PX);

      const startRow = row - offsetCellY + boundingBox.minRow;
      const startCol = col - offsetCellX + boundingBox.minCol;

      updateGhostPlacement(currentDraggingBlockData.shape, startRow, startCol);
    } else {
      removeGhostPlacement();
    }
  } else {
    removeGhostPlacement();
  }
});

// ---- touchmove ----
document.addEventListener(
  "touchmove",
  (e) => {
    if (!isDragging || !gameActive || isPaused || !e.touches[0]) return;
    e.preventDefault();

    const touch = e.touches[0];
    currentDraggingBlockDOM.style.left = `${touch.clientX - dragOffsetX}px`;
    currentDraggingBlockDOM.style.top = `${touch.clientY - dragOffsetY}px`;

    const targetCell = document.elementFromPoint(touch.clientX, touch.clientY);
    if (targetCell && targetCell.closest("#game-board")) {
      const gridCell = targetCell.closest(".grid-cell");
      if (gridCell) {
        const row = parseInt(gridCell.dataset.row);
        const col = parseInt(gridCell.dataset.col);

        const boundingBox = getBlockBoundingBox(currentDraggingBlockData.shape);
        const offsetCellX = Math.floor(dragOffsetX / CELL_SIZE_PX);
        const offsetCellY = Math.floor(dragOffsetY / CELL_SIZE_PX);

        const startRow = row - offsetCellY + boundingBox.minRow;
        const startCol = col - offsetCellX + boundingBox.minCol;

        updateGhostPlacement(currentDraggingBlockData.shape, startRow, startCol);
      } else {
        removeGhostPlacement();
      }
    } else {
      removeGhostPlacement();
    }
  },
  { passive: false }
);

// ---- mouseup / touchend ----
document.addEventListener("mouseup", (e) => {
  if (isDragging && gameActive && !isPaused) {
    handleBlockDrop(e.clientX, e.clientY);
  }
});

document.addEventListener("touchend", (e) => {
  if (isDragging && gameActive && !isPaused && e.changedTouches[0]) {
    handleBlockDrop(
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY
    );
  }
});

function handleBlockDrop(clientX, clientY) {
  const targetCell = document.elementFromPoint(clientX, clientY);
  let placementSuccessful = false;

  if (targetCell && targetCell.closest("#game-board")) {
    const gridCell = targetCell.closest(".grid-cell");
    if (gridCell) {
      const row = parseInt(gridCell.dataset.row);
      const col = parseInt(gridCell.dataset.col);

      const boundingBox = getBlockBoundingBox(currentDraggingBlockData.shape);
      const offsetCellX = Math.floor(dragOffsetX / CELL_SIZE_PX);
      const offsetCellY = Math.floor(dragOffsetY / CELL_SIZE_PX);

      const startRow = row - offsetCellY + boundingBox.minRow;
      const startCol = col - offsetCellX + boundingBox.minCol;

      if (isValidPlacement(currentDraggingBlockData.shape, startRow, startCol)) {
        placeBlock(
          currentDraggingBlockData.shape,
          currentDraggingBlockData.color,
          startRow,
          startCol
        );
        nextBlocks.splice(currentDraggingBlockIndex, 1, null);
        placementSuccessful = true;
        playSoundSafely(placeBlockSound);
        clearLines();
      }
    }
  }

  if (currentDraggingBlockDOM) currentDraggingBlockDOM.remove();
  removeGhostPlacement();

  if (originalDraggedSlotDOM && !placementSuccessful) {
    originalDraggedSlotDOM.style.visibility = "visible";
  }

  isDragging = false;
  currentDraggingBlockData = null;
  currentDraggingBlockDOM = null;
  currentDraggingBlockIndex = -1;
  originalDraggedSlotDOM = null;

  renderNextBlocks();
  checkForNewBlocks();
}

// --- Skor ---
function updateScoreDisplay() {
  currentScoreDisplay.textContent = currentScore;
}

function updateBestScoreDisplay() {
  bestScoreDisplay.textContent = bestScore;
}

function updateScore(points) {
  currentScore += points;
  updateScoreDisplay();
  if (currentScore > bestScore) {
    bestScore = currentScore;
    localStorage.setItem("blockBlastBestScore", bestScore);
    updateBestScoreDisplay();
  }
}

function checkForNewBlocks() {
  const allSlotsEmpty = nextBlocks.every((block) => block === null);
  if (allSlotsEmpty) {
    generateNewBlocks();
    renderNextBlocks();
  }
  checkGameOver();
}

function clearLines() {
  let linesCleared = 0;
  let cellsCleared = 0;
  const rowsToClear = new Set();
  const colsToClear = new Set();

  for (let r = 0; r < BOARD_ROWS; r++) {
    if (gameBoard[r].every((cell) => cell !== 0)) rowsToClear.add(r);
  }

  for (let c = 0; c < BOARD_COLS; c++) {
    let isColFull = true;
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (gameBoard[r][c] === 0) { isColFull = false; break; }
    }
    if (isColFull) colsToClear.add(c);
  }

  rowsToClear.forEach((r) => {
    for (let c = 0; c < BOARD_COLS; c++) {
      gameBoard[r][c] = 0;
      cellsCleared++;
    }
    linesCleared++;
  });

  colsToClear.forEach((c) => {
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (gameBoard[r][c] !== 0) {
        gameBoard[r][c] = 0;
        cellsCleared++;
      }
    }
    linesCleared++;
  });

  if (linesCleared > 0) {
    const scoreBonus = linesCleared > 1 ? (linesCleared - 1) * 50 : 0;
    updateScore(cellsCleared * 10 + scoreBonus);
    drawGameBoard();
    playSoundSafely(blockClearSound);
  }
}

function checkGameOver() {
  if (!gameActive) return;

  const availableBlocks = nextBlocks.filter((block) => block !== null);
  if (availableBlocks.length === 0) return;

  let canPlaceAnyBlock = false;
  outer: for (const blockData of availableBlocks) {
    if (!blockData?.shape) continue;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (isValidPlacement(blockData.shape, r, c)) {
          canPlaceAnyBlock = true;
          break outer;
        }
      }
    }
  }

  if (!canPlaceAnyBlock) triggerGameOver();
}

function triggerGameOver() {
  if (!gameActive) return;
  gameActive = false;
  isPaused = true;

  localStorage.setItem("lastGameScore", currentScore);

  if (pauseButton) pauseButton.classList.add("hidden");
  if (resumeButton) resumeButton.classList.add("hidden");
  if (restartButton) restartButton.classList.add("hidden");

  window.location.href = "../game-over/index.html";
}

// --- Pause/Resume ---
function togglePause() {
  if (!gameActive) return;

  isPaused = !isPaused;
  if (isPaused) {
    if (pauseButton) pauseButton.classList.add("hidden");
    if (resumeButton) resumeButton.classList.remove("hidden");
    if (gameMusic) gameMusic.pause();
  } else {
    if (pauseButton) pauseButton.classList.remove("hidden");
    if (resumeButton) resumeButton.classList.add("hidden");
    if (gameMusic) gameMusic.play().catch(() => {});
  }
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  initGame();

  pauseButton?.addEventListener("click", togglePause);
  resumeButton?.addEventListener("click", togglePause);

  restartButton?.addEventListener("click", () => {
    window.location.href = "../menu/index.html";
  });

  settingsButton?.addEventListener("click", () => {
    if (settingsModal) {
      settingsModal.classList.remove("hidden");
      if (gameActive && !isPaused) togglePause();
    }
  });

  closeModalButtonTop?.addEventListener("click", () => {
    if (settingsModal) {
      settingsModal.classList.add("hidden");
      if (gameActive) togglePause();
    }
  });

  closeModalButtonBottom?.addEventListener("click", () => {
    if (settingsModal) {
      settingsModal.classList.add("hidden");
      if (gameActive) togglePause();
    }
  });

  settingsModal?.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add("hidden");
      if (gameActive) togglePause();
    }
  });

  if (musicVolumeSlider && gameMusic) {
    musicVolumeSlider.addEventListener("input", (e) => {
      gameMusic.volume = e.target.value;
      saveVolumeSettings();
    });
  }

  if (sfxVolumeSlider && blockClearSound && placeBlockSound) {
    sfxVolumeSlider.addEventListener("input", (e) => {
      blockClearSound.volume = e.target.value;
      placeBlockSound.volume = e.target.value;
      saveVolumeSettings();
    });
  }
});
