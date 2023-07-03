//TEXT PREDICTION
const formSentiment = document.getElementById("form-sentiment");
const inputSentiment = document.getElementById("sentiment");
const answer = document.getElementById("answer");

formSentiment.addEventListener("submit", (e) => {
  e.preventDefault();
  const sentiment = inputSentiment.value;

  const formData = new FormData();
  formData.append("text", sentiment);

  axios.post("/api/predict/text", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
    .then(response => {
      const prediction = response.data.prediction;
      answer.innerText = `Your sentiment is ${prediction}`;
      answer.classList.remove('no-result', 'positive', 'neutral', 'negative');
      if (response.data.prediction == "positif") {
        answer.classList.add('positive', 'answer')
      } else if (response.data.prediction == "netral") {
        answer.classList.add('neutral', 'answer')
      } else {
        answer.classList.add('negative', 'answer')
      }
    })
    .catch(error => {
      console.error("Error:", error);
    });
});

//FILE PREDICTION
const file = document.getElementById("file");
const uploadedOrNot = document.getElementById("uploaded-or-not");
const fakePathRegex = /C:\\fakepath\\/i;

file.addEventListener("change", (e) => {
  if (file.value !== "") {
    uploadedOrNot.innerText = "File chosen: " + file.value.replace(fakePathRegex, "");
  }
});

const formSentimentFile = document.getElementById("form-sentiment-file");
const loadingContainer = document.querySelector(".loading-container");
const ancestorContainer = document.querySelector(".ancestor-container");
const downloadAnswer = document.getElementById("download-answer");

function showLoading() {
  loadingContainer.classList.remove("loading-false");
  loadingContainer.classList.add("loading-true");
  ancestorContainer.classList.add("background-blur");
}

function hideLoading() {
  loadingContainer.classList.add("loading-false");
  loadingContainer.classList.remove("loading-true");
  ancestorContainer.classList.remove("background-blur");
  downloadAnswer.innerHTML = `<a id="download-link" download style="font-weight:bold;cursor:pointer;color:blue;text-decoration:underline;">Download your result</a>`;
}

formSentimentFile.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select a file to upload.');
    hideLoading();
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const postResponse = await axios.post("/api/predict/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    const filename = postResponse.data.filename;

    const getResponse = await axios.get(`/api/download/${filename}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([getResponse.data]));

    hideLoading();
    const downloadLink = document.getElementById("download-link");
    downloadLink.href = url;
    downloadLink.download = filename;
  } catch (error) {
    console.error("Error:", error);
  }
});
