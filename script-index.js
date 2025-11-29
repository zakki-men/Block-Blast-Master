// script.js

// --- 1. Dapatkan Elemen DOM (PENTING: Harus sesuai dengan ID di HTML) ---
const startGameButton = document.getElementById("start-game-button");
const gameLogoCentral = document.getElementById("game-logo-central");
const bestScoreDisplay = document.getElementById("best-score-display"); // ID Sesuai HTML baru
const diamondCountDisplay = document.getElementById("diamond-count"); // Elemen baru (Diamond)

// Elemen Pengaturan Suara
const settingsIconButton = document.getElementById("settings-icon-button");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsModalButton = document.getElementById("close-settings-modal");
const musicVolumeSlider = document.getElementById("music-volume");
const sfxVolumeSlider = document.getElementById("sfx-volume");

// Elemen Audio
const clickSound = document.getElementById("click-sound");
const backgroundMusic = document.getElementById("background-music");

// --- 2. Konstanta (Untuk konsistensi Local Storage) ---
const LS_PREFIX = "blockBlast"; 

// --- 3. Fungsi Utilitas ---

const navigateTo = (path) => {
  window.location.href = path;
};

// Fungsi utilitas untuk memutar SFX klik (digunakan berulang kali, menghemat baris kode)
const playClickSFX = () => {
  if (clickSound) {
    clickSound.currentTime = 0; // Memastikan suara dapat diputar ulang segera
    clickSound.play().catch((e) => console.error("Error playing click sound:", e));
  }
};

// --- 4. Manajemen Data (Local Storage) ---

const getBestScore = () => {
  // Mengambil skor terbaik, default 0
  return parseInt(localStorage.getItem(`${LS_PREFIX}BestScore`) || "0");
};

const getDiamondCount = () => {
  // Mengambil jumlah berlian, default 100 jika belum ada
  return parseInt(localStorage.getItem(`${LS_PREFIX}DiamondCount`) || "100"); 
};

// --- 5. Manajemen Volume ---

const saveVolumeSettings = (type, value) => {
  // Menyimpan volume ke Local Storage
  localStorage.setItem(`${LS_PREFIX}${type.charAt(0).toUpperCase() + type.slice(1)}Volume`, value);
  applyVolumeSettings(type, value);
};

const applyVolumeSettings = (type, value) => {
  // Menerapkan volume ke elemen audio
  if (type === "music" && backgroundMusic) {
    backgroundMusic.volume = value;
  }
  if (type === "sfx" && clickSound) {
    clickSound.volume = value;
  }
};

const loadVolumeSettings = () => {
  // Memuat volume dari Local Storage (default 0.5 jika belum ada)
  const musicVol = parseFloat(localStorage.getItem(`${LS_PREFIX}MusicVolume`) || "0.5");
  const sfxVol = parseFloat(localStorage.getItem(`${LS_PREFIX}SfxVolume`) || "0.5");

  if (musicVolumeSlider) musicVolumeSlider.value = musicVol;
  if (sfxVolumeSlider) sfxVolumeSlider.value = sfxVol;

  applyVolumeSettings("music", musicVol);
  applyVolumeSettings("sfx", sfxVol);
};

// --- 6. Inisialisasi Halaman (DOM LOADED) ---

document.addEventListener("DOMContentLoaded", () => {
  // A. Tampilkan Data Awal (Skor dan Diamond)
  if (bestScoreDisplay) {
    bestScoreDisplay.textContent = getBestScore();
  }
  if (diamondCountDisplay) {
    diamondCountDisplay.textContent = getDiamondCount();
  }

  // B. Muat dan Terapkan Pengaturan Volume
  loadVolumeSettings();

  // C. Animasi Fade-In (Logo dan Tombol Start)
  // setTimeout 100ms memberikan waktu bagi browser untuk merender elemen sebelum transisi dimulai
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

  // D. Audio Autoplay (Percobaan putar musik, mungkin diblokir browser)
  if (backgroundMusic) {
    backgroundMusic.play().catch((e) => {
      console.warn("Autoplay musik diblokir. Membutuhkan interaksi pengguna.", e);
    });
  }

  // E. Event Listeners (Logika Interaksi Pengguna)

  // 1. Tombol "Mulai Game"
  if (startGameButton) {
    startGameButton.addEventListener("click", () => {
      playClickSFX();
      
      // Hentikan musik menu saat navigasi
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }

      // Navigasi ke halaman game utama
      setTimeout(() => {
        navigateTo("Home_Layar_Game/index_game.html");
      }, 300);
    });
  }

  // 2. Tombol Pengaturan (Membuka Modal)
  if (settingsIconButton && settingsModal) {
    settingsIconButton.addEventListener("click", () => {
      playClickSFX();
      settingsModal.classList.remove("hidden");
      
      // Jika musik diblokir, coba putar musik di sini (Interaksi pertama pengguna)
      if (backgroundMusic && backgroundMusic.paused) {
          backgroundMusic.play().catch((e) => console.log("Gagal memutar musik setelah interaksi."));
      }
    });
  }

  // 3. Tombol Tutup Modal
  if (closeSettingsModalButton && settingsModal) {
    closeSettingsModalButton.addEventListener("click", () => {
      playClickSFX();
      settingsModal.classList.add("hidden");
    });
  }
  
  // 4. Slider Volume Musik (Simpan dan Terapkan)
  if (musicVolumeSlider) {
    musicVolumeSlider.addEventListener("input", (event) => {
      saveVolumeSettings("music", event.target.value);
    });
  }

  // 5. Slider Volume Efek Suara (Simpan, Terapkan, dan Putar SFX uji coba)
  if (sfxVolumeSlider) {
    sfxVolumeSlider.addEventListener("input", (event) => {
      saveVolumeSettings("sfx", event.target.value);
      playClickSFX(); // Putar SFX uji coba agar pengguna bisa mendengar perubahan volume
    });
  }
});
