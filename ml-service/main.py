from fastapi import FastAPI, File, UploadFile
import requests

app = FastAPI(title="PawPal ML Service")

COLAB_QWEN_URL = "https://janae-presentative-unsmokily.ngrok-free.dev"

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()

    try:        
        #send the image file to the Qwen model hosted on Google Colab                                
        resp = requests.post(                   
            f"{COLAB_QWEN_URL}/predict",
            files={
                "file": (
                    file.filename or "image.jpg",
                    contents,
                    file.content_type or "image/jpeg"
                )
            },
            timeout=120,
        )

        try:
            return resp.json()                   #get the JSON prediction response back from Qwen
        except Exception:
            return {"label": "unclear", "raw": resp.text}

    except Exception as e:
        return {"label": "unclear", "error": str(e)}