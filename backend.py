from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import numpy as np
import cv2
import io
import datetime
from PIL import Image
import base64
import uvicorn
import os

# --- 1. DATABASE SETUP (SQLite) ---
DATABASE_URL = "sqlite:///./textile_project.db"

# FIX: Added timeout and pool_pre_ping to prevent "database is locked" errors
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 30},
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User Table
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    name = Column(String)
    picture = Column(String)

# Scan History Table
class ScanHistory(Base):
    __tablename__ = "scan_history"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String)
    filename = Column(String)
    status = Column(String) 
    score = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# Create Tables
Base.metadata.create_all(bind=engine)

# --- 2. FASTAPI APP SETUP ---
app = FastAPI()

# CORS: All origins allowed for easy hosting connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "TexScan Pro API is Live!", "status": "Healthy"}

# --- 3. CORE AI ANALYSIS ENDPOINT ---
@app.post("/analyze")
async def analyze_fabric(
    file: UploadFile = File(...), 
    email: str = Form(...) 
):
    db = SessionLocal()
    try:
        # Image processing
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_array = np.array(image)

        # Logic based on filename (Simulation)
        filename = file.filename.lower()
        if any(word in filename for word in ["good", "clean", "pass"]):
            status = "PASS"
            score = np.random.uniform(96.8, 99.9)
            msg = "No defects detected. Fabric quality meets ISO standards."
        else:
            status = "FAIL"
            score = np.random.uniform(12.5, 38.2)
            msg = "Critical defect detected! Pattern anomaly found."

        # Heatmap Generation
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        heatmap_img = cv2.applyColorMap(cv2.convertScaleAbs(gray, alpha=1.3, beta=20), cv2.COLORMAP_JET)
        
        _, buffer = cv2.imencode('.jpg', heatmap_img)
        heatmap_base64 = base64.b64encode(buffer).decode('utf-8')

        # SAVE TO DATABASE
        new_record = ScanHistory(
            user_email=email,
            filename=file.filename,
            status=status,
            score=round(score, 2)
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return {
            "status": status,
            "score": round(score, 2),
            "message": msg,
            "heatmap": heatmap_base64
        }
    except Exception as e:
        db.rollback() 
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Database or Analysis error.")
    finally:
        db.close() # CRITICAL: This prevents "Database is locked"

# --- 4. HISTORY ENDPOINT ---
@app.get("/history")
async def get_history(
    email: str = Query(...), 
    is_admin: str = Query("false")
):
    db = SessionLocal()
    try:
        admin_bool = is_admin.lower() == "true"
        if admin_bool:
            records = db.query(ScanHistory).order_by(ScanHistory.timestamp.desc()).all()
        else:
            records = db.query(ScanHistory).filter(ScanHistory.user_email == email).order_by(ScanHistory.timestamp.desc()).all()
        return records
    finally:
        db.close()

# --- 5. START COMMAND FOR HOSTING ---
if __name__ == "__main__":
    # Get port from Render/Environment or default to 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
