async function loadQuestions() {
  try {
    const response = await fetch('fragen.json');
    const data = await response.json();

    const list = document.getElementById('fragen-liste');
    list.innerHTML = '';

    data.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.solution + ' – ' + item.clue;
      list.appendChild(li);
    });
  } catch (error) {
    console.error('Fehler beim Laden von fragen.json:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadQuestions);
