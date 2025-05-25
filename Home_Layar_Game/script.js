// script.js

// --- Konfigurasi dan Variabel Global Game ---
const BOARD_ROWS = 15; // Jumlah baris papan game
const BOARD_COLS = 15; // Jumlah kolom papan game
let CELL_SIZE_PX = 30; // Ukuran sel papan default dalam piksel (akan disesuaikan responsif)
const PREVIEW_CELL_SIZE_PX = 20; // Ukuran sel untuk preview blok di panel "next blocks"

let gameBoard = []; // Representasi papan game (15x15)
let currentScore = 0;
let bestScore = localStorage.getItem("blockBlastBestScore")
  ? parseInt(localStorage.getItem("blockBlastBestScore"))
  : 0;
let nextBlocks = []; // Array untuk menyimpan 3 blok selanjutnya
let isPaused = false;
let gameActive = true; // Status aktif game

// Variabel untuk Drag-and-Drop
let isDragging = false; // Status apakah sedang ada blok yang diseret
let currentDraggingBlockData = null; // Menyimpan data blok yang sedang diseret (shape, color)
let currentDraggingBlockIndex = -1; // Indeks blok yang sedang diseret di array nextBlocks
let currentDraggingBlockDOM = null; // Elemen DOM dari blok yang sedang diseret (yang floating)
let originalDraggedSlotDOM = null; // Elemen DOM slot asli tempat blok berasal
let dragOffsetX = 0; // Offset X mouse dari sudut kiri atas blok preview di slot
let dragOffsetY = 0; // Offset Y mouse dari sudut kiri atas blok preview di slot
let currentBlockGhost = null; // Menyimpan sel-sel yang di-highlight sebagai 'ghost' blok

// --- Referensi Elemen DOM ---
const gameBoardElement = document.getElementById("game-board");
const nextBlocksContainer = document.getElementById("next-blocks-container");
const currentScoreDisplay = document.getElementById("current-score");
const bestScoreDisplay = document.getElementById("best-score-display-game");

// Tombol Kontrol Game
const pauseButton = document.getElementById("pause-button");
const resumeButton = document.getElementById("resume-button");
const restartButton = document.getElementById("restart-button");
const settingsButton = document.getElementById("settings-button");

// Modal Pengaturan
const settingsModal = document.getElementById("settings-modal"); // Asumsi ini adalah div overlay
const closeModalButtonBottom = document.getElementById("close-modal"); // Tombol 'Tutup' di bawah
const closeModalButtonTop = document.getElementById("close-modal-top"); // Tombol 'X' di pojok kanan atas

// Elemen Audio dan Slider Volume
const gameMusic = document.getElementById("game-music");
const blockClearSound = document.getElementById("block-clear-sound");
const placeBlockSound = document.getElementById("place-block-sound");
const musicVolumeSlider = document.getElementById("music-volume");
const sfxVolumeSlider = document.getElementById("sfx-volume");

// --- Definisi Bentuk dan Warna Blok ---
const BLOCK_SHAPES = {
  square2x2: [
    [1, 1],
    [1, 1],
  ],
  line1x1: [[1]],
  line1x2: [[1], [1]],
  line2x1: [[1, 1]],
  line1x3: [[1], [1], [1]],
  line3x1: [[1, 1, 1]],
  line1x4: [[1], [1], [1], [1]],
  line4x1: [[1, 1, 1, 1]],
  L_shape_small_corner: [
    [1, 0],
    [1, 1],
  ],
  L_shape_small_L: [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  L_shape_small_L_rotated: [
    [1, 1, 1],
    [1, 0, 0],
  ],
  T_shape: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  Z_shape: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  S_shape: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  C_shape: [
    [1, 1, 1],
    [1, 0, 1],
  ],
  Plus_shape: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  Small_Cross: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ], // Duplikat dari Plus_shape, mungkin perlu direvisi
  diagonal_3: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  square3x3: [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ],
  line1x5: [[1], [1], [1], [1], [1]],
  line5x1: [[1, 1, 1, 1, 1]],
  L_shape_large_L: [
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
  ],
  L_shape_large_L_rotated: [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ],
  H_shape: [
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
  ],
  cross_large: [
    [0, 1, 0, 0],
    [1, 1, 1, 1],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
  ],
  big_line_block: [[1, 1, 1, 1, 1]], // Duplikat dari line5x1
  big_T_shape: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
  ],
  frame_3x3: [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  plus_4x4: [
    [0, 0, 1, 0],
    [0, 1, 1, 1],
    [1, 1, 1, 0],
    [0, 1, 0, 0],
  ], // Bentuk kompleks
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

// --- Fungsi Pembantu untuk Bounding Box ---
/**
 * Menghitung bounding box (kotak terkecil yang mengelilingi) sebuah bentuk blok.
 * Ini membantu dalam merender preview blok agar lebih rapat tanpa sel kosong berlebih.
 * @param {Array<Array<number>>} shape - Bentuk blok (matriks 0s dan 1s).
 * @returns {{minRow: number, minCol: number, maxRow: number, maxCol: number, width: number, height: number}}
 */
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
    // Kasus blok kosong, meskipun tidak diharapkan
    return { minRow: 0, minCol: 0, maxRow: 0, maxCol: 0, width: 0, height: 0 };
  }

  return {
    minRow: minRow,
    minCol: minCol,
    maxRow: maxRow,
    maxCol: maxCol,
    width: maxCol - minCol + 1,
    height: maxRow - minRow + 1, // Corrected calculation for height
  };
}

