from flask import Flask, request, jsonify, render_template, send_file
import spacy
import csv
import os

app = Flask(__name__)

# Load pre-trained NER model
nlp = spacy.load("en_core_web_lg")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/ner", methods=["POST"])
def perform_ner():
    text = request.form.get("text", "")
    if not text:
        return jsonify([])  # Return an empty list if no text is provided

    doc = nlp(text)
    entities = []
    for ent in doc.ents:
        # Handle 'unknown' labels for numbers (CARDINAL)
        if ent.label_ == "CARDINAL":
            entities.append({"text": ent.text, "label": "CARDINAL"})
        else:
            entities.append({"text": ent.text, "label": ent.label_})

    return jsonify(entities)

@app.route("/download", methods=["POST"])
def download():
    data = request.get_json()
    entities = data.get("entities", [])  # Retrieve entities from request
    
    # Create a CSV file
    file_path = 'entities.csv'
    with open(file_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Entity", "Label"])  # Write header
        for entity in entities:
            writer.writerow([entity["text"], entity["label"]])  # Write each entity

    # Send the CSV file
    response = send_file(file_path, as_attachment=True)
    response.headers["Content-Disposition"] = "attachment; filename=entities.csv"
    
    # Cleanup: Remove the file after sending
    @response.call_on_close
    def remove_file(*args):
        os.remove(file_path)

    return response

if __name__ == "__main__":
    app.run(debug=True)
