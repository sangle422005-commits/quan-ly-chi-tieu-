const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Render sẽ cung cấp PORT.
// Khi chạy máy local sẽ dùng 3000.
const PORT = process.env.PORT || 3000;


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// STATIC WEBSITE
// ==========================================

app.use(express.static(path.join(__dirname, "public")));


// ==========================================
// DATABASE FILE
// ==========================================
// ==========================================
// DATABASE FILE
// ==========================================
const dataFolder = path.join(__dirname, "data");

const dataFile = path.join(dataFolder, "transactions.json");

// THÊM MỚI: Khai báo file lưu trữ nợ
const debtsFile = path.join(dataFolder, "debts.json");

// Tạo thư mục data nếu chưa có
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}

// Tạo file JSON nếu chưa có
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf8");
}

// THÊM MỚI: Tạo file debts.json nếu chưa có
if (!fs.existsSync(debtsFile)) {
    fs.writeFileSync(debtsFile, "[]", "utf8");
}


const dataFolder = path.join(__dirname, "data");

const dataFile = path.join(
    dataFolder,
    "transactions.json"
);


// Tạo thư mục data nếu chưa có
if (!fs.existsSync(dataFolder)) {

    fs.mkdirSync(dataFolder, {
        recursive: true
    });

}


// Tạo file JSON nếu chưa có
if (!fs.existsSync(dataFile)) {

    fs.writeFileSync(
        dataFile,
        "[]",
        "utf8"
    );

}


// ==========================================
// DATABASE FUNCTIONS
// ==========================================

function readTransactions() {

    try {

        const data =
            fs.readFileSync(
                dataFile,
                "utf8"
            );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "Lỗi đọc database:",
            error
        );

        return [];

    }

}


function saveTransactions(transactions) {

    fs.writeFileSync(
        dataFile,
        JSON.stringify(
            transactions,
            null,
            2
        ),
        "utf8"
    );

}

function readDebts() {
    try {
        const data = fs.readFileSync(debtsFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Lỗi đọc database nợ:", error);
        return [];
    }
}

function saveDebts(debts) {
    fs.writeFileSync(debtsFile, JSON.stringify(debts, null, 2), "utf8");
}

// ==========================================
// API TEST
// ==========================================

app.get("/api", (req, res) => {

    res.json({

        success: true,

        message:
            "API quản lý chi tiêu đang hoạt động",

        server:
            "Node.js + Express"

    });

});


// ==========================================
// GET ALL TRANSACTIONS
// ==========================================

app.get(
    "/api/transactions",
    (req, res) => {

        const transactions =
            readTransactions();

        res.json({

            success: true,

            data: transactions

        });

    }
);


// ==========================================
// ADD TRANSACTION
// ==========================================

app.post(
    "/api/transactions",
    (req, res) => {

        const {

            type,
            amount,
            category,
            date,
            note

        } = req.body;


        // Kiểm tra dữ liệu

        if (
            !type ||
            !amount ||
            !category ||
            !date
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Thiếu thông tin giao dịch"

            });

        }


        if (
            type !== "income" &&
            type !== "expense"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Loại giao dịch không hợp lệ"

            });

        }


        if (
            Number(amount) <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Số tiền phải lớn hơn 0"

            });

        }


        // Đọc database

        const transactions =
            readTransactions();


        // Tạo giao dịch

        const transaction = {

            id:
                Date.now().toString(),

            type,

            amount:
                Number(amount),

            category,

            date,

            note:
                note || "Không có ghi chú",

            createdAt:
                new Date().toISOString()

        };


        // Thêm vào database

        transactions.push(transaction);


        // Lưu

        saveTransactions(
            transactions
        );


        // Trả kết quả

        res.status(201).json({

            success: true,

            message:
                "Đã thêm giao dịch",

            data:
                transaction

        });

    }
);


// ==========================================
// DELETE TRANSACTION
// ==========================================

app.delete(
    "/api/transactions/:id",
    (req, res) => {

        const id =
            req.params.id;


        let transactions =
            readTransactions();


        const oldLength =
            transactions.length;


        transactions =
            transactions.filter(
                transaction =>
                    transaction.id !== id
            );


        if (
            transactions.length === oldLength
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Không tìm thấy giao dịch"

            });

        }


        saveTransactions(
            transactions
        );


        res.json({

            success: true,

            message:
                "Đã xóa giao dịch"

        });

    }
);


