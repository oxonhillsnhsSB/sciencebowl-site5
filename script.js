const ACCESS_USER = 'OHHSSNHS';
const ACCESS_PASS = 'ScienceBowl';
const STORAGE_KEY = 'scienceBowlData';
const CATEGORIES = [
  'Chemistry',
  'Biology',
  'Physics',
  'Environmental Sciences',
  'Mathematics',
  'Earth and Space Science',
  'Energy Science',
  'General Science'
];

const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const modeScreen = document.getElementById('mode-screen');
const modeContent = document.getElementById('mode-content');
const loginButton = document.getElementById('login-button');
const loginError = document.getElementById('login-error');
const welcomeText = document.getElementById('welcome-text');
const leaderboardButton = document.getElementById('leaderboard-button');
const questionEditorButton = document.getElementById('question-editor-button');
const logoutButton = document.getElementById('logout-button');
const startDailyButton = document.getElementById('start-daily');
const startPracticeButton = document.getElementById('start-practice');
const startBuzzerButton = document.getElementById('start-buzzer');
const closeModeButton = document.getElementById('close-mode');

const statDaily = document.getElementById('stat-daily');
const statPractice = document.getElementById('stat-practice');
const statBuzzer = document.getElementById('stat-buzzer');
const statTotal = document.getElementById('stat-total');
const statStreak = document.getElementById('stat-streak');

const usernameInput = document.getElementById('login-username');
const passwordInput = document.getElementById('login-password');
const displayNameInput = document.getElementById('login-displayname');

let appData = null;
let sessionUser = null;
let modeState = null;

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('Invalid storage data, resetting.', error);
    }
  }
  const initial = {
    users: {},
    questions: sampleQuestions(),
  };
  saveData(initial);
  return initial;
}

function saveData(data = appData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function init() {
  appData = loadData();

  // Add login button event listener
  loginButton.addEventListener('click', handleLogin);

  // Keep event listeners for other functionality
  logoutButton.addEventListener('click', handleLogout);
  startDailyButton.addEventListener('click', openDailyMode);
  startPracticeButton.addEventListener('click', openPracticeMode);
  startBuzzerButton.addEventListener('click', openBuzzerMode);
  leaderboardButton.addEventListener('click', showLeaderboard);
  questionEditorButton.addEventListener('click', showQuestionEditor);
  closeModeButton.addEventListener('click', closeMode);
  modeScreen.addEventListener('click', (event) => {
    if (event.target === modeScreen) {
      closeMode();
    }
  });
}

init();

function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const displayName = displayNameInput.value.trim() || 'Participant';

  if (username !== ACCESS_USER || password !== ACCESS_PASS) {
    loginError.textContent = 'Wrong username or password, try again.';
    return;
  }

  loginError.textContent = '';
  sessionUser = username;
  if (!appData.users[username]) {
    appData.users[username] = createUserRecord(displayName);
  } else {
    appData.users[username].displayName = displayName;
  }
  saveData();
  showApp();
}

function createUserRecord(name) {
  return {
    displayName: name,
    stats: {
      dailyPoints: 0,
      practicePoints: 0,
      buzzerPoints: 0,
      totalPoints: 0,
      dailyStreak: 0,
      lastDailyDate: null,
    },
    history: {
      daily: [],
      practice: [],
      buzzer: []
    }
  };
}

function handleLogout() {
  sessionUser = null;
  appScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginError.textContent = '';
  usernameInput.value = '';
  passwordInput.value = '';
  displayNameInput.value = '';
}

function showApp() {
  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  const user = appData.users[sessionUser];
  welcomeText.textContent = `Welcome, ${user.displayName}! Choose a mode to begin.`;
  renderStats();
}

function renderStats() {
  const user = appData.users[sessionUser];
  statDaily.textContent = user.stats.dailyPoints;
  statPractice.textContent = user.stats.practicePoints;
  statBuzzer.textContent = user.stats.buzzerPoints;
  statTotal.textContent = user.stats.totalPoints;
  statStreak.textContent = user.stats.dailyStreak;
}

function showModal(html) {
  modeContent.innerHTML = html;
  modeScreen.classList.remove('hidden');
}

function closeMode() {
  modeScreen.classList.add('hidden');
  modeContent.innerHTML = '';
  if (modeState && modeState.cleanup) {
    modeState.cleanup();
  }
  modeState = null;
}

