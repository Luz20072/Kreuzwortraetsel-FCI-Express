const GRID_SIZE = 15;

// Leeres Gitter erzeugen
function createEmptyGrid() {
  const grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push(null); // null = Block / leer
    }
    grid.push(row);
  }
  return grid;
}

// Prüfen, ob ein Wort an Position passt (nur Konflikte prüfen, keine Nebenwörter)
function canPlaceWordBasic(grid, word, row, col, direction) {
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

// Wort aus dem Gitter entfernen (nur Buchstaben entfernen, die nicht von anderen Wörtern gebraucht werden)
function removeWordFromGrid(grid, word, row, col, direction, placedWords) {
  if (direction === 'across') {
    for (let i = 0; i < word.length; i++) {
      const r = row;
      const c = col + i;
      const ch = word[i];

      // prüfen, ob andere platzierte Wörter diesen Buchstaben ebenfalls nutzen
      const usedElsewhere = placedWords.some(w => {
        if (w.row === row && w.col === col && w.direction === direction && w.solution === word) {
          return false; // das ist genau dieses Wort
        }
        const len = w.solution.length;
        for (let k = 0; k < len; k++) {
          const wr = w.direction === 'across' ? w.row : w.row + k;
          const wc = w.direction === 'across' ? w.col + k : w.col;
          if (wr === r && wc === c && w.solution[k] === ch) {
            return true;
          }
        }
        return false;
      });

      if (!usedElsewhere) {
        grid[r][c] = null;
      }
    }
  } else {
    for (let i = 0; i < word.length; i++) {
      const r = row + i;
      const c = col;
      const ch = word[i];

      const usedElsewhere = placedWords.some(w => {
        if (w.row === row && w.col === col && w.direction === direction && w.solution === word) {
          return false;
        }
        const len = w.solution.length;
        for (let k = 0; k < len; k++) {
          const wr = w.direction === 'across' ? w.row : w.row + k;
          const wc = w.direction === 'across' ? w.col + k : w.col;
          if (wr === r && wc === c && w.solution[k] === ch) {
            return true;
          }
        }
        return false;
      });

      if (!usedElsewhere) {
        grid[r][c] = null;
      }
    }
  }
}

// Alle Wortstrecken im Grid finden
function findWordRuns(grid) {
  const runsAcross = [];
  const runsDown = [];

  // horizontal
  for (let r = 0; r < GRID_SIZE; r++) {
    let c = 0;
    while (c < GRID_SIZE) {
      if (grid[r][c] !== null && (c === 0 || grid[r][c - 1] === null)) {
        let start = c;
        let word = '';
        while (c < GRID_SIZE && grid[r][c] !== null) {
          word += grid[r][c];
          c++;
        }
        if (word.length >= 2) {
          runsAcross.push({ row: r, col: start, word });
        }
      } else {
        c++;
      }
    }
  }

  // vertikal
  for (let c = 0; c < GRID_SIZE; c++) {
    let r = 0;
    while (r < GRID_SIZE) {
      if (grid[r][c] !== null && (r === 0 || grid[r - 1][c] === null)) {
        let start = r;
        let word = '';
        while (r < GRID_SIZE && grid[r][c] !== null) {
          word += grid[r][c];
          r++;
        }
        if (word.length >= 2) {
          runsDown.push({ row: start, col: c, word });
        }
      } else {
        r++;
      }
    }
  }

  return { runsAcross, runsDown };
}

// Prüfen, ob alle gebildeten Wortstrecken gültige Wörter sind
function isLayoutValid(grid, words) {
  const wordSet = new Set(words.map(w => w.solution));
  const { runsAcross, runsDown } = findWordRuns(grid);
  const allRuns = [...runsAcross, ...runsDown];
  return allRuns.every(run => wordSet.has(run.word));
}

// Backtracking-Layout: versucht, so viele Wörter wie möglich zu platzieren
function generateLayout(words) {
  const grid = createEmptyGrid();

  // erstes Wort in der Mitte waagerecht
  const first = words[0];
  const midRow = Math.floor(GRID_SIZE / 2);
  const startCol = Math.floor((GRID_SIZE - first.solution.length) / 2);
  placeWordOnGrid(grid, first.solution, midRow, startCol, 'across');

  const placedWords = [{
    ...first,
    row: midRow,
    col: startCol,
    direction: 'across',
    number: 1
  }];

  let bestPlaced = placedWords.slice();
  let bestGrid = grid.map(row => row.slice());

  function backtrack(index, nextNumber) {
    if (index >= words.length) {
      // alle Wörter verarbeitet
      if (placedWords.length > bestPlaced.length && isLayoutValid(grid, placedWords)) {
        bestPlaced.splice(0, bestPlaced.length, ...placedWords.map(w => ({ ...w })));
        bestGrid = grid.map(row => row.slice());
      }
      return;
    }

    const wordObj = words[index];
    const word = wordObj.solution;

    // Versuche, das Wort an allen möglichen Kreuzungen anzudocken
    const positions = [];

    // Kandidatenpositionen: über alle bereits platzierten Wörter kreuzen
    for (const existing of placedWords) {
      const existingWord = existing.solution;

      for (let i = 0; i < word.length; i++) {
        const letter = word[i];
        for (let j = 0; j < existingWord.length; j++) {
          if (existingWord[j] !== letter) continue;

          // Position des existierenden Buchstabens im Grid
          const baseRow = existing.row + (existing.direction === 'down' ? j : 0);
          const baseCol = existing.col + (existing.direction === 'across' ? j : 0);

          // orthogonale Richtung
          const dir = existing.direction === 'across' ? 'down' : 'across';
          const startRow = dir === 'down' ? baseRow - i : baseRow;
          const startCol = dir === 'across' ? baseCol - i : baseCol;

          positions.push({ row: startRow, col: startCol, direction: dir });
        }
      }
    }

    // Zusätzlich: falls gar keine Kreuzmöglichkeit existiert, kann man optional
    // noch "frei" platzieren – hier lassen wir das erstmal weg, damit Worte immer kreuzen.

    // Positionen zufällig durchmischen, damit Layouts variieren
    const shuffled = positions.sort(() => Math.random() - 0.5);

    for (const pos of shuffled) {
      const { row, col, direction } = pos;

      // Startzelle darf nicht schon Start eines anderen Wortes sein
      const startUsed = placedWords.some(w => w.row === row && w.col === col);
      if (startUsed) continue;

      if (!canPlaceWordBasic(grid, word, row, col, direction)) continue;

      // temporär setzen
      placeWordOnGrid(grid, word, row, col, direction);
      placedWords.push({
        ...wordObj,
        row,
        col,
        direction,
        number: nextNumber
      });

      // Layout nach jedem Schritt validieren
      if (isLayoutValid(grid, placedWords)) {
        backtrack(index + 1, nextNumber + 1);
      }

      // zurücknehmen
      placedWords.pop();
      removeWordFromGrid(grid, word, row, col, direction, placedWords);
    }

    // Wenn wir dieses Wort gar nicht platzieren, trotzdem weiter:
    // vielleicht ist Layout mit weniger Wörtern besser/nötig.
    if (placedWords.length > bestPlaced.length && isLayoutValid(grid, placedWords)) {
      bestPlaced.splice(0, bestPlaced.length, ...placedWords.map(w => ({ ...w })));
      bestGrid = grid.map(row => row.slice());
    }
    backtrack(index + 1, nextNumber); // Wort überspringen
  }

  backtrack(1, 2); // wir haben Wort 0 schon gesetzt, nächste Nummer ist 2

  return { grid: bestGrid, placedWords: bestPlaced };
}

// Grid + Inputs + Hinweise zeichnen (mit Nummern und Pfeilen)
function renderGrid(grid, placedWords) {
  const table = document.getElementById('crossword');
  table.innerHTML = '';

  // Startzellen merken: "row-col" -> { number, hasAcross, hasDown }
  const startCells = new Map();
  placedWords.forEach(word => {
    const key = word.row + '-' + word.col;
    if (!startCells.has(key)) {
      startCells.set(key, { number: word.number, hasAcross: false, hasDown: false });
    }
    const entry = startCells.get(key);
    if (word.direction === 'across') {
      entry.hasAcross = true;
    } else if (word.direction === 'down') {
      entry.hasDown = true;
    }
  });

  // Mapping von Zellen zu Wort-IDs
  const cellWords = {}; // "r-c" -> { across: number|undefined, down: number|undefined }

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

        // Nummer + Pfeile in Startzellen anzeigen
        if (startCells.has(key)) {
          const entry = startCells.get(key);
          const num = entry.number;

          const container = document.createElement('span');
          container.style.position = 'absolute';
          container.style.top = '2px';
          container.style.left = '3px';
          container.style.fontSize = '10px';
          container.style.color = '#555';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.lineHeight = '1.0';

          const numSpan = document.createElement('span');
          numSpan.textContent = num;
          container.appendChild(numSpan);

          // Pfeile klar trennen:
          if (entry.hasAcross && !entry.hasDown) {
            const arrowRight = document.createElement('span');
            arrowRight.textContent = '→';
            arrowRight.style.fontSize = '8px';
            container.appendChild(arrowRight);
          } else if (entry.hasDown && !entry.hasAcross) {
            const arrowDown = document.createElement('span');
            arrowDown.textContent = '↓';
            arrowDown.style.fontSize = '8px';
            container.appendChild(arrowDown);
          } else if (entry.hasAcross && entry.hasDown) {
            // optional: ein Symbol für beides, oder nur Zahl ohne Pfeil
            const arrowBoth = document.createElement('span');
            arrowBoth.textContent = '↘';
            arrowBoth.style.fontSize = '8px';
            container.appendChild(arrowBoth);
          }

          td.appendChild(container);
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
    li.textContent = word.number + '. ' + word.clue;
    if (word.direction === 'across') {
      acrossList.appendChild(li);
    } else {
      downList.appendChild(li);
    }
  });

  // Eingabefluss: automatisch entlang des aktuellen Wortes springen
  const inputs = Array.from(document.querySelectorAll('#crossword input'));
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
      const hasAcross = !!input.dataset.across;
      const hasDown = !!input.dataset.down;

      if (hasAcross && !hasDown) {
        currentDirection = 'across';
      } else if (!hasAcross && hasDown) {
        currentDirection = 'down';
      } else if (hasAcross && hasDown) {
        currentDirection = 'across';
      }
    });

    input.addEventListener('input', (e) => {
      const value = e.target.value.toUpperCase();
      e.target.value = value;

      if (!value) return;

      const dirKey = currentDirection;
      const wordNumber = input.dataset[dirKey];
      if (!wordNumber) return;

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
function checkSolution(grid, placedWords) {
  const inputs = document.querySelectorAll('#crossword input');

  let allCorrect = true;

  // Erst alle Felder zurücksetzen
  inputs.forEach(input => {
    const td = input.parentElement;
    td.classList.remove('wrong');
  });

  // Dann prüfen und falsche markieren
  for (const input of inputs) {
    const r = parseInt(input.dataset.row, 10);
    const c = parseInt(input.dataset.col, 10);
    const expected = grid[r][c];
    const value = (input.value || '').toUpperCase();

    if (value !== expected) {
      allCorrect = false;
      const td = input.parentElement;
      td.classList.add('wrong');
    }
  }

  return allCorrect;
}