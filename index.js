import db from "./db.json" with { type: "json" };

document.addEventListener("DOMContentLoaded", () => {
  let words = [];
  let currentWord = undefined;
  
  function getAllWords() {
    return db.default.lists.flatMap((list) => list.words);
  }
  
  function setupEvents() {
    // document.getElementById("wordList").addEventListener("input", saveWords);
    document.getElementById("resetWords").addEventListener("click", resetWords);
    document.getElementById("saveWords").addEventListener("click", saveWords);
    document.getElementById("speakWord").addEventListener("click", speakWord);
    document.getElementById("checkAnswer").addEventListener("click", checkAnswer);
    document.getElementById("speakAnswer").addEventListener("click", speakAnswer);
    document.getElementById("answer").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        checkAnswer();
      }
    });
  }

  function resetWords() {
    words = getAllWords();
    currentWord = undefined;
    document.getElementById("wordList").value = words.join("\n");
  }
  
  function renderWords() {
    document.getElementById("wordList").value = words.join("\n");
  }
  
  // Load saved words or default
  function loadWords() {
    const saved = localStorage.getItem("spellingWords");
    if (saved) {
      words = JSON.parse(saved);
    } else {
      words = getAllWords();
    }
    renderWords();
  }
  
  function saveWords() {
    const input = document.getElementById("wordList").value.trim();
    words = input
      .split(/\s*\n\s*/)
      .filter(Boolean)
      .map((word) => word.toLowerCase()); // split by line
    localStorage.setItem("spellingWords", JSON.stringify(words));
    alert("✅ Word list saved!");
  }
  
  function getRandomWord() {
    if (words.length === 0) {
      alert("⚠️ Word list is empty!");
      return "";
    }
    return words[Math.floor(Math.random() * words.length)];
  }
  
  function speakWord() {
    currentWord = getRandomWord();
    if (!currentWord) {
      alert("⚠️ No word to speak!");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = "en-US";
    utterance.rate = 0.5;
    speechSynthesis.speak(utterance);
    document.getElementById("answer").value = "";
    document.getElementById("result").innerText = "";
  }
  
  function checkAnswer() {
    const input = document.getElementById("answer").value.trim().toLowerCase();
    if (!currentWord) {
      alert("⚠️ No word to check!");
      return;
    }
    if (input === currentWord) {
      document.getElementById("result").innerText = "✅ Correct!";
      document.getElementById("result").style.color = "green";
    } else {
      document.getElementById(
        "result"
      ).innerText = `❌ Wrong! It was: ${currentWord}`;
      document.getElementById("result").style.color = "red";
    }
  }
  
  function speakAnswer() {
    if (!currentWord) {
      alert("⚠️ No word to speak!");
      return;
    }
    if (!("webkitSpeechRecognition" in window)) {
      alert("⚠️ Speech Recognition not supported in this browser.");
      return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
  
    recognition.onresult = function (event) {
      console.log(`[speakAnswer] results: ${speechRecognitionResultListToString(event.results)} and transcript: "${event.results[0][0].transcript}"`);
      const spoken = event.results[0][0].transcript
        .trim()
        .replace(/\./g, "")
        .toLowerCase();
      document.getElementById("answer").value = spoken;
      if (spoken === currentWord) {
        document.getElementById("result").innerText = "✅ Correct (spoken)!";
        document.getElementById("result").style.color = "green";
      } else {
        document.getElementById(
          "result"
        ).innerText = `❌ You said: "${spoken}" — It was: ${currentWord}`;
        document.getElementById("result").style.color = "red";
      }
    };
  }

  function speechRecognitionResultListToString(resultList) {
    return JSON.stringify(Array.from(resultList).map(result =>
      Array.from(result).map(alt => ({
        transcript: alt.transcript,
        confidence: alt.confidence
      }))
    ));
  }
  
  // Initialize
  setupEvents();
  loadWords();
});
