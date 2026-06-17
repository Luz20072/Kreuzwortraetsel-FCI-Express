const GRID_SIZE = 15; // 15x15 Feld

// Leeres Gitter erzeugen
function createEmptyGrid(size) {
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(null); // null = leer / Block
    }
    grid.push(row);
  }
  return grid;
}

// Versuch, Wörter ins Gitter zu legen (einfache Heuristik)
function placeWords(words) {
  const grid = createEmptyGrid(GRID_SIZE);
  const placedWords = [];

  if (words.length === 0) return { grid, placedWords };

  // Erstes Wort mittig horizontal
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
    const wordStr = words[w].solution;
    let placed = false;

    // Für jeden Buchstaben des neuen Wortes
    for (let i = 0; i < wordStr.length && !placed; i++) {
      const letter = wordStr[i];

      for (const existing of placedWords) {
        const existingWord = existing.solution;

        for (let j = 0; j < existingWord.length && !placed; j++) {
          if (existingWord[j] !== letter) continue;

          // Position des existierenden Buchstabens im Grid
          const baseRow = existing.row + (existing.direction === 'down' ? j : 0);
          const baseCol = existing.col + (existing.direction === 'across' ? j : 0);

          // Neues Wort orthogonal zur vorhandenen Richtung
          const newDir = existing.direction === 'across' ? 'down' : 'across';

          const startRow2 = newDir === 'down' ? baseRow - i : baseRow;
          const startCol2 = newDir === 'across' ? baseCol - i : baseCol;

          if (canPlaceWord(grid, wordStr, startRow2, startCol2, newDir)) {
            placeWordOnGrid(grid, wordStr, startRow2, startCol2, newDir);
            placedWords.push({
              ...words[w],
              row: startRow2,
              col: startCol2,
              direction: newDir,
              number: clueNumber++
            });
            placed = true;
          }
        }
      }
    }
    // Falls kein Kreuz möglich: Wort wird ignoriert
  }

  return { grid, placedWords };
}

// Prüfen, ob Wort an Position passt
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

// Wort ins Gitter schreiben
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

