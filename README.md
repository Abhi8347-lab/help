# Kavach – AI Phishing and Scam Detector

Detects phishing links, scam messages and fake sender addresses using a HYBRID system:
1. Explainable rule engine (js/app.js): lookalike brands, risky domains, scam phrases, highlighted words.
2. Machine-learning models (trained by backend/train.py, exported to js/model.js):
   - Text model: TF-IDF (word 1-2 grams) + Logistic Regression
   - URL model: 18 URL features + Logistic Regression
   Final score = 50% rules + 50% AI model.

## Run the website
Open the folder in VS Code, install "Live Server", right-click index.html -> Open with Live Server.

## Retrain the AI
    cd backend
    pip install scikit-learn pandas numpy
    python gen_data.py     (creates the STARTER dataset)
    python train.py        (trains, prints metrics, rewrites ../js/model.js)

IMPORTANT: the starter data in backend/data is synthetic (template-made), so the 100% test scores
it prints are NOT real accuracy. For your final submission, replace data/messages.csv (text,label)
and data/urls.csv (url,label) with real datasets (SMS Spam Collection, Kaggle phishing emails,
PhishTank / Kaggle malicious URLs; label 1 = scam, 0 = safe) and run train.py again.

## Structure
index.html, css/style.css, js/app.js (rules + ML inference), js/model.js (trained model),
backend/ (gen_data.py, train.py, data/)
