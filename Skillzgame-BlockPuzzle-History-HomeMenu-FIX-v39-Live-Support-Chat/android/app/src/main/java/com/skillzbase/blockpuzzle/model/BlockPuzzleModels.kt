package com.skillzbase.blockpuzzle.model

import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

enum class GameMode {
    DUEL, PRACTICE, PRIVATE_ROOM, RANKED, TOURNAMENT
}

enum class PracticeDifficulty {
    EASY, NORMAL, HARD, EXPERT
}

enum class SpecialBlockType {
    BOMB, LIGHTNING, HAMMER, SHUFFLE
}

enum class RatingTier {
    BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER
}

data class BlockShape(
    val id: String = "",
    val matrix: List<List<Int>> = emptyList(),
    val colorHex: String = "#38BDF8",
    val accentHex: String = "#0284C7",
    val name: String = "",
    val isSpecial: Boolean = false,
    val specialType: SpecialBlockType? = null
)

data class PlayerState(
    val playerId: String = "",
    val name: String = "",
    val avatarUrl: String = "",
    val ready: Boolean = false,
    val connected: Boolean = true,
    val score: Int = 0,
    val linesCleared: Int = 0,
    val combo: Int = 0,
    val bestCombo: Int = 0,
    val streak: Int = 0,
    val remainingTime: Int = 60,
    val lastActionTimestamp: Long = System.currentTimeMillis(),
    val isWinner: Boolean? = null,
    val ratingChange: Int = 0,
    val xpEarned: Int = 0
)

data class BlockMatchMoveEvent(
    val playerId: String = "",
    val moveIndex: Int = 0,
    val blockId: String = "",
    val row: Int = 0,
    val col: Int = 0,
    val linesCleared: Int = 0,
    val clearedRows: List<Int> = emptyList(),
    val clearedCols: List<Int> = emptyList(),
    val pointsEarned: Int = 0,
    val totalScore: Int = 0,
    val combo: Int = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val boardHash: String = ""
)

data class BlockMatch(
    val matchId: String = "",
    val mode: GameMode = GameMode.DUEL,
    val difficulty: PracticeDifficulty = PracticeDifficulty.NORMAL,
    val seed: Long = 0L,
    val roomId: String? = null,
    val status: String = "playing", // searching, countdown, playing, validating, finished, interrupted
    val startTime: Long = System.currentTimeMillis(),
    val durationSeconds: Int = 60,
    val player1: PlayerState = PlayerState(),
    val player2: PlayerState? = null,
    val winnerId: String? = null,
    val isDraw: Boolean = false,
    val serverValidated: Boolean = false,
    @ServerTimestamp val createdAt: Date? = null
)