// --- Fungsi Inisialisasi Game ---
function initGame() {
  currentScore = 0;
  gameBoard = [];
  nextBlocks = [];
  gameActive = true;
  isPaused = false;
  updateScoreDisplay();
  updateBestScoreDisplay();

  // 1. Atur variabel CSS untuk ukuran papan dan sel (PENTING!)
  document.documentElement.style.setProperty("--BOARD_ROWS", BOARD_ROWS);
  document.documentElement.style.setProperty("--BOARD_COLS", BOARD_COLS);

  // Sesuaikan ukuran sel berdasarkan lebar layar agar papan tidak terlalu besar/kecil
  adjustCellSize(); // Panggil fungsi penyesuaian ukuran sel

  document.documentElement.style.setProperty(
    "--preview-cell-size",
    `${PREVIEW_CELL_SIZE_PX}px`
  );

  createGameBoard();
  generateNewBlocks();
  renderNextBlocks();

  // Pastikan tombol pause terlihat dan resume tersembunyi saat inisialisasi
  if (pauseButton) pauseButton.classList.remove("hidden");
  if (resumeButton) resumeButton.classList.add("hidden");

  // Mainkan musik saat game dimulai (jika ada dan diizinkan browser)
  if (gameMusic) {
    gameMusic.play().catch((e) => console.log("Autoplay music failed:", e));
  }
  // Set volume dari slider
  loadVolumeSettings();

  // Sembunyikan modal pengaturan jika terlihat
  if (settingsModal) settingsModal.classList.add("hidden");

  // Setelah inisialisasi dan blok baru dihasilkan, cek apakah game langsung over
  checkGameOver();
}

// Fungsi untuk menyesuaikan ukuran sel berdasarkan lebar layar
function adjustCellSize() {
  const gameBoardWrapper = document.getElementById("game-board-wrapper");
  let availableWidth;

  if (gameBoardWrapper) {
    const wrapperPadding =
      parseFloat(getComputedStyle(gameBoardWrapper).paddingLeft) * 2;
    const wrapperBorder =
      parseFloat(getComputedStyle(gameBoardWrapper).borderLeftWidth) * 2;

    if (window.innerWidth <= 767) {
      const maxBoardWrapperWidth = Math.min(window.innerWidth - 40, 400);
      availableWidth = maxBoardWrapperWidth - wrapperPadding - wrapperBorder;
      CELL_SIZE_PX = Math.floor(availableWidth / BOARD_COLS);
      CELL_SIZE_PX = Math.max(CELL_SIZE_PX, 20);
    } else if (window.innerWidth <= 1199) {
      CELL_SIZE_PX = 30;
    } else {
      CELL_SIZE_PX = 30;
    }
  } else {
    if (window.innerWidth <= 767) {
      CELL_SIZE_PX = Math.floor((window.innerWidth * 0.8) / BOARD_COLS);
      CELL_SIZE_PX = Math.max(CELL_SIZE_PX, 20);
    } else {
      CELL_SIZE_PX = 30;
    }
  }

  document.documentElement.style.setProperty(
    "--cell-size",
    `${CELL_SIZE_PX}px`
  );
  if (gameBoardElement) {
    gameBoardElement.style.width = `calc(var(--cell-size) * var(--BOARD_COLS))`;
    gameBoardElement.style.height = `calc(var(--cell-size) * var(--BOARD_ROWS))`;
    gameBoardElement.style.gridTemplateColumns = `repeat(${BOARD_COLS}, var(--cell-size))`;
    gameBoardElement.style.gridTemplateRows = `repeat(${BOARD_ROWS}, var(--cell-size))`;
  }
}

