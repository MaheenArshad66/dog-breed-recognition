const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const predictButton = document.getElementById("predictButton");
const result = document.getElementById("result");
const confidence = document.getElementById("confidence");

imageInput.addEventListener("change", function () {
    const file = imageInput.files[0];

    if (!file || !file.type.startsWith("image/")) {
        preview.hidden = true;
        predictButton.disabled = true;
        result.textContent = "Please select a valid image.";
        confidence.textContent = "";
        return;
    }

    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    predictButton.disabled = false;
    result.textContent = "Image ready for prediction.";
    confidence.textContent = "";
});

predictButton.addEventListener("click", async function () {
    const file = imageInput.files[0];
    if (!file) return;

    predictButton.disabled = true;
    result.textContent = "AI is analyzing the image...";
    confidence.textContent = "";

    try {
        const response = await fetch("/api/predict", {
            method: "POST",
            headers: {
                "Content-Type": file.type || "application/octet-stream"
            },
            body: file
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Prediction failed.");
        }

        result.textContent = "Predicted Breed: " + data.breed;
        confidence.textContent = "Confidence: " + data.confidence + "%";
    } catch (error) {
        result.textContent = "Prediction error";
        confidence.textContent =
            error.message + " Please check the API deployment.";
    } finally {
        predictButton.disabled = false;
    }
});
