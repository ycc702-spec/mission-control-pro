// Cloudflare Pages Function: /api/market
// 由 Cloudflare 邊緣節點代為抓 Yahoo Finance + Fear&Greed
// 完全不依賴第三方 CORS proxy，100% Cloudflare

const YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart/";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function yahoo(symbol) {
  try {
    const url = `${YAHOO}${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const r = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "application/json" },
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const res = j?.chart?.result?.[0];
    if (!res) return null;
    const meta = res.meta || {};
    const price = meta.regularMarketPrice ?? meta.previousClose;
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    if (price == null || prev == null) return null;
    const changePct = ((price - prev) / prev) * 100;
    return {
      symbol,
      price: Number(price.toFixed(2)),
      prev: Number(prev.toFixed(2)),
      changePct: Number(changePct.toFixed(2)),
      currency: meta.currency || "USD",
    };
  } catch (e) {
    return null;
  }
}

async function fng() {
  try {
    const r = await fetch("https://api.alternative.me/fng/?limit=1", {
      headers: { "Accept": "application/json" },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const d = j?.data?.[0];
    if (!d) return null;
    return {
      value: Number(d.value),
      classification: d.value_classification,
      ts: d.timestamp,
    };
  } catch {
    return null;
  }
}

export async function onRequestGet() {
  const [
    vix, usdtwd, spy, qqq, voo, nvda, tsm, tsla, smh, pave, gold, oil, fearGreed,
  ] = await Promise.all([
    yahoo("^VIX"),
    yahoo("USDTWD=X"),
    yahoo("SPY"),
    yahoo("QQQ"),
    yahoo("VOO"),
    yahoo("NVDA"),
    yahoo("TSM"),
    yahoo("TSLA"),
    yahoo("SMH"),
    yahoo("PAVE"),
    yahoo("GC=F"),
    yahoo("CL=F"),
    fng(),
  ]);

  const body = JSON.stringify({
    ok: true,
    updated: new Date().toISOString(),
    data: {
      vix, usdtwd, spy, qqq, voo, nvda, tsm, tsla, smh, pave, gold, oil,
      fearGreed,
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
