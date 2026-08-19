const express = require("express");
const cors = require("cors");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} = require("firebase/firestore");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsoUBziK_6vMKyVnT58aDu0EDjUfNk5Sk",
  authDomain: "sangles-28185.firebaseapp.com",
  projectId: "sangles-28185",
  storageBucket: "sangles-28185.firebasestorage.app",
  messagingSenderId: "574466676130",
  appId: "1:574466676130:web:1168a376216cff7f898efb"
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
    console.error("Lỗi lấy danh sách giao dịch:", err);
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
    console.error("Lỗi thêm giao dịch:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    await deleteDoc(doc(db, "transactions", req.params.id));
    res.json({ success: true, message: "Đã xóa giao dịch thành công" });
  } catch (err) {
    console.error("Lỗi xóa giao dịch:", err);
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
    console.error("Lỗi lấy danh sách nợ:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/debts", async (req, res) => {
  try {
    const { type, person, amount, date, note } = req.body;
    if (!type || !person || !amount || !date) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu nợ bắt buộc" });
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
    console.error("Lỗi thêm nợ:", err);
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
    console.error("Lỗi thanh toán nợ:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/debts/:id", async (req, res) => {
  try {
    await deleteDoc(doc(db, "debts", req.params.id));
    res.json({ success: true, message: "Đã xóa khoản nợ thành công" });
  } catch (err) {
    console.error("Lỗi xóa khoản nợ:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= API: STATISTICS =================
app.get("/api/statistics", async (req, res) => {
  try {
    const snap = await getDocs(collection(db, "transactions"));
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory = {};

    snap.docs.forEach(docSnap => {
      const t = docSnap.data();
      const amt = Number(t.amount) || 0;
      if (t.type === "income") totalIncome += amt;
      if (t.type === "expense") {
        totalExpense += amt;
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + amt;
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
  } catch (err) {
    console.error("Lỗi tính toán thống kê:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= SERVE FRONTEND =================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
