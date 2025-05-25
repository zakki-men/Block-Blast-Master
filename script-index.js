// script-index.js

// --- Dapatkan elemen yang dibutuhkan untuk halaman awal ---
const startGameButton = document.getElementById("start-game-button");
const gameLogoCentral = document.getElementById("game-logo-central");
// PERBAIKAN: Mengubah ID elemen untuk best score agar konsisten dengan game.html
const bestScoreDisplay = document.getElementById("best-score-display-game");

// Elemen-elemen untuk Pengaturan Suara
const settingsIconButton = document.getElementById("settings-icon-button");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsModalButton = document.getElementById(
  "close-settings-modal"
);
const musicVolumeSlider = document.getElementById("music-volume");
const sfxVolumeSlider = document.getElementById("sfx-volume");

// Elemen Audio
const clickSound = document.getElementById("click-sound");
const backgroundMusic = document.getElementById("background-music"); // Elemen audio musik latar

// --- Fungsi Navigasi Halaman ---
function navigateTo(path) {
  window.location.href = path;
}

// --- Fungsi untuk mendapatkan Best Score dari localStorage ---
function getBestScore() {
  // PERBAIKAN: Menggunakan kunci localStorage yang konsisten
  return parseInt(localStorage.getItem("blockBlastBestScore") || "0");
}

// --- Fungsi untuk Mengatur dan Menyimpan Volume ---
function saveVolumeSettings(type, value) {
  // PERBAIKAN: Menggunakan kunci localStorage yang konsisten
  localStorage.setItem(
    `blockBlast${type.charAt(0).toUpperCase() + type.slice(1)}Volume`,
    value
  );
  applyVolumeSettings(type, value);
}

function loadVolumeSettings() {
  // PERBAIKAN: Menggunakan kunci localStorage yang konsisten
  const musicVol = parseFloat(
    localStorage.getItem("blockBlastMusicVolume") || "0.5"
  );
  const sfxVol = parseFloat(
    localStorage.getItem("blockBlastSfxVolume") || "0.5"
  );

  // Atur nilai slider sesuai dengan yang dimuat
  if (musicVolumeSlider) musicVolumeSlider.value = musicVol;
  if (sfxVolumeSlider) sfxVolumeSlider.value = sfxVol;

  // Terapkan volume ke elemen audio
  applyVolumeSettings("music", musicVol);
  applyVolumeSettings("sfx", sfxVol);
}

function applyVolumeSettings(type, value) {
  if (type === "music" && backgroundMusic) {
    backgroundMusic.volume = value;
  }
  if (type === "sfx" && clickSound) {
    clickSound.volume = value;
  }
  // If there are other sounds later (e.g., game over sound), add them here
}

// --- Inisialisasi Halaman Awal Setelah DOM Dimuat ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Tampilkan Best Score saat halaman awal dimuat
  if (bestScoreDisplay) {
    bestScoreDisplay.textContent = getBestScore();
  }

  // 2. Muat dan Terapkan Pengaturan Volume
  loadVolumeSettings();

  // 3. Putar Musik Latar Otomatis
  if (backgroundMusic) {
    backgroundMusic.play().catch((e) => {
      console.warn(
        "Background music autoplay prevented. User interaction required:",
        e
      );
    });
  }

  // 4. Animasi Fade-In untuk Logo dan Tombol
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

  // 5. Event Listener untuk Tombol "Mulai"
  if (startGameButton) {
    startGameButton.addEventListener("click", () => {
      if (clickSound) {
        clickSound.currentTime = 0;
        clickSound
          .play()
          .catch((e) => console.error("Error playing click sound:", e));
      }
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
      setTimeout(() => {
        navigateTo("Home_Layar_Game/index_game.html"); // Navigate to the game page
      }, 300);
    });
  }

  // 6. Event Listener untuk Tombol Pengaturan (Membuka Pop-up)
  if (settingsIconButton && settingsModal) {
    settingsIconButton.addEventListener("click", () => {
      if (clickSound) {
        clickSound.currentTime = 0;
        clickSound
          .play()
          .catch((e) => console.error("Error playing click sound:", e));
      }
      settingsModal.classList.remove("hidden"); // Show pop-up
    });
  }

  // 7. Event Listener untuk Tombol Tutup Pop-up
  if (closeSettingsModalButton && settingsModal) {
    closeSettingsModalButton.addEventListener("click", () => {
      if (clickSound) {
        clickSound.currentTime = 0;
        clickSound
          .play()
          .catch((e) => console.error("Error playing click sound:", e));
      }
      settingsModal.classList.add("hidden"); // Hide pop-up
    });
  }

  // 8. Event Listener untuk Mengubah Volume Slider Musik
  if (musicVolumeSlider) {
    musicVolumeSlider.addEventListener("input", (event) => {
      saveVolumeSettings("music", event.target.value);
    });
  }

  // 9. Event Listener untuk Mengubah Volume Slider Efek Suara
  if (sfxVolumeSlider) {
    sfxVolumeSlider.addEventListener("input", (event) => {
      saveVolumeSettings("sfx", event.target.value);
      if (clickSound) {
        clickSound.currentTime = 0;
        clickSound
          .play()
          .catch((e) => console.error("Error playing click sound:", e));
      }
    });
  }
});
