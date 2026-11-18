"use strict";

const TX_CHECK = "https://apexfaucet.xyz/api/x402/tx-check";
const DELIVERY_SCORE = "https://apexfaucet.xyz/api/x402/delivery-score";

async function apexGet(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  const text = await response.text();
  let body = text.slice(0, 8000);
  try {
    body = JSON.parse(text);
  } catch (_e) {
    // keep the clipped text
  }
  if (response.status === 402) {
    return {
      paid: false,
      http: 402,
      note: "Unpaid. Pay the returned x402 terms with your own wallet, then retry. Nothing was signed here.",
      terms: body,
    };
  }
  return { http: response.status, body };
}

function textOf(result) {
  const body = result && result.body;
  if (body && body.verdict) return body.verdict + (body.reasons ? " " + body.reasons.join(",") : "");
  if (body && body.score != null) return "score " + body.score;
  if (result && result.http === 402) return "unpaid, 402 terms returned for your own wallet";
  return "http " + (result && result.http);
}

const txCheck = {
  name: "APEX_TX_CHECK",
  similes: ["CHECK_UNSIGNED_TX", "TX_CHECK", "IS_THIS_TX_SAFE"],
  description:
    "Check one unsigned Base or Solana transaction and return SAFE or RISKY. Base: simulation, unlimited approval, approval-for-all, a hidden token move, one exit check. Solana: simulation, a token drain, a delegate approval, a rug mint. Nothing is signed or broadcast. 0.001 USDC. Do not pass a private key. On 402, pay the terms with your own wallet.",
  validate: async () => true,
  handler: async (_runtime, _message, _state, options, callback) => {
    const p = (options && options.parameters) || options || {};
    const chain = String(p.chain || "base").toLowerCase();
    let url;
    if (chain === "solana" || chain === "sol") {
      if (!p.signer || !p.tx) {
        const text = "Solana needs signer and tx. Do not pass a private key.";
        if (callback) callback({ text });
        return { success: false, text };
      }
      url = TX_CHECK + "?" + new URLSearchParams({ chain: "solana", signer: String(p.signer), tx: String(p.tx) }).toString();
    } else {
      if (!p.from) {
        const text = "Base needs from, plus to and data, or raw.";
        if (callback) callback({ text });
        return { success: false, text };
      }
      const q = new URLSearchParams({ from: String(p.from) });
      if (p.raw) q.set("raw", String(p.raw));
      else {
        if (!p.to) {
          const text = "Base needs to and data, or raw.";
          if (callback) callback({ text });
          return { success: false, text };
        }
        q.set("to", String(p.to));
        q.set("data", String(p.data || "0x"));
        if (p.value) q.set("value", String(p.value));
      }
      url = TX_CHECK + "?" + q.toString();
    }
    const result = await apexGet(url);
    const text = textOf(result);
    if (callback) callback({ text, data: result });
    return { success: result.http !== 402, text, data: result };
  },
  examples: [
    [
      { name: "{{user1}}", content: { text: "Is this unsigned Base transaction safe?" } },
      { name: "{{agent}}", content: { text: "I will check it and I will not sign it.", action: "APEX_TX_CHECK" } },
    ],
  ],
};

const deliveryScore = {
  name: "APEX_DELIVERY_SCORE",
  similes: ["SCORE_X402_URL", "DELIVERY_SCORE", "X402_UPTIME_SCORE"],
  description:
    "Score one https x402 URL from 0 to 100. Five parts of 0 to 20: watchtower uptime, a valid 402, USDC price, probe speed, and recorded test buys. This does not pay the URL. 0.003 USDC. On 402, pay the terms with your own wallet.",
  validate: async () => true,
  handler: async (_runtime, _message, _state, options, callback) => {
    const p = (options && options.parameters) || options || {};
    const target = String(p.url || "");
    if (!target.startsWith("https://")) {
      const text = "url must start with https://";
      if (callback) callback({ text });
      return { success: false, text };
    }
    const result = await apexGet(DELIVERY_SCORE + "?" + new URLSearchParams({ url: target }).toString());
    const text = textOf(result);
    if (callback) callback({ text, data: result });
    return { success: result.http !== 402, text, data: result };
  },
  examples: [
    [
      { name: "{{user1}}", content: { text: "Score this x402 URL before I pay it." } },
      { name: "{{agent}}", content: { text: "I will score it. I will not pay it.", action: "APEX_DELIVERY_SCORE" } },
    ],
  ],
};

const plugin = {
  name: "apex-x402",
  description:
    "Unsigned Base or Solana transaction check, and an x402 delivery score, from the public APEX routes. Does not sign and does not pay.",
  actions: [txCheck, deliveryScore],
};

module.exports = plugin;
