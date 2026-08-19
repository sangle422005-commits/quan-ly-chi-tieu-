const express = require("express");
const cors = require("cors");
const path = require("path");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// FIREBASE INITIALIZATION
// ==========================================
let db;
try {
    const serviceAccount = require("./firebase-key.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    console.log("🔥 Connected to Firebase Firestore successfully!");
} catch (error) {
    console.error("❌ Firebase connection error:", error);
}

// ==========================================
// TRANSACTIONS APIS
// ==========================================
app.get("/api/transactions", async (req, res) => {
    try {
        const snapshot = await db.collection("transactions").get();
        const data = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/api/statistics", async (req, res) => {
    try {
        const snapshot = await db.collection("transactions").get();
        const transactions = snapshot.docs.map(doc => doc.data());

        let totalIncome = 0;
        let totalExpense = 0;
        const expenseByCategory = {};

        transactions.forEach(t => {
            const amount = Number(t.amount);
            if (t.type === "income") totalIncome += amount;
            if (t.type === "expense") {
                totalExpense += amount;
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + amount;
            }
        });

        res.json({
            success: true,
            data: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
                expenseByCategory
            }
        });
    } catch (error) {
        console.error("Error calculating statistics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/api/transactions", async (req, res) => {
    const { type, amount, category, date, note } = req.body;

    if (!type || !amount || !category || !date) {
        return res.status(400).json({ success: false, message: "Missing transaction fields" });
    }

    const transaction = {
        id: Date.now().toString(),
        type,
        amount: Number(amount),
        category,
        date,
        note: note || "No notes",
        createdAt: new Date().toISOString()
    };

    try {
        await db.collection("transactions").doc(transaction.id).set(transaction);
        res.status(201).json({ success: true, message: "Transaction added", data: transaction });
    } catch (error) {
        console.error("Error saving transaction:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete("/api/transactions/:id", async (req, res) => {
    try {
        const docRef = db.collection("transactions").doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }
        await docRef.delete();
        res.json({ success: true, message: "Transaction deleted" });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// DEBTS APIS
// ==========================================
app.get("/api/debts", async (req, res) => {
    try {
        const snapshot = await db.collection("debts").get();
        const data = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching debts:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/api/debts", async (req, res) => {
    const { type, person, amount, date, note } = req.body;

    if (!type || !person || !amount || !date) {
        return res.status(400).json({ success: false, message: "Missing debt fields" });
    }

    const newDebt = {
        id: Date.now().toString(),
        type,
        person,
        amount: Number(amount),
        date,
        note: note || "No notes",
        status: "pending",
        createdAt: new Date().toISOString()
    };

    try {
        await db.collection("debts").doc(newDebt.id).set(newDebt);
        res.status(201).json({ success: true, message: "Debt added", data: newDebt });
    } catch (error) {
        console.error("Error saving debt:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put("/api/debts/:id/pay", async (req, res) => {
    try {
        const docRef = db.collection("debts").doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Debt not found" });
        }
        await docRef.update({
            status: "paid",
            paidAt: new Date().toISOString()
        });
        const updated = await docRef.get();
        res.json({ success: true, message: "Debt marked as paid", data: updated.data() });
    } catch (error) {
        console.error("Error updating debt payment:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete("/api/debts/:id", async (req, res) => {
    try {
        const docRef = db.collection("debts").doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Debt not found" });
        }
        await docRef.delete();
        res.json({ success: true, message: "Debt deleted" });
    } catch (error) {
        console.error("Error deleting debt:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// SPA Fallback & Listen
app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
