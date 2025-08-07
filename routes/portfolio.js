import express from "express";
import db from "../db.js";

const router = express.Router();

// ===============================
// Mock Stock Price System
// ===============================
let mockPrices = {};

const generateRandomPrice = (base = 100) => {
  const change = (Math.random() * 10 - 5).toFixed(2); // Random ±5
  return parseFloat((base + parseFloat(change)).toFixed(2));
};

const updateMockPrices = () => {
  db.query("SELECT stock_symbol FROM portfolio", (err, results) => {
    if (err) {
      console.error("Error fetching stock symbols:", err);
      return;
    }

    results.forEach((row) => {
      const basePrice = mockPrices[row.stock_symbol] || 100;
      mockPrices[row.stock_symbol] = generateRandomPrice(basePrice);
    });
  });
};

// Update every 10 seconds
setInterval(updateMockPrices, 10000);

// ===============================
// GET /dashboard – Portfolio Summary
// ===============================
router.get("/", (req, res) => {
  db.query("SELECT * FROM portfolio", (err, portfolioRows) => {
    if (err) {
      console.error("Error fetching portfolio:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    let totalValue = 0;

    const updatedPortfolio = portfolioRows.map((stock) => {
      const currentPrice = mockPrices[stock.stock_symbol] ?? 100;
      const buyPrice = Number(stock.buy_price);
      const quantity = Number(stock.quantity);
      const total = currentPrice * quantity;
      const profitLoss = (currentPrice - buyPrice) * quantity;
      const pnlPercent = ((currentPrice - buyPrice) / buyPrice) * 100;

      totalValue += total;

      return {
        id: stock.id,
        stock_symbol: stock.stock_symbol,
        company_name: stock.company_name || stock.stock_symbol, // fallback
        buy_price: buyPrice,
        quantity,
        current_price: currentPrice.toFixed(2),
        total_value: total.toFixed(2),
        profit_loss: profitLoss.toFixed(2),
        pnl_percent: pnlPercent.toFixed(2),
      };
    });

    db.query(
      "SELECT SUM(realized_pl) AS total_realized FROM realized_profit_loss",
      (err, result) => {
        if (err) {
          console.error("Error fetching realized P&L:", err);
          return res.status(500).json({ error: "Internal server error" });
        }

        const realizedPL = Number(result[0].total_realized) || 0;

        res.json({
          total_portfolio_value: totalValue.toFixed(2),
          realized_pl: realizedPL.toFixed(2),
          portfolio: updatedPortfolio,
        });
      }
    );
  });
});

// router.post("/add", (req, res) => {
//   const { stock_symbol, company_name, quantity, buy_price } = req.body;

//   console.log(company_name, stock_symbol, quantity, buy_price);

//   db.query(
//     "INSERT INTO portfolio (stock_symbol, company_name, quantity, buy_price) VALUES (?, ?, ?, ?)",
//     [stock_symbol, company_name, quantity, buy_price],
//     (err, result) => {
//       if (err) return res.status(500).json({ error: err });
//       res.json({ message: "Stock added to portfolio" });
//     }
//   );




// });


router.post("/add", (req, res) => {
  const { stock_symbol, company_name, quantity, buy_price } = req.body;

  const totalCost = quantity * buy_price;

  db.query(
    "INSERT INTO portfolio (stock_symbol, company_name, quantity, buy_price) VALUES (?, ?, ?, ?)",
    [stock_symbol, company_name, quantity, buy_price],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });

      // ✅ Deduct balance
      db.query(
        "UPDATE account_balance SET balance = balance - ? WHERE id = 1",
        [totalCost],
        (err2) => {
          if (err2) {
            console.error("Balance deduction failed:", err2);
            return res.status(500).json({ message: "Stock added but balance update failed." });
          }
          res.json({ message: "Stock added and balance updated." });
        }
      );
    }
  );
});


// ===============================
// GET Ticker Data (for Carousel)
// ===============================
router.get("/ticker", (req, res) => {
  const symbols = ["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN","BTC", "ETH", "ADA", "XRP", "SOL","NFLX"];
  const results = symbols.map((symbol) => {
    if (!mockPrices[symbol]) {
      mockPrices[symbol] = generateRandomPrice(100);
    }
    const change = (Math.random() * 4 - 2).toFixed(2);
    const change_percent =
      ((change / mockPrices[symbol]) * 100).toFixed(2) + "%";

    return {
      symbol,
      price: mockPrices[symbol],
      change: parseFloat(change),
      change_percent,
    };
  });

  res.json(results);
});

