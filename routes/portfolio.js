// import express from "express";
// import db from "../db.js";
// import axios from "axios";

// const router = express.Router();

// // Stock API config
// const API_KEY = "LUTZAJVO9S0Q5VRV";
// const API_URL = "https://www.alphavantage.co/query";

// // GET Portfolio with Realized & Unrealized P/L
// router.get("/", async (req, res) => {
//   try {
//     db.query("SELECT * FROM portfolio", async (err, portfolioRows) => {
//       if (err) throw err;

//       let totalValue = 0;
//       let unrealizedPL = 0;

//       const updatedPortfolio = await Promise.all(
//         portfolioRows.map(async (stock) => {
//           try {
//             const { data } = await axios.get(API_URL, {
//               params: {
//                 function: "GLOBAL_QUOTE",
//                 symbol: stock.stock_symbol,
//                 apikey: API_KEY,
//               },
//             });

//             console.log(data);

//             const currentPrice =
//               parseFloat(data["Global Quote"]["05. price"]) || 0;
//             const pl = (currentPrice - stock.avg_buy_price) * stock.quantity;

//             totalValue += currentPrice * stock.quantity;
//             unrealizedPL += pl;

//             return {
//               ...stock,
//               current_price: currentPrice,
//               unrealized_pl: pl,
//             };
//           } catch (apiErr) {
//             console.error(`Error fetching ${stock.stock_symbol}:`, apiErr);
//             return { ...stock, current_price: 0, unrealized_pl: 0 };
//           }
//         })
//       );

//       db.query(
//         "SELECT SUM(realized_pl) AS total_realized FROM realized_profit_loss",
//         (err, result) => {
//           if (err) throw err;
//           //   const realizedPL = result[0].total_realized || 0;

//           const realizedPL = Number(result[0].total_realized) || 0;

//           res.json({
//             total_portfolio_value: totalValue,
//             realized_pl: realizedPL,
//             unrealized_pl: unrealizedPL,
//             portfolio: updatedPortfolio,
//           });
//         }
//       );
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // POST Add Investment (Buy/Sell)
// router.post("/add", (req, res) => {
//   const { stock_symbol, quantity, price_per_share, transaction_type } =
//     req.body;

//   db.query(
//     "INSERT INTO transactions (stock_symbol, quantity, price_per_share, transaction_type) VALUES (?, ?, ?, ?)",
//     [stock_symbol, quantity, price_per_share, transaction_type],
//     (err) => {
//       if (err) throw err;

//       console.log(quantity);
//       if (transaction_type === "BUY") {
//         db.query(
//           "SELECT * FROM portfolio WHERE stock_symbol = ?",
//           [stock_symbol],
//           (err, rows) => {
//             if (err) throw err;

//             if (rows.length > 0) {
//               const existing = rows[0];
//               console.log(existing);
//               const newQty = existing.quantity + quantity;
//               console.log(newQty);
//               const newAvg =
//                 (existing.quantity * existing.avg_buy_price +
//                   quantity * price_per_share) /
//                 newQty;

//               db.query(
//                 "UPDATE portfolio SET quantity = ?, avg_buy_price = ? WHERE stock_symbol = ?",
//                 [newQty, newAvg, stock_symbol]
//               );
//             } else {
//               db.query(
//                 "INSERT INTO portfolio (stock_symbol, quantity, avg_buy_price) VALUES (?, ?, ?)",
//                 [stock_symbol, quantity, price_per_share]
//               );
//             }
//           }
//         );
//       } else if (transaction_type === "SELL") {
//         db.query(
//           "SELECT * FROM portfolio WHERE stock_symbol = ?",
//           [stock_symbol],
//           (err, rows) => {
//             if (err) throw err;
//             if (rows.length === 0) return;

//             const existing = rows[0];
//             const realizedPL =
//               (price_per_share - existing.avg_buy_price) * quantity;

