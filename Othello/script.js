// script.js - Othello with Multiplayer + Single Player (Minimax AI)

const whiteScore = document.getElementById("whiteScore");
const blackScore = document.getElementById("blackScore");
const reversiBoard = document.getElementById("reversiBoard");
const resetBtn = document.getElementById("reset");
const multiBtn = document.getElementById("multiBtn");
const singleBtn = document.getElementById("singleBtn");
const alertBox = document.getElementById("alert");

const squareElems = Array.from(document.querySelectorAll(".square")); 
let boardState = []; // 8x8 array: "white", "black", or null
let isWhiteTurn = true; // human white starts
let whiteCount = 2;
let blackCount = 2;
let noLegalMove = false;
let mode = "multiplayer"; // "multiplayer" or "single"
let aiColor = "black"; // human always plays white per user
const MINIMAX_DEPTH = 3; // depth limit for AI

// Direction vectors for 8 directions
const DIRECTIONS = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1]
];

// Setup the board elements once
setupBoard(); // run once on load
initializeBoard(); // initialize pieces and board state
highlightLegalSquares(getLegalMoves(boardState, isWhiteTurn ? "white" : "black"));

/* ========== Setup functions ========== */

function setupBoard() {
  // Assign ids and data attributes to squares in the order given in HTML (8th rank first)
  squareElems.forEach((sq, i) => {
    // compute row, col consistent with your previous indexing:
    // HTML starts from 8th rank to 1st rank; i from 0..63
    const row = 8 - Math.floor(i / 8); // 8..1
    const col = (i % 8) + 1; // 1..8
    const id = `${row}${col}`;
    sq.id = id;
    sq.dataset.row = row;
    sq.dataset.col = col;
    // Ensure not adding duplicate listeners: remove then add
    sq.removeEventListener("click", onSquareClick);
    sq.addEventListener("click", onSquareClick);
  });

  // Mode buttons
  multiBtn.addEventListener("click", () => {
    mode = "multiplayer";
    multiBtn.classList.add("active");
    singleBtn.classList.remove("active");
    reset();
  });

  singleBtn.addEventListener("click", () => {
    mode = "single";
    multiBtn.classList.remove("active");
    singleBtn.classList.add("active");
    reset();
  });

  // Reset button
  resetBtn.addEventListener("click", reset);
}

/* ========== Board Model & DOM sync ========== */

function initializeBoard() {
  // initialize boardState (8x8) with null
  boardState = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));

  // Clear DOM squares
  squareElems.forEach(sq => {
    while (sq.firstChild) sq.firstChild.remove();
    sq.classList.remove("legal-square");
  });

  // Place initial 4 pieces in center
  // Positions: (4,4)=black, (5,5)=black in previous code were swapped; standard Othello initial:
  // We'll keep your original setup: white on 4,4 and 5,5; black on 4,5 and 5,4
  setBoardCell(4, 4, "white");
  setBoardCell(5, 5, "white");
  setBoardCell(4, 5, "black");
  setBoardCell(5, 4, "black");

  isWhiteTurn = true; // White starts as per your choice
  whiteCount = 2;
  blackCount = 2;
  noLegalMove = false;
  updateDOMFromBoard();
  updateScores();
}

function setBoardCell(r, c, color) {
  // r and c are 1-based (1..8)
  boardState[r - 1][c - 1] = color;
}

function getBoardCell(r, c) {
  return boardState[r - 1][c - 1];
}

function updateDOMFromBoard() {
  // Clear DOM and re-create pieces according to boardState
  squareElems.forEach(sq => {
    while (sq.firstChild) sq.firstChild.remove();
    const r = parseInt(sq.dataset.row, 10);
    const c = parseInt(sq.dataset.col, 10);
    const color = getBoardCell(r, c);
    if (color) {
      const piece = createPiece(color);
      sq.appendChild(piece);
    }
    sq.classList.remove("legal-square");
  });
}

