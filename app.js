// Game State Manager - StateModule
class StateManager {
  constructor() {
    this.state = {
      puzzleState: { bottles: [] },
      achievements: {},
      career: {
        levelIndex: 1,
        unlockedAchievements: []
      },
      multiplayer: {
        matches: [],
        results: []
      },
      currentMode: 'career'
    };
    this.listeners = [];
    this.loadState();
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = newState;
    this.saveState();
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  saveState() {
    localStorage.setItem('watersort-state', JSON.stringify(this.state));
  }

  loadState() {
    const saved = localStorage.getItem('watersort-state');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }

  // LogicModule methods
  newGame(difficulty = 1) {
    const bottles = this.generateBottles(difficulty);
    this.state.puzzleState = { bottles };
    this.saveState();
    this.notifyListeners();
    return this.state.puzzleState;
  }

  applyMove(move) {
    const { from, to } = move;
    const { bottles } = this.state.puzzleState;
    
    if (from < 0 || from >= bottles.length || to < 0 || to >= bottles.length) {
      return this.state.puzzleState;
    }

    const fromBottle = bottles[from];
    const toBottle = bottles[to];

    if (fromBottle.contents.length === 0) {
      return this.state.puzzleState;
    }

    if (toBottle.contents.length >= toBottle.capacity) {
      return this.state.puzzleState;
    }

    const fromColor = fromBottle.contents[fromBottle.contents.length - 1];
    if (toBottle.contents.length > 0 && toBottle.contents[toBottle.contents.length - 1] !== fromColor) {
      return this.state.puzzleState;
    }

    const newBottles = bottles.map((b, i) => ({ ...b, contents: [...b.contents] }));
    newBottles[from].contents.pop();
    newBottles[to].contents.push(fromColor);

    this.state.puzzleState = { bottles: newBottles };
    this.saveState();
    this.notifyListeners();
    
    return this.state.puzzleState;
  }

  isSolved() {
    const { bottles } = this.state.puzzleState;
    return bottles.every(bottle => {
      if (bottle.contents.length === 0) return true;
      if (bottle.contents.length !== bottle.capacity) return false;
      const color = bottle.contents[0];
      return bottle.contents.every(c => c === color);
    });
  }

  generateBottles(difficulty) {
    const bottleCount = 4 + difficulty;
    const capacity = 4;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    
    const bottles = [];
    const colorPool = [];
    
    for (let i = 0; i < bottleCount - 1; i++) {
      const color = colors[i % colors.length];
      for (let j = 0; j < capacity; j++) {
        colorPool.push(color);
      }
    }

    // Shuffle
    for (let i = colorPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorPool[i], colorPool[j]] = [colorPool[j], colorPool[i]];
    }

    for (let i = 0; i < bottleCount - 1; i++) {
      bottles.push({
        capacity,
        contents: colorPool.slice(i * capacity, (i + 1) * capacity)
      });
    }

    bottles.push({ capacity, contents: [] });

    return bottles;
  }

  // SolverModule - simple BFS solver
  solveCurrent() {
    return this.solve(this.state.puzzleState);
  }

  solve(puzzleState) {
    const queue = [{ state: puzzleState, moves: [] }];
    const visited = new Set();

    while (queue.length > 0) {
      const { state, moves } = queue.shift();
      const stateKey = JSON.stringify(state);

      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      if (this.isSolvedState(state)) {
        return moves;
      }

      for (let from = 0; from < state.bottles.length; from++) {
        for (let to = 0; to < state.bottles.length; to++) {
          if (from === to) continue;
          
          const newState = this.applyMoveToState(state, { from, to });
          if (JSON.stringify(newState) !== stateKey) {
            queue.push({
              state: newState,
              moves: [...moves, { from, to }]
            });
          }
        }
      }

      if (visited.size > 1000) break;
    }

    return [];
  }

  applyMoveToState(state, move) {
    const { from, to } = move;
    const { bottles } = state;

    const fromBottle = bottles[from];
    const toBottle = bottles[to];

    if (fromBottle.contents.length === 0 || toBottle.contents.length >= toBottle.capacity) {
      return state;
    }

    const fromColor = fromBottle.contents[fromBottle.contents.length - 1];
    if (toBottle.contents.length > 0 && toBottle.contents[toBottle.contents.length - 1] !== fromColor) {
      return state;
    }

    const newBottles = bottles.map(b => ({ ...b, contents: [...b.contents] }));
    newBottles[from].contents.pop();
    newBottles[to].contents.push(fromColor);

    return { bottles: newBottles };
  }

