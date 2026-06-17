const GRID_SIZE = 15; // 15x15 Feld

async function loadQuestions() {
  const response = await fetch('fragen.json');
  if (!response.ok) {
    throw new Error('Konnte fragen.json nicht laden: ' + response.status);
  }
  const data = await response.json();
  return data;
}

function getRandomSubset(array, count) {
  const shuffled = array.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Gitter initialisieren
function createEmptyGrid(size) {
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(null); // null = leer / block
    }
    grid.push(row);
  }
  return grid;
}

// Versuch, Wörter ins Gitter zu legen (einfache Heuristik)
function placeWords(words) {
  const grid = createEmptyGrid(GRID_SIZE);
  const placedWords = [];

  // Erstes Wort mittig horizontal
  if (words.length === 0) return { grid, placedWords };
  const first = words[0];
  const startRow = Math.floor(GRID_SIZE / 2);
  const startCol = Math.floor((GRID_SIZE - first.solution.length) / 2);
  for (let i = 0; i < first.solution.length; i++) {
    grid[startRow][startCol + i] = first.solution[i];
  }
  placedWords.push({
    ...first,
    row: startRow,
    col: startCol,
    direction: 'across',
    number: 1
  });

  let clueNumber = 2;

  // Versuche, weitere Wörter anzudocken
  for (let w = 1; w < words.length; w++) {
    const word = words[w].solution;
    let placed = false;

    // Versuche, jeden Buchstaben an ein bestehendes Wort zu kreuzen
    for (let i = 0; i < word.length && !placed; i++) {
      const letter = word[i];

      for (const existing of placedWords) {
        const existingWord = existing.solution;
        for (let j = 0; j < existingWord.length && !placed; j++) {
          if (existingWord[j] !== letter) continue;

          // Position des existierenden Buchstabens im Grid
          const baseRow = existing.row + (existing.direction === 'down' ? j : 0);
          const baseCol = existing.col + (existing.direction === 'across' ? j : 0);

          // Neues Wort orthogonal zur vorhandenen Richtung
          const newDir = existing.direction === 'across' ? 'down' : 'across';

          const startRow = newDir === 'down' ? baseRow - i : baseRow;
          const startCol = newDir === 'across' ? baseCol - i : baseCol;

          if (canPlaceWord(grid, word, startRow, startCol, newDir)) {
            placeWordOnGrid(grid, word, startRow, startCol, newDir);
            placedWords.push({
              ...words[w],
              row: startRow,
              col: startCol,
              direction: newDir,
              number: clueNumber++
            });
            placed = true;
          }
        }
      }
    }

    // Falls kein Kreuz möglich: ignorieren wir das Wort erstmal
  }

  return { grid, placedWords };
}

function canPlaceWord(grid, word, row, col, direction) {
  if (direction === 'across') {
    if (col < 0 || col + word.length > GRID_SIZE) return false;
    for (let i = 0; i < word.length; i++) {
      const r = row;
      const c = col + i;
      if (r < 0 || r >= GRID_SIZE) return false;
      const cell = grid[r][c];
      if (cell !== null && cell !== word[i]) return false;
    }
  } else {
    if (row < 0 || row + word.length > GRID_SIZE) return false;
    for (let i = 0; i < word.length; i++) {
      const r = row + i;
      const c = col;
      if (c < 0 || c >= GRID_SIZE) return false;
      const cell = grid[r][c];
      if (cell !== null && cell !== word[i]) return false;
    }
  }
  return true;
}

function placeWordOnGrid(grid, word, row, col, direction) {
  if (direction === 'across') {
    for (let i = 0; i < word.length; i++) {
      grid[row][col + i] = word[i];
    }
  } else {
    for (let i = 0; i < word.length; i++) {
      grid[row + i][col] = word[i];
    }
  }
}

// Grid und Inputs zeichnen
function renderGrid(grid, placedWords) {
  const table = document.getElementById('crossword');
  table.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < GRID_SIZE; c++) {
      const td = document.createElement('td');
      if (grid[r][c] === null) {
        td.classList.add('block');
      } else {
        const input = document.createElement('input');
        input.maxLength = 1;
        input.dataset.row = r;
        input.dataset.col = c;
        td.appendChild(input);
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  // Hinweise rendern
  const acrossList = document.getElementById('hints-across');
  const downList = document.getElementById('hints-down');
  acrossList.innerHTML = '';
  downList.innerHTML = '';

  placedWords.forEach(word => {
    const li = document.createElement('li');
    li.textContent = word.number + '. ' + word.clue;
    if (word.direction === 'across') {
      acrossList.appendChild(li);
    } else {
      downList.appendChild(li);
    }
  });
}

// Eingaben prüfen
function checkSolution(grid, placedWords) {
  // Alle Inputs auslesen und vergleichen
  const inputs = document.querySelectorAll('#crossword input');
  for (const input of inputs) {
    const r = parseInt(input.dataset.row, 10);
    const c = parseInt(input.dataset.col, 10);
    const expected = grid[r][c];
    const value = (input.value || '').toUpperCase();
    if (value !== expected) {
      return false;
    }
  }
  return true;
}

function showSecretPopup() {
  const popup = document.getElementById('secret-popup');
  const secretCodeElem = document.getElementById('secret-code');
  // Hier dein gewünschtes Codewort setzen:
  const codewort = 'KEHRWERT'; // später gern dynamisch machen
  secretCodeElem.textContent = codewort;
  popup.style.display = 'flex';
}

async function generateNewCrossword() {
  const allQuestions = await loadQuestions();
  const selectionCount = Math.min(8, allQuestions.length);
  const randomQuestions = getRandomSubset(allQuestions, selectionCount);

  // Nur die wirklich zufällig gewählten, aber wir brauchen die .solution großgeschrieben
  const words = randomQuestions.map(q => ({
    solution: q.solution.toUpperCase(),
    clue: q.clue
  }));

  const { grid, placedWords } = placeWords(words);
  renderGrid(grid, placedWords);

  // Check-Button resetten
  const checkBtn = document.getElementById('check-btn');
  checkBtn.onclick = () => {
    const ok = checkSolution(grid, placedWords);
    if (ok) {
      showSecretPopup();
    } else {
      alert('Es sind noch Fehler im Rätsel. Schau nochmal drüber.');
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  generateNewCrossword();

  const neuBtn = document.getElementById('neu-btn');
  neuBtn.addEventListener('click', () => {
    generateNewCrossword();
  });

  const closePopup = document.getElementById('close-popup');
  closePopup.addEventListener('click', () => {
    document.getElementById('secret-popup').style.display = 'none';
  });
});
