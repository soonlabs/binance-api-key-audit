# Binance API Key Security Audit CLI

🚀 **Binance API Key Security Audit** is a Node.js command-line tool that helps you **analyze your Binance API keys** and their permissions. It highlights risky permissions, provides a risk level assessment, and gives actionable recommendations to improve the security of your API keys.

---

## Features

- ✅ Checks which permissions are enabled (Spot, Margin, Futures, Withdrawals, etc.)
- ⚠ Highlights high-risk permissions like withdrawals or futures trading
- 💡 Provides detailed recommendations for safer API key configuration
- 🌐 Detects your current public IP and warns if it may conflict with Binance API IP whitelist
- 🔒 CLI input is secure; API Key and Secret Key are masked

---

## Installation

Make sure you have **Node.js >= 20** installed. Then:

```bash
git clone https://github.com/yourusername/binance-key-audit.git
cd binance-key-audit
npm install
```

## Usage

Run the CLI tool:

```bash
node index.js
```

You will be prompted to enter your Binance API Key and Secret Key (input is masked):

```bash
Enter your Binance API Key: ************
Enter your Binance Secret Key: ************
```

The tool will then:
1.	Fetch your API key permissions from Binance.
2.	Analyze which permissions are ON/OFF.
3.	Determine an overall risk level (LOW / MEDIUM / HIGH).
4.	Display detailed recommendations, e.g., disable withdrawals, enable IP whitelist, or enable read-only access.
5.	Show your current public IP to help verify whitelist settings.

Example Output

```bash
📋 API KEY AUDIT RESULT
==============================
✔ ipRestrict: ON
✔ enableReading: ON
⚠ enableFutures: ON
✔ enableSpotAndMarginTrading: ON
✖ enableWithdrawals: ON 🚨
enableInternalTransfer: OFF
✔ permitsUniversalTransfer: ON
enableVanillaOptions: OFF
enablePortfolioMarginTrading: OFF
enableFixApiTrade: OFF
enableFixReadOnly: OFF
✔ enableMargin: ON

Risk Level: HIGH ⚠️

💡 Recommendations:
🔒 Disable Withdrawals immediately:
  - Reason: Your API key can move funds out of your account.
  - Risk: High. If your key is compromised, funds can be stolen.
  - Recommendation: Only enable for trusted environments or temporarily, then disable.
⚠ Futures trading enabled:
  - Reason: Your API key can trade on Binance Futures.
  - Risk: High. Leveraged trading can cause large losses if misused.
  - Recommendation: Only enable for automated trading bots you fully trust.

✅ Audit Complete. Stay safe! ✨
```

Notes
*	This tool does not store your API keys. Keys are only used to query Binance directly.
*	Always use caution when enabling high-risk permissions.
*	Designed for educational and auditing purposes; not a trading bot.