import { NextResponse } from "next/server";

const SYMBOLS = [
  'SPY', 'QQQ', 'VOO', 'SMH', 'PAVE',
  'NVDA', 'TSM', 'ASML', 'INTC', 'SMCI',
  'GLD', 'USO', '^VIX', 'TWD=X'
];

export const runtime = 'edge';

async function fetchQuotes(symbols: string[]) {
  const joined = symbols.join('%2C');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${joined}&fields=regularMarketPrice,regularMarketChangePercent,shortName&lang=en-US`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    cf: { cacheTtl: 60, cacheEverything: true } as any
  });

  if (!res.ok) throw new Error(`Yahoo fetch failed: ${res.status}`);
  const json = await res.json() as any;
  return json?.quoteResponse?.result ?? [];
}

async function fetchFearGreed() {
  try {
    const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const json = await res.json() as any;
    const score = json?.fear_and_greed?.score ?? null;
    const rating = json?.fear_and_greed?.rating ?? null;
    return { score, rating };
  } catch {
    return { score: null, rating: null };
  }
}

export async function GET() {
  try {
    const [quotes, fg] = await Promise.all([
      fetchQuotes(SYMBOLS),
      fetchFearGreed()
    ]);

    const map: Record<string, any> = {};
    for (const q of quotes) {
      map[q.symbol] = {
        price: q.regularMarketPrice ?? null,
        change: q.regularMarketChangePercent ?? null,
        name: q.shortName ?? q.symbol
      };
    }

    // 持股損益計算（精確股數）
    const holdings = [
      { sym: 'ASML',  qty: 7.2399,    cost: 922.22 },
      { sym: 'INTC',  qty: 100,        cost: 22.85  },
      { sym: 'NVDA',  qty: 100.03635,  cost: 95.70  },
      { sym: 'SMCI',  qty: 50,         cost: 79.44  },
      { sym: 'TSM',   qty: 50.40953,   cost: 162.63 },
    ];

    let totalPL = 0;
    let totalCost = 0;
    const portfolioDetail: Record<string, any> = {};
    for (const h of holdings) {
      const price = map[h.sym]?.price ?? 0;
      const pl = (price - h.cost) * h.qty;
      const costTotal = h.cost * h.qty;
      totalPL += pl;
      totalCost += costTotal;
      portfolioDetail[h.sym] = {
        qty: h.qty,
        cost: h.cost,
        price,
        pl: parseFloat(pl.toFixed(2)),
        plPct: costTotal > 0 ? parseFloat((pl / costTotal * 100).toFixed(2)) : 0,
        change: map[h.sym]?.change ?? null
      };
    }

    // USD/TWD：TWD=X 是 USD per TWD，需要倒數
    const twdRaw = map['TWD=X']?.price ?? null;
    const usdTwd = twdRaw ? parseFloat((1 / twdRaw).toFixed(3)) : null;

    const data = {
      timestamp: new Date().toISOString(),
      etf: {
        SPY:  map['SPY'],
        QQQ:  map['QQQ'],
        VOO:  map['VOO'],
        SMH:  map['SMH'],
        PAVE: map['PAVE'],
      },
      portfolio: portfolioDetail,
      totalPL: parseFloat(totalPL.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalReturn: totalCost > 0 ? parseFloat((totalPL / totalCost * 100).toFixed(2)) : 0,
      commodities: {
        GOLD: map['GLD'],
        OIL:  map['USO'],
      },
      vix: map['^VIX']?.price ?? null,
      usdTwd,
      fearGreed: fg
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
