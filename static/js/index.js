const formSentiment = document.getElementById("form-sentiment")
const inputSentiment = document.getElementById("sentiment")
const answer = document.getElementById("answer")

formSentiment.addEventListener("submit", (e) => {
  e.preventDefault()
  const sentiment = inputSentiment.value

  const formData = new FormData()
  formData.append("text", sentiment)

  axios.post("/api/predict/text", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
  .then(response => {
    answer.innerText = "Your sentiment is " + response.data.prediction
    answer.classList.remove('no-result')
    answer.classList.remove('positive')
    answer.classList.remove('neutral')
    answer.classList.remove('negative')
    if (response.data.prediction == "positif"){
      answer.classList.add('positive', 'answer')
    } else if (response.data.prediction == "netral") {
      answer.classList.add('neutral', 'answer')
    } else {
      answer.classList.add('negative', 'answer')
    }
    })
  .catch(error => {
    console.error("Error:", error)
  })
})

const file = document.getElementById("file")
const uploadedOrNot = document.getElementById("uploaded-or-not")
const fakePathRegex = /C:\\fakepath\\/i;

file.addEventListener("change", (e) => {
    if (file.value !== "") {
        uploadedOrNot.innerText = "File choosed: " + file.value.replace(fakePathRegex, "")
    }
})

const formSentimentFile = document.getElementById("form-sentiment-file")

const loadingContainer = document.querySelector(".loading-container")
const ancestorContainer = document.querySelector(".ancestor-container")
const downloadAnswer = document.getElementById("download-answer")

function loadStart() {
  loadingContainer.classList.remove("loading-false")
  loadingContainer.classList.add("loading-true")
  ancestorContainer.classList.add("background-blur")
}

function loadEnd() {
  loadingContainer.classList.add("loading-false")
  loadingContainer.classList.remove("loading-true")
  ancestorContainer.classList.remove("background-blur")
  downloadAnswer.innerHTML = `<a id="download" download style="font-weight:bold;cursor:pointer;color:blue;text-decoration:underline;">Download your result</a>`
}

formSentimentFile.addEventListener("submit", async (e) => {
  e.preventDefault();
  loadStart();
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];
  let filename, url;

  if (!file) {
    alert('Please select a file to upload.');
    return;
  }

  // Create FormData object to send the file
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Send POST request to upload the file
    const postResponse = await axios.post("/api/predict/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    filename = postResponse.data.filename;

    // Send GET request to download the file
    const getResponse = await axios.get(`/api/download/${filename}`, { responseType: 'blob' });
    // Create URL object from Blob data
    url = URL.createObjectURL(new Blob([getResponse.data]));

    // Perform other actions after both POST and GET requests are completed
    loadEnd();
    const downloadLink = document.getElementById("download");
    downloadLink.href = url;
    downloadLink.download = filename;
  } catch (error) {
    console.error("Error:", error);
  }
});


