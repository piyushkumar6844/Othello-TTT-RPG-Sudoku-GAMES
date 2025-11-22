import { Sudoku } from './suduko_board.js';
let prev=40;
document.addEventListener("DOMContentLoaded", function () { // ensure all html is loading only afetr that js code is implemented

    const container = document.getElementById("sudokuContainer");  // acces my suduko coantienr from main div so i can make grid

    // Function to generate a random Sudoku puzzle
    function generateRandomSudoku(k) {

        let sudokumaker = new Sudoku(9, k);
        sudokumaker.fillValues();
        // console.log(sudokumaker.mat);
        
        return sudokumaker.mat;
    }


    // Function to solve the Sudoku puzzle
    function solveSudoku(board) {

        const solvedPuzzle = JSON.parse(JSON.stringify(board));// make an deep copy
        solveHelper(solvedPuzzle);
        return solvedPuzzle;
    }

    // Helper function for solving Sudoku recursively
    function solveHelper(board) {
        const emptyCell = findEmptyCell(board);
        if (!emptyCell) {
            return true; // Puzzle solved
        }

        const [row, col] = emptyCell;
        for (let num = 1; num <= 9; num++) {
            if (isValidMove(board, row, col, num)) {
                board[row][col] = num;
                if (solveHelper(board)) {
                    return true;
                }
                board[row][col] = 0; // Backtrack
            }
        }
        return false; // No valid number found for this cell
    }

    // Function to find an empty cell in the Sudoku puzzle
    function findEmptyCell(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return [row, col];
                }
            }
        }
        return null; // No empty cell found
    }

    // Function to check if a move is valid
    function isValidMove(board, row, col, num) {
        
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) {
                return false;
            }
        }
        
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) {
                return false;
            }
        }
        
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = startRow; i < startRow + 3; i++) {
            for (let j = startCol; j < startCol + 3; j++) {
                if (board[i][j] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    // Function to create the Sudoku puzzle grid
    function createSudokuGrid(puzzle) {
        container.innerHTML = '';
        puzzle.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.classList.add('row');
            row.forEach((cell, columnIndex) => {
                const cellElement = document.createElement('input');
                cellElement.classList.add('cell');
                cellElement.classList
                    .add((rowIndex + columnIndex) % 2 === 0 ?
                        'lightBackground' : 'darkBackground');
                cellElement.type = 'text';
                cellElement.maxLength = 1;
                cellElement.value = cell !== 0 ? cell : '';
                rowElement.appendChild(cellElement);
            });
            container.appendChild(rowElement);
        });
    }

    // Initialize puzzle
    let initialPuzzle = generateRandomSudoku(30);
    let puzzle = JSON.parse(JSON.stringify(initialPuzzle));
    let solvedPuzzle = [];


    // Function to solve the puzzle
    function solvePuzzle() {
        solvedPuzzle = solveSudoku(puzzle);
        createSudokuGrid(solvedPuzzle);
    }

    // Function to reset the puzzle
    function resetPuzzle(val=30) {
        initialPuzzle = generateRandomSudoku(val);
        puzzle = JSON.parse(JSON.stringify(initialPuzzle));
        solvedPuzzle = [];
        createSudokuGrid(puzzle);
    }

    function easy(){
        prev=20;
        resetPuzzle(20);
    }
    function medium(){
        prev=30;
        resetPuzzle(30);
    }
    function hard(){
        prev=40;
        resetPuzzle(40);
    }
    // Initial puzzle creation
    createSudokuGrid(puzzle);

    // Attach event listeners to buttons
    document.getElementById("easy")
        .addEventListener("click", easy);
    document.getElementById("medium")
        .addEventListener("click", medium);
    document.getElementById("hard")
        .addEventListener("click", hard);

    document.getElementById("solveButton")
        .addEventListener("click", solvePuzzle);
    document.getElementById("resetButton")
        .addEventListener("click", ()=>resetPuzzle(prev));
});
