import inquirer from "inquirer";
import chalk from "chalk";
import axios from "axios";
import crypto from "crypto";

// ---------- Utility Functions ----------

// HMAC-SHA256 signing for Binance API
function hmacSHA256(queryString, secret) {
  return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

// Simple sleep function for CLI animations / delays
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------- Permission Analysis ----------

// Analyze the returned API data and mark each permission as ON/OFF
function analyzePermissions(apiData) {
  const result = [];
  let riskLevel = "LOW";

  for (const [key, value] of Object.entries(apiData)) {
    if (key === "createTime") continue; // skip non-permission fields

    let line;
    if (value) { // permission is enabled
      switch(key) {
        case "enableWithdrawals":
          line = chalk.red.bold(`✖ ${key}: ON 🚨`); // high-risk permission
          riskLevel = "HIGH";
          break;
        case "enableFutures":
        case "enablePortfolioMarginTrading":
          line = chalk.yellow(`⚠ ${key}: ON`); // medium-risk
          if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
          break;
        default:
          line = chalk.green(`✔ ${key}: ON`); // normal permission
      }
    } else {
      line = chalk.gray(`${key}: OFF`); // disabled permission
    }

    result.push(line);
  }

  return { result, riskLevel };
}

// ---------- Recommendations ----------

// Generate actionable recommendations based on API Key configuration
function generateRecommendation(apiData) {
  const rec = [];

  // High-risk: Withdrawals enabled
  if (apiData.enableWithdrawals) {
    rec.push(
      "🔒 Disable Withdrawals immediately:\n" +
      "  - Reason: Your API key can move funds out of your account.\n" +
      "  - Risk: High. If your key is compromised, funds can be stolen.\n" +
      "  - Recommendation: Only enable for trusted environments or temporarily, then disable."
    );
  }

  // IP restriction check
  if (!apiData.ipRestrict) {
    rec.push(
      "🌐 Enable IP whitelist:\n" +
      "  - Reason: Your API key is currently unrestricted by IP.\n" +
      "  - Risk: Medium-High. Anyone with your key can access it from any IP.\n" +
      "  - Recommendation: Add your trusted IP(s) to Binance API whitelist to prevent misuse."
    );
  }

  // Read-only access suggestion
  if (!apiData.enableReading) {
    rec.push(
      "🔑 Enable Read-only access for non-trading purposes:\n" +
      "  - Reason: Some tools or scripts may need read-only access to check balances or positions.\n" +
      "  - Risk: Low. No trading or withdrawals, only data access.\n" +
      "  - Recommendation: Enable read-only instead of full trading permissions for monitoring or auditing tools."
    );
  }

  // Optional: warn about other risky permissions
  if (apiData.enableFutures) {
    rec.push(
      "⚠ Futures trading enabled:\n" +
      "  - Reason: Your API key can trade on Binance Futures.\n" +
      "  - Risk: High. Leveraged trading can cause large losses if misused.\n" +
      "  - Recommendation: Only enable for automated trading bots you fully trust."
    );
  }

  if (apiData.enablePortfolioMarginTrading) {
    rec.push(
      "⚠ Portfolio Margin enabled:\n" +
      "  - Reason: Key can access margin trading features.\n" +
      "  - Risk: High. Positions can be liquidated quickly if mishandled.\n" +
      "  - Recommendation: Only use in secure, trusted environment."
    );
  }

  return rec;
}

// ---------- Fetch Permissions from Binance ----------

async function fetchPermissions(apiKey, secretKey) {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = hmacSHA256(queryString, secretKey);
    const url = `https://api.binance.com/sapi/v1/account/apiRestrictions?${queryString}&signature=${signature}`;

    const res = await axios.get(url, { headers: { "X-MBX-APIKEY": apiKey }, timeout: 5000 });
    return res.data;
  } catch(err) {
    handleBinanceError(err);
    return null;
  }
}

// ---------- Error Handling ----------

async function handleBinanceError(err) {
  if (!err.response || !err.response.data) {
    console.error("Network error:", err.message);
    return;
  }

  const { code, msg } = err.response.data;

  switch(code) {
    case -2008:
      console.log(chalk.red.bold("API Key Error"));
      console.log("Please check if your API Key is entered correctly.");
      break;

    case -2015:
      console.log(chalk.yellow.bold("⚠ Request Rejected"));
      console.log("Possible reasons:");
      console.log("- API Key is invalid");
      console.log("- Your current public IP is not in the whitelist");
      console.log("- API Key does not have sufficient permissions");

      try {
        // Fetch current public IP to help user troubleshoot IP whitelist
        const ipRes = await axios.get("https://api.ipify.org?format=json");
        const currentIP = ipRes.data.ip;
        console.log(chalk.cyan(`\n💡 Your current public IP is: ${currentIP}`));
        console.log("Please check if this IP is added to your API Key whitelist in Binance.\n");
      } catch (ipErr) {
        console.log(chalk.red("Failed to fetch your public IP:"), ipErr.message);
      }
      break;

    default:
      // For other error codes, just print the Binance message
      console.log(chalk.red("Binance returned an error:"), code, msg);
  }
}

// ---------- Main CLI ----------

async function main() {
  console.clear();
  console.log(chalk.cyan.bold("🚀 Binance API Key Security Audit\n"));

  // Prompt user for API Key and Secret Key securely
  const answers = await inquirer.prompt([
    { type:"password", name:"apiKey", message:"Enter your Binance API Key:", mask:"*" },
    { type:"password", name:"secretKey", message:"Enter your Binance Secret Key:", mask:"*" }
  ]);

  console.log(chalk.yellow("\n🔍 Checking API permissions..."));
  await sleep(800);

  // Fetch permissions from Binance
  const data = await fetchPermissions(answers.apiKey, answers.secretKey);
  if(!data) return console.log(chalk.red("Failed to fetch permissions."));

  // Analyze permissions and determine risk level
  const { result, riskLevel } = analyzePermissions(data);
  console.log("\n📋 API KEY AUDIT RESULT");
  console.log(chalk.gray("=============================="));
  result.forEach(r => console.log(r));

  // Display overall risk level
  console.log("\nRisk Level:", 
    riskLevel==="HIGH"?chalk.red.bold(riskLevel+" ⚠️") :
    riskLevel==="MEDIUM"?chalk.yellow.bold(riskLevel) :
    chalk.green.bold(riskLevel)
  );

  // Provide actionable recommendations
  const recommendations = generateRecommendation(data);
  console.log("\n💡 Recommendations:");
  recommendations.forEach(r => console.log(r));

  console.log(chalk.cyan("\n✅ Audit Complete. Stay safe! ✨\n"));
}

// Run CLI
main();