window.addEventListener("resize", adjustCellSize);

/**
 * Memuat pengaturan volume dari localStorage dan menerapkannya.
 */
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

/**
 * Menyimpan pengaturan volume ke localStorage.
 */
function saveVolumeSettings() {
  if (musicVolumeSlider) {
    localStorage.setItem("blockBlastMusicVolume", musicVolumeSlider.value);
  }
  if (sfxVolumeSlider) {
    localStorage.setItem("blockBlastSfxVolume", sfxVolumeSlider.value);
  }
}

// --- Papan Game: Pembuatan dan Penggambaran ---
/**
 * Membuat struktur HTML untuk papan game dan menginisialisasi array gameBoard.
 */
function createGameBoard() {
  gameBoardElement.innerHTML = ""; // Bersihkan papan sebelumnya
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
      gameBoard[r][c] = 0; // 0 menandakan sel kosong
    }
  }
}

/**
 * Menggambar ulang isi papan game berdasarkan array `gameBoard`.
 */
function drawGameBoard() {
  const cells = gameBoardElement.children;
  let cellIndex = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = cells[cellIndex];
      cell.innerHTML = ""; // Bersihkan konten sel
      cell.classList.remove(
        ...BLOCK_COLORS,
        "highlight-cell",
        "invalid-placement"
      );

      if (gameBoard[r][c] !== 0) {
        const blockDiv = document.createElement("div");
        blockDiv.classList.add(
          "placed-block",
          BLOCK_COLORS[gameBoard[r][c] - 1] // Warna disimpan sebagai 1-based index
        );
        cell.appendChild(blockDiv);
      }
      cellIndex++;
    }
  }
}

// --- Manajemen Blok (Generasi, Rendering, Penempatan) ---
/**
 * Menghasilkan 3 blok acak baru dan menyimpannya di `nextBlocks`.
 */
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