// ===============================
// Record End-of-Day Snapshot (3 PM)
// ===============================
// const recordDailySnapshot = () => {
//   const now = new Date();
//   const hours = now.getHours();
//   const minutes = now.getMinutes();

//   if (hours === 20 && minutes === 0) {
//     db.query(
//       "SELECT * FROM profit_loss_history WHERE date = CURDATE()",
//       (err, rows) => {
//         if (err) return console.error(err);
//         if (rows.length > 0) return; // already saved today

//         db.query("SELECT * FROM portfolio", (err, portfolioRows) => {
//           if (err) return console.error(err);

//           let totalValue = 0;
//           portfolioRows.forEach((stock) => {
//             const price = mockPrices[stock.stock_symbol] ?? 100;
//             totalValue += price * Number(stock.quantity);
//           });

//           db.query(
//             "SELECT SUM(realized_pl) AS total_realized FROM realized_profit_loss",
//             (err, result) => {
//               if (err) return console.error(err);
//               const realizedPL = Number(result[0].total_realized) || 0;

//               db.query(
//                 "INSERT INTO profit_loss_history (date, realized_pl, total_value) VALUES (CURDATE(), ?, ?)",
//                 [realizedPL, totalValue],
//                 (err) => {
//                   if (err) console.error(err);
//                   else console.log("✅ Snapshot saved for", now.toDateString());
//                 }
//               );
//             }
//           );
//         });
//       }
//     );
//   }
// };
// setInterval(recordDailySnapshot, 60 * 1000)
const recordDailySnapshot = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours === 15 && minutes === 0) { // You said 3PM — adjust if needed
    db.query(
      "SELECT * FROM profit_loss_history WHERE date = CURDATE()",
      (err, rows) => {
        if (err) return console.error(err);
        if (rows.length > 0) return; 

        db.query("SELECT * FROM portfolio", (err, portfolioRows) => {
          if (err) return console.error(err);

          let totalValue = 0;
          let unrealizedPL = 0;

          portfolioRows.forEach((stock) => {
            const currentPrice = mockPrices[stock.stock_symbol] ?? 100;
            const quantity = Number(stock.quantity);
            const buyPrice = Number(stock.buy_price);

            totalValue += currentPrice * quantity;
            unrealizedPL += (currentPrice - buyPrice) * quantity;
          });

          // db.query(
          //   "SELECT SUM(realized_pl) AS total_realized FROM realized_profit_loss",
          //   (err, result) => {
          //     if (err) return console.error(err);
          //     const realizedPL = Number(result[0].total_realized) || 0;

              db.query(
                "INSERT INTO profit_loss_history (date, realized_pl, total_value) VALUES (CURDATE(), ?, ?)",
                [unrealizedPL, totalValue],
                (err) => {
                  if (err) console.error(err);
                  else console.log("✅ Snapshot saved with unrealized P/L for", now.toDateString());
                }
              );
            }
          );
        });
      }

  }

setInterval(recordDailySnapshot, 60 * 1000); // check every minute


// ===============================
// GET Performance History API
// ===============================
router.get("/history", (req, res) => {
  const { frequency } = req.query; // daily, weekly, monthly
  let groupBy = "DATE(date)";
  if (frequency === "weekly") groupBy = "DATE_FORMAT(date, '%x-W%v')";

  if (frequency === "monthly") groupBy = "DATE_FORMAT(date, '%Y-%m')";

  db.query(
    `SELECT ${groupBy} AS period,
            AVG(total_value) as avg_value,
            AVG(realized_pl) as avg_realized
     FROM profit_loss_history
     GROUP BY period
     ORDER BY period`,
    (err, rows) => {
      if (err) throw err;
      const data = rows.map((row) => ({
        period: row.period,
        profit_loss:
          (Number(row.avg_value) || 0) + (Number(row.avg_realized) || 0),
      }));
      res.json(data);
    }
  );
});





router.get("/transactions", (req, res) => {
  db.query(
    "SELECT * FROM transactions ORDER BY transaction_date DESC",
    (err, rows) => {
      if (err) throw err;
      res.json(rows);
    }
  );
});

