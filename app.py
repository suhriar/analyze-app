import os
import pandas as pd
import numpy as np
import tensorflow as tf
import swifter
import pickle
import json
from flask import Flask, jsonify, request, render_template, redirect, url_for, send_from_directory
import re
from tensorflow.keras.utils import pad_sequences
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory
from werkzeug.utils import secure_filename
from datetime import datetime

#init flask and model
app = Flask(__name__)
model = tf.keras.models.load_model('model.h5')

#init tokenizer
with open('tokenizer.pkl', 'rb') as handle:
    tokenizer = pickle.load(handle)

#init stopwords
with open('list_stopwords.pkl', 'rb') as handle:
    list_stopwords = pickle.load(handle)

#preprocessing data
#cleaning
def remove_pattern(Text, pattern):
    r = re.findall(pattern, str(Text))
    for i in r:
        Text = re.sub(i, '', str(Text))
    return Text

def cleaning(Text):
    Text = re.sub(r'\$\w*', '', Text)
    Text = re.sub(r'^rt[\s]+', '', Text)
    Text = re.sub('((www\.[^\s]+)|(https?://[^\s]+))', ' ', Text)
    Text = re.sub('&quot;'," ", Text)
    Text = re.sub(r"\d+", " ", str(Text))
    Text = re.sub(r"\b[a-zA-Z]\b", "", str(Text))
    Text = re.sub(r"[^\w\s]", " ", str(Text))
    Text = re.sub(r'(.)\1+', r'\1\1', Text)
    Text = re.sub(r"\s+", " ", str(Text))
    Text = re.sub(r'#', '', Text)
    Text = re.sub(r'[^a-zA-z0-9]', ' ', str(Text))
    Text = re.sub(r'\b\w{1,2}\b', '', Text)
    Text = re.sub(r'\s\s+', ' ', Text)
    Text = re.sub(r'^RT[\s]+', '', Text)
    Text = re.sub(r'^b[\s]+', '', Text)
    Text = re.sub(r'^link[\s]+', '', Text)
    Text = re.sub(r'@\w+', '', Text)
    Text = re.sub('<[^>]+>', '', Text)
    Text = re.sub(r'[\U0001F600-\U0001F64F]', '', Text)
    return Text

#stopword removal
def stopwords_removal(Text):
    words = Text.split()
    return [word for word in words if word not in list_stopwords]

#stemming
#buat stemmer
factory = StemmerFactory()
stemmer = factory.create_stemmer()
#stemmed wrapper
def stemmed_wrapper(term):
    return stemmer.stem(term)
#memmulai stemming
def apply_stemmed_term(term_dict, Text):
    return [term_dict[term] for term in Text]
#fit stemming
def fit_stemming(text):
    text = np.array(text)
    text = ' '.join(text)
    return text

#file-preprocessing
def file_prepocessing(file):
    file['cleaning'] = np.vectorize(remove_pattern)(file['Text'], "@[\w]*")
    file['cleaning'] = file['cleaning'].apply(cleaning)
    file['case_folding'] = file['cleaning'].str.lower()
    file['stopword_removal'] = file['case_folding'].apply(stopwords_removal)
    term_dict = {}
    for Text in file['stopword_removal']:
      for term in Text:
        if term not in term_dict:
          term_dict[term] = ' '

    for term in term_dict:
        term_dict[term] = stemmed_wrapper(term)
        print(term,":" ,term_dict[term])

    file['stemming'] = file['stopword_removal'].swifter.apply(lambda x: apply_stemmed_term(term_dict, x))
    stemming = file[['stemming']]
    file['stemming'] = file['stemming'].apply(lambda x: fit_stemming(x))

    del(file["cleaning"])
    del(file["case_folding"])
    del(file["stopword_removal"])

    return file

#file prediction
def prediction(text):
    text=pad_sequences(tokenizer.texts_to_sequences([text]), maxlen=400)
    score=model.predict(text)
    predicted_label = np.argmax(score[0])

    # Map predicted label to sentiment category
    sentiment_mapping = {0: 'negatif', 1: 'netral', 2: 'positif'}
    predicted_sentiment = sentiment_mapping[predicted_label]

    return predicted_sentiment

#text preprocessing
def text_preprocessing(text):
    text = remove_pattern(text, "@[\w]*")
    text = cleaning(text)
    text = text.lower()
    text = stopwords_removal(text)
    term_dict = {}

    for term in text:
      if term not in term_dict:
        term_dict[term] = ' '

    for term in term_dict:
        term_dict[term] = stemmed_wrapper(term)
        print(term,":" ,term_dict[term])

    text=apply_stemmed_term(term_dict, text)
    text=fit_stemming(text)
    return text

# Define folder to save uploaded and downloaded files to process further
UPLOAD_FOLDER = os.path.join('uploads')
DOWNLOAD_FOLDER = os.path.join('downloads')

ALLOWED_EXTENSIONS = set(['csv'])

# Configure upload and download file path flask
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['DOWNLOAD_FOLDER'] = DOWNLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/api/predict/text', methods=['POST'])
def text_prediction():
    if request.method == 'POST':
        text = request.form['text']
        text = text_preprocessing(text)
        predicted_sentiment = prediction(text)

        # Return hasil prediksi dengan format JSON
        return jsonify({
            "prediction": predicted_sentiment
        })

@app.route('/api/predict/file', methods=['POST'])
def file_prediction():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S.%f")
                upload_filename = f'{filename.split(".")[0]}_{timestamp}.csv'
                upload_location = os.path.join(app.config['UPLOAD_FOLDER'], upload_filename)
                file.save(upload_location)

                #read file
                df = pd.read_csv(upload_location)

                file_prepocessing(df)
                df['sentimen_prediction'] = df['stemming'].swifter.apply(prediction)
                del(df["stemming"])

                # Save processed DataFrame to output folder
                downnload_filename = f'{upload_filename.split(".")[0]}_processed.csv'
                download_location = os.path.join(app.config['DOWNLOAD_FOLDER'], downnload_filename)
                df.to_csv(download_location, index=False)

                # Return hasil prediksi dengan format JSON
                return jsonify({
                    "filename": downnload_filename
                })

@app.route('/api/download/<string:filename>', methods=['GET'])
def download_file(filename):
    directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')  # Ganti dengan path direktori sesuai dengan lokasi direktori "downloads" Anda
    return send_from_directory(directory, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.environ.get('PORT', 8080)))