/* ========== Utility: piece DOM ========== */
function createPiece(color) {
  const piece = document.createElement("div");
  piece.setAttribute("class", "piece");
  piece.setAttribute("color", color);
  const img = document.createElement("img");
  img.setAttribute("src", `${color}-disc.png`);
  img.setAttribute("alt", `${color} disc`);
  piece.appendChild(img);
  return piece;
}

/* ========== Move generation (model-based) ========== */

function getLegalMoves(board, color) {
  // returns an object: { "<r><c>": [ [r1,c1], [r2,c2], ... flips ] } for each legal move
  const moves = {};
  for (let r = 1; r <= 8; r++) {
    for (let c = 1; c <= 8; c++) {
      if (board[r - 1][c - 1] !== null) continue; // occupied
      const flips = getFlipsForCell(board, r, c, color);
      if (flips.length > 0) {
        moves[`${r}${c}`] = flips;
      }
    }
  }
  return moves;
}

function getFlipsForCell(board, r, c, color) {
  const opponent = color === "white" ? "black" : "white";
  const totalFlips = [];
  for (const [dr, dc] of DIRECTIONS) {
    const flipsThisDir = [];
    let rr = r + dr;
    let cc = c + dc;
    let foundOwn = false;
    while (rr >= 1 && rr <= 8 && cc >= 1 && cc <= 8) {
      const content = board[rr - 1][cc - 1];
      if (content === opponent) {
        flipsThisDir.push([rr, cc]);
      } else if (content === color) {
        if (flipsThisDir.length > 0) {
          foundOwn = true;
        }
        break;
      } else { // null/empty
        break;
      }
      rr += dr;
      cc += dc;
    }
    if (foundOwn) {
      totalFlips.push(...flipsThisDir);
    }
  }
  return totalFlips;
}

/* ========== Applying moves ========== */

function applyMove(board, r, c, color, flips) {
  // assume flips is array of [r,c] pairs to flip
  board[r - 1][c - 1] = color;
  for (const [fr, fc] of flips) {
    board[fr - 1][fc - 1] = color;
  }
}

function cloneBoard(board) {
  return board.map(row => row.slice());
}

/* ========== Event handler for clicks ========== */

function onSquareClick(e) {
  // get .square ancestor
  const sq = e.target.closest(".square");
  if (!sq) return;
  const r = parseInt(sq.dataset.row, 10);
  const c = parseInt(sq.dataset.col, 10);

  const playerColor = isWhiteTurn ? "white" : "black";
  // In single-player mode, if it's AI's turn, don't allow click
  if (mode === "single" && playerColor === aiColor) return;

  const legalMoves = getLegalMoves(boardState, playerColor);
  const key = `${r}${c}`;
  if (!legalMoves.hasOwnProperty(key)) {
    // illegal; ignore
    return;
  }

  // Make the move on the model
  applyMove(boardState, r, c, playerColor, legalMoves[key]);

  // Update DOM and scores
  updateDOMFromBoard();
  updateCountsFromBoard();
  updateScores();

  // Switch turn and handle AI if needed
  switchTurn();
}

/* ========== Turn switching, pass handling, endgame ========== */

function switchTurn() {
  isWhiteTurn = !isWhiteTurn;
  updateTurnUI();

  const currentColor = isWhiteTurn ? "white" : "black";
  let avail = getLegalMoves(boardState, currentColor);
  const availKeys = Object.keys(avail);

  if (availKeys.length === 0) {
    // No moves for current player -> check pass/back
    const otherColor = isWhiteTurn ? "black" : "white";
    const otherAvail = getLegalMoves(boardState, otherColor);
    if (Object.keys(otherAvail).length === 0) {
      // No moves for both -> end game
      checkEndGame();
      return;
    } else {
      // Pass - switch back
      // Inform user briefly
      showTempMessage(`${capitalize(currentColor)} has no legal moves. Passing turn.`);
      isWhiteTurn = !isWhiteTurn;
      updateTurnUI();
      // If we returned to AI's turn (single mode), trigger AI
      if (mode === "single" && (isWhiteTurn ? "white" : "black") === aiColor) {
        setTimeout(makeAIMove, 250);
      }
      return;
    }
  }

  // If single-player and it's AI turn -> make AI move after slight delay
  if (mode === "single" && currentColor === aiColor) {
    setTimeout(makeAIMove, 250);
  } else {
    // Highlight legal squares for UI
    highlightLegalSquares(getLegalMoves(boardState, currentColor));
  }
}