/**
 * Merender blok-blok yang ada di `nextBlocks` ke dalam `nextBlocksContainer`.
 */
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

      // Atur ukuran grid preview berdasarkan bounding box
      blockPreview.style.gridTemplateColumns = `repeat(${boundingBox.width}, var(--preview-cell-size))`;
      blockPreview.style.gridTemplateRows = `repeat(${boundingBox.height}, var(--preview-cell-size))`;

      for (let r = 0; r < blockData.shape.length; r++) {
        for (let c = 0; c < blockData.shape[r].length; c++) {
          if (blockData.shape[r][c] === 1) {
            // Hanya render sel yang berisi 1
            const cell = document.createElement("div");
            cell.classList.add("block-cell-preview", blockData.color);

            // Atur posisi sel dalam grid baru yang dipangkas
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

/**
 * Memvalidasi apakah sebuah blok dapat ditempatkan pada posisi tertentu di papan.
 * @param {Array<Array<number>>} shape - Bentuk blok (array 2D).
 * @param {number} startRow - Baris awal di papan.
 * @param {number} startCol - Kolom awal di papan.
 * @returns {boolean} True jika penempatan valid, false jika tidak.
 */
function isValidPlacement(shape, startRow, startCol) {
  const shapeRows = shape.length;
  const shapeCols = shape[0].length;

  for (let r = 0; r < shapeRows; r++) {
    for (let c = 0; c < shapeCols; c++) {
      if (shape[r][c] === 1) {
        // Jika bagian dari blok
        const boardRow = startRow + r;
        const boardCol = startCol + c;

        // Cek batas papan dan tumpang tindih dengan blok lain
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

/**
 * Menempatkan blok ke papan game dan memperbarui skor.
 * @param {Array<Array<number>>} shape - Bentuk blok.
 * @param {string} colorClass - Kelas warna CSS untuk blok.
 * @param {number} startRow - Baris awal penempatan.
 * @param {number} startCol - Kolom awal penempatan.
 */
function placeBlock(shape, colorClass, startRow, startCol) {
  // Warna disimpan sebagai 1-based index di gameBoard, jadi cari indeksnya + 1
  const colorValue = BLOCK_COLORS.indexOf(colorClass) + 1;
  const shapeRows = shape.length;
  const shapeCols = shape[0].length;

  for (let r = 0; r < shapeRows; r++) {
    for (let c = 0; c < shapeCols; c++) {
      if (shape[r][c] === 1) {
        gameBoard[startRow + r][startCol + c] = colorValue;
      }
    }
  }
  drawGameBoard();
  // Hitung poin berdasarkan jumlah sel dalam blok
  const cellsInBlock = shape.reduce(
    (count, row) => count + row.filter((cell) => cell === 1).length,
    0
  );
  updateScore(cellsInBlock * 5);
}

/**
 * Memperbarui tampilan 'ghost' (highlight) blok di papan.
 * @param {Array<Array<number>>} shape - Bentuk blok.
 * @param {number} targetRow - Baris tujuan kursor/blok (sudut kiri atas bounding box).
 * @param {number} targetCol - Kolom tujuan kursor/blok (sudut kiri atas bounding box).
 */
function updateGhostPlacement(shape, targetRow, targetCol) {
  removeGhostPlacement(); // Hapus ghost sebelumnya

  const cells = gameBoardElement.children;
  currentBlockGhost = []; // Reset array ghost cells

  let validPlacement = true;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        // Hanya proses sel yang merupakan bagian dari blok
        const boardRow = targetRow + r;
        const boardCol = targetCol + c;

        // Cek batas papan atau tumpang tindih
        if (
          boardRow < 0 ||
          boardRow >= BOARD_ROWS ||
          boardCol < 0 ||
          boardCol >= BOARD_COLS ||
          gameBoard[boardRow][boardCol] !== 0
        ) {
          validPlacement = false;
          // Tidak perlu break, kita ingin menandai semua sel yang invalid
        }
        const cellIndex = boardRow * BOARD_COLS + boardCol;
        if (cells[cellIndex]) {
          // Pastikan sel DOM ada
          currentBlockGhost.push(cells[cellIndex]);
        }
      }
    }
  }

  // Terapkan kelas highlight atau invalid ke semua sel ghost
  currentBlockGhost.forEach((cell) => {
    cell.classList.add(validPlacement ? "highlight-cell" : "invalid-placement");
  });
}

/**
 * Menghapus tampilan 'ghost' (highlight) blok dari papan.
 */
function removeGhostPlacement() {
  if (currentBlockGhost) {
    currentBlockGhost.forEach((cell) => {
      cell.classList.remove("highlight-cell", "invalid-placement");
    });
    currentBlockGhost = null;
  }
}

// --- Logika Drag-and-Drop ---
// Mencegah drag dari papan game jika sudah ada blok yang ditempatkan
gameBoardElement.addEventListener("mousedown", (e) => {
  if (!gameActive || isPaused || e.target.closest(".placed-block")) return;
});
gameBoardElement.addEventListener(
  "touchstart",
  (e) => {
    if (!gameActive || isPaused || e.target.closest(".placed-block")) return;
  },
  { passive: true }
);

nextBlocksContainer.addEventListener("mousedown", (e) => {
  if (!gameActive || isPaused) return;

  const slot = e.target.closest(".next-block-slot");
  if (slot && !slot.classList.contains("empty")) {
    const index = parseInt(slot.dataset.blockIndex);

    if (nextBlocks[index] === null) return;

    currentDraggingBlockData = nextBlocks[index];
    currentDraggingBlockIndex = index;
    originalDraggedSlotDOM = slot;

    if (currentDraggingBlockData) {
      isDragging = true;
      originalDraggedSlotDOM.style.visibility = "hidden";

      currentDraggingBlockDOM = document.createElement("div");
      currentDraggingBlockDOM.classList.add(
        "draggable-block-preview",
        "dragging"
      );

      const boundingBox = getBlockBoundingBox(currentDraggingBlockData.shape);

      currentDraggingBlockDOM.style.gridTemplateColumns = `repeat(${boundingBox.width}, ${CELL_SIZE_PX}px)`;
      currentDraggingBlockDOM.style.gridTemplateRows = `repeat(${boundingBox.height}, ${CELL_SIZE_PX}px)`;

      for (let r = 0; r < currentDraggingBlockData.shape.length; r++) {
        for (let c = 0; c < currentDraggingBlockData.shape[r].length; c++) {
          if (currentDraggingBlockData.shape[r][c] === 1) {
            const cell = document.createElement("div");
            cell.classList.add(
              "block-cell-preview",
              currentDraggingBlockData.color
            );

            cell.style.gridRowStart = r - boundingBox.minRow + 1;
            cell.style.gridColumnStart = c - boundingBox.minCol + 1;

            currentDraggingBlockDOM.appendChild(cell);
          }
        }
      }

      const blockPreviewInSlot = slot.querySelector(".draggable-block-preview");
      const slotRect = blockPreviewInSlot.getBoundingClientRect();
      dragOffsetX = e.clientX - slotRect.left;
      dragOffsetY = e.clientY - slotRect.top;

      currentDraggingBlockDOM.style.position = "fixed";
      currentDraggingBlockDOM.style.zIndex = "1000";
      currentDraggingBlockDOM.style.left = `${e.clientX - dragOffsetX}px`;
      currentDraggingBlockDOM.style.top = `${e.clientY - dragOffsetY}px`;

      document.body.appendChild(currentDraggingBlockDOM);
    }
  }
});

nextBlocksContainer.addEventListener(
  "touchstart",
  (e) => {
    if (!gameActive || isPaused) return;

    const slot = e.target.closest(".next-block-slot");
    if (slot && !slot.classList.contains("empty")) {
      const index = parseInt(slot.dataset.blockIndex);

      if (nextBlocks[index] === null) return;

      currentDraggingBlockData = nextBlocks[index];
      currentDraggingBlockIndex = index;
      originalDraggedSlotDOM = slot;

      if (currentDraggingBlockData) {
        isDragging = true;
        originalDraggedSlotDOM.style.visibility = "hidden";

        currentDraggingBlockDOM = document.createElement("div");
        currentDraggingBlockDOM.classList.add(
          "draggable-block-preview",
          "dragging"
        );

        const boundingBox = getBlockBoundingBox(currentDraggingBlockData.shape);

        currentDraggingBlockDOM.style.gridTemplateColumns = `repeat(${boundingBox.width}, ${CELL_SIZE_PX}px)`;
        currentDraggingBlockDOM.style.gridTemplateRows = `repeat(${boundingBox.height}, ${CELL_SIZE_PX}px)`;

        for (let r = 0; r < currentDraggingBlockData.shape.length; r++) {
          for (let c = 0; c < currentDraggingBlockData.shape[r].length; c++) {
            if (currentDraggingBlockData.shape[r][c] === 1) {
              const cell = document.createElement("div");
              cell.classList.add(
                "block-cell-preview",
                currentDraggingBlockData.color
              );
              cell.style.gridRowStart = r - boundingBox.minRow + 1;
              cell.style.gridColumnStart = c - boundingBox.minCol + 1;
              currentDraggingBlockDOM.appendChild(cell);
            }
          }
        }

        const blockPreviewInSlot = slot.querySelector(
          ".draggable-block-preview"
        );
        const slotRect = blockPreviewInSlot.getBoundingClientRect();
        dragOffsetX = e.touches[0].clientX - slotRect.left;
        dragOffsetY = e.touches[0].clientY - slotRect.top;

        currentDraggingBlockDOM.style.position = "fixed";
        currentDraggingBlockDOM.style.zIndex = "1000";
        currentDraggingBlockDOM.style.left = `${
          e.touches[0].clientX - dragOffsetX
        }px`;
        currentDraggingBlockDOM.style.top = `${
          e.touches[0].clientY - dragOffsetY
        }px`;

        document.body.appendChild(currentDraggingBlockDOM);
      }
    }
  },
  { passive: false }
);

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

document.addEventListener(
  "touchmove",
  (e) => {
    if (!isDragging || !gameActive || isPaused || !e.touches[0]) return;

    e.preventDefault();

    currentDraggingBlockDOM.style.left = `${
      e.touches[0].clientX - dragOffsetX
    }px`;
    currentDraggingBlockDOM.style.top = `${
      e.touches[0].clientY - dragOffsetY
    }px`;

    const targetCell = document.elementFromPoint(
      e.touches[0].clientX,
      e.touches[0].clientY
    );
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

        updateGhostPlacement(
          currentDraggingBlockData.shape,
          startRow,
          startCol
        );
      } else {
        removeGhostPlacement();
      }
    } else {
      removeGhostPlacement();
    }
  },
  { passive: false }
);

document.addEventListener("mouseup", (e) => {
  if (isDragging && gameActive && !isPaused) {
    handleBlockDrop(e.clientX, e.clientY);
  }
});

document.addEventListener("touchend", (e) => {
  if (isDragging && gameActive && !isPaused && e.changedTouches[0]) {
    handleBlockDrop(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
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

      if (
        isValidPlacement(currentDraggingBlockData.shape, startRow, startCol)
      ) {
        placeBlock(
          currentDraggingBlockData.shape,
          currentDraggingBlockData.color,
          startRow,
          startCol
        );
        nextBlocks.splice(currentDraggingBlockIndex, 1, null); // Hapus blok dari `nextBlocks`
        placementSuccessful = true;
        if (placeBlockSound) placeBlockSound.play();
        clearLines(); // Cek dan hapus baris/kolom penuh
      }
    }
  }

  if (currentDraggingBlockDOM) {
    currentDraggingBlockDOM.remove();
  }
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
  checkForNewBlocks(); // Panggil ini untuk cek dan generate blok baru, lalu akan memanggil checkGameOver()
}

// --- Skor dan Game Over ---
/**
 * Memperbarui tampilan skor saat ini.
 */
function updateScoreDisplay() {
  currentScoreDisplay.textContent = currentScore;
}

/**
 * Memperbarui tampilan skor terbaik.
 */
function updateBestScoreDisplay() {
  bestScoreDisplay.textContent = bestScore;
}

/**
 * Menambahkan poin ke skor saat ini dan memperbarui skor terbaik jika diperlukan.
 * @param {number} points - Jumlah poin yang akan ditambahkan.
 */
function updateScore(points) {
  currentScore += points;
  updateScoreDisplay();
  if (currentScore > bestScore) {
    bestScore = currentScore;
    localStorage.setItem("blockBlastBestScore", bestScore); // Simpan skor terbaik
    updateBestScoreDisplay();
  }
}

/**
 * Memeriksa apakah ada 3 slot blok kosong dan menghasilkan blok baru jika demikian.
 * Setelah menghasilkan blok baru, fungsi ini akan memanggil checkGameOver().
 */
function checkForNewBlocks() {
  const allSlotsEmpty = nextBlocks.every((block) => block === null);
  if (allSlotsEmpty) {
    generateNewBlocks();
    renderNextBlocks();
    // Setelah menghasilkan blok baru, segera cek game over
    checkGameOver();
  } else {
    // Jika tidak semua slot kosong, tapi mungkin ada blok yang tidak bisa ditempatkan
    // Kita tetap perlu cek game over
    checkGameOver();
  }
}

/**
 * Memeriksa dan menghapus baris atau kolom yang penuh.
 */
function clearLines() {
  let linesCleared = 0;
  let cellsCleared = 0;
  const rowsToClear = new Set();
  const colsToClear = new Set();

  // Cek Baris Penuh
  for (let r = 0; r < BOARD_ROWS; r++) {
    if (gameBoard[r].every((cell) => cell !== 0)) {
      rowsToClear.add(r);
    }
  }

  // Cek Kolom Penuh
  for (let c = 0; c < BOARD_COLS; c++) {
    let isColFull = true;
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (gameBoard[r][c] === 0) {
        isColFull = false;
        break;
      }
    }
    if (isColFull) {
      colsToClear.add(c);
    }
  }

  // Hapus baris yang penuh
  rowsToClear.forEach((r) => {
    for (let c = 0; c < BOARD_COLS; c++) {
      gameBoard[r][c] = 0;
      cellsCleared++;
    }
    linesCleared++;
  });

  // Hapus kolom yang penuh
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
    let scoreBonus = 0;
    if (linesCleared > 1) {
      scoreBonus = (linesCleared - 1) * 50;
    }
    updateScore(cellsCleared * 10 + scoreBonus);
    drawGameBoard();
    if (blockClearSound) blockClearSound.play();
  }
}

/**
 * Memeriksa apakah game sudah berakhir (tidak ada blok yang bisa ditempatkan).
 */
function checkGameOver() {
  // Hanya cek game over jika game masih aktif
  if (!gameActive) return;

  const availableBlocks = nextBlocks.filter((block) => block !== null);

  // Jika tidak ada blok yang tersedia di slot, berarti kita baru saja meletakkan
  // blok terakhir dan checkForNewBlocks akan menghasilkan yang baru.
  // Tidak perlu cek game over sekarang, checkForNewBlocks akan memanggil ini lagi.
  if (availableBlocks.length === 0) {
    return;
  }

  let canPlaceAnyBlock = false;
  // Iterasi melalui setiap blok yang tersedia
  for (const blockData of availableBlocks) {
    if (!blockData || !blockData.shape) continue; // Pastikan blockData dan shape-nya valid

    const shape = blockData.shape;

    // Coba setiap kemungkinan posisi di papan
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (isValidPlacement(shape, r, c)) {
          canPlaceAnyBlock = true;
          break; // Blok ini bisa ditempatkan, tidak perlu cek posisi lain
        }
      }
      if (canPlaceAnyBlock) break; // Tidak perlu cek baris lain untuk blok ini
    }
    if (canPlaceAnyBlock) break; // Tidak perlu cek blok lain
  }

  if (!canPlaceAnyBlock) {
    // Jika tidak ada satu pun blok yang bisa ditempatkan, maka Game Over
    triggerGameOver();
  }
}

