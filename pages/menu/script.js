// script.js — Halaman Menu Utama

// --- Dapatkan elemen yang dibutuhkan untuk halaman awal ---
const startGameButton = document.getElementById("start-game-button");
const gameLogoCentral = document.getElementById("game-logo-central");
const bestScoreDisplay = document.getElementById("best-score-display-game");

// Elemen-elemen untuk Pengaturan Suara
const settingsIconButton = document.getElementById("settings-icon-button");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsModalButton = document.getElementById(
  "close-settings-modal"
);
const musicVolumeSlider = document.getElementById("music-volume");
const sfxVolumeSlider = document.getElementById("sfx-volume");

// Elemen Audio (musik latar tetap pakai <audio> biasa)
const backgroundMusic = document.getElementById("background-music");

// --- Web Audio API untuk suara klik (biar nggak delay) ---
// Kenapa perlu ini: <audio> biasa harus "decode" file dulu pas play() pertama
// kali dipanggil, jadi selalu ada jeda. Web Audio API decode filenya SEKALI di
// awal (jadi buffer siap pakai di memori), jadi pas diklik langsung bunyi.
let audioContext;
let clickBuffer = null;
let sfxVolume = 0.5;

function initClickSound() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  fetch("../../assets/audio/click.mp3")
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
    .then((decodedBuffer) => {
      clickBuffer = decodedBuffer;
    })
    .catch((e) => console.error("Gagal memuat suara klik:", e));
}

function playClickSound() {
  if (!audioContext || !clickBuffer) return;

  // AudioContext bisa ke-suspend sebelum ada interaksi user, resume dulu
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const source = audioContext.createBufferSource();
  source.buffer = clickBuffer;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = sfxVolume;

  source.connect(gainNode).connect(audioContext.destination);
  source.start(0); // langsung main dari detik ke-0, tanpa delay
}

// --- Fungsi Navigasi Halaman ---
function navigateTo(path) {
  window.location.href = path;
}

// --- Fungsi untuk mendapatkan Best Score dari localStorage ---
function getBestScore() {
  return parseInt(localStorage.getItem("blockBlastBestScore") || "0");
}

// --- Fungsi untuk Mengatur dan Menyimpan Volume ---
function saveVolumeSettings(type, value) {
  localStorage.setItem(
    `blockBlast${type.charAt(0).toUpperCase() + type.slice(1)}Volume`,
    value
  );
  applyVolumeSettings(type, value);
}

function loadVolumeSettings() {
  const musicVol = parseFloat(
    localStorage.getItem("blockBlastMusicVolume") || "0.5"
  );
  const sfxVol = parseFloat(
    localStorage.getItem("blockBlastSfxVolume") || "0.5"
  );

  if (musicVolumeSlider) musicVolumeSlider.value = musicVol;
  if (sfxVolumeSlider) sfxVolumeSlider.value = sfxVol;

  applyVolumeSettings("music", musicVol);
  applyVolumeSettings("sfx", sfxVol);
}

function applyVolumeSettings(type, value) {
  if (type === "music" && backgroundMusic) {
    backgroundMusic.volume = value;
  }
  if (type === "sfx") {
    sfxVolume = parseFloat(value); // dipakai di gainNode setiap playClickSound()
  }
}

// --- Fungsi untuk mencoba memutar musik latar dengan aman ---
function tryPlayBackgroundMusic() {
  if (!backgroundMusic) return;
  backgroundMusic.play().catch((e) => {
    console.warn(
      "Musik latar belum bisa diputar otomatis, menunggu interaksi user:",
      e
    );
  });
}

// --- Inisialisasi Halaman Awal Setelah DOM Dimuat ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Tampilkan Best Score saat halaman awal dimuat
  if (bestScoreDisplay) {
    bestScoreDisplay.textContent = getBestScore();
  }

  // 2. Muat dan Terapkan Pengaturan Volume
  loadVolumeSettings();

  // 3. Siapkan buffer suara klik di awal (biar pas diklik langsung bunyi)
  initClickSound();

  // 4. Coba putar musik latar (kemungkinan diblokir browser di percobaan pertama)
  tryPlayBackgroundMusic();

  // 4b. Fallback: begitu user klik pertama kali di mana pun, coba putar lagi
  document.addEventListener(
    "click",
    () => {
      if (backgroundMusic && backgroundMusic.paused) {
        tryPlayBackgroundMusic();
      }
    },
    { once: true }
  );

  // 5. Animasi Fade-In untuk Logo dan Tombol
  setTimeout(() => {
    if (gameLogoCentral) {
      gameLogoCentral.classList.remove("hidden");
      gameLogoCentral.classList.add("visible");
    }
    if (startGameButton) {
      startGameButton.classList.remove("hidden");
      startGameButton.classList.add("visible");
    }
  }, 100);

  // 6. Event Listener untuk Tombol "Mulai"
  if (startGameButton) {
    startGameButton.addEventListener("click", () => {
      playClickSound();
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
      setTimeout(() => {
        navigateTo("../game/index.html");
      }, 300);
    });
  }

  // 7. Event Listener untuk Tombol Pengaturan (Membuka Pop-up)
  if (settingsIconButton && settingsModal) {
    settingsIconButton.addEventListener("click", () => {
      playClickSound();
      settingsModal.classList.remove("hidden");
    });
  }

  // 8. Event Listener untuk Tombol Tutup Pop-up
  if (closeSettingsModalButton && settingsModal) {
    closeSettingsModalButton.addEventListener("click", () => {
      playClickSound();
      settingsModal.classList.add("hidden");
    });
  }

  // 9. Event Listener untuk Mengubah Volume Slider Musik
  if (musicVolumeSlider) {
    musicVolumeSlider.addEventListener("input", (event) => {
      saveVolumeSettings("music", event.target.value);
    });
  }

  // 10. Event Listener untuk Mengubah Volume Slider Efek Suara
  if (sfxVolumeSlider) {
    sfxVolumeSlider.addEventListener("input", (event) => {
      saveVolumeSettings("sfx", event.target.value);
      playClickSound(); // langsung kasih preview suara klik pas geser slider
    });
  }
});