// ==========================================
// GET STATISTICS
// ==========================================

app.get(
    "/api/statistics",
    (req, res) => {

        const transactions =
            readTransactions();


        let totalIncome = 0;

        let totalExpense = 0;


        const expenseByCategory = {};


        transactions.forEach(
            transaction => {

                const amount =
                    Number(transaction.amount);


                // THU NHẬP

                if (
                    transaction.type === "income"
                ) {

                    totalIncome += amount;

                }


                // CHI TIÊU

                if (
                    transaction.type === "expense"
                ) {

                    totalExpense += amount;


                    if (
                        !expenseByCategory[
                            transaction.category
                        ]
                    ) {

                        expenseByCategory[
                            transaction.category
                        ] = 0;

                    }


                    expenseByCategory[
                        transaction.category
                    ] += amount;

                }

            }
        );


        const balance =
            totalIncome -
            totalExpense;


        res.json({

            success: true,

            data: {

                totalIncome,

                totalExpense,

                balance,

                expenseByCategory

            }

        });

    }
);


// ==========================================
// GET TRANSACTION BY ID
// ==========================================

app.get(
    "/api/transactions/:id",
    (req, res) => {

        const transactions =
            readTransactions();


        const transaction =
            transactions.find(
                item =>
                    item.id === req.params.id
            );


        if (!transaction) {

            return res.status(404).json({

                success: false,

                message:
                    "Không tìm thấy giao dịch"

            });

        }


        res.json({

            success: true,

            data: transaction

        });

    }
);
// ==========================================
// API QUẢN LÝ NỢ (DEBTS)
// ==========================================

// 1. LẤY DANH SÁCH NỢ
app.get("/api/debts", (req, res) => {
    const debts = readDebts();
    res.json({ success: true, data: debts });
});

// 2. THÊM KHOẢN NỢ MỚI
app.post("/api/debts", (req, res) => {
    const { type, person, amount, date, note } = req.body;

    // Kiểm tra dữ liệu
    if (!type || !person || !amount || !date) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin khoản nợ" });
    }

    if (type !== "borrow" && type !== "lend") {
        return res.status(400).json({ success: false, message: "Loại nợ không hợp lệ (borrow/lend)" });
    }

    if (Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: "Số tiền phải lớn hơn 0" });
    }

    const debts = readDebts();

    const newDebt = {
        id: Date.now().toString(),
        type, // 'borrow' (Đi vay) hoặc 'lend' (Cho mượn)
        person,
        amount: Number(amount),
        date,
        note: note || "Không có ghi chú",
        status: "pending", // Trạng thái: pending (Chưa trả) hoặc paid (Đã trả)
        createdAt: new Date().toISOString()
    };

    debts.push(newDebt);
    saveDebts(debts);

    res.status(201).json({ success: true, message: "Đã thêm khoản nợ", data: newDebt });
});

// 3. THANH TOÁN NỢ (Cập nhật trạng thái thành Đã trả)
app.put("/api/debts/:id/pay", (req, res) => {
    const id = req.params.id;
    const debts = readDebts();
    
    const debtIndex = debts.findIndex(d => d.id === id);
    if (debtIndex === -1) {
        return res.status(404).json({ success: false, message: "Không tìm thấy khoản nợ" });
    }

    debts[debtIndex].status = "paid";
    debts[debtIndex].paidAt = new Date().toISOString();
    
    saveDebts(debts);

    res.json({ success: true, message: "Đã xác nhận thanh toán nợ", data: debts[debtIndex] });
});

// 4. XÓA KHOẢN NỢ
app.delete("/api/debts/:id", (req, res) => {
    let debts = readDebts();
    const oldLength = debts.length;
    
    debts = debts.filter(debt => debt.id !== req.params.id);
    
    if (debts.length === oldLength) {
        return res.status(404).json({ success: false, message: "Không tìm thấy khoản nợ" });
    }

    saveDebts(debts);
    res.json({ success: true, message: "Đã xóa khoản nợ" });
});


// ==========================================
// SPA FALLBACK
// ==========================================

app.get("/{*splat}", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});
// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `Server đang chạy tại port ${PORT}`
        );

    }
);