/* ========== AI: Minimax + Move selection ========== */

function makeAIMove() {
  const color = aiColor; // black
  const legal = getLegalMoves(boardState, color);
  const keys = Object.keys(legal);
  if (keys.length === 0) {
    // AI has no moves
    switchTurn();
    return;
  }

  // If only one move, quick play
  if (keys.length === 1) {
    const key = keys[0];
    const r = parseInt(key.charAt(0), 10);
    const c = parseInt(key.charAt(1), 10);
    applyMove(boardState, r, c, color, legal[key]);
    updateDOMFromBoard();
    updateCountsFromBoard();
    updateScores();
    switchTurn();
    return;
  }

  // Evaluate each legal move using minimax
  let bestScore = -Infinity;
  let bestMoves = [];
  for (const key of keys) {
    const r = parseInt(key.charAt(0), 10);
    const c = parseInt(key.charAt(1), 10);
    const flips = legal[key];
    const sim = cloneBoard(boardState);
    applyMove(sim, r, c, color, flips);
    const score = minimax(sim, MINIMAX_DEPTH - 1, false); // next is opponent (white) -> minimizing
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [[r, c, flips]];
    } else if (score === bestScore) {
      bestMoves.push([r, c, flips]);
    }
  }
  // Choose random among best moves to add variety
  const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  applyMove(boardState, chosen[0], chosen[1], color, chosen[2]);
  updateDOMFromBoard();
  updateCountsFromBoard();
  updateScores();
  switchTurn();
}

function minimax(board, depth, maximizingPlayer) {
  // Terminal or depth 0 -> evaluate
  const whiteLegal = getLegalMoves(board, "white");
  const blackLegal = getLegalMoves(board, "black");
  const noWhite = Object.keys(whiteLegal).length === 0;
  const noBlack = Object.keys(blackLegal).length === 0;

  if (depth === 0 || (noWhite && noBlack)) {
    return evaluateBoard(board);
  }

  if (maximizingPlayer) {
    // AI is black -> maximizing
    const moves = getLegalMoves(board, "black");
    const keys = Object.keys(moves);
    if (keys.length === 0) {
      // pass
      if (Object.keys(getLegalMoves(board, "white")).length === 0) {
        return evaluateBoard(board);
      }
      return minimax(board, depth, false); // simulate pass - switch player
    }
    let best = -Infinity;
    for (const key of keys) {
      const r = parseInt(key.charAt(0), 10);
      const c = parseInt(key.charAt(1), 10);
      const flips = moves[key];
      const sim = cloneBoard(board);
      applyMove(sim, r, c, "black", flips);
      const val = minimax(sim, depth - 1, false);
      if (val > best) best = val;
    }
    return best;
  } else {
    // minimizing (white)
    const moves = getLegalMoves(board, "white");
    const keys = Object.keys(moves);
    if (keys.length === 0) {
      // pass
      if (Object.keys(getLegalMoves(board, "black")).length === 0) {
        return evaluateBoard(board);
      }
      return minimax(board, depth, true);
    }
    let best = Infinity;
    for (const key of keys) {
      const r = parseInt(key.charAt(0), 10);
      const c = parseInt(key.charAt(1), 10);
      const flips = moves[key];
      const sim = cloneBoard(board);
      applyMove(sim, r, c, "white", flips);
      const val = minimax(sim, depth - 1, true);
      if (val < best) best = val;
    }
    return best;
  }
}

