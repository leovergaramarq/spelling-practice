import db from "./db.json" with { type: "json" };

document.addEventListener("DOMContentLoaded", () => {
  const PLAY_WORD_DEFAULT_RATE = 0.8;
  const PLAY_WORD_SPEED_SLOW = 0.5;
  const PLAY_WORD_LABEL = "🔊 Play Word";
  const SKIP_WORD_LABEL = "🔁 Next Word";
  let words = [];
  let currentWord = undefined;
  let wordLists = {};
  let currentListName = db.default.lists[0].name;
  let isWordVisible = false;
  let defaultListNames = [];
  let utterance = undefined;
  
  function getAllWords() {
    return db.default.lists.flatMap((list) => list.words);
  }

  function getDefaultLists() {
    const lists = {};
    defaultListNames = [];
    
    db.default.lists.forEach((list) => {
      lists[list.name] = list.words;
      defaultListNames.push(list.name);
    });
    
    return lists;
  }

  function isDefaultList(listName) {
    return defaultListNames.includes(listName);
  }
  
  function setupEvents() {
    // document.getElementById("wordList").addEventListener("input", saveWords);
    document.getElementById("resetWords").addEventListener("click", resetWords);
    document.getElementById("saveWords").addEventListener("click", saveWords);
    document.getElementById("speakWord").addEventListener("click", speakWord);
    document.getElementById("replayWord").addEventListener("click", replayWord);
    document.getElementById("showHideWord").addEventListener("click", toggleWordVisibility);
    document.getElementById("checkAnswer").addEventListener("click", checkAnswer);
    document.getElementById("speakAnswer").addEventListener("click", speakAnswer);
    document.getElementById("createNewList").addEventListener("click", createNewList);
    document.getElementById("deleteList").addEventListener("click", deleteCurrentList);
    document.getElementById("wordListSelect").addEventListener("change", switchWordList);
    document.getElementById("answer").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        checkAnswer();
      }
    });
  }

  function resetWords() {
    if (!isDefaultList(currentListName)) {
      alert("Reset function only works for default lists!");
      return;
    }
    
    // Reset to original words from db.json for the current default list
    const listData = db.default.lists.find(list => list.name === currentListName);
    if (listData) {
      words = [...listData.words]; // Create a copy
      wordLists[currentListName] = words;
      currentWord = undefined;
      document.getElementById("wordList").value = words.join("\n");
      hideCurrentWord();
      document.getElementById("answer").value = "";
      document.getElementById("result").innerText = "";
      resetSpeakWordButtonLabel();
      updateButtonStates();
      saveWordLists();
      alert(`✅ "${listData.label}" reset to original words!`);
    }
  }

  function createNewList() {
    const listName = prompt("Enter name for new word list:");
    if (!listName || listName.trim() === "") {
      return;
    }
    
    const trimmedName = listName.trim();
    if (wordLists[trimmedName]) {
      alert("A list with this name already exists!");
      return;
    }
    
    if (isDefaultList(trimmedName)) {
      alert("Cannot use default list names for custom lists!");
      return;
    }
    
    wordLists[trimmedName] = [];
    currentListName = trimmedName;
    words = [];
    
    updateWordListSelector();
    renderWords();
    saveWordLists();
    // alert(`✅ New list "${trimmedName}" created!`);
  }

  function deleteCurrentList() {
    if (isDefaultList(currentListName)) {
      alert("Cannot delete default lists!");
      return;
    }
    
    const confirmDelete = confirm(`Are you sure you want to delete the list "${currentListName}"?`);
    if (!confirmDelete) {
      return;
    }
    
    delete wordLists[currentListName];
    // Switch to the first available default list
    currentListName = defaultListNames[0];
    
    updateWordListSelector();
    loadCurrentWordList();
    saveWordLists();
    alert("✅ List deleted!");
  }

  function switchWordList() {
    const select = document.getElementById("wordListSelect");
    currentListName = select.value;
    loadCurrentWordList();
    currentWord = undefined;
    hideCurrentWord();
    document.getElementById("answer").value = "";
    document.getElementById("result").innerText = "";
    resetSpeakWordButtonLabel();
    updateButtonStates();
  }
  
  function renderWords() {
    document.getElementById("wordList").value = words.join("\n");
  }
  
  // Load saved word lists or default
  function loadWordLists() {
    const defaultLists = getDefaultLists();
    const saved = localStorage.getItem("spellingWordLists");
    
    if (saved) {
      wordLists = JSON.parse(saved);
      // Always ensure default lists exist and are up to date
      Object.keys(defaultLists).forEach(listName => {
        wordLists[listName] = defaultLists[listName];
      });
    } else {
      wordLists = defaultLists;
    }
    
    updateWordListSelector();
    loadCurrentWordList();
  }

  function updateWordListSelector() {
    const select = document.getElementById("wordListSelect");
    select.innerHTML = "";
    
    // Sort lists: default lists first, then custom lists
    const sortedListNames = Object.keys(wordLists).sort((a, b) => {
      const aIsDefault = isDefaultList(a);
      const bIsDefault = isDefaultList(b);
      
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      return a.localeCompare(b);
    });
    
    sortedListNames.forEach(listName => {
      const option = document.createElement("option");
      option.value = listName;
      
      // Get the proper label for default lists
      if (isDefaultList(listName)) {
        const listData = db.default.lists.find(list => list.name === listName);
        option.textContent = listData ? listData.label : listName;
      } else {
        option.textContent = listName;
      }
      
      if (listName === currentListName) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  function loadCurrentWordList() {
    words = wordLists[currentListName] || [];
    renderWords();
  }
  
  function saveWords() {
    const input = document.getElementById("wordList").value.trim();
    words = input
      .split(/\s*\n\s*/)
      .filter(Boolean)
      .map((word) => word.toLowerCase()); // split by line
    
    wordLists[currentListName] = words;
    localStorage.setItem("spellingWordLists", JSON.stringify(wordLists));
    alert(`✅ Word list "${currentListName}" saved!`);
  }

  function saveWordLists() {
    localStorage.setItem("spellingWordLists", JSON.stringify(wordLists));
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
      updateButtonStates();
      return;
    }
    speakCurrentWord();
    document.getElementById("answer").value = "";
    document.getElementById("result").innerText = "";
    hideCurrentWord();
    // toggleSpeakWordButtonLabel();
    setSpeakWordButtonLabelToSkip();
    updateButtonStates();
  }

  function setSpeakWordButtonLabelToSkip() {
    const speakWordButton = document.getElementById("speakWord");
    if (speakWordButton.textContent === PLAY_WORD_LABEL) {
      speakWordButton.textContent = SKIP_WORD_LABEL;
    }
  }

  function resetSpeakWordButtonLabel() {
    const speakWordButton = document.getElementById("speakWord");
    speakWordButton.textContent = PLAY_WORD_LABEL;
  }

  function updateButtonStates() {
    const hasCurrentWord = currentWord && currentWord.trim() !== "";
    const replayButton = document.getElementById("replayWord");
    const showHideButton = document.getElementById("showHideWord");
    
    // Enable/disable buttons based on current word availability
    replayButton.disabled = !hasCurrentWord;
    showHideButton.disabled = !hasCurrentWord;
    
    // Update button styling for disabled state
    if (!hasCurrentWord) {
      replayButton.style.opacity = "0.5";
      replayButton.style.cursor = "not-allowed";
      showHideButton.style.opacity = "0.5";
      showHideButton.style.cursor = "not-allowed";
    } else {
      replayButton.style.opacity = "1";
      replayButton.style.cursor = "pointer";
      showHideButton.style.opacity = "1";
      showHideButton.style.cursor = "pointer";
    }
  }

  // function toggleSpeakWordButtonLabel() {
  //   const speakWordButton = document.getElementById("speakWord");
  //   speakWordButton.textContent = speakWordButton.textContent === PLAY_WORD_LABEL ? SKIP_WORD_LABEL : PLAY_WORD_LABEL;
  // }

  function speakCurrentWord(rate = PLAY_WORD_DEFAULT_RATE) {
    if (!currentWord) return;
    utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = "en-US";
    utterance.rate = rate;
    speechSynthesis.speak(utterance);
  }

  function replayWord() {
    if (!currentWord || document.getElementById("replayWord").disabled) {
      return; // Don't show alert if button is properly disabled
    }
    speakCurrentWord(PLAY_WORD_SPEED_SLOW);
  }

  function skipWord() {
    speakWord(); // This will get a new random word and speak it
  }

  function toggleWordVisibility() {
    if (!currentWord || document.getElementById("showHideWord").disabled) {
      return; // Don't show alert if button is properly disabled
    }
    isWordVisible = !isWordVisible;
    const display = document.getElementById("currentWordDisplay");
    if (isWordVisible) {
      display.style.display = "block";
      display.textContent = currentWord;
      document.getElementById("showHideWord").textContent = "🙈 Hide Word";
    } else {
      hideCurrentWord();
    }
  }

  function hideCurrentWord() {
    isWordVisible = false;
    const display = document.getElementById("currentWordDisplay");
    display.style.display = "none";
    display.textContent = "";
    document.getElementById("showHideWord").textContent = "👁️ Show Word";
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
  loadWordLists();
  updateButtonStates();
});