  isSolvedState(state) {
    return state.bottles.every(bottle => {
      if (bottle.contents.length === 0) return true;
      if (bottle.contents.length !== bottle.capacity) return false;
      const color = bottle.contents[0];
      return bottle.contents.every(c => c === color);
    });
  }
}

// UI Manager
class UIManager {
  constructor(stateManager) {
    this.state = stateManager;
    this.app = document.getElementById('app');
    this.selectedBottle = null;
    this.moveCount = 0;
    this.startTime = null;

    this.state.subscribe(() => this.render());
    this.render();
  }

  render() {
    const currentState = this.state.getState();
    
    if (!currentState.puzzleState.bottles.length) {
      this.renderModeSelect();
    } else {
      this.renderGameView(currentState);
    }
  }

  renderModeSelect() {
    this.app.innerHTML = `
      <div class="mode-select">
        <h1>Water Sort Game 💧</h1>
        <div class="mode-buttons">
          <button class="mode-btn" onclick="window.uiManager.selectMode('career')">
            Career Mode<br><small>Progress through levels</small>
          </button>
          <button class="mode-btn" onclick="window.uiManager.selectMode('multiplayer')">
            Multiplayer<br><small>Challenge friends</small>
          </button>
        </div>
      </div>
    `;
  }

  selectMode(mode) {
    const currentState = this.state.getState();
    currentState.currentMode = mode;
    this.state.setState(currentState);
    this.startNewGame(1);
  }

  startNewGame(difficulty) {
    this.moveCount = 0;
    this.startTime = Date.now();
    this.selectedBottle = null;
    this.state.newGame(difficulty);
  }

  renderGameView(currentState) {
    const { puzzleState, currentMode } = currentState;
    const { bottles } = puzzleState;

    this.app.innerHTML = `
      <div class="game-container">
        <div class="game-header">
          <h1>Water Sort</h1>
          <div class="game-stats">
            <span>Moves: ${this.moveCount}</span>
            <span>Mode: ${currentMode}</span>
          </div>
        </div>
        
        <div class="puzzle-area">
          <div class="bottles-container" id="bottles"></div>
        </div>

        ${this.renderControls()}

        ${this.state.isSolved() ? `
          <div class="solved-overlay">
            <div class="solved-modal">
              <h2>🎉 Puzzle Solved!</h2>
              <p>You completed it in ${this.moveCount} moves!</p>
              <button class="btn btn-primary" onclick="window.uiManager.startNewGame(1)">Next Level</button>
              <button class="btn btn-secondary" onclick="window.uiManager.renderModeSelect()">Back to Menu</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.renderBottles(bottles);
  }

  renderBottles(bottles) {
    const container = document.getElementById('bottles');
    container.innerHTML = bottles.map((bottle, idx) => `
      <div class="bottle ${idx === this.selectedBottle ? 'selected' : ''}" onclick="window.uiManager.selectBottle(${idx})">
        <div class="bottle-contents">
          ${bottle.contents.map(color => `<div class="water-drop" style="background: ${color}"></div>`).join('')}
        </div>
      </div>
    `).join('');
  }

  selectBottle(idx) {
    if (this.selectedBottle === null) {
      this.selectedBottle = idx;
    } else if (this.selectedBottle === idx) {
      this.selectedBottle = null;
    } else {
      const move = { from: this.selectedBottle, to: idx };
      this.state.applyMove(move);
      this.moveCount++;
      this.selectedBottle = null;
    }
    this.render();
  }

  renderControls() {
    return `
      <div class="controls">
        <button class="btn btn-secondary" onclick="window.uiManager.renderModeSelect()">Back to Menu</button>
        <button class="btn btn-primary" onclick="window.uiManager.getSolution()">Get Solution</button>
        <button class="btn btn-secondary" onclick="window.uiManager.resetGame()">Reset</button>
      </div>
    `;
  }

  getSolution() {
    const moves = this.state.solveCurrent();
    if (moves.length > 0) {
      alert(`Solution found in ${moves.length} moves!\nCheck console for details.`);
      console.log('Solution moves:', moves);
      // Auto-play solution
      this.playSolution(moves);
    } else {
      alert('No solution found or puzzle already solved!');
    }
  }

  playSolution(moves) {
    let index = 0;
    const playNextMove = () => {
      if (index < moves.length) {
        this.state.applyMove(moves[index]);
        this.moveCount++;
        index++;
        setTimeout(playNextMove, 500);
      }
    };
    playNextMove();
  }

  resetGame() {
    const currentState = this.state.getState();
    const difficulty = currentState.career.levelIndex;
    this.startNewGame(difficulty);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  const stateManager = new StateManager();
  window.uiManager = new UIManager(stateManager);
});