router.get("/top-movers", (req, res) => {
  db.query("SELECT * FROM portfolio", (err, rows) => {
    if (err) throw err;

    const movers = rows.map((stock) => {
      const currentPrice =
        mockPrices[stock.stock_symbol] ?? stock.buy_price;
      const changePercent =
        ((currentPrice - stock.buy_price) / stock.buy_price) * 100;

      return {
        stock_symbol: stock.stock_symbol,
        current_price: currentPrice,
        change_percent: changePercent,
      };
    });

    // Separate gainers and losers
    const gainers = movers
      .filter((m) => m.change_percent > 0)
      .sort((a, b) => b.change_percent - a.change_percent)
      .slice(0, 3);

    const losers = movers
      .filter((m) => m.change_percent < 0)
      .sort((a, b) => a.change_percent - b.change_percent) // lowest first
      .slice(0, 3);

    res.json({ topGainers: gainers, topLosers: losers });
  });
});


router.get("/balance",(req, res) => {
  db.query("SELECT balance FROM account_balance WHERE id = 1", (err, result) => {
    if (err) return res.status(500).send(err);
    const balance = result[0] ? result[0].balance : 0;
    console.log("Current balance:", balance);
    res.json({ balance :Number(balance)});
  });
});

// ===============================
// PUT /portfolio/buy-again/:id – Merge new quantity & update weighted avg price
// ===============================
router.put("/buyagain/:id", (req, res) => {
  const stockId = req.params.id;
  const { quantity: newQty, buy_price: newPrice } = req.body;

  // Fetch current data first
  db.query("SELECT quantity, buy_price FROM portfolio WHERE id = ?", [stockId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: "Stock not found or DB error" });
    }

    const { quantity: oldQty, buy_price: oldPrice } = results[0];

    // Calculate updated values
    const updatedQty = oldQty + newQty;
    const totalCost = oldQty * oldPrice + newQty * newPrice;
    const weightedAvgPrice = totalCost / updatedQty;

    // Update with new quantity and avg price
    db.query(
      "UPDATE portfolio SET quantity = ?, buy_price = ? WHERE id = ?",
      [updatedQty, weightedAvgPrice.toFixed(2), stockId],
      (updateErr) => {
        if (updateErr) {
          console.error("Error updating stock:", updateErr);
          return res.status(500).json({ error: "Error updating stock" });
        }

        res.json({ message: "Stock updated with new quantity and price" });
      }
    );
  });
});
// router.delete("/:id", (req, res) => {
//   const { id } = req.params;

//   console.log("Deleting investment with ID:", id);
//   const query = "DELETE FROM portfolio WHERE id = ?";
//   db.query(query, [id], (err, result) => {
//     if (err) {
//       console.error("Error deleting investment:", err);
//       return res.status(500).json({ message: "Internal server error." });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Investment not found." });
//     }

//     res.json({ message: "Investment deleted successfully." });
//   });
// });

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  // Step 1: Get the stock to refund its value
  db.query("SELECT quantity, buy_price FROM portfolio WHERE id = ?", [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Stock not found." });
    }

    const { quantity, buy_price } = results[0];
    const refundAmount = quantity * buy_price;

    // Step 2: Delete the stock
    db.query("DELETE FROM portfolio WHERE id = ?", [id], (err2, result2) => {
      if (err2) {
        console.error("Error deleting stock:", err2);
        return res.status(500).json({ message: "Delete failed." });
      }

      // Step 3: Refund balance
      db.query("UPDATE account_balance SET balance = balance + ? WHERE id = 1", [refundAmount], (err3) => {
        if (err3) {
          console.error("Balance refund failed:", err3);
          return res.status(500).json({ message: "Stock deleted but balance refund failed." });
        }

        res.json({ message: "Stock deleted and balance refunded." });
      });
    });
  });
});


router.put("/update/:id", (req, res) => {
  const stockId = req.params.id;
  const { stock_symbol, company_name, quantity, buy_price } = req.body;

  if (!stock_symbol || !company_name || !quantity || !buy_price) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const sql = `
    UPDATE portfolio 
    SET stock_symbol = ?, company_name = ?, quantity = ?, buy_price = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [stock_symbol, company_name, quantity, buy_price, stockId],
    (err, result) => {
      if (err) {
        console.error("Error updating stock:", err);
        return res.status(500).json({ message: "Failed to update stock." });
      }
      return res.json({ message: "Stock updated successfully!" });
    }
  );
});





export default router;
