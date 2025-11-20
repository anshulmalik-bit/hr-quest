// Simple hover / parallax-like movement for the portrait
const img = document.getElementById("studentImg");

if (img) {
  document.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    img.style.transform = `translate(${x}px, ${y}px)`;
  });
}

// Make the button scroll or redirect (your choice)
const startBtn = document.getElementById("startGame");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    // Redirect to your actual HR-Quest game
    window.location.href = "/";
  });
}

