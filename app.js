// Fragen laden
async function loadQuestions() {
  const response = await fetch('fragen.json');
  if (!response.ok) {
    throw new Error('Konnte fragen.json nicht laden: ' + response.status);
  }
  const data = await response.json();
  return data;
}

// Zufällige Teilmenge wählen
function getRandomSubset(array, count) {
  const shuffled = array.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Popup anzeigen
function showSecretPopup() {
  const popup = document.getElementById('secret-popup');
  const secretCodeElem = document.getElementById('secret-code');

  // Hier dein gewünschtes Codewort setzen:
  const codewort = 'KEHRWERT'; // kannst du später beliebig ändern
  secretCodeElem.textContent = codewort;

  popup.style.display = 'flex';
}

// Neues Kreuzworträtsel erzeugen
async function generateNewCrossword() {
  const allQuestions = await loadQuestions();

  // Anzahl Wörter pro Rätsel – kannst du anpassen
  const selectionCount = Math.min(15, allQuestions.length);
  const randomQuestions = getRandomSubset(allQuestions, selectionCount);

  const words = randomQuestions.map(q => ({
    solution: q.solution.toUpperCase(),
    clue: q.clue
  }));

  const { grid, placedWords } = placeWords(words);
  renderGrid(grid, placedWords);

  const checkBtn = document.getElementById('check-btn');
  checkBtn.onclick = () => {
    const ok = checkSolution(grid);
    if (ok) {
      showSecretPopup();
    } else {
      alert('Es sind noch Fehler im Rätsel. Schau nochmal drüber.');
    }
  };
}


// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  generateNewCrossword().catch(err => {
    console.error(err);
    alert('Fehler beim Erzeugen des Kreuzworträtsels.');
  });

  const neuBtn = document.getElementById('neu-btn');
  neuBtn.addEventListener('click', () => {
    generateNewCrossword().catch(err => {
      console.error(err);
      alert('Fehler beim Erzeugen eines neuen Rätsels.');
    });
  });

  const closePopup = document.getElementById('close-popup');
  closePopup.addEventListener('click', () => {
    document.getElementById('secret-popup').style.display = 'none';
  });
});