// Grid + Inputs + Hinweise zeichnen
function renderGrid(grid, placedWords) {
  const table = document.getElementById('crossword');
  table.innerHTML = '';

  // Startzellen der Wörter merken: "row-col" -> number
  const startCells = new Map();
  placedWords.forEach(word => {
    const key = word.row + '-' + word.col;
    startCells.set(key, word.number);
  });

  // Mapping von Zellen zu Wort-IDs
  const cellWords = {}; // key "r-c" -> { across: number|undefined, down: number|undefined }

  placedWords.forEach(word => {
    const len = word.solution.length;
    for (let i = 0; i < len; i++) {
      const r = word.direction === 'across' ? word.row : word.row + i;
      const c = word.direction === 'down' ? word.col : word.col + i;
      const key = r + '-' + c;
      if (!cellWords[key]) {
        cellWords[key] = {};
      }
      cellWords[key][word.direction] = word.number;
    }
  });

  for (let r = 0; r < GRID_SIZE; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < GRID_SIZE; c++) {
      const td = document.createElement('td');

      if (grid[r][c] === null) {
        td.classList.add('block');
      } else {
        td.style.position = 'relative';

        const input = document.createElement('input');
        input.maxLength = 1;
        input.dataset.row = r;
        input.dataset.col = c;

        const key = r + '-' + c;
        if (cellWords[key]) {
          if (cellWords[key].across) {
            input.dataset.across = cellWords[key].across;
          }
          if (cellWords[key].down) {
            input.dataset.down = cellWords[key].down;
          }
        }

        td.appendChild(input);

        // Nummer in Startzellen anzeigen
        if (startCells.has(key)) {
          const num = startCells.get(key);
          const label = document.createElement('span');
          label.textContent = num;
          label.style.position = 'absolute';
          label.style.top = '2px';
          label.style.left = '3px';
          label.style.fontSize = '10px';
          label.style.color = '#555';
          td.appendChild(label);
        }
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
    // eigene Nummer im Text; in index.html dann <ul> verwenden, wenn du keine doppelte Nummer willst
    li.textContent = word.number + '. ' + word.clue;
    if (word.direction === 'across') {
      acrossList.appendChild(li);
    } else {
      downList.appendChild(li);
    }
  });

  // Eingabefluss: automatisch entlang des aktuellen Wortes springen
  const inputs = Array.from(document.querySelectorAll('#crossword input'));

  // aktuelle Richtung: 'across' oder 'down'
  let currentDirection = 'across';

  function getInputsForWord(wordNumber, direction) {
    return inputs.filter(inp => inp.dataset[direction] == wordNumber)
      .sort((a, b) => {
        const ar = parseInt(a.dataset.row, 10);
        const ac = parseInt(a.dataset.col, 10);
        const br = parseInt(b.dataset.row, 10);
        const bc = parseInt(b.dataset.col, 10);
        if (direction === 'across') {
          return ac - bc || ar - br;
        } else {
          return ar - br || ac - bc;
        }
      });
  }

  inputs.forEach((input) => {
    input.addEventListener('focus', () => {
      // Beim Klick entscheiden, welche Richtung aktiv ist
      const hasAcross = !!input.dataset.across;
      const hasDown = !!input.dataset.down;

      if (hasAcross && !hasDown) {
        currentDirection = 'across';
      } else if (!hasAcross && hasDown) {
        currentDirection = 'down';
      } else if (hasAcross && hasDown) {
        // Kreuzungsfeld: Standard auf across, könnte man später toggeln
        currentDirection = 'across';
      }
    });

    input.addEventListener('input', (e) => {
      const value = e.target.value.toUpperCase();
      e.target.value = value;

      if (!value) return;

      const dirKey = currentDirection;
      const wordNumber = input.dataset[dirKey];
      if (!wordNumber) {
        return;
      }

      const wordInputs = getInputsForWord(wordNumber, dirKey);
      const index = wordInputs.indexOf(input);

      if (index > -1 && index < wordInputs.length - 1) {
        const nextInput = wordInputs[index + 1];
        nextInput.focus();
        nextInput.select();
      }
    });

    input.addEventListener('keydown', (e) => {
      const dirKey = currentDirection;
      const wordNumber = input.dataset[dirKey];

      if ((e.key === 'Backspace' || e.key === 'Delete') && wordNumber) {
        const wordInputs = getInputsForWord(wordNumber, dirKey);
        const index = wordInputs.indexOf(input);

        if (e.key === 'Backspace') {
          if (input.value) {
            // aktuellen Buchstaben löschen, nicht springen
            return;
          }
          if (index > 0) {
            e.preventDefault();
            const prevInput = wordInputs[index - 1];
            prevInput.focus();
            prevInput.value = '';
          }
        }
        return;
      }

      // Pfeiltasten steuern Richtung explizit
      const r = parseInt(input.dataset.row, 10);
      const c = parseInt(input.dataset.col, 10);
      let target = null;

      if (e.key === 'ArrowRight') {
        currentDirection = 'across';
        target = inputs.find(inp => inp.dataset.row == r && inp.dataset.col == c + 1);
      } else if (e.key === 'ArrowLeft') {
        currentDirection = 'across';
        target = inputs.find(inp => inp.dataset.row == r && inp.dataset.col == c - 1);
      } else if (e.key === 'ArrowDown') {
        currentDirection = 'down';
        target = inputs.find(inp => inp.dataset.row == r + 1 && inp.dataset.col == c);
      } else if (e.key === 'ArrowUp') {
        currentDirection = 'down';
        target = inputs.find(inp => inp.dataset.row == r - 1 && inp.dataset.col == c);
      }

      if (target) {
        e.preventDefault();
        target.focus();
        target.select();
      }
    });
  });
}

// Eingaben vs. Lösung vergleichen
function checkSolution(grid) {
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
