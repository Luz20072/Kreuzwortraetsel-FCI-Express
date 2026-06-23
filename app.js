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

  const codewort = 'KEHRWERT'; // kannst du später beliebig ändern
  secretCodeElem.textContent = codewort;

  popup.style.display = 'flex';
}

// Info-Popup anzeigen (für Fehler oder unfair kleine Rätsel)
function showInfoPopup(message) {
  const popup = document.getElementById('info-popup');
  const msgElem = document.getElementById('info-message');
  msgElem.textContent = message;
  popup.style.display = 'flex';
}


// Neues Kreuzworträtsel erzeugen
async function generateNewCrossword() {
  const allQuestions = await loadQuestions();

  const selectionCount = 10;
  if (allQuestions.length < selectionCount) {
    alert('Es werden mindestens 10 Fragen im Pool benötigt.');
    return;
  }

  const randomQuestions = getRandomSubset(allQuestions, selectionCount);

  const words = randomQuestions.map(q => ({
    solution: q.solution.toUpperCase(),
    clue: q.clue
  }));

  // Layout mit Backtracking erzeugen
  const { grid, placedWords } = generateLayout(words);

  if (!placedWords || placedWords.length === 0) {
    alert('Es konnte kein gültiges Kreuzworträtsel erzeugt werden. Versuche es nochmal.');
    return;
  }

  console.log('Platziert wurden:', placedWords.map(w => w.solution));

  renderGrid(grid, placedWords);

    const checkBtn = document.getElementById('check-btn');
  checkBtn.onclick = () => {
    const ok = checkSolution(grid, placedWords);

    if (!ok) {
      // Fehler im Rätsel -> Info-Popup statt alert
      showInfoPopup('Es sind noch Fehler im Rätsel. Schau bitte nochmal über deine Eingaben.');
      return;
    }

    // Fairness-Regel: Fünf oder weniger Begriffe -> unfair
    if (placedWords.length <= 5) {
      showInfoPopup('Dieses Rätsel hat zu wenige Begriffe und ist laut Regeln unfair. Bitte lade die Seite mit F5 neu, um ein neues Rätsel zu erzeugen.');
      return;
    }

    // Alles korrekt UND genug Begriffe -> Gewinn-Popup
    showSecretPopup();
  };

  };

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  generateNewCrossword().catch(err => {
    console.error(err);
    showInfoPopup('Fehler beim Erzeugen des Kreuzworträtsels.');
  });

  const closePopup = document.getElementById('close-popup');
  closePopup.addEventListener('click', () => {
    document.getElementById('secret-popup').style.display = 'none';
  });

  const closeInfoPopup = document.getElementById('close-info-popup');
  closeInfoPopup.addEventListener('click', () => {
    document.getElementById('info-popup').style.display = 'none';
  });
});