/**
 * Menghentikan game dan mengarahkan ke halaman Game Over.
 */
function triggerGameOver() {
  if (!gameActive) return; // Mencegah pemanggilan berulang
  gameActive = false;
  isPaused = true;

  // Simpan skor terakhir ke Local Storage
  localStorage.setItem("lastGameScore", currentScore);

  // Sembunyikan semua tombol kontrol saat game over (optional, karena halaman akan beralih)
  if (pauseButton) pauseButton.classList.add("hidden");
  if (resumeButton) resumeButton.classList.add("hidden");
  if (restartButton) restartButton.classList.add("hidden"); // Sembunyikan tombol restart juga

  // Redirect ke halaman Game Over dengan jalur yang benar
  window.location.href = "../Home_Layar_Akhir/game_over.html";
}

// --- Kontrol Game (Pause/Resume) ---
/**
 * Mengganti status pause/resume game.
 */
function togglePause() {
  if (!gameActive) return;

  isPaused = !isPaused;
  if (isPaused) {
    if (pauseButton) pauseButton.classList.add("hidden");
    if (resumeButton) resumeButton.classList.remove("hidden");
    if (gameMusic) gameMusic.pause();
    console.log("Game paused.");
  } else {
    if (pauseButton) pauseButton.classList.remove("hidden");
    if (resumeButton) resumeButton.classList.add("hidden");
    if (gameMusic) {
      gameMusic
        .play()
        .catch((e) => console.log("Autoplay music failed after resume:", e));
    }
    console.log("Game resumed.");
  }
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  initGame();

  // Event listener untuk tombol Pause
  if (pauseButton) {
    pauseButton.addEventListener("click", togglePause);
  }

  // Event listener untuk tombol Resume
  if (resumeButton) {
    resumeButton.addEventListener("click", togglePause);
  }

  // Event listener untuk tombol Restart (Home)
  if (restartButton) {
    restartButton.addEventListener("click", () => {
      // Mengarahkan browser ke halaman utama (index.html)
      // Asumsi: file HTML ini (misal: game.html) berada di dalam folder (misal: Home_Layar_Game/)
      // dan index.html ada di satu level di atas (root repositori).
      window.location.href = "../index.html";
    });
  }

  // Event listener untuk tombol Pengaturan
  if (settingsButton) {
    settingsButton.addEventListener("click", () => {
      if (settingsModal) {
        settingsModal.classList.remove("hidden");
        if (gameActive && !isPaused) {
          togglePause();
        }
        if (pauseButton) pauseButton.classList.add("hidden");
        if (resumeButton) resumeButton.classList.remove("hidden");
      }
    });
  }

  // Event listener untuk tombol Tutup Modal Pengaturan (tombol 'X' di atas)
  if (closeModalButtonTop) {
    closeModalButtonTop.addEventListener("click", () => {
      if (settingsModal) {
        settingsModal.classList.add("hidden");
        if (gameActive) {
          togglePause();
        }
      }
    });
  }

  // Event listener untuk tombol Tutup Modal Pengaturan (tombol 'Tutup' di bawah)
  if (closeModalButtonBottom) {
    closeModalButtonBottom.addEventListener("click", () => {
      if (settingsModal) {
        settingsModal.classList.add("hidden");
        if (gameActive) {
          togglePause();
        }
      }
    });
  }

  // Event listener untuk menutup modal jika klik di luar modal-content
  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.add("hidden");
        if (gameActive) {
          togglePause();
        }
      }
    });
  }

  // Event listeners untuk volume slider
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
