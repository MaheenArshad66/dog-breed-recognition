const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const predictButton = document.getElementById("predictButton");
const statusText = document.getElementById("status");
const dropzone = document.getElementById("dropzone");
const emptyState = document.getElementById("emptyState");
const fileName = document.getElementById("fileName");
const resultPanel = document.getElementById("resultPanel");
const resultBreed = document.getElementById("resultBreed");
const confidence = document.getElementById("confidence");
const barFill = document.getElementById("barFill");

function selectImage(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    statusText.textContent = "Please choose a valid image file.";
    return;
  }
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  emptyState.hidden = true;
  fileName.textContent = file.name;
  predictButton.disabled = false;
  resultPanel.classList.remove("show");
  statusText.textContent = "Image ready. Click Predict breed.";
}

imageInput.addEventListener("change", () => selectImage(imageInput.files[0]));

["dragenter", "dragover"].forEach(eventName => {
  dropzone.addEventListener(eventName, event => {
    event.preventDefault();
    dropzone.classList.add("drag");
  });
});
["dragleave", "drop"].forEach(eventName => {
  dropzone.addEventListener(eventName, event => {
    event.preventDefault();
    dropzone.classList.remove("drag");
  });
});
dropzone.addEventListener("drop", event => {
  const file = event.dataTransfer.files[0];
  if (file) {
    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      imageInput.files = transfer.files;
    } catch (_) {}
    selectImage(file);
  }
});

predictButton.addEventListener("click", async () => {
  const file = imageInput.files[0] || null;
  if (!file) {
    statusText.textContent = "Please upload an image first.";
    return;
  }

  predictButton.disabled = true;
  predictButton.textContent = "Analyzing image…";
  statusText.textContent = "The AI model is analyzing your image.";
  resultPanel.classList.remove("show");

  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Prediction request failed.");

    resultBreed.textContent = data.breed || "Unknown breed";
    const score = Number(data.confidence);
    confidence.textContent = Number.isFinite(score) ? `${score.toFixed(2)}%` : "Unavailable";
    barFill.style.width = `${Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0))}%`;
    resultPanel.classList.add("show");
    statusText.textContent = "Prediction complete. Results are model estimates, not a guarantee.";
  } catch (error) {
    statusText.textContent = `Could not predict: ${error.message}`;
  } finally {
    predictButton.disabled = false;
    predictButton.textContent = "✨  Predict breed";
  }
});
