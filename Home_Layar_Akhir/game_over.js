// game_over.js

document.addEventListener("DOMContentLoaded", () => {
  const finalScoreDisplay = document.getElementById("final-score");
  const bestScoreDisplay = document.getElementById("best-score-gameover"); // Elemen untuk menampilkan best score
  const restartGameButton = document.getElementById("restart-game-button"); // Tombol "Play Again"
  const backToMenuButton = document.getElementById("back-to-menu-button"); // Tombol "Back to Menu"

  // Referensi elemen audio untuk halaman Game Over
  const gameOverSound = document.getElementById("game-over-sound");
  const gameOverMusic = document.getElementById("game-over-music");

  // Ambil skor dari Local Storage
  const lastGameScore = localStorage.getItem("lastGameScore");
  const blockBlastBestScore = localStorage.getItem("blockBlastBestScore"); // Ambil best score juga

  // Tampilkan skor terakhir
  if (finalScoreDisplay) {
    finalScoreDisplay.textContent =
      lastGameScore !== null ? lastGameScore : "0";
  } else {
    console.warn("Elemen 'final-score' tidak ditemukan.");
  }

  // Tampilkan skor terbaik
  if (bestScoreDisplay) {
    bestScoreDisplay.textContent =
      blockBlastBestScore !== null ? blockBlastBestScore : "0";
  } else {
    console.warn("Elemen 'best-score-gameover' tidak ditemukan.");
  }

  // --- Logika Audio untuk Halaman Game Over ---

  // Memainkan suara Game Over (sekali saja)
  if (gameOverSound) {
    // Atur volume suara game over berdasarkan slider SFX yang terakhir disimpan
    const savedSfxVolume = localStorage.getItem("blockBlastSfxVolume");
    gameOverSound.volume =
      savedSfxVolume !== null ? parseFloat(savedSfxVolume) : 0.75;
    gameOverSound
      .play()
      .catch((e) => console.error("Error playing game over sound:", e));
  }

  // Memainkan musik latar Game Over (loop)
  if (gameOverMusic) {
    // Atur volume musik game over berdasarkan slider musik yang terakhir disimpan
    const savedMusicVolume = localStorage.getItem("blockBlastMusicVolume");
    gameOverMusic.volume =
      savedMusicVolume !== null ? parseFloat(savedMusicVolume) : 0.5;
    gameOverMusic
      .play()
      .catch((e) => console.error("Error playing game over music:", e));
  }

  // --- Event Listeners untuk Tombol ---

  // Event Listener untuk Tombol "Play Again"
  if (restartGameButton) {
    restartGameButton.addEventListener("click", () => {
      // Hentikan musik di halaman game over sebelum kembali
      if (gameOverMusic) gameOverMusic.pause();
      // Kembali ke halaman game utama untuk memulai ulang
      window.location.href = "../index.html"; // Mengarah ke index.html (halaman game utama)
    });
  } else {
    console.warn("Tombol 'restart-game-button' tidak ditemukan.");
  }

  // Event Listener untuk Tombol "Back to Menu"
  if (backToMenuButton) {
    backToMenuButton.addEventListener("click", () => {
      // Hentikan musik di halaman game over sebelum kembali
      if (gameOverMusic) gameOverMusic.pause();
      // Mengarahkan pengguna kembali ke halaman pertama (indek-home.html)
      window.location.href = "../index.html"; // Sesuai permintaan Anda
    });
  } else {
    console.warn("Tombol 'back-to-menu-button' tidak ditemukan.");
  }
});
