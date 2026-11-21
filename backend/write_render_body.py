import json
data = {
    "type": "web_service",
    "name": "stockforge",
    "ownerId": "tea-dc11varl550s73d56fl0",
    "repo": "https://github.com/borstlerkian-hash/stockforge",
    "branch": "main",
    "serviceDetails": {
        "env": "python",
        "runtime": "python",
        "envSpecificDetails": {
            "buildCommand": "pip install -r backend/requirements.txt",
            "startCommand": "uvicorn server:app --app-dir backend --host 0.0.0.0 --port $PORT",
            "pythonVersion": "3.12"
        },
        "plan": "free",
        "region": "oregon"
    }
}
path = r"C:\Users\fritj\AppData\Local\Temp\render_body.json"
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f)
print("written")