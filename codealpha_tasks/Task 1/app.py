
from flask import Flask, render_template, request, jsonify
import random
from bot_responses import RESPONSES, FALLBACK_RESPONSES

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json["message"].lower()

    reply = RESPONSES.get(user_message, random.choice(FALLBACK_RESPONSES))
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True)