//             db.query(
//               "INSERT INTO realized_profit_loss (stock_symbol, realized_pl) VALUES (?, ?)",
//               [stock_symbol, realizedPL]
//             );

//             const newQty = existing.quantity - quantity;
//             if (newQty > 0) {
//               db.query(
//                 "UPDATE portfolio SET quantity = ? WHERE stock_symbol = ?",
//                 [newQty, stock_symbol]
//               );
//             } else {
//               db.query("DELETE FROM portfolio WHERE stock_symbol = ?", [
//                 stock_symbol,
//               ]);
//             }
//           }
//         );
//       }

//       res.json({ message: "Transaction added successfully" });
//     }
//   );
// });

// router.get("/ticker", async (req, res) => {
//   try {
//     const symbols = ["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN"]; // Change to your preferred list
//     const results = [];

//     for (const symbol of symbols) {
//       const { data } = await axios.get(API_URL, {
//         params: {
//           function: "GLOBAL_QUOTE",
//           symbol,
//           apikey: API_KEY,
//         },
//       });

//       const quote = data["Global Quote"];
//       if (quote) {
//         results.push({
//           symbol,
//           price: parseFloat(quote["05. price"]) || 0,
//           change: parseFloat(quote["09. change"]) || 0,
//           change_percent: quote["10. change percent"] || "0%",
//         });
//       }
//     }

//     res.json(results);
//   } catch (error) {
//     console.error("Ticker error:", error);
//     res.status(500).json({ error: "Failed to fetch ticker data" });
//   }
// });

// export default router;
import express from "express";
import db from "../db.js";

const router = express.Router();

// ===============================
// Mock Stock Price System
// ===============================
let mockPrices = {};

const generateRandomPrice = (base = 100) => {
  const change = (Math.random() * 10 - 5).toFixed(2);
  return parseFloat((base + parseFloat(change)).toFixed(2));
};

const updateMockPrices = () => {
  db.query("SELECT DISTINCT stock_symbol FROM portfolio", (err, rows) => {
    if (err) return console.error(err);
    rows.forEach(({ stock_symbol }) => {
      if (!mockPrices[stock_symbol]) {
        mockPrices[stock_symbol] = generateRandomPrice(100);
      } else {
        mockPrices[stock_symbol] = generateRandomPrice(
          mockPrices[stock_symbol]
        );
      }
    });
  });
};
setInterval(updateMockPrices, 2 * 60 * 1000);
updateMockPrices();

// ===============================
// GET Portfolio (Dashboard)
// ===============================
router.get("/", (req, res) => {
  db.query("SELECT * FROM portfolio", (err, portfolioRows) => {
    if (err) throw err;

    let totalValue = 0;

    const updatedPortfolio = portfolioRows.map((stock) => {
      const currentPrice = mockPrices[stock.stock_symbol] ?? 100;
      const pl =
        (currentPrice - Number(stock.avg_buy_price)) * Number(stock.quantity);

      totalValue += currentPrice * Number(stock.quantity);

      return {
        ...stock,
        current_price: currentPrice,
      };
    });

    db.query(
      "SELECT SUM(realized_pl) AS total_realized FROM realized_profit_loss",
      (err, result) => {
        if (err) throw err;

        const realizedPL = Number(result[0].total_realized) || 0;

        res.json({
          total_portfolio_value: totalValue,
          realized_pl: realizedPL,
          portfolio: updatedPortfolio,
        });
      }
    );
  });
});

// ===============================
// POST Add Investment
// ===============================
router.post("/add", (req, res) => {
  const stock_symbol = req.body.stock_symbol.toUpperCase();
  const quantity = Number(req.body.quantity);
  const transaction_type = req.body.transaction_type;

  const price_per_share = mockPrices[stock_symbol] ?? generateRandomPrice(100);
  mockPrices[stock_symbol] = price_per_share;

  db.query(
    "INSERT INTO transactions (stock_symbol, quantity, price_per_share, transaction_type) VALUES (?, ?, ?, ?)",
    [stock_symbol, quantity, price_per_share, transaction_type],
    (err) => {
      if (err) throw err;

      if (transaction_type === "BUY") {
        db.query(
          "SELECT * FROM portfolio WHERE stock_symbol = ?",
          [stock_symbol],
          (err, rows) => {
            if (err) throw err;

            if (rows.length > 0) {
              const existing = rows[0];
              const newQty = Number(existing.quantity) + quantity;
              const newAvg =
                (Number(existing.quantity) * Number(existing.avg_buy_price) +
                  quantity * price_per_share) /
                newQty;

              db.query(
                "UPDATE portfolio SET quantity = ?, avg_buy_price = ? WHERE stock_symbol = ?",
                [newQty, newAvg, stock_symbol]
              );
            } else {
              db.query(
                "INSERT INTO portfolio (stock_symbol, quantity, avg_buy_price) VALUES (?, ?, ?)",
                [stock_symbol, quantity, price_per_share]
              );
            }
          }
        );
      } else if (transaction_type === "SELL") {
        db.query(
          "SELECT * FROM portfolio WHERE stock_symbol = ?",
          [stock_symbol],
          (err, rows) => {
            if (err) throw err;
            if (rows.length === 0) return;

            const existing = rows[0];
            const realizedPL =
              (price_per_share - Number(existing.avg_buy_price)) * quantity;

            db.query(
              "INSERT INTO realized_profit_loss (stock_symbol, realized_pl) VALUES (?, ?)",
              [stock_symbol, realizedPL]
            );

            const newQty = Number(existing.quantity) - quantity;
            if (newQty > 0) {
              db.query(
                "UPDATE portfolio SET quantity = ? WHERE stock_symbol = ?",
                [newQty, stock_symbol]
              );
            } else {
              db.query("DELETE FROM portfolio WHERE stock_symbol = ?", [
                stock_symbol,
              ]);
            }
          }
        );
      }

      res.json({
        message: `Transaction added at market price ${price_per_share}`,
      });
    }
  );
});

// ===============================
// GET Ticker Data (for Carousel)
// ===============================
router.get("/ticker", (req, res) => {
  const symbols = ["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN"];
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
const recordDailySnapshot = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours === 20 && minutes === 0) {
    db.query(
      "SELECT * FROM profit_loss_history WHERE date = CURDATE()",
      (err, rows) => {
        if (err) return console.error(err);
        if (rows.length > 0) return; // already saved today

        db.query("SELECT * FROM portfolio", (err, portfolioRows) => {
          if (err) return console.error(err);

          let totalValue = 0;
          portfolioRows.forEach((stock) => {
            const price = mockPrices[stock.stock_symbol] ?? 100;
            totalValue += price * Number(stock.quantity);
          });

          db.query(
            "SELECT SUM(realized_pl) AS total_realized FROM realized_profit_loss",
            (err, result) => {
              if (err) return console.error(err);
              const realizedPL = Number(result[0].total_realized) || 0;

              db.query(
                "INSERT INTO profit_loss_history (date, realized_pl, total_value) VALUES (CURDATE(), ?, ?)",
                [realizedPL, totalValue],
                (err) => {
                  if (err) console.error(err);
                  else console.log("✅ Snapshot saved for", now.toDateString());
                }
              );
            }
          );
        });
      }
    );
  }
};
setInterval(recordDailySnapshot, 60 * 1000);

// ===============================
// GET Performance History API
// ===============================
router.get("/history", (req, res) => {
  const { frequency } = req.query; // daily, weekly, monthly
  let groupBy = "DATE(date)";
  if (frequency === "weekly") groupBy = "YEARWEEK(date)";
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
        mockPrices[stock.stock_symbol] ?? stock.avg_buy_price;
      const changePercent =
        ((currentPrice - stock.avg_buy_price) / stock.avg_buy_price) * 100;

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

export default router;
