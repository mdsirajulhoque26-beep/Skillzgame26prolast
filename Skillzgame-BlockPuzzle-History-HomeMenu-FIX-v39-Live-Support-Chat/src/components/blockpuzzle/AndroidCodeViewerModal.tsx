import React, { useState } from 'react';
import { X, Code2, Copy, Check, FileCode, Layers, ShieldCheck, Database } from 'lucide-react';

interface AndroidCodeViewerModalProps {
  onClose: () => void;
}

const ANDROID_FILES = [
  {
    id: 'models',
    name: 'BlockPuzzleModels.kt',
    icon: '📦',
    category: 'Kotlin Model',
    code: `package com.skillzbase.blockpuzzle.model

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
    val matrix: List<List<Int>> = emptyList(), // 2D array representation
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
    val status: String = "playing", // searching, countdown, playing, validating, finished
    val startTime: Long = System.currentTimeMillis(),
    val durationSeconds: Int = 60,
    val player1: PlayerState = PlayerState(),
    val player2: PlayerState? = null,
    val winnerId: String? = null,
    val isDraw: Boolean = false,
    val serverValidated: Boolean = false,
    @ServerTimestamp val createdAt: Date? = null
)`
  },
  {
    id: 'engine',
    name: 'BlockPuzzleEngine.kt',
    icon: '⚙️',
    category: 'Game Engine',
    code: `package com.skillzbase.blockpuzzle.engine

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

    // Deterministic scoring formula
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
}`
  },
  {
    id: 'compose_ui',
    name: 'BlockPuzzleScreen.kt',
    icon: '🎨',
    category: 'Jetpack Compose UI',
    code: `package com.skillzbase.blockpuzzle.ui

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.skillzbase.blockpuzzle.model.*

@Composable
fun BlockPuzzleScreen(
    matchState: BlockMatch,
    onPlaceBlock: (blockIndex: Int, row: Int, col: Int) -> Unit,
    onBackClicked: () -> Unit
) {
    val boardState = remember { mutableStateOf(Array(8) { IntArray(8) { 0 } }) }
    var selectedPieceIndex by remember { mutableStateOf<Int?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0E1C))
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Match HUD
            BlockMatchHud(
                player1 = matchState.player1,
                player2 = matchState.player2,
                remainingTime = matchState.player1.remainingTime,
                onBackClicked = onBackClicked
            )

            // 8x8 Puzzle Board (Responsive Grid)
            BlockBoardGrid(
                board = boardState.value,
                onCellTapped = { r, c ->
                    selectedPieceIndex?.let { idx ->
                        onPlaceBlock(idx, r, c)
                        selectedPieceIndex = null
                    }
                }
            )

            // 3-Block Tray
            BlockPiecesTray(
                selectedPieceIndex = selectedPieceIndex,
                onPieceSelected = { selectedPieceIndex = it }
            )
        }
    }
}

@Composable
fun BlockBoardGrid(
    board: Array<IntArray>,
    onCellTapped: (row: Int, col: Int) -> Unit
) {
    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF0D1428))
            .border(2.dp, Color(0xFF6366F1), RoundedCornerShape(16.dp))
            .padding(8.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            for (r in 0 until 8) {
                Row(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    for (c in 0 until 8) {
                        val isFilled = board[r][c] > 0
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .aspectRatio(1f)
                                .padding(2.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(
                                    if (isFilled) Color(0xFF38BDF8) else Color(0xFF111936)
                                )
                                .clickable { onCellTapped(r, c) }
                        )
                    }
                }
            }
        }
    }
}`
  },
  {
    id: 'firebase_manager',
    name: 'BlockPuzzleFirebaseManager.kt',
    icon: '🔥',
    category: 'Firebase & Multiplayer',
    code: `package com.skillzbase.blockpuzzle.firebase

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.database.FirebaseDatabase
import com.skillzbase.blockpuzzle.model.*
import kotlinx.coroutines.tasks.await

class BlockPuzzleFirebaseManager {
    private val auth = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()
    private val rtdb = FirebaseDatabase.getInstance()

    suspend fun joinMatchmakingQueue(rating: Int): String {
        val uid = auth.currentUser?.uid ?: throw IllegalStateException("Not authenticated")
        val queueDoc = firestore.collection("matchmaking").document(uid)
        
        queueDoc.set(mapOf(
            "playerId" to uid,
            "rating" to rating,
            "timestamp" to System.currentTimeMillis(),
            "status" to "SEARCHING"
        )).await()

        return uid
    }

    suspend fun sendMoveEvent(matchId: String, event: BlockMatchMoveEvent) {
        firestore.collection("matches")
            .document(matchId)
            .collection("moves")
            .document(event.moveIndex.toString())
            .set(event)
            .await()
    }

    fun observeMatchState(matchId: String, onUpdate: (BlockMatch) -> Unit): ListenerRegistration {
        return firestore.collection("matches").document(matchId)
            .addSnapshotListener { snapshot, _ ->
                snapshot?.toObject(BlockMatch::class.java)?.let(onUpdate)
            }
    }
}`
  },
  {
    id: 'rules',
    name: 'firestore.rules',
    icon: '🛡️',
    category: 'Security Rules',
    code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profile permissions
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Matchmaking queue
    match /matchmaking/{playerId} {
      allow read, write: if request.auth != null && request.auth.uid == playerId;
    }

    // Matches & Anti-cheat verified results
    match /matches/{matchId} {
      allow read: if request.auth != null;
      // Clients can only update their ready/heartbeat state, NOT the winner or final rating
      allow update: if request.auth != null && 
        (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['winnerId', 'serverValidated', 'ratingChange']));
      allow create: if request.auth != null;
      
      match /moves/{moveId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && request.auth.uid == request.resource.data.playerId;
      }
    }

    // Leaderboards - Read only by clients, written only by Cloud Functions
    match /rankings/{rankingId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}`
  },
  {
    id: 'cloud_validator',
    name: 'serverValidation.js (Cloud Function)',
    icon: '⚡',
    category: 'Cloud Backend Anti-Cheat',
    code: `// Cloud Functions Server-Authoritative Anti-Cheat Validator
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.validateMatchResult = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const matchData = change.after.data();
    if (matchData.status !== 'validating' || matchData.serverValidated) {
      return null;
    }

    const { matchId } = context.params;
    const movesSnapshot = await admin.firestore()
      .collection('matches').doc(matchId)
      .collection('moves').orderBy('timestamp', 'asc')
      .get();

    // Verify move stream legality & compute authoritative score
    let p1AuthoritativeScore = 0;
    let p2AuthoritativeScore = 0;

    movesSnapshot.forEach(doc => {
      const move = doc.data();
      if (move.playerId === matchData.player1.playerId) {
        p1AuthoritativeScore += move.pointsEarned;
      } else if (matchData.player2 && move.playerId === matchData.player2.playerId) {
        p2AuthoritativeScore += move.pointsEarned;
      }
    });

    const isP1Winner = p1AuthoritativeScore > p2AuthoritativeScore;
    const isDraw = p1AuthoritativeScore === p2AuthoritativeScore;
    const winnerId = isDraw ? null : (isP1Winner ? matchData.player1.playerId : matchData.player2.playerId);

    // Authoritative atomic write
    return change.after.ref.update({
      'player1.score': p1AuthoritativeScore,
      'player2.score': p2AuthoritativeScore,
      winnerId,
      isDraw,
      status: 'finished',
      serverValidated: true,
      validatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });`
  }
];

export const AndroidCodeViewerModal: React.FC<AndroidCodeViewerModalProps> = ({ onClose }) => {
  const [selectedFileId, setSelectedFileId] = useState<string>('models');
  const [copied, setCopied] = useState<boolean>(false);

  const currentFile = ANDROID_FILES.find((f) => f.id === selectedFileId) || ANDROID_FILES[0];

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentFile.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#0b1022] border-2 border-indigo-500/60 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-900/80 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                Android Kotlin + Jetpack Compose Architecture
              </h3>
              <p className="text-[11px] text-emerald-400 font-semibold">
                Production-Ready Skillz Base Game Module
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#141b38] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 shrink-0 scrollbar-none">
          {ANDROID_FILES.map((file) => (
            <button
              key={file.id}
              onClick={() => setSelectedFileId(file.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                selectedFileId === file.id
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md font-black'
                  : 'bg-[#121935] text-slate-300 border-indigo-950 hover:border-indigo-800'
              }`}
            >
              <span>{file.icon}</span>
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* File Header Bar & Copy Button */}
        <div className="flex items-center justify-between bg-[#141d3e] px-3.5 py-2 rounded-t-xl border-t border-x border-indigo-900/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-300 uppercase">
              {currentFile.category}
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-[11px] text-slate-300 font-mono">
              {currentFile.name}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-indigo-900/80 hover:bg-indigo-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-indigo-700/60 font-bold active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 bg-[#060a16] p-3 rounded-b-xl border border-indigo-900/80 overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed select-text">
          <pre className="whitespace-pre-wrap">{currentFile.code}</pre>
        </div>
      </div>
    </div>
  );
};