function showLeaderboard() {
  const rows = Object.values(appData.users)
    .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
    .slice(0, 12)
    .map((user, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${user.displayName}</td>
        <td>${user.stats.totalPoints}</td>
        <td>${user.stats.dailyStreak}</td>
      </tr>
    `)
    .join('');

  showModal(`
    <div class="mode-header">
      <div>
        <h2>Leaderboard</h2>
        <p class="small-note">Your best scores are saved in browser storage.</p>
      </div>
    </div>
    <table class="table">
      <thead>
        <tr><th>#</th><th>Name</th><th>Total Points</th><th>Daily Streak</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `);
}

function showQuestionEditor() {
  const editorPassword = prompt('Enter the password to access the Question Editor:');
  if (editorPassword !== 'editquestions') {
    alert('Incorrect password. Access denied.');
    return;
  }

  const rows = appData.questions
    .map((question, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${question.category}</td>
        <td>${question.difficulty}</td>
        <td>${question.question}</td>
        <td>${question.options[question.answerIndex]}</td>
        <td><button class="secondary" data-delete-id="${question.id}">Delete</button></td>
      </tr>`)
    .join('');

  showModal(`
    <div class="mode-header">
      <div>
        <h2>Practice Question Editor</h2>
        <p class="small-note">Add, review, or delete the practice questions used by all modes.</p>
      </div>
    </div>
    <div class="mode-actions">
      <div class="mode-form">
        <label>Category</label>
        <select id="editor-category">${CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}</select>
        <label>Difficulty</label>
        <select id="editor-difficulty">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <label>Question</label>
        <textarea id="editor-question" rows="3" placeholder="Enter the question text"></textarea>
        <label>Answer Option A</label>
        <input id="editor-opt-a" placeholder="Option A" />
        <label>Answer Option B</label>
        <input id="editor-opt-b" placeholder="Option B" />
        <label>Answer Option C</label>
        <input id="editor-opt-c" placeholder="Option C" />
        <label>Answer Option D</label>
        <input id="editor-opt-d" placeholder="Option D" />
        <label>Correct Option</label>
        <select id="editor-answer-index">
          <option value="0">A</option>
          <option value="1">B</option>
          <option value="2">C</option>
          <option value="3">D</option>
        </select>
        <button id="editor-save-button">Add Question</button>
      </div>
      <div>
        <table class="table">
          <thead><tr><th>#</th><th>Category</th><th>Difficulty</th><th>Question</th><th>Answer</th><th>Action</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `);

  document.getElementById('editor-save-button').addEventListener('click', () => {
    const category = document.getElementById('editor-category').value;
    const difficulty = document.getElementById('editor-difficulty').value;
    const question = document.getElementById('editor-question').value.trim();
    const options = [
      document.getElementById('editor-opt-a').value.trim(),
      document.getElementById('editor-opt-b').value.trim(),
      document.getElementById('editor-opt-c').value.trim(),
      document.getElementById('editor-opt-d').value.trim(),
    ];
    const answerIndex = Number(document.getElementById('editor-answer-index').value);

    if (!question || options.some(opt => !opt)) {
      alert('Please fill all question fields before adding.');
      return;
    }

    appData.questions.push({
      id: crypto.randomUUID(),
      category,
      difficulty,
      question,
      options,
      answerIndex,
    });
    saveData();
    showQuestionEditor();
  });

  modeContent.querySelectorAll('[data-delete-id]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.deleteId;
      appData.questions = appData.questions.filter(item => item.id !== id);
      saveData();
      showQuestionEditor();
    });
  });
}

function openDailyMode() {
  const user = appData.users[sessionUser];
  const today = new Date().toISOString().split('T')[0];
  const alreadyDone = user.stats.lastDailyDate === today;
  if (alreadyDone) {
    showModal(`
      <div class="mode-header">
        <div>
          <h2>Daily Login</h2>
          <p class="small-note">You have already completed today's daily set. Come back tomorrow for a new challenge.</p>
        </div>
      </div>
      <p>You earned <strong>${user.history.daily.slice(-1)[0]?.score ?? 0}</strong> points today.</p>
      <button id="daily-replay-button">Review Last Daily</button>
    `);

    document.getElementById('daily-replay-button').addEventListener('click', () => {
      startDailyMode(true);
    });
    return;
  }
  startDailyMode();
}

function startDailyMode(readOnly = false) {
  const questions = buildDailyQuestions();
  const title = readOnly ? 'Daily Review' : 'Daily Login';
  const description = readOnly
    ? 'Review your last daily questions and answers.'
    : 'Answer 5 daily questions. Timed and scored with category variety.';

  modeState = createQuizState({
    title,
    description,
    questions,
    timed: true,
    onComplete: (result) => {
      if (!readOnly) {
        const user = appData.users[sessionUser];
        const today = new Date().toISOString().split('T')[0];
        user.stats.dailyPoints += result.score;
        user.stats.totalPoints += result.score;
        user.stats.lastDailyDate = today;
        if (user.history.daily.length && user.history.daily.slice(-1)[0].date === today) {
          // do nothing
        } else {
          const streak = user.stats.lastDailyDate === today && user.history.daily.slice(-1)[0]?.date === yesterdayDate()
            ? user.stats.dailyStreak + 1
            : 1;
          user.stats.dailyStreak = streak;
        }
        user.history.daily.push({ date: today, score: result.score });
        saveData();
        renderStats();
      }
    }
  });
  showModal(modeState.render());
  modeState.start?.();
}

function buildDailyQuestions() {
  const easy = randomQuestions('easy', 2);
  const medium = randomQuestions('medium', 2);
  const hard = randomQuestions('hard', 1);
  return [...easy, ...medium, ...hard];
}

function openPracticeMode() {
  showModal(`
    <div class="mode-header">
      <div>
        <h2>Practice Mode</h2>
        <p class="small-note">Select a science branch or randomized question set, then practice with all answers shown at the end.</p>
      </div>
    </div>
    <div class="mode-form">
      <label>Branch</label>
      <select id="practice-category">
        <option value="random">Randomized</option>
        ${CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
      </select>
      <label>Number of Questions</label>
      <input id="practice-count" type="number" min="3" max="20" value="8" />
      <button id="practice-start-button">Start Practice</button>
    </div>
  `);

  document.getElementById('practice-start-button').addEventListener('click', () => {
    const category = document.getElementById('practice-category').value;
    const count = Math.min(20, Math.max(3, Number(document.getElementById('practice-count').value)));
    const questions = buildPracticeQuestions(category, count);
    modeState = createQuizState({
      title: 'Practice Mode',
      description: `Practice ${count} questions from ${category === 'random' ? 'all categories' : category}.`,
      questions,
      timed: true,
      onComplete: (result) => {
        const user = appData.users[sessionUser];
        user.stats.practicePoints += result.score;
        user.stats.totalPoints += result.score;
        user.history.practice.push({ date: new Date().toISOString(), score: result.score });
        saveData();
        renderStats();
      }
    });
    showModal(modeState.render());
    modeState.start?.();
  });
}

function buildPracticeQuestions(category, count) {
  let pool = appData.questions;
  if (category !== 'random') {
    pool = pool.filter(item => item.category === category);
  }
  return randomize(pool).slice(0, count);
}

function openBuzzerMode() {
  showModal(`
    <div class="mode-header">
      <div>
        <h2>Buzzer Mode</h2>
        <p class="small-note">Red vs Blue buzzer competition! First to buzz gets to answer the question. Use buttons or keyboard shortcuts (A/L keys).</p>
      </div>
    </div>
    <div class="mode-form">
      <button id="buzzer-vs-computer">Play vs Computer</button>
      <button id="buzzer-vs-friend">Play vs Friend (same device)</button>
    </div>
  `);

  document.getElementById('buzzer-vs-computer').addEventListener('click', () => {
    startBuzzerGame('computer');
  });
  document.getElementById('buzzer-vs-friend').addEventListener('click', () => {
    startBuzzerGame('friend');
  });
}

function startBuzzerGame(mode) {
  const questions = randomize(appData.questions).slice(0, 10);
  modeState = createBuzzerState({
    mode,
    questions,
    onComplete: (result) => {
      const user = appData.users[sessionUser];
      user.stats.buzzerPoints += result.userScore;
      user.stats.totalPoints += result.userScore;
      user.history.buzzer.push({ date: new Date().toISOString(), score: result.userScore, mode });
      saveData();
      renderStats();
    }
  });
  showModal(modeState.render());
  modeState.start?.();
}

function randomQuestions(difficulty, count) {
  return randomize(appData.questions.filter(q => q.difficulty === difficulty)).slice(0, count);
}

function randomize(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function yesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function createQuizState({ title, description, questions, timed, onComplete }) {
  let currentIndex = 0;
  const answers = [];
  const questionCount = questions.length;
  let timerId = null;
  let remaining = 30;

  function renderQuestion() {
    const question = questions[currentIndex];
    const optionButtons = question.options.map((option, idx) => `
      <button class="option-button" data-option="${idx}">${option}</button>
    `).join('');

    return `
      <div class="mode-header">
        <div>
          <h2>${title}</h2>
          <small>${description}</small>
        </div>
        <div>
          <p>Question ${currentIndex + 1} / ${questionCount}</p>
          ${timed ? `<p><strong>Time left:</strong> <span id="quiz-timer">${remaining}</span> sec</p>` : ''}
        </div>
      </div>
      <div class="question-block">
        <p class="question-text">${question.question}</p>
        <div class="options">${optionButtons}</div>
      </div>
    `;
  }

  function renderReview(result) {
    const rows = questions.map((question, idx) => {
      const chosen = answers[idx];
      const correct = question.answerIndex;
      const isCorrect = chosen === correct;
      const answerText = question.options[correct];
      return `
        <div class="question-block">
          <p class="question-text">${idx + 1}. ${question.question}</p>
          <p><strong>Your choice:</strong> ${chosen === null ? 'No answer' : question.options[chosen]}</p>
          <p><strong>Correct answer:</strong> ${answerText}</p>
          <p class="explanation ${isCorrect ? '' : ''}">${isCorrect ? 'Correct!' : 'Keep practicing and try again.'}</p>
        </div>
      `;
    }).join('');

    return `
      <div class="mode-header">
        <div>
          <h2>${title} Result</h2>
          <p class="small-note">Your score: ${result.score} / ${questionCount}.</p>
        </div>
      </div>
      ${rows}
    `;
  }

  function handleOptionClick(event) {
    const button = event.target.closest('[data-option]');
    if (!button) return;
    clearInterval(timerId);
    const answerIndex = Number(button.dataset.option);
    answers[currentIndex] = answerIndex;
    currentIndex += 1;
    if (currentIndex >= questionCount) {
      finishQuiz();
    } else {
      remaining = 30;
      renderScreen();
    }
  }

  function startTimer() {
    if (!timed) return;
    timerId = setInterval(() => {
      remaining -= 1;
      const timerLabel = document.getElementById('quiz-timer');
      if (timerLabel) timerLabel.textContent = String(remaining);
      if (remaining <= 0) {
        clearInterval(timerId);
        answers[currentIndex] = null;
        currentIndex += 1;
        if (currentIndex >= questionCount) {
          finishQuiz();
        } else {
          remaining = 30;
          renderScreen();
        }
      }
    }, 1000);
  }

  function renderScreen() {
    modeContent.innerHTML = renderQuestion();
    modeContent.querySelectorAll('[data-option]').forEach(button => {
      button.addEventListener('click', handleOptionClick);
    });
    if (timed) {
      clearInterval(timerId);
      remaining = 30;
      startTimer();
    }
  }

  function finishQuiz() {
    clearInterval(timerId);
    const score = answers.reduce((total, chosen, idx) => {
      return total + (chosen === questions[idx].answerIndex ? 10 : 0);
    }, 0);
    modeContent.innerHTML = renderReview({ score });
    onComplete({ score });
  }

  function render() {
    answers.length = questions.length;
    answers.fill(null);
    return `
      <div id="quiz-starter">
        <div class="mode-header">
          <div>
            <h2>${title}</h2>
            <p>${description}</p>
          </div>
        </div>
        <button id="quiz-start-button">Begin Quiz</button>
      </div>
    `;
  }

  function setup() {
    const startButton = document.getElementById('quiz-start-button');
    if (startButton) {
      startButton.addEventListener('click', () => {
        renderScreen();
      });
    }
  }

  return {
    render,
    cleanup() {
      clearInterval(timerId);
    },
    start: setup
  };
}

function createBuzzerState({ mode, questions, onComplete }) {
  let currentIndex = 0;
  let player1Score = 0; // Red buzzer (human in vs computer, player1 in vs friend)
  let player2Score = 0; // Blue buzzer (computer in vs computer, player2 in vs friend)
  let status = '';
  let waitingForBuzz = false;
  let computerTimer = null;
  let buzzedPlayer = null; // 'player1' or 'player2'
  let gameEnded = false;

  // Keyboard event listener for desktop shortcuts
  function handleKeyPress(event) {
    if (!waitingForBuzz || gameEnded) return;

    if (event.key.toLowerCase() === 'a') {
      // Player 1 (Red) buzzer
      event.preventDefault();
      handleBuzz('player1');
    } else if (event.key.toLowerCase() === 'l') {
      // Player 2 (Blue) buzzer
      event.preventDefault();
      handleBuzz('player2');
    }
  }

  function getQuestionBlock() {
    const question = questions[currentIndex];
    const isTiebreaker = currentIndex >= 10; // Questions 11+ are tiebreakers

    return `
      <div class="mode-header">
        <div>
          <h2>Buzzer Mode - ${mode === 'computer' ? 'vs Computer' : 'vs Friend'}</h2>
          <p class="small-note">Question ${Math.min(currentIndex + 1, 10)} of 10${isTiebreaker ? ' (Tiebreaker)' : ''}</p>
        </div>
        <div>
          <p><strong>Red:</strong> ${player1Score} | <strong>Blue:</strong> ${player2Score}</p>
        </div>
      </div>
      <div class="question-block">
        <p class="question-text">${question.question}</p>
        <div class="options">${question.options.map((option, idx) => `<button class="option-button" data-answer="${idx}" ${buzzedPlayer ? '' : 'disabled'}>${option}</button>`).join('')}</div>
      </div>
      <div class="mode-actions">
        ${renderBuzzControls()}
        <p class="small-note">${status}</p>
      </div>
    `;
  }

  function renderBuzzControls() {
    if (currentIndex >= questions.length || gameEnded) return '';
    if (buzzedPlayer) return '';

    if (!waitingForBuzz) {
      return `<button id="buzz-start">Start Round</button>`;
    }

    // Show buzzer buttons for both players
    return `
      <div class="buzzer-section">
        <div class="buzzer-controls">
          <button id="buzz-red" class="buzzer-button red-buzzer">
            <div class="buzzer-label">RED</div>
            <div class="buzzer-shortcut">(A key)</div>
          </button>
          <button id="buzz-blue" class="buzzer-button blue-buzzer">
            <div class="buzzer-label">BLUE</div>
            <div class="buzzer-shortcut">(L key)</div>
          </button>
        </div>
        <p class="buzzer-instructions">⚡ First to buzz gets to answer! ⚡</p>
      </div>
    `;
  }

  function renderResult() {
    let verdict = '';
    let winner = '';

    if (player1Score > player2Score) {
      verdict = 'Red wins!';
      winner = 'player1';
    } else if (player2Score > player1Score) {
      verdict = 'Blue wins!';
      winner = 'player2';
    } else {
      verdict = 'It\'s a tie! Playing tiebreaker...';
      return renderTiebreakerSetup();
    }

    return `
      <div class="mode-header">
        <div>
          <h2>🎉 Game Complete! 🎉</h2>
          <p class="small-note">${verdict}</p>
        </div>
      </div>
      <div class="final-scores">
        <div class="score-display red-score">
          <div class="score-label">RED</div>
          <div class="score-value">${player1Score}</div>
        </div>
        <div class="score-display blue-score">
          <div class="score-label">BLUE</div>
          <div class="score-value">${player2Score}</div>
        </div>
      </div>
      <p class="game-summary">${mode === 'computer' ? 'You were <span class="red-text">RED</span>, Computer was <span class="blue-text">BLUE</span>' : 'Player 1 was <span class="red-text">RED</span>, Player 2 was <span class="blue-text">BLUE</span>'}</p>
    `;
  }

  function renderTiebreakerSetup() {
    return `
      <div class="mode-header">
        <div>
          <h2>⚡ SUDDEN DEATH! ⚡</h2>
          <p class="small-note">Scores are tied. First to answer correctly wins!</p>
        </div>
      </div>
      <div class="final-scores">
        <div class="score-display red-score">
          <div class="score-label">RED</div>
          <div class="score-value">${player1Score}</div>
        </div>
        <div class="score-display blue-score">
          <div class="score-label">BLUE</div>
          <div class="score-value">${player2Score}</div>
        </div>
      </div>
      <div class="mode-actions">
        <button id="start-tiebreaker" class="tiebreaker-button">🚀 Start Tiebreaker 🚀</button>
      </div>
    `;
  }

  function render() {
    return `
      <div id="buzzer-root">
        ${getQuestionBlock()}
      </div>
    `;
  }

  function playRound() {
    gameEnded = false;
    if (currentIndex >= questions.length) {
      endGame();
      return;
    }
    waitingForBuzz = true;
    buzzedPlayer = null;
    status = '<span class="go-signal">⚡ GO! ⚡</span>';
    updateScreen();

    if (mode === 'computer') {
      const delay = 2000 + Math.random() * 4000; // 2-6 seconds for computer
      computerTimer = setTimeout(() => {
        if (waitingForBuzz) {
          handleBuzz('player2'); // Computer is blue (player2)
        }
      }, delay);
    }
  }

  function handleBuzz(player) {
    if (!waitingForBuzz || buzzedPlayer) return;

    waitingForBuzz = false;
    buzzedPlayer = player;
    clearTimeout(computerTimer);

    const playerName = player === 'player1' ? '<span class="red-text">RED</span>' : '<span class="blue-text">BLUE</span>';
    status = `${playerName} buzzed first! Choose an answer.`;

    updateScreen();
  }

  function handleAnswerClick(event) {
    const chosen = Number(event.target.dataset.answer);
    const question = questions[currentIndex];
    const correct = question.answerIndex;

    const playerName = buzzedPlayer === 'player1' ? 'Red' : 'Blue';

    if (chosen === correct) {
      if (buzzedPlayer === 'player1') {
        player1Score += 10;
      } else {
        player2Score += 10;
      }
      status = `${playerName} answered correctly and earns 10 points!`;
    } else {
      status = `${playerName} answered incorrectly. The correct answer was: ${question.options[correct]}`;
    }

    updateScreen();
    advanceAfterDelay();
  }

  function advanceAfterDelay() {
    setTimeout(() => {
      currentIndex += 1;
      if (currentIndex >= questions.length) {
        endGame();
      } else {
        status = '';
        playRound();
      }
    }, 2500);
  }

  function endGame() {
    waitingForBuzz = false;
    document.removeEventListener('keydown', handleKeyPress);

    // Check for tiebreaker - only after all 10 regular questions
    if (player1Score === player2Score && currentIndex >= 10 && questions.length === 10) {
      // Get a hard question for tiebreaker
      const hardQuestions = appData.questions.filter(q => q.difficulty === 'hard');
      if (hardQuestions.length > 0) {
        const tiebreakerQuestion = randomize(hardQuestions).slice(0, 1)[0];
        questions.push(tiebreakerQuestion);
        modeContent.innerHTML = renderTiebreakerSetup();

        document.getElementById('start-tiebreaker').addEventListener('click', () => {
          gameEnded = false;
          playRound();
        });
        return;
      }
    }

    gameEnded = true;
    modeContent.innerHTML = renderResult();
    onComplete({
      userScore: mode === 'computer' ? player1Score : player1Score,
      opponentScore: mode === 'computer' ? player2Score : player2Score
    });
  }

  function updateScreen() {
    modeContent.innerHTML = getQuestionBlock();
    setupEventListeners();
  }

  function setupEventListeners() {
    const startButton = document.getElementById('buzz-start');
    if (startButton) {
      startButton.addEventListener('click', () => {
        playRound();
      });
    }

    const buzzRed = document.getElementById('buzz-red');
    const buzzBlue = document.getElementById('buzz-blue');

    if (buzzRed) {
      buzzRed.addEventListener('click', () => handleBuzz('player1'));
    }
    if (buzzBlue) {
      buzzBlue.addEventListener('click', () => handleBuzz('player2'));
    }

    const answerButtons = modeContent.querySelectorAll('[data-answer]');
    answerButtons.forEach(button => {
      button.addEventListener('click', handleAnswerClick);
    });
  }

  function start() {
    document.addEventListener('keydown', handleKeyPress);
    setupEventListeners();
  }

  function cleanup() {
    document.removeEventListener('keydown', handleKeyPress);
    if (computerTimer) {
      clearTimeout(computerTimer);
    }
  }

  return { render, start, cleanup };
}

function sampleQuestions() {
  return [
    {
      id: 'q1',
      category: 'Chemistry',
      difficulty: 'easy',
      question: 'What is the chemical symbol for water?',
      options: ['H2O', 'O2', 'CO2', 'HO'],
      answerIndex: 0
    },
    {
      id: 'q2',
      category: 'Biology',
      difficulty: 'easy',
      question: 'Which part of a plant makes food by photosynthesis?',
      options: ['Flower', 'Leaf', 'Root', 'Seed'],
      answerIndex: 1
    },
    {
      id: 'q3',
      category: 'Physics',
      difficulty: 'easy',
      question: 'What force pulls objects toward Earth?',
      options: ['Magnetism', 'Friction', 'Gravity', 'Light'],
      answerIndex: 2
    },
    {
      id: 'q4',
      category: 'Mathematics',
      difficulty: 'easy',
      question: 'What is 7 × 8?',
      options: ['48', '54', '56', '64'],
      answerIndex: 2
    },
    {
      id: 'q5',
      category: 'Environmental Sciences',
      difficulty: 'medium',
      question: 'Which of these is a renewable energy source?',
      options: ['Coal', 'Oil', 'Solar', 'Natural gas'],
      answerIndex: 2
    },
    {
      id: 'q6',
      category: 'Earth and Space Science',
      difficulty: 'medium',
      question: 'What layer of Earth is directly below the crust?',
      options: ['Mantle', 'Core', 'Atmosphere', 'Lithosphere'],
      answerIndex: 0
    },
    {
      id: 'q7',
      category: 'Energy Science',
      difficulty: 'medium',
      question: 'What type of energy is stored in a stretched spring?',
      options: ['Kinetic', 'Thermal', 'Nuclear', 'Elastic potential'],
      answerIndex: 3
    },
    {
      id: 'q8',
      category: 'Physics',
      difficulty: 'hard',
      question: 'What is the unit of electrical resistance?',
      options: ['Volt', 'Ohm', 'Ampere', 'Watt'],
      answerIndex: 1
    },
    {
      id: 'q9',
      category: 'Chemistry',
      difficulty: 'hard',
      question: 'Which term describes a reaction that absorbs heat from the surroundings?',
      options: ['Exothermic', 'Endothermic', 'Catalytic', 'Photochemical'],
      answerIndex: 1
    },
    {
      id: 'q10',
      category: 'Biology',
      difficulty: 'hard',
      question: 'Which organ system transports nutrients and oxygen throughout the body?',
      options: ['Digestive', 'Respiratory', 'Circulatory', 'Nervous'],
      answerIndex: 2
    },
    {
      id: 'q11',
      category: 'Mathematics',
      difficulty: 'medium',
      question: 'What is the slope of the line that passes through (2, 4) and (6, 12)?',
      options: ['1', '2', '3', '4'],
      answerIndex: 1
    },
    {
      id: 'q12',
      category: 'Earth and Space Science',
      difficulty: 'easy',
      question: 'What object orbits the Earth?',
      options: ['Sun', 'Moon', 'Mars', 'Venus'],
      answerIndex: 1
    },
    {
      id: 'q13',
      category: 'Environmental Sciences',
      difficulty: 'easy',
      question: 'Which gas is most associated with climate change?',
      options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'],
      answerIndex: 2
    },
    {
      id: 'q14',
      category: 'Energy Science',
      difficulty: 'hard',
      question: 'Which process converts chemical energy into electrical energy in a battery?',
      options: ['Combustion', 'Electrochemical reaction', 'Nuclear fusion', 'Photosynthesis'],
      answerIndex: 1
    },
    {
      id: 'q15',
      category: 'Chemistry',
      difficulty: 'medium',
      question: 'Which pH value describes a basic solution?',
      options: ['2', '5', '7', '10'],
      answerIndex: 3
    },
    {
      id: 'q16',
      category: 'Chemistry',
      difficulty: 'easy',
      question: 'An aqueous solution in which the concentration of OH⁻ ions is greater than that of H⁺ ions is:',
      options: ['basic', 'acidic', 'neutral', 'in equilibrium'],
      answerIndex: 0
    },
    {
      id: 'q17',
      category: 'Earth and Space Science',
      difficulty: 'medium',
      question: 'The overall charge at the top and bottom, respectively, of a towering cumulonimbus cloud during a thunderstorm is:',
      options: ['positive, positive', 'positive, negative', 'negative, positive', 'negative, negative'],
      answerIndex: 1
    },
    {
      id: 'q18',
      category: 'Earth and Space Science',
      difficulty: 'easy',
      question: 'A lightning bolt is seen and its accompanying thunder is heard 15 seconds later. This means the storm is most likely how many miles away:',
      options: ['3', '6', '9', '15'],
      answerIndex: 0
    },
    {
      id: 'q19',
      category: 'Biology',
      difficulty: 'easy',
      question: 'Human epidermis is mostly composed of which of the following basic animal tissue types:',
      options: ['epithelial', 'connective', 'nervous', 'muscle'],
      answerIndex: 0
    },
    {
      id: 'q20',
      category: 'Physics',
      difficulty: 'easy',
      question: 'A constant force acting on a body experiencing no change in its environment will give the body:',
      options: ['constant acceleration', 'constant speed', 'constant velocity', 'zero acceleration'],
      answerIndex: 0
    },
    {
      id: 'q21',
      category: 'Earth and Space Science',
      difficulty: 'easy',
      question: 'Which of the following is a sedimentary rock:',
      options: ['slate', 'marble', 'basalt', 'sandstone'],
      answerIndex: 3
    },
    {
      id: 'q22',
      category: 'Earth and Space Science',
      difficulty: 'hard',
      question: 'Which of the following is LEAST accurate about minerals:',
      options: ['calcite has a hardness of 3 on most of its surfaces but a hardness of 4 along the crystal face perpendicular to its long axis', 'the Moh’s scale measures the absolute hardness of minerals', 'a mineral’s chemical composition largely determines its crystal shape and cleavage pattern', 'a mineral’s color is the same as its streak'],
      answerIndex: 3
    },
    {
      id: 'q23',
      category: 'General Science',
      difficulty: 'easy',
      question: 'Which of the following is closest to the meaning of the suffix ‘lith’:',
      options: ['outside', 'stone', 'side', 'surface'],
      answerIndex: 1
    },
    {
      id: 'q24',
      category: 'Chemistry',
      difficulty: 'medium',
      question: 'Which of the following is a metallic element, composes about 5% of the Earth’s crust, oxidizes very easily, and when pure is a dark, silver-grey metal:',
      options: ['cobalt', 'nickel', 'iron', 'titanium'],
      answerIndex: 2
    },
    {
      id: 'q25',
      category: 'Physics',
      difficulty: 'easy',
      question: 'Upon which of the following does the mass of a body MOST directly depend:',
      options: ['its magnetic properties', 'how much volume it has', 'the amount of matter it contains', 'its location'],
      answerIndex: 2
    },
    {
      id: 'q26',
      category: 'Physics',
      difficulty: 'medium',
      question: 'Mary and Joe are on a merry-go-round. Mary is seated near the center of rotation and Joe is on the outer edge. Which of the following BEST describes their motion:',
      options: ['Mary has a greater acceleration than Joe', 'Joe has a greater acceleration than Mary', 'neither Mary nor Joe are accelerating', 'both Mary and Joe have the same acceleration'],
      answerIndex: 1
    },
    {
      id: 'q27',
      category: 'Earth and Space Science',
      difficulty: 'medium',
      question: 'Which of the following terms best describes the albedo of a planet:',
      options: ['electromagnetic energy', 'density', 'reflectivity', 'absorption'],
      answerIndex: 2
    },
    {
      id: 'q28',
      category: 'Earth and Space Science',
      difficulty: 'medium',
      question: 'Which of the following is NOT true of what occurs during an equinox:',
      options: ['equal length of day and night except at the poles', 'the Earth is not tilted with respect to the ecliptic', 'the Sun is directly overhead at the equator', 'the Moon is directly overhead at the poles'],
      answerIndex: 3
    },
    {
      id: 'q29',
      category: 'Biology',
      difficulty: 'medium',
      question: 'If a plant had a taproot, it would also most likely have:',
      options: ['parallel leaf venation', 'two cotyledons in its seedling stage', 'diffusely arranged vascular bundles in its stem', 'no stomata on the upper surfaces of its leaves'],
      answerIndex: 1
    },
    {
      id: 'q30',
      category: 'Physics',
      difficulty: 'medium',
      question: 'Martin is swinging a yo-yo in a large room with a circular motion perpendicular to a level floor. If the yo-yo breaks away from its string at the top of the yo-yo’s circular path, in what direction will the yo-yo initially move:',
      options: ['at an angle between horizontal and vertical', 'straight up, toward the ceiling', 'straight down, to the floor', 'horizontally, tangent to its original circular path'],
      answerIndex: 3
    },
    {
      id: 'q31',
      category: 'Chemistry',
      difficulty: 'hard',
      question: 'Which of the following pure substances has the highest melting point at 1 atmosphere of pressure:',
      options: ['magnesium oxide', 'diamond', 'sodium chloride', 'cesium chloride'],
      answerIndex: 1
    },
    {
      id: 'q32',
      category: 'Mathematics',
      difficulty: 'medium',
      question: 'Which of the following numbers is evenly divisible by both 11 and 3:',
      options: ['7791', '7553', '5181', '8769'],
      answerIndex: 2
    },
    {
      id: 'q33',
      category: 'Mathematics',
      difficulty: 'easy',
      question: 'What is the smaller of two integers whose sum is 19 and whose product is 48?',
      options: ['2', '3', '4', '6'],
      answerIndex: 1
    },
    {
      id: 'q34',
      category: 'Mathematics',
      difficulty: 'medium',
      question: 'One-fifth of 0.04% is equal to:',
      options: ['8 × 10⁻²', '8 × 10⁻³', '8 × 10⁻⁴', '8 × 10⁻⁵'],
      answerIndex: 3
    },
    {
      id: 'q35',
      category: 'Mathematics',
      difficulty: 'easy',
      question: 'Find the prime factorization of 240:',
      options: ['2 × 2 × 2 × 3 × 5', '2 × 2 × 2 × 2 × 3 × 5', '2 × 3 × 5 × 8', '2 × 2 × 3 × 10'],
      answerIndex: 1
    },
    {
      id: 'q36',
      category: 'Mathematics',
      difficulty: 'medium',
      question: 'Giving your answer in centimeters, what is the length of a side of a square whose diagonal measures 12√2 centimeters?',
      options: ['6', '12', '24', '12√2'],
      answerIndex: 1
    },
    {
      id: 'q37',
      category: 'Mathematics',
      difficulty: 'medium',
      question: 'Multiply the following 4 numbers and give your answer in scientific notation: 30,000 × 3,000 × 30 × 0.1',
      options: ['2.7 × 10⁶', '2.7 × 10⁷', '2.7 × 10⁸', '2.7 × 10⁹'],
      answerIndex: 2
    },
    {
      id: 'q38',
      category: 'Mathematics',
      difficulty: 'medium',
      question: 'Simplify the following expression by combining like terms: 12.03A – 4.03B – 0.03(A – 40)',
      options: ['12A – 4.03B + 1.2', '12A + 4.03B + 1.2', '12.06A – 4.03B – 1.2', '11.97A – 4.03B + 1.2'],
      answerIndex: 0
    },
    {
      id: 'q39',
      category: 'Earth and Space Science',
      difficulty: 'easy',
      question: 'Which of the following is best classified as a plutonic intrusive rock:',
      options: ['obsidian', 'granite', 'basalt', 'pumice'],
      answerIndex: 1
    },
    {
      id: 'q40',
      category: 'Earth and Space Science',
      difficulty: 'easy',
      question: 'The principle constituent of most granites is:',
      options: ['feldspar', 'muscovite', 'calcite', 'dolomite'],
      answerIndex: 0
    },
    {
      id: 'q41',
      category: 'General Science',
      difficulty: 'easy',
      question: 'The related quantities charted on a line graph are most often called:',
      options: ['results', 'lines', 'sets', 'variables'],
      answerIndex: 3
    },
    {
      id: 'q42',
      category: 'Chemistry',
      difficulty: 'medium',
      question: 'Group 1 cations and group 7 anions combine to form:',
      options: ['metal alloys', 'alkali halides', 'alkaloids', 'organometallic compounds'],
      answerIndex: 1
    },
    {
      id: 'q43',
      category: 'Physics',
      difficulty: 'medium',
      question: 'A child learns that mixing approximately equal amounts of the paint colors orange and green produces brown. This is an example of:',
      options: ['additive color mixing', 'summative color generation', 'subtractive color synthesis', 'neutral coloration'],
      answerIndex: 2
    },
    {
      id: 'q44',
      category: 'Mathematics',
      difficulty: 'medium',
      question: 'One-fifth of 0.04% is equal to:',
      options: ['8 × 10⁻²', '8 × 10⁻³', '8 × 10⁻⁴', '8 × 10⁻⁵'],
      answerIndex: 3
    },
    {
      id: 'q45',
      category: 'Earth and Space Science',
      difficulty: 'medium',
      question: 'When spreading centers reach above the ocean’s surface, they typically form which of the following types of volcanoes:',
      options: ['shield', 'composite', 'stratovolcano', 'cinder cone'],
      answerIndex: 0
    },
    {
      id: 'q46',
      category: 'Earth and Space Science',
      difficulty: 'medium',
      question: 'Mount Vesuvius in Italy is a typical:',
      options: ['mud volcano', 'caldera', 'cinder cone', 'composite volcano'],
      answerIndex: 3
    },
    {
      id: 'q47',
      category: 'Chemistry',
      difficulty: 'medium',
      question: 'Which of the following substances is water soluble:',
      options: ['ethanol', 'dichloromethane', 'chloroform', 'benzene'],
      answerIndex: 0
    },
    {
      id: 'q48',
      category: 'General Science',
      difficulty: 'easy',
      question: 'Anthropogenic means:',
      options: ['generated by humans', 'created many years ago', 'carried in primate genes', 'harmful to elderly people'],
      answerIndex: 0
    },
    {
      id: 'q49',
      category: 'Physics',
      difficulty: 'medium',
      question: 'Jay walks to his car and drives to the store. The trip takes 20 minutes. Jay figures how far he traveled on foot and by car and divides the distance by how long the trip took. Which of the following BEST describes what Jay has computed:',
      options: ['total velocity', 'average acceleration', 'average speed', 'instantaneous velocity'],
      answerIndex: 2
    }
  ];
}

