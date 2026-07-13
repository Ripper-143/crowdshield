import sys
import os
import uvicorn

# Add workspace directory to path so uvicorn can find backend package
workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if workspace_dir not in sys.path:
    sys.path.append(workspace_dir)

from backend.db.database import init_db

if __name__ == "__main__":
    print("Initializing local SQLite database (crowdshield.db)...")
    init_db()
    print("Starting CrowdShield API locally on http://127.0.0.1:8000")
    uvicorn.run("backend.api.main:app", host="127.0.0.1", port=8000, reload=True)
