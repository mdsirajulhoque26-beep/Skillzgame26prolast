package com.skillzbase.blockpuzzle.firebase

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

    // 1. Join Matchmaking Queue
    suspend fun joinMatchmakingQueue(rating: Int): String {
        val uid = auth.currentUser?.uid ?: throw IllegalStateException("User not authenticated")
        val queueDoc = firestore.collection("matchmaking").document(uid)

        val queueData = mapOf(
            "playerId" to uid,
            "rating" to rating,
            "timestamp" to System.currentTimeMillis(),
            "status" to "SEARCHING"
        )
        queueDoc.set(queueData).await()
        return uid
    }

    // 2. Stream Match Events (Compact and lightweight)
    suspend fun sendMoveEvent(matchId: String, event: BlockMatchMoveEvent) {
        firestore.collection("matches")
            .document(matchId)
            .collection("moves")
            .document(event.moveIndex.toString())
            .set(event)
            .await()
    }

    // 3. Realtime match synchronization
    fun observeMatch(matchId: String, onUpdate: (BlockMatch) -> Unit): ListenerRegistration {
        return firestore.collection("matches").document(matchId)
            .addSnapshotListener { snapshot, _ ->
                snapshot?.toObject(BlockMatch::class.java)?.let(onUpdate)
            }
    }

    // 4. Save Practice Score
    suspend fun savePracticeScore(score: Int, lines: Int, difficulty: String) {
        val uid = auth.currentUser?.uid ?: return
        firestore.collection("practiceScores").add(mapOf(
            "userId" to uid,
            "score" to score,
            "lines" to lines,
            "difficulty" to difficulty,
            "timestamp" to System.currentTimeMillis()
        )).await()
    }
}
