const express = require("express");
const cors = require("cors");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { 
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc 
} = require("firebase/firestore");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8WvfnEI-s9hdUpMvDSulzD5_BfJtAE48",
  authDomain: "quan-li-chi-tieu-e82b1.firebaseapp.com",
  projectId: "quan-li-chi-tieu-e82b1",
  storageBucket: "quan-li-chi-tieu-e82b1.firebasestorage.app",
  messagingSenderId: "905488417584",
  appId: "1:905488417584:web:323d109f25145ad6bc3ef5"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

// ================= API: TRANSACTIONS =================
app.get("/api/transactions", async (req, res) => {
  try {
    const snap = await getDocs(collection(db, "transactions"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { type, amount, category, date, note } = req.body;
    if (!type || !amount || !category || !date) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc" });
    }

    const id = Date.now().toString();
    const item = {
      id,
      type,
      amount: Number(amount),
      category,
      date,
      note: note || "",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "transactions", id), item);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    await deleteDoc(doc(db, "transactions", req.params.id));
    res.json({ success: true, message: "Đã xóa giao dịch" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= API: DEBTS =================
app.get("/api/debts", async (req, res) => {
  try {
    const snap = await getDocs(collection(db, "debts"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/debts", async (req, res) => {
  try {
    const { type, person, amount, date, note } = req.body;
    if (!type || !person || !amount || !date) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu nợ" });
    }

    const id = Date.now().toString();
    const item = {
      id,
      type,
      person,
      amount: Number(amount),
      date,
      note: note || "",
      status: "pending",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "debts", id), item);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/debts/:id/pay", async (req, res) => {
  try {
    await updateDoc(doc(db, "debts", req.params.id), {
      status: "paid",
      paidAt: new Date().toISOString()
    });
    res.json({ success: true, message: "Đã cập nhật thanh toán" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/debts/:id", async (req, res) => {
  try {
    await deleteDoc(doc(db, "debts", req.params.id));
    res.json({ success: true, message: "Đã xóa khoản nợ" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= SPA CATCH-ALL =================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