function evaluateBoard(board) {
  // Simple heuristic: disc difference + corner weight
  let black = 0, white = 0;
  let blackCorners = 0, whiteCorners = 0;
  const corners = [[1,1],[1,8],[8,1],[8,8]];
  for (let r=1;r<=8;r++){
    for (let c=1;c<=8;c++){
      const v = board[r-1][c-1];
      if (v === "black") black++;
      else if (v === "white") white++;
    }
  }
  for (const [cr,cc] of corners) {
    const v = board[cr-1][cc-1];
    if (v === "black") blackCorners++;
    else if (v === "white") whiteCorners++;
  }
  const cornerWeight = 10;
  return (black - white) + cornerWeight * (blackCorners - whiteCorners);
}

/* ========== Scoring and UI helpers ========== */

function updateCountsFromBoard() {
  let b = 0, w = 0;
  for (let r=1;r<=8;r++){
    for (let c=1;c<=8;c++){
      const v = getBoardCell(r,c);
      if (v === "black") b++;
      if (v === "white") w++;
    }
  }
  blackCount = b;
  whiteCount = w;
}

function updateScores() {
  whiteScore.innerHTML = "White Score: " + whiteCount;
  blackScore.innerHTML = "Black Score: " + blackCount;
}

function highlightLegalSquares(legalMoves) {
  // clear current
  const allLegal = document.querySelectorAll(".legal-square");
  allLegal.forEach(sq => sq.classList.remove("legal-square"));
  // add for new moves
  Object.keys(legalMoves).forEach(key => {
    const el = document.getElementById(key);
    if (el) el.classList.add("legal-square");
  });
}

function clearLegalSquares() {
  const allLegal = document.querySelectorAll(".legal-square");
  allLegal.forEach(sq => sq.classList.remove("legal-square"));
}

function updateTurnUI() {
  whiteScore.classList.toggle("active", isWhiteTurn);
  blackScore.classList.toggle("active", !isWhiteTurn);
  const currentColor = isWhiteTurn ? "white" : "black";
  const legal = getLegalMoves(boardState, currentColor);
  highlightLegalSquares(legal);
}

/* ========== End game detection & messages ========== */

function checkEndGame() {
  updateCountsFromBoard();
  updateScores();
  // End conditions: board full or one color zero or both have no moves
  const total = whiteCount + blackCount;
  const whiteHas = Object.keys(getLegalMoves(boardState, "white")).length > 0;
  const blackHas = Object.keys(getLegalMoves(boardState, "black")).length > 0;
  if (total === 64 || whiteCount === 0 || blackCount === 0 || (!whiteHas && !blackHas)) {
    let message = "";
    if (whiteCount > blackCount) message = "White Wins!";
    else if (whiteCount < blackCount) message = "Black Wins!";
    else message = "Draw!";
    showEndGameMessage(message);
  }
}

function showEndGameMessage(message) {
  alertBox.style.display = "block";
  reversiBoard.style.opacity = 0.5;
  alertBox.innerHTML = message;
  setTimeout(function () {
    alertBox.style.display = "none";
    reversiBoard.style.opacity = 1;
  }, 4000);
}

function showTempMessage(text) {
  alertBox.style.display = "block";
  alertBox.innerHTML = text;
  setTimeout(() => {
    alertBox.style.display = "none";
  }, 1100);
}

/* ========== Reset and helpers ========== */

function reset() {
  // Reset UI mode selection handled by button classes
  initializeBoard();
  updateCountsFromBoard();
  updateScores();
  isWhiteTurn = true;
  updateTurnUI();
  // If single-player and AI is set to play first (black), but human plays white always per requirements.
  // So we do nothing here. Human always white starts.
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
