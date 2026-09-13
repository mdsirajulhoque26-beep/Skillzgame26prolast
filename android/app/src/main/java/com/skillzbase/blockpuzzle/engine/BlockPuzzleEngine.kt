package com.skillzbase.blockpuzzle.engine

import com.skillzbase.blockpuzzle.model.BlockShape
import com.skillzbase.blockpuzzle.model.PracticeDifficulty
import com.skillzbase.blockpuzzle.model.SpecialBlockType

object BlockPuzzleEngine {
    const val BOARD_SIZE = 8

    fun createEmptyBoard(): Array<IntArray> {
        return Array(BOARD_SIZE) { IntArray(BOARD_SIZE) { 0 } }
    }

    fun canPlaceBlock(
        board: Array<IntArray>,
        matrix: List<List<Int>>,
        startRow: Int,
        startCol: Int
    ): Boolean {
        val rows = matrix.size
        val cols = if (rows > 0) matrix[0].size else 0

        if (startRow < 0 || startCol < 0 || startRow + rows > BOARD_SIZE || startCol + cols > BOARD_SIZE) {
            return false
        }

        for (r in 0 until rows) {
            for (c in 0 until cols) {
                if (matrix[r][c] != 0) {
                    if (board[startRow + r][startCol + c] != 0) {
                        return false // Occupied
                    }
                }
            }
        }
        return true
    }

    fun placeBlock(
        board: Array<IntArray>,
        matrix: List<List<Int>>,
        startRow: Int,
        startCol: Int,
        colorVal: Int = 1
    ): Array<IntArray> {
        val newBoard = Array(BOARD_SIZE) { r -> board[r].clone() }
        for (r in matrix.indices) {
            for (c in matrix[0].indices) {
                if (matrix[r][c] != 0) {
                    newBoard[startRow + r][startCol + c] = colorVal
                }
            }
        }
        return newBoard
    }

    fun checkAndClearLines(board: Array<IntArray>): Triple<Array<IntArray>, List<Int>, List<Int>> {
        val clearedRows = mutableListOf<Int>()
        val clearedCols = mutableListOf<Int>()

        // Check rows
        for (r in 0 until BOARD_SIZE) {
            var full = true
            for (c in 0 until BOARD_SIZE) {
                if (board[r][c] == 0) {
                    full = false
                    break
                }
            }
            if (full) clearedRows.add(r)
        }

        // Check columns
        for (c in 0 until BOARD_SIZE) {
            var full = true
            for (r in 0 until BOARD_SIZE) {
                if (board[r][c] == 0) {
                    full = false
                    break
                }
            }
            if (full) clearedCols.add(c)
        }

        val newBoard = Array(BOARD_SIZE) { r -> board[r].clone() }

        clearedRows.forEach { r ->
            for (c in 0 until BOARD_SIZE) newBoard[r][c] = 0
        }
        clearedCols.forEach { c ->
            for (r in 0 until BOARD_SIZE) newBoard[r][c] = 0
        }

        return Triple(newBoard, clearedRows, clearedCols)
    }

    // Deterministic scoring calculation
    fun calculateScore(linesCleared: Int, tiles: Int, currentCombo: Int, streak: Int): Triple<Int, Int, Int> {
        val linePoints = when (linesCleared) {
            1 -> 10
            2 -> 25
            3 -> 45
            4 -> 70
            else -> if (linesCleared > 4) 70 + (linesCleared - 4) * 25 else 0
        }

        val newCombo = if (linesCleared > 0) currentCombo + 1 else 0
        val newStreak = if (linesCleared > 0) streak + 1 else streak

        val comboBonus = if (newCombo > 1) (newCombo - 1) * 15 else 0
        val streakBonus = if (newStreak > 2) minOf(newStreak * 5, 50) else 0

        val total = tiles + linePoints + comboBonus + streakBonus
        return Triple(total, newCombo, newStreak)
    }

    // Seeded PRNG Generator for Synchronized 1v1 Sequences
    class SeededRandom(private var seed: Long) {
        fun nextInt(min: Int, max: Int): Int {
            seed = (seed * 1664525L + 1013904223L) and 0xFFFFFFFFL
            val normalized = (seed ushr 16).toDouble() / 65536.0
            return (min + normalized * (max - min + 1)).toInt()
        }
    }
}
