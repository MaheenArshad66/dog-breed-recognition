import io
import json
import os
import numpy as np
from PIL import Image
from http.server import BaseHTTPRequestHandler
from ai_edge_litert.interpreter import Interpreter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "dog_breed_model.tflite")

BREEDS = [
    "German Shepherd",
    "Siberian Husky",
    "Beagle",
    "Golden Retriever",
    "Pug"
]

def load_interpreter():
    interpreter = Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    return interpreter

class handler(BaseHTTPRequestHandler):
    def send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json(200, {"message": "OK"})

    def do_GET(self):
        self.send_json(200, {
            "message": "Dog Breed Recognition API is running"
        })

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0:
                return self.send_json(400, {"error": "No image received"})

            image_bytes = self.rfile.read(length)
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image = image.resize((224, 224))

            # MobileNetV2 preprocessing: pixel values from 0 to 255
            # are scaled to -1 to 1.
            array = np.asarray(image, dtype=np.float32)
            array = array / 127.5 - 1.0
            array = np.expand_dims(array, axis=0)

            interpreter = load_interpreter()
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()

            interpreter.set_tensor(input_details[0]["index"], array)
            interpreter.invoke()
            predictions = interpreter.get_tensor(
                output_details[0]["index"]
            )[0]

            index = int(np.argmax(predictions))
            confidence = float(predictions[index]) * 100

            self.send_json(200, {
                "breed": BREEDS[index],
                "confidence": round(confidence, 2)
            })

        except Exception as exc:
            self.send_json(500, {"error": str(exc)})
