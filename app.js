// ===== TACTICAL OS V2.6 - JARVIS HUD COMMAND CENTER =====

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initAudioSystem();
    initNavigation();
    updateDateTime();
    loadDailyContent();
    renderMacroVideos();
    renderIntelVideos();
    fetchMarketData();
    initSearchFunctionality();
});

// ===== AUDIO SYSTEM - Web Audio API Synthesized JARVIS Ambient =====
let audioContext = null;
let oscillators = [];
let isAudioPlaying = false;

function initAudioSystem() {
    const audioBtn = document.getElementById('audioToggle');
    if (!audioBtn) return;

    audioBtn.addEventListener('click', toggleAudio);
    
    // Try to start audio on first user interaction
    document.addEventListener('click', startAudioOnFirstInteraction, { once: true });
}

function startAudioOnFirstInteraction() {
    if (!isAudioPlaying && audioContext) {
        resumeAudio();
    }
}

function toggleAudio() {
    if (isAudioPlaying) {
        stopAudio();
    } else {
        startAudio();
    }
}

function startAudio() {
    if (isAudioPlaying) return;

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    isAudioPlaying = true;
    updateAudioButtonUI();
    createJARVISAmbient();
}

function stopAudio() {
    if (!isAudioPlaying) return;

    oscillators.forEach(osc => {
        try {
            osc.stop();
        } catch (e) {}
    });
    oscillators = [];

    isAudioPlaying = false;
    updateAudioButtonUI();
}

function resumeAudio() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function updateAudioButtonUI() {
    const audioBtn = document.getElementById('audioToggle');
    const statusEl = audioBtn?.querySelector('.audio-status');
    if (statusEl) {
        statusEl.textContent = isAudioPlaying ? 'ON' : 'OFF';
    }
}

function createJARVISAmbient() {
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.15, now);
    masterGain.connect(audioContext.destination);

    // Low frequency hum (JARVIS signature)
    const hum = audioContext.createOscillator();
    hum.frequency.setValueAtTime(55, now);
    hum.type = 'sine';
    const humGain = audioContext.createGain();
    humGain.gain.setValueAtTime(0.1, now);
    hum.connect(humGain);
    humGain.connect(masterGain);
    hum.start(now);
    oscillators.push(hum);

    // Filtered noise for atmosphere
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(300, now);
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.05, now);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(now);

    // Periodic sci-fi beeps
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            if (!isAudioPlaying || !audioContext) return;
            const beepTime = audioContext.currentTime;
            const beep = audioContext.createOscillator();
            beep.frequency.setValueAtTime(800 + i * 200, beepTime);
            beep.type = 'sine';
            const beepGain = audioContext.createGain();
            beepGain.gain.setValueAtTime(0.08, beepTime);
            beepGain.gain.exponentialRampToValueAtTime(0.01, beepTime + 0.1);
            beep.connect(beepGain);
            beepGain.connect(masterGain);
            beep.start(beepTime);
            beep.stop(beepTime + 0.1);
        }, i * 2000);
    }

    // Loop the ambient sound
    setTimeout(() => {
        if (isAudioPlaying) {
            createJARVISAmbient();
        }
    }, 120000); // Restart every 2 minutes
}

// ===== NAVIGATION =====
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.dataset.page;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            pages.forEach(p => p.classList.remove('active'));
            const target = document.getElementById(`page-${targetPage}`);
            if (target) target.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Macro preview card -> go to MACRO page
    const macroPreview = document.getElementById('macroPreviewCard');
    if (macroPreview) {
        macroPreview.addEventListener('click', () => {
            navigateTo('macro');
        });
    }

    // Filter buttons for MACRO page
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderMacroVideos(btn.dataset.filter);
        });
    });
}

function navigateTo(page) {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    navItems.forEach(n => n.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    const navBtn = document.querySelector(`[data-page="${page}"]`);
    const pageEl = document.getElementById(`page-${page}`);
    if (navBtn) navBtn.classList.add('active');
    if (pageEl) pageEl.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== DATE & TIME =====
function updateDateTime() {
    const now = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' };
    const dateStr = now.toLocaleDateString('en-US', options);
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        subtitle.innerHTML = `JARVIS COMMAND CENTER`;
    }
}

// ===== DAILY CONTENT =====
const quotes = [
    { text: '"A lot of people say they want to be great, but they\'re not willing to make the sacrifices necessary to achieve greatness."', zh: '很多人說他們想要變得卓越，但他們不願意為了卓越做出必要的犧牲。', author: 'KOBE BRYANT' },
    { text: '"The only way to do great work is to love what you do."', zh: '做出偉大工作的唯一方法就是熱愛你所做的事。', author: 'STEVE JOBS' },
    { text: '"In the middle of difficulty lies opportunity."', zh: '在困難之中，蘊藏著機會。', author: 'ALBERT EINSTEIN' },
    { text: '"It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change."', zh: '生存下來的不是最強壯的物種，也不是最聰明的，而是最能適應變化的。', author: 'CHARLES DARWIN' },
    { text: '"The market can stay irrational longer than you can stay solvent."', zh: '市場保持非理性的時間，可以比你保持償付能力的時間更長。', author: 'JOHN MAYNARD KEYNES' },
    { text: '"Risk comes from not knowing what you are doing."', zh: '風險來自於你不知道自己在做什麼。', author: 'WARREN BUFFETT' },
    { text: '"The best time to plant a tree was 20 years ago. The second best time is now."', zh: '種一棵樹最好的時間是二十年前，其次是現在。', author: 'CHINESE PROVERB' },
    { text: '"Success is not final, failure is not fatal: it is the courage to continue that counts."', zh: '成功不是終點，失敗也不是致命的：重要的是繼續前進的勇氣。', author: 'WINSTON CHURCHILL' },
    { text: '"Be fearful when others are greedy, and greedy when others are fearful."', zh: '當別人貪婪時要恐懼，當別人恐懼時要貪婪。', author: 'WARREN BUFFETT' },
    { text: '"The harder I work, the luckier I get."', zh: '我越努力，就越幸運。', author: 'GARY PLAYER' },
    { text: '"Discipline is the bridge between goals and accomplishment."', zh: '紀律是目標與成就之間的橋樑。', author: 'JIM ROHN' },
    { text: '"Price is what you pay. Value is what you get."', zh: '價格是你付出的，價值是你得到的。', author: 'WARREN BUFFETT' },
    { text: '"I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times."', zh: '我不怕練過一萬種踢法的人，我怕的是把一種踢法練了一萬次的人。', author: 'BRUCE LEE' },
    { text: '"The stock market is a device for transferring money from the impatient to the patient."', zh: '股票市場是一個把錢從沒耐心的人轉移到有耐心的人手中的工具。', author: 'WARREN BUFFETT' }
];

const historyEvents = [
    { year: '1932', event: 'First splitting of the atom using a particle accelerator.', zh: '首次使用粒子加速器分裂原子。' },
    { year: '1990', event: 'The Hubble Space Telescope was launched aboard Space Shuttle Discovery.', zh: '哈伯太空望遠鏡搭乘發現號太空梭發射升空。' },
    { year: '1953', event: 'Watson and Crick published their discovery of the DNA double helix structure.', zh: '華生和克里克發表了DNA雙螺旋結構的發現。' },
    { year: '1969', event: 'ARPANET, the precursor to the Internet, transmitted its first message.', zh: 'ARPANET（網際網路前身）傳送了第一條訊息。' },
    { year: '2010', event: 'The Deepwater Horizon oil rig exploded in the Gulf of Mexico.', zh: '深水地平線鑽油平台在墨西哥灣爆炸。' },
    { year: '1986', event: 'The Chernobyl nuclear disaster occurred in Ukraine.', zh: '車諾比核災在烏克蘭發生。' },
    { year: '1915', event: 'Albert Einstein presented his general theory of relativity.', zh: '愛因斯坦發表了廣義相對論。' },
    { year: '1971', event: 'Intel released the first commercial microprocessor, the Intel 4004.', zh: 'Intel 發布了第一款商用微處理器 Intel 4004。' },
    { year: '2004', event: 'Facebook was founded by Mark Zuckerberg at Harvard University.', zh: 'Mark Zuckerberg 在哈佛大學創立了 Facebook。' },
    { year: '1997', event: 'IBM\'s Deep Blue defeated world chess champion Garry Kasparov.', zh: 'IBM 的深藍擊敗了世界西洋棋冠軍卡斯帕洛夫。' }
];

const triviaFacts = [
    { fact: 'The New York Stock Exchange was founded in 1792 under a buttonwood tree on Wall Street.', zh: '紐約證券交易所於1792年在華爾街的一棵梧桐樹下成立。' },
    { fact: 'The term "bull market" comes from the way a bull attacks — thrusting its horns upward.', zh: '「牛市」一詞源自公牛攻擊的方式——用牛角向上頂。' },
    { fact: 'The first electronic stock ticker was invented by Thomas Edison in 1869.', zh: '第一台電子股票報價機由湯瑪斯·愛迪生於1869年發明。' },
    { fact: 'Japan\'s stock market (Nikkei 225) took over 34 years to recover from its 1989 peak.', zh: '日本股市（日經225指數）花了超過34年才從1989年的高峰恢復。' },
    { fact: 'The VIX index, known as the "fear gauge," was introduced by CBOE in 1993.', zh: 'VIX指數，又稱「恐慌指標」，由CBOE於1993年推出。' },
    { fact: 'Taiwan Semiconductor (TSMC) manufactures over 90% of the world\'s most advanced chips.', zh: '台積電生產了全球超過90%的最先進晶片。' },
    { fact: 'Warren Buffett bought his first stock at age 11 and filed his first tax return at age 13.', zh: '巴菲特11歲買了第一支股票，13歲就申報了第一次所得稅。' },
    { fact: 'The S&P 500 has returned an average of about 10% per year since its inception in 1957.', zh: '標普500指數自1957年成立以來，年均回報率約為10%。' }
];

function loadDailyContent() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const quote = quotes[dayOfYear % quotes.length];
    const history = historyEvents[dayOfYear % historyEvents.length];
    const trivia = triviaFacts[dayOfYear % triviaFacts.length];

    // Set quote content
    const quoteText = document.getElementById('quote-text');
    const quoteZh = document.getElementById('quote-zh');
    const quoteAuthor = document.getElementById('quote-author');
    if (quoteText) quoteText.textContent = quote.text;
    if (quoteZh) quoteZh.textContent = quote.zh;
    if (quoteAuthor) quoteAuthor.textContent = `— ${quote.author}`;

    // Set motivation card link
    const motivationCard = document.getElementById('motivationCard');
    if (motivationCard) {
        const searchQuery = encodeURIComponent(quote.author + ' quotes');
        motivationCard.href = `https://www.google.com/search?q=${searchQuery}`;
    }

    // Set history content
    const historyYear = document.getElementById('history-year');
    const historyEvent = document.getElementById('history-event');
    const historyEventZh = document.getElementById('history-event-zh');
    if (historyYear) historyYear.textContent = history.year;
    if (historyEvent) historyEvent.textContent = history.event;
    if (historyEventZh) historyEventZh.textContent = history.zh;

    // Set history card link
    const historyCard = document.getElementById('historyCard');
    if (historyCard) {
        const searchQuery = encodeURIComponent(history.year + ' ' + history.event);
        historyCard.href = `https://en.wikipedia.org/w/index.php?search=${searchQuery}`;
    }

    // Set trivia content
    const triviaFact = document.getElementById('trivia-fact');
    const triviaFactZh = document.getElementById('trivia-fact-zh');
    if (triviaFact) triviaFact.textContent = trivia.fact;
    if (triviaFactZh) triviaFactZh.textContent = trivia.zh;

    // Set trivia card link
    const triviaCard = document.getElementById('triviaCard');
    if (triviaCard) {
        const searchQuery = encodeURIComponent(trivia.fact);
        triviaCard.href = `https://www.google.com/search?q=${searchQuery}`;
    }
}

// ===== VIDEO DATA (63 records) =====
const videoData = [
  {
    "video_id": "X_Gf2z33_wg",
    "channel": "尼可拉斯楊Live精",
    "title": "I'm Buying NOW: How I'm Making a Fortune on This Crash!",
    "pub_date": "2026-03-28",
    "url": "https://www.youtube.com/watch?v=X_Gf2z33_wg",
    "content_overview": "分析 2026 年 3 月底由伊朗地緣危機與 Michael Burry 崩盤預警引發的市場劇震。Nicolas 解讀為何在 CAPE 逼近 40 的恐慌中，AI 基礎設施與數位資產反而迎來了「致富級」的抄底窗口。",
    "key_points": [
      "地緣溢價與通膨誤讀：油價一週飆升 25% 引發的恐慌是暫時的，市場過度計價了長期通膨風險。",
      "AI 估值修正完成：NVDA 等標的出清了極度看好下的情緒溢價，基本面（佔 GDP 增長 1/3）依然穩固。",
      "大空頭效應的逆向利用：當 Michael Burry 預警 30%-50% 的崩盤時，正是聰明錢利用恐慌性流動性建倉的時機。",
      "比特幣的避險屬性轉化：BTC 在此輪震盪中展現出優於黃金的恢復力與數字黃金屬性。"
    ],
    "investment_direction": "全速進攻：BTC、NVDA。減持受關稅與能源鏈斷裂影響的傳統出口製造業。",
    "trend_analysis": {
      "short_term": "地緣局勢邊際改善帶動科技股暴力反彈。",
      "medium_term": "AI 應用層數據爆發支撐高估值合理化。",
      "long_term": "進入萬億美元俱樂部普漲時代。"
    },
    "tickers": [
      {
        "symbol": "BTC",
        "change": "+3.8%"
      },
      {
        "symbol": "NVDA",
        "change": "+2.1%"
      },
      {
        "symbol": "QQQ",
        "change": "+1.5%"
      }
    ],
    "strategist_opinion": ""
  },
  {
    "video_id": "WqH4WgH4WMw",
    "channel": "Alan Chen 專欄",
    "title": "放棄造車？馬斯克豪賭 250 億硬剛台積電！80% 的 2 納米產能竟全部送上天！",
    "pub_date": "2026-03-24",
    "url": "https://www.youtube.com/watch?v=WqH4WgH4WMw",
    "content_overview": "深度解讀馬斯克在得州奧斯汀啟動的 Terafab 超級晶片工廠計畫。這不只是造晶片，而是重新定義 AGI 時代的算力供給模型。",
    "key_points": [
      "Terafab 垂直整合：馬斯克打破半導體數十年的分工，將設計、光刻、封測整合於單一工廠（系統級晶圓廠）。",
      "1 太瓦算力狂想：目標產能是當前全球 AI 算力總和的 50 倍，旨在解決台積電、三星擴產過慢的瓶頸。",
      "算力上天計畫：80% 產能將用於太空抗輻射 D3 晶片，在軌道建立大規模 AI 數據中心，規避地球能源與土地限制。",
      "地表應用：20% 產能留給特斯拉 AI5/AI6 晶片，支撐 FSD 與 Optimus 機器人規模化。"
    ],
    "investment_direction": "佈局具備垂直整合能力的 AI 巨頭。關注 Space AI 基礎設施標的。",
    "trend_analysis": {
      "short_term": "馬斯克概念股波動加劇。",
      "medium_term": "太空數據中心成為解決 AI 能源危機的『Plan B』。",
      "long_term": "半導體產業鏈從『大爆炸分工』轉向『大坍縮整合』。"
    },
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "8SWJT0ekUW8",
    "channel": "Alan Chen 專欄",
    "title": "微軟背刺、老黃撤離、馬斯克設局！OpenAI遭五面圍剿，7000億估值隨時雪崩？",
    "pub_date": "2026-03-23",
    "url": "https://www.youtube.com/watch?v=8SWJT0ekUW8",
    "content_overview": "揭露 OpenAI 面臨的史詩級圍剿。微軟轉向自研代碼、NVIDIA 軟體化滲透、以及馬斯克 xAI 的產能超車。",
    "key_points": [
      "OpenAI 私募估值泡沫化風險：華爾街 SPV 的真實套現路徑。",
      "軟體定義 AI 時代：微軟不再依賴單一模型供應商。",
      "算力霸權移轉：xAI 六週建成 30 萬 GPU 叢集的戰略威懾。"
    ],
    "investment_direction": "警惕 OpenAI 相關持股。加固算力基建（NVDA, VST）核心地位。",
    "trend_analysis": {
      "short_term": "獨角獸溢價縮水。",
      "medium_term": "AI 產業整合潮與收購戰。",
      "long_term": "AGI 朝主權化與去依賴化發展。"
    },
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "U6DcfJVqqyc",
    "channel": "尼可拉斯楊Live精",
    "title": "Is This the Bottom? War Ending & Trump’s Move — Get Rich or Miss It!",
    "pub_date": "2026-03-23",
    "url": "https://www.youtube.com/watch?v=U6DcfJVqqyc",
    "content_overview": "分析川普 48 小時通牒後的局勢逆轉：川普宣佈談判取得「非常良好」進展並暫緩打擊。討論戰爭結束預期下的市場底部信號與抄底邏輯。",
    "key_points": [
      "川普以戰逼和策略奏效，中東地緣溢價快速消退。",
      "市場從『末日定價』轉向『和平定價』的暴漲機會。",
      "黃金從高位回撤 500 美元的背後邏輯（土豪套現與避險撤離）。",
      "比特幣在高波動中展現的新型資產屬性分析。"
    ],
    "investment_direction": "轉向進攻：超跌科技股、數位資產。減持過熱的避險金銀。",
    "trend_analysis": {
      "short_term": "空頭回補帶動強勢反彈。",
      "medium_term": "通膨預期隨能源穩定而回落。",
      "long_term": "結構性牛市重啟。"
    },
    "tickers": [
      {
        "symbol": "QQQ",
        "change": "+2.5%"
      },
      {
        "symbol": "BTC",
        "change": "+4.2%"
      }
    ],
    "strategist_opinion": ""
  },
  {
    "video_id": "airm_2i4Kto",
    "channel": "尼可拉斯楊",
    "title": "轟炸耶路撒冷：伊朗黑旗軍開啟末日預言！聖殿山將會裂開",
    "pub_date": "2026-03-22",
    "url": "https://www.youtube.com/watch?v=airm_2i4Kto",
    "content_overview": "解讀伊朗代理人武裝（黑旗軍）的動向與耶路撒冷聖殿山的預言聯繫。探討地緣衝突如何被賦予『末日審判』色彩，從而改變參戰方的行為風險偏好。",
    "key_points": [
      "伊朗黑旗軍的歷史象徵意義與現實威脅。",
      "聖殿山作為中東戰爭爆發點的核心敏感度。",
      "末日心理預期對市場非理性拋售的催化作用。",
      "荷姆茲海峽封鎖風險對全球石油市場的極端壓力測試。"
    ],
    "investment_direction": "能源對沖：原油期貨 (USO)、能源板塊 (XLE)。",
    "trend_analysis": {
      "short_term": "原油受荷姆茲海峽封鎖威脅而暴漲。",
      "medium_term": "航運成本飆升，通膨預期再度抬頭。",
      "long_term": "實物資產（大宗商品）的定價權重估。"
    },
    "tickers": [
      {
        "symbol": "XLE",
        "change": 3.1
      },
      {
        "symbol": "USO",
        "change": 4.5
      }
    ],
    "strategist_opinion": "預言即動力。當戰爭被賦予信仰色彩，理性的估值模型將暫時失效，需隨時準備好撤離高風險部位。"
  },
  {
    "video_id": "sgJmbRClyqk",
    "channel": "尼可拉斯楊",
    "title": "為什麼以色列會永遠追殺伊朗最高領袖？破解伊朗洗腦的秘密！",
    "pub_date": "2026-03-22",
    "url": "https://www.youtube.com/watch?v=sgJmbRClyqk",
    "content_overview": "深入探討伊朗神權體系與以色列間的衝突根源。分析伊朗如何透過意識形態控制國民，以及以色列為何將定點清除伊朗高層視為生存底線。",
    "key_points": [
      "伊朗神權政治的意識形態『紅線』與洗腦機制。",
      "以色列『摩薩德』式打擊對伊朗指揮鏈的瓦解作用。",
      "中東局勢從『影子戰爭』向『全面衝突』演變的臨界點。",
      "全球資本逃向避險資產（黃金、美債）的流動性邏輯。"
    ],
    "investment_direction": "避險配置：黃金 (GLD)、比特幣 (BTC)。同時關注能源鏈斷裂對東南亞代工廠的成本衝擊。",
    "trend_analysis": {
      "short_term": "恐慌指數 (VIX) 飆升，中東溢價維持。",
      "medium_term": "區域性能源短缺（如東南亞斷油預警）影響製造業。",
      "long_term": "全球供應鏈加速『去中東化』與能源結構轉型。"
    },
    "tickers": [
      {
        "symbol": "GLD",
        "change": 1.2
      },
      {
        "symbol": "BTC",
        "change": 2.5
      }
    ],
    "strategist_opinion": "只要伊朗核心體系存在，這場追殺就不會停止。市場需習慣『常態化高波動』。"
  },
  {
    "video_id": "TwYYX3_2Emk",
    "channel": "Alan Chen 專欄",
    "title": "25億GPU走私案告破！還原美超微SMCI驚天大案。英偉達有波折？",
    "pub_date": "2026-03-21",
    "url": "https://www.youtube.com/watch?v=TwYYX3_2Emk",
    "content_overview": "還原 SMCI 美超微涉及的 GPU 走私案真相。探討監管壓力下伺服器供應鏈的脆弱性。",
    "key_points": [
      "SMCI 內控漏洞解析",
      "GPU 黑市價格波動",
      "NVIDIA 供應鏈合規風險"
    ],
    "investment_direction": "觀望伺服器板塊，避開處於監管風暴中心的標的。",
    "trend_analysis": "供應鏈主權化與合規化成為 2026 主旋律。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "Zqz57HXQAsw",
    "channel": "Alan Chen 專欄",
    "title": "全球最大天然氣心臟停擺！導彈摧毀 20% 供給，2026 天然氣危機遠大於石油危機",
    "pub_date": "2026-03-20",
    "url": "https://www.youtube.com/watch?v=Zqz57HXQAsw",
    "content_overview": "分析中東衝突對 LNG 供應鏈的衝擊。",
    "key_points": [
      "LNG 價格暴漲邏輯",
      "能源通膨二度爆發"
    ],
    "investment_direction": "佈局美國本土 LNG 出口商。",
    "trend_analysis": "能源危機加速核能轉型。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "WDtlvsgF4xs",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: I built my own AI research lab (Hermes agent/OpenClaw)",
    "pub_date": "2026-03-20",
    "url": "https://youtube.com/watch?v=WDtlvsgF4xs",
    "content_overview": "Alex Finn 在影片中展示了他如何利用 OpenClaw 和 Hermes Agent 建立自己的個人 AI 研究實驗室，名為「Henry Research Lab」。這個實驗室基於 Carpathy 的自動研究框架，旨在自主訓練和微調模型、建立 LoRA、優化系統提示，甚至自主經營業務和改善生活。他強調每個人都應該擁有自己的 AI 研究實驗室和 24/7 工作的 AI 代理團隊。影片中也提到 Hermes 是 OpenClaw 的競爭產品，並展示了 Henry 實驗室目前每五分鐘運行實驗的狀態。",
    "key_points": [
      "Alex Finn 建立了一個名為「Henry Research Lab」的個人 AI 研究實驗室。",
      "該實驗室使用 OpenClaw 和 Hermes Agent 進行開發。",
      "它基於 Carpathy 的自動研究框架，實現自動研究。",
      "實驗室功能包括：訓練模型、微調模型、建立 LoRA、優化系統提示、自主經營業務和改善生活。",
      "Alex 鼓勵觀眾建立自己的 AI 研究實驗室和 24/7 工作的 AI 代理團隊。",
      "Hermes Agent 被提及為 OpenClaw 的競爭產品。",
      "Henry 實驗室目前每五分鐘運行一次實驗。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "xfRVuweL_yc",
    "channel": "Alan Chen 專欄",
    "title": "查我賬也不降息！鮑威爾強硬留任：誓與通脹死磕到底！油價反噬！",
    "pub_date": "2026-03-19",
    "url": "https://www.youtube.com/watch?v=xfRVuweL_yc",
    "content_overview": "解讀鮑威爾強硬立場與 PPI 數據衝擊。",
    "key_points": [
      "聯準會獨立性挑戰",
      "高利率環境常態化"
    ],
    "investment_direction": "增持現金與短債。",
    "trend_analysis": "全球金融資本回流美元。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "a7eKM4_0dOA",
    "channel": "Alan Chen 專欄",
    "title": "1萬億訂單揭曉！黃仁勳建“AI安卓 empire”，19家車企聯手圍剿特斯拉？",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=a7eKM4_0dOA",
    "content_overview": "GTC 2026 深度拆解，NVIDIA 的汽車版圖。",
    "key_points": [
      "Blackwell 滲透汽車鏈",
      "FSD 的競爭對手群像"
    ],
    "investment_direction": "長期看好 NVDA 平台化價值。",
    "trend_analysis": "自動駕駛進入戰國時代。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "nCoISFU91t4",
    "channel": "尼可拉斯楊Live精",
    "title": "Iran Has No Cards Left — Time to Get Rich Buying the Dip.",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=nCoISFU91t4",
    "content_overview": "分析伊朗在當前地緣政治衝突中的頹勢，探討其外部壓力與內部困境，指出地緣衝突引發的市場短期波動是極佳的「買入低點」機會。",
    "key_points": [
      "伊朗地緣政治籌碼耗盡，反擊能力受限",
      "全球供應鏈對中東風險的耐受度提高",
      "市場因恐慌導致的超賣提供了套利空間",
      "原油價格與避險資產的短期震盪邏輯"
    ],
    "investment_direction": "建議關注因地緣政治恐慌而被錯殺的優質藍籌股，以及能源板塊的短期對沖機會。",
    "trend_analysis": "短期內市場受中東局勢恐慌情緒主導，呈現超賣跡象，特別是能源進口國如韓國（EWY）因油價衝擊與槓桿平倉出現非理性暴跌；中期隨衝突邊際影響遞減，基本面回歸；長期看好避險資產配置價值。",
    "tickers": [
      {
        "symbol": "EWY",
        "change": -0.5
      },
      {
        "symbol": "SPY",
        "change": 0.26
      },
      {
        "symbol": "XLE",
        "change": -0.85
      }
    ],
    "strategist_opinion": "伊朗的威懾力正在瓦解，市場往往過度反應。韓國市場的劇震是典型的「恐慌性錯殺」，這不是危機，而是資產重新配置的黃金窗口。"
  },
  {
    "video_id": "DiVwY66AgaE",
    "channel": "尼可拉斯楊Live精",
    "title": "Stop Panic Selling! The Real Opportunity Is Buying the Dip Before Hormuz Reopens",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=DiVwY66AgaE",
    "content_overview": "針對荷姆茲海峽可能封鎖引發的恐慌進行反向思考，強調封鎖通常是短期且難以持續的，投資者應在復航預期前提前佈局。",
    "key_points": [
      "荷姆茲海峽封鎖的經濟成本極高，各方無力長期維持",
      "恐慌性拋售導致資產價格偏離內在價值",
      "航運成本與通脹預期的關聯分析",
      "復航後的市場反彈力道預測"
    ],
    "investment_direction": "佈局航運、大宗商品期貨，以及對通脹敏感的金融資產。",
    "trend_analysis": "短期供應鏈擔憂推升運費，但實體經濟承壓；中期復航後將迎來暴力修復；長期看好大宗商品在全球新局勢下的定價權。",
    "tickers": [
      {
        "symbol": "MU",
        "change": 4.5
      },
      {
        "symbol": "SPY",
        "change": 0.26
      },
      {
        "symbol": "XLE",
        "change": -0.85
      }
    ],
    "strategist_opinion": "恐慌是投資者的敵人，卻是智者的朋友。在封鎖傳言最盛時買入，在復航確定時獲利。"
  },
  {
    "video_id": "GqBtxVrY_SM",
    "channel": "尼可拉斯楊Live精",
    "title": "Market Crash = Opportunity！！！",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=GqBtxVrY_SM",
    "content_overview": "深度剖析股市崩盤背後的宏觀經濟週期，論證為什麼每一次「崩盤」都是財富重新分配的關鍵時刻。",
    "key_points": [
      "歷史數據顯示崩盤後的修復期是漲幅最猛烈的階段",
      "現金流充足的企業在崩盤中更具備擴張優勢",
      "心理建設：如何克服群體恐慌心態",
      "識別市場底部的核心技術指標"
    ],
    "investment_direction": "分批建倉指數基金（如 SPY, QQQ）以及具備護城河的科技龍頭。",
    "trend_analysis": "短期波動率激增，多殺多風險仍在；中期底部信號顯現，指數率先反彈；長期資產估值修復，迎來大牛市起點。",
    "tickers": [
      {
        "symbol": "QQQ",
        "change": 0.49
      },
      {
        "symbol": "SPY",
        "change": 0.26
      }
    ],
    "strategist_opinion": "崩盤是上帝給投資者的打折季。如果你在繁榮時不敢賣，至少在崩盤時要敢買。"
  },
  {
    "video_id": "zwmuT5uaGRw",
    "channel": "尼可拉斯楊Live精",
    "title": "Market Panic Is a Chance to Get Rich — The War May End Soon",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=zwmuT5uaGRw",
    "content_overview": "結合戰爭停火談判的最新進展，探討戰爭溢價消退後的市場轉向，強調和平預期下的經濟復甦機會。",
    "key_points": [
      "戰爭恐慌導致的市場大跌：3月初伊朗宣布關閉荷姆茲海峽，導致韓國、日本、台灣股市暴跌，因為這些地區的晶片製造高度依賴中東天然氣。",
      "戰爭將提前結束的邏輯：美國國防部長宣布伊朗海軍已被摧毀、空軍已不存在，美國獲得完全制空權。川普政府迅速提供政治風險保險，打破英國保險公司的壟斷，荷姆茲海峽將逐步開放。",
      "恐慌時買入的實踐：作者在周一賣出黃金礦業股，周二果斷抄底韓國ETF（EWY），周三韓國綜合指數暴漲9.66%，驗證了「別人恐懼我貪婪」的策略。",
      "具體投資標的：1) 韓國ETF（EWY）— 主要持有三星、SK海力士，因恐慌被錯殺；2) 台積電（TSMC）和Micron— 邏輯晶片需求未變；3) 電力基礎設施（PAVE、GEV、PWR、CAT）— AI數據中心的核心需求；4) 黃金（GLD、GDX）— 戰後降息預期利好。",
      "核心投資邏輯：戰爭導致的下跌是買入機會，不要等到戰爭結束才進場，因為那時已經太晚了。現在大多數人還看不清大局，這就是機會。"
    ],
    "investment_direction": "關注重建相關建材、工程機械，以及戰後消費復甦板塊；佈局超跌的韓國科技藍籌（EWY）。",
    "trend_analysis": "短期軍工板塊漲勢乏力，市場轉向和平利多；韓股因能源依賴度高而短期承壓，但基本面（HBM）依然強勁；長期區域經濟融合重塑生產力。",
    "tickers": [
      {
        "symbol": "EWY",
        "change": -0.5
      },
      {
        "symbol": "GLD",
        "change": -0.25
      },
      {
        "symbol": "SPY",
        "change": 0.26
      }
    ],
    "strategist_opinion": "戰爭總會結束，而市場總是提前反映。在砲火聲中尋找和平的種子。"
  },
  {
    "video_id": "6b54-_5OH80",
    "channel": "尼可拉斯楊Live精",
    "title": "The Market is Crashing. Here’s How We Profit.",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=6b54-_5OH80",
    "content_overview": "提供具體的空頭市場操作指南，包括對沖工具的使用與反向投資策略，幫助投資者在下行週期中獲利。",
    "key_points": [
      "戰後重建的投資邏輯：戰爭結束後，重建需求將推動原物料（鋼鐵、水泥、銅）、能源基礎設施、以及工程服務的需求。",
      "伊朗石油的回歸：若制裁解除，伊朗石油產量有望從目前的250萬桶/日恢復至400萬桶/日，影響全球油市供需平衡。",
      "投資標的：1) 原物料ETF（DBC、GSG）；2) 能源基礎設施（管道、煉油廠）；3) 國際工程公司（Fluor、Jacobs）；4) 中東ETF（MES）。",
      "戰爭期間的資本保護：持有黃金、美元、以及避險資產，減少風險資產敞口，為戰後機會保留現金。",
      "時間窗口：戰後重建通常在衝突結束後的6-12個月內啟動，投資者需要提前研究和準備。"
    ],
    "investment_direction": "短期持有 SH 或 PSQ 等對沖工具，中長期鎖定高股息避險資產。",
    "trend_analysis": "短期下行壓力沉重，對沖工具溢價高企；中期行情進入盤整築底；長期優質資產展現高分紅吸引力。",
    "tickers": [
      {
        "symbol": "QQQ",
        "change": 0.49
      },
      {
        "symbol": "SPY",
        "change": 0.26
      }
    ],
    "strategist_opinion": "專業投資者不在乎市場漲跌，只在乎波動率。學會在下雨天賣傘。"
  },
  {
    "video_id": "FqDQfEV8UBI",
    "channel": "尼可拉斯楊Live精",
    "title": "One Life Opportunity: AI & SpaceX Before 2030",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=FqDQfEV8UBI",
    "content_overview": "聚焦未來五年的兩大核心科技引擎：人工智慧與商業航太。探討 SpaceX 的市場壟斷力及其對全球通訊與運輸的革新。",
    "key_points": [
      "AI的「1995時刻」：AI正處於類似1995年網際網路的發展階段，基礎設施剛剛建立，應用層才剛開始探索，未來10年將迎來爆發式增長。",
      "太空經濟的崛起：SpaceX降低了太空發射成本10倍以上，開啟了太空經濟的新時代，包括衛星網際網路、太空旅遊、太空採礦等。",
      "投資策略：1) AI基礎設施（NVIDIA、AMD、資料中心REITs）；2) AI應用（軟體公司、自動駕駛）；3) 太空供應鏈（鋁材、鈦合金、太陽能板）；4) 太空ETF（ARKX、UFO）。",
      "時間窗口：作者認為2025-2027年是布局的關鍵窗口，之後這些產業將進入成熟階段，回報率將下降。",
      "風險提示：高成長伴隨高波動，需要承受50%以上的回調，建議用長期資金（5-10年）投資。"
    ],
    "investment_direction": "關注 AI 算力基礎設施、航太複合材料供應商，以及韓國 HBM 龍頭（透過 EWY 配置）。",
    "trend_analysis": "短期算力需求持續爆炸，科技板塊領漲；韓國記憶體晶片因 HBM 需求進入超級週期；長期太空經濟重塑地球商業版圖。",
    "tickers": [
      {
        "symbol": "EWY",
        "change": -0.5
      },
      {
        "symbol": "NVDA",
        "change": -0.69
      },
      {
        "symbol": "QQQ",
        "change": 0.49
      },
      {
        "symbol": "UNG",
        "change": 0
      }
    ],
    "strategist_opinion": "這是屬於我們這個時代的「大航海時代」。SpaceX 不僅是公司，更是通往外星文明的基礎設施。"
  },
  {
    "video_id": "YU-Ci7VRQA0",
    "channel": "尼可拉斯楊Live精",
    "title": "Trump’s Next Shockwave — A Once-in-a-Lifetime Opportunity",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=YU-Ci7VRQA0",
    "content_overview": "預測川普政策對全球經貿格局的第二次震盪，探討關稅政策、能源鬆綁與去中心化金融的潛在利多。",
    "key_points": [
      "美國最高法院對IEEPA的裁決並非阻止川普徵收關稅，而是透過「司法極簡主義」提供了法律灰色地帶，讓川普可利用其他法規繼續執行關稅政策。",
      "川普將透過1974年貿易法案第122條及後續232、301條款，繼續並可能加強徵收關稅，以促進美國製造業回流，這對出口型企業構成風險。",
      "由於關稅收入不會減少甚至可能增加，市場對Palantir等軍工AI和國防股因政府訂單減少而下跌的擔憂是過度的，存在反彈空間。",
      "若美國政府最終需退還已徵收的巨額關稅，將造成財政缺口，需發行更多債券彌補，此因素利好黃金，黃金價格具上漲潛力。",
      "Google、Microsoft、Amazon、Meta等大型科技公司股價近期下跌後估值誘人，且其投資的AI新創公司（如OpenAI、Anthropic）今年將陸續IPO，帶來潛在機會。",
      "核心投資策略應轉向投資在美國本土設廠或業務主要在美國的公司，以應對關稅政策帶來的產業結構變化。"
    ],
    "investment_direction": "看好美國本土工業股、傳統能源（XLE）以及受監管放寬激勵的金融板塊；避開高關稅風險行業或佈局已承諾在美投資的韓企。",
    "trend_analysis": "短期政策預期引發概念股劇震；韓國市場因貿易戰陰雲短期承壓；長期產業政策引導資本向美國本土與合規盟友回流。",
    "tickers": [
      {
        "symbol": "BTC",
        "change": -0.41
      },
      {
        "symbol": "DJT",
        "change": 0.41
      },
      {
        "symbol": "EWY",
        "change": -0.5
      },
      {
        "symbol": "XLE",
        "change": -0.85
      }
    ],
    "strategist_opinion": "川普的不可預測性是市場的噪音，但他的「去監管」核心則是投資者的福音。"
  },
  {
    "video_id": "sNWNCg1s4-E",
    "channel": "尼可拉斯楊Live精",
    "title": "Strangest Market Signal Yet… Get Rich Opportunity?",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=sNWNCg1s4-E",
    "content_overview": "分析近期市場中出現的異常背離現象，如金價與美債殖利率同漲，解讀這類罕見信號背後的深層財富密碼。",
    "key_points": [
      "全球不確定性飆升與市場異常：2026年2月全球不確定性指數(WUI)達歷史新高，同時Ray Dalio等專家預警舊世界秩序崩壞。美股大盤指數雖創新高，但超過四分之一的S&P 500成分股已大幅下跌，市場呈現巨大背離。",
      "「興登堡凶兆」的歷史借鑒：當前市場大型股支撐指數、中小盤股崩跌的現象，與歷史上三次重大市場修正（如2000年科網泡沫、2007年金融危機前夕、2021-2022年）的「興登堡凶兆」高度相似，預示潛在的市場風險或修正。",
      "AI應用與市場敘事變遷：AI曾是股價飆升的催化劑，但現在市場邏輯轉變為「AI可取代的公司將率先崩潰」。AI相關公司若業績不達預期，股價會大幅下跌，導致市場混沌且風險極高。",
      "未來市場情景預測與投資策略：影片提出未來三種可能情景（熊市機率30%，震盪調整機率45%），並指出Bridgewater Associates增持黃金與AI科技巨頭（NVIDIA, Amazon, Micron）的策略，暗示在不確定性中尋求避險與成長機會。"
    ],
    "investment_direction": "增加實物黃金或黃金 ETF（GLD）配置，適度持有比特幣作為數位黃金對沖。",
    "trend_analysis": "短期信號混亂，資產定價權博弈激烈；中期避險共識達成，實物資產受寵；長期貨幣體系重估有利於去中心化資產。",
    "tickers": [
      {
        "symbol": "BTC",
        "change": -0.41
      },
      {
        "symbol": "GLD",
        "change": -0.25
      }
    ],
    "strategist_opinion": "當所有傳統公式都失效時，說明大變革即將到來。緊跟央行和聰明錢的腳步。"
  },
  {
    "video_id": "4rVfvvk5IbQ",
    "channel": "尼可拉斯楊Live精",
    "title": "Where Will Sanae Takaichi Lead Japan’s Stock Market?",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=4rVfvvk5IbQ",
    "content_overview": "探討日本政治人物高市早苗的政策對日股的影響，分析其積極財政政策與貨幣寬鬆立場對日本經濟振興的意義。",
    "key_points": [
      "高市早苗被稱為「日本川普」，其政策主張包括：維持超寬鬆貨幣政策（反對升息）、將國防預算從GDP的1%提升至2%以上、以及強硬對中政策。",
      "若高市早苗當選，日圓可能持續貶值，利好日本出口股（如豐田、索尼），但不利於依賴進口原物料的企業。",
      "國防預算翻倍將直接利好日本國防相關企業，如三菱重工（7011.T）、川崎重工（7012.T）、IHI（7013.T）等。",
      "高市早苗的對中強硬路線可能影響中日貿易，但同時可能強化台日供應鏈合作，利好台灣相關的半導體供應鏈股票。",
      "影片提醒投資者關注9月27日的自民黨總裁選舉結果，並建議提前布局相關受益板塊，但也要注意選舉不確定性帶來的風險。"
    ],
    "investment_direction": "關注日本半導體設備商與出口導向型車企。",
    "trend_analysis": "短期日圓匯率震盪帶動出口板塊反彈；中期財政刺激政策支撐本土需求；長期日本製造業在全球產業鏈中重新佔位。",
    "tickers": [
      {
        "symbol": "NVDA",
        "change": -0.69
      },
      {
        "symbol": "QQQ",
        "change": 0.49
      }
    ],
    "strategist_opinion": "日本正在經歷失去三十年後的真正轉折。政治強人的出現將是日股起飛的導火索。"
  },
  {
    "video_id": "SI6V4Oi2Y4Y",
    "channel": "尼可拉斯楊Live精",
    "title": "SpaceX IPO Strategy: How I’m Positioning to Get Rich",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=SI6V4Oi2Y4Y",
    "content_overview": "雖然 SpaceX 尚未正式 IPO，但投資者可以通過二級市場股權基金或其重要合作夥伴進行預先佈局，分析其估值邏輯。",
    "key_points": [
      "SpaceX預計在2025-2026年進行IPO，估值可能達到2000-2500億美元，成為有史以來最大的IPO之一。",
      "Starlink（星鏈）將是IPO的主要資產，目前已擁有超過400萬用戶，年收入估計達80億美元，且持續快速增長。",
      "在SpaceX IPO前，投資者可透過以下方式間接布局：1) 供應鏈相關股票（如鋁材、鈦合金、太陽能板供應商）；2) 太空基礎設施ETF（如UFO、ARKX）；3) 與SpaceX有業務往來的上市公司。",
      "具體供應鏈標的包括：Alcoa (AA) - 鋁材供應商、ATI (ATI) - 鈦合金供應商、SolAero（未上市）- 太陽能板供應商等。",
      "影片強調SpaceX的護城河在於其可重複使用的火箭技術，這使其發射成本比競爭對手低10倍以上，形成強大的競爭優勢。"
    ],
    "investment_direction": "關注持有 SpaceX 股份的投資銀行與私募基金，以及衛星通訊技術配套商。",
    "trend_analysis": "短期二級市場股份溢價抬升；中期隨星鏈營收增長進入上市倒計時；長期星鏈網聯全球創造萬億級現金流。",
    "tickers": [
      {
        "symbol": "NVDA",
        "change": -0.69
      },
      {
        "symbol": "QQQ",
        "change": 0.49
      }
    ],
    "strategist_opinion": "這是未來的亞馬遜加上未來的波音。在它變身萬億巨頭前，找到一切能入場的縫隙。"
  },
  {
    "video_id": "l7_3brMj_Yo",
    "channel": "尼可拉斯楊Live精",
    "title": "Global Market Crash: Ordinary People’s Chance to Get Rich",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=l7_3brMj_Yo",
    "content_overview": "專為普通投資者設計的崩盤生存與致富指南，強調「階級跨越」往往發生在資產價格跌到地心的時候。",
    "key_points": [
      "全球市場回調的三大原因：1) 中東地緣政治風險升溫；2) 美聯儲維持高利率的時間比預期長；3) AI相關股票估值過高，出現獲利了結賣壓。",
      "作者認為這不是金融危機，而是健康的市场調整。企業盈利仍然強勁，失業率低，消費者信心穩定，基本面支撐股市長期向上。",
      "「別人恐懼我貪婪」：歷史數據顯示，在市場大跌時勇敢買入的投資者，長期回報遠超過在市場高點追漲的人。",
      "具體操作策略：分批買入（dollar-cost averaging），專注於有護城河的優質公司（如蘋果、微軟、輝達），避免高負債和無盈利的概念股。",
      "特別關注被錯殺的優質中小型股，這些股票在市場恐慌時跌幅往往大於大型股，但反彈時漲幅也更大。"
    ],
    "investment_direction": "堅持長期主義，利用崩盤低位積累優質資產的「籌碼數量」。",
    "trend_analysis": "短期散戶情緒極度低迷，具備反彈潛力；中期定期定額展現平滑成本優勢；長期在經濟復甦中實現資產階級躍升。",
    "tickers": [
      {
        "symbol": "BTC",
        "change": -0.41
      },
      {
        "symbol": "SPY",
        "change": 0.26
      }
    ],
    "strategist_opinion": "對於沒有原始積累的普通人，平穩的市場是絕望的。崩盤才是翻身的唯一通路。"
  },
  {
    "video_id": "bsgjD3Uf8T4",
    "channel": "尼可拉斯楊Live精",
    "title": "Gold & Silver Collapse: Only Trump Can Stop It — A Once-in-a-Lifetime Chance",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=bsgjD3Uf8T4",
    "content_overview": "分析貴金屬近期暴跌的原因，以及川普回歸後對強美元政策或金本位討論的影響，指出這是長期持有的補票機會。",
    "key_points": [
      "黃金回調的主要原因：1) 美元指數走強；2) 中東地緣政治風險暫時緩解；3) 部分投資者獲利了結；4) 實際利率上升。",
      "長期看漲邏輯未變：全球央行持續增持黃金儲備、美國財政赤字惡化、去美元化趨勢、以及潛在的美元信用危機。",
      "川普政策對黃金的影響：若川普當選並推行減稅和增加支出政策，將進一步惡化財政赤字，長期利好黃金。",
      "白銀的投資價值：白銀除了貴金屬屬性外，還有工業需求（太陽能板、電動車），在綠能轉型趨勢下需求持續增長。",
      "操作策略：分批買入實物黃金/白銀或ETF（GLD、SLV、GDX），避免使用槓桿，持有週期至少3-5年。"
    ],
    "investment_direction": "低位吸納實物金銀，或關注白銀相關開採企業。",
    "trend_analysis": "短期金價在底部徘徊，尋求強美元政策邊際轉折；中期政策落地後通脹預期回升支撐金價；長期實物資產價值回歸。",
    "tickers": [
      {
        "symbol": "DJT",
        "change": 0.41
      },
      {
        "symbol": "GLD",
        "change": -0.25
      }
    ],
    "strategist_opinion": "實物資產永遠是信用貨幣崩塌時的最後堡壘。趁現在金銀價格回調，完成最後的避險配置。"
  },
  {
    "video_id": "IijbvUP-J5g",
    "channel": "尼可拉斯楊Live精",
    "title": "Takaichi, Japan Collapse, Iran War — A Rare Chance to Get Rich",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=IijbvUP-J5g",
    "content_overview": "綜合多重地緣與政治變量，分析日本與中東局勢交織下的全球資本流向，尋找被市場忽視的避險與成長結合點。",
    "key_points": [
      "日本經濟風險：日圓持續貶值、債務佔GDP比例超過260%、人口老化和少子化問題嚴重，存在系統性風險。但若高市早苗當選並推動改革，可能逆轉頹勢。",
      "伊朗戰爭投資邏輯：戰爭爆發通常導致油價飆升、避險資產（黃金、美元）走強、國防股上漲。但作者提醒要在戰爭爆發前布局，而非等新聞出來後追高。",
      "高市早苗的政策組合：超寬鬆貨幣+財政刺激+國防擴張，這組合類似「安倍經濟學」但更激進，可能短期刺激日本股市但長期加劇債務風險。",
      "具體投資標的：日本國防股（三菱重工、川崎重工）、黃金ETF（GLD）、韓國ETF（EWY，因地緣政治緊張被錯殺）、以及美國國防股（LMT、NOC、RTX）。",
      "風險管理：這些投資都帶有高不確定性，建議控制倉位（不超過投資組合的10-15%），並設置止損點。"
    ],
    "investment_direction": "對沖型投資：持有軍工股、能源股的同時，監控日圓匯率的異常波動。",
    "trend_analysis": "短期地緣不確定性推升能源股；中期日本國防政策帶動軍工鏈條；長期全球資本在避險與收益間頻繁搬運。",
    "tickers": [
      {
        "symbol": "QQQ",
        "change": 0.49
      },
      {
        "symbol": "XLE",
        "change": -0.85
      }
    ],
    "strategist_opinion": "危機越複雜，獲利機會越純粹。從地緣冲突中找出必備的剛需物資。"
  },
  {
    "video_id": "zH2Kyex5Dgs",
    "channel": "尼可拉斯楊Live精",
    "title": "Japan’s Collapse: A Once-in-a-Lifetime Wealth Event",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=zH2Kyex5Dgs",
    "content_overview": "探討日本經濟結構性問題爆發（如負債率、人口結構）可能引發的「創造性破壞」，分析從廢墟中重生的致富邏輯。",
    "key_points": [
      "日本債務危機：日本政府債務佔GDP比例超過260%，為全球最高。隨著利率上升，債務利息支出將吞噬越來越多的財政預算。",
      "日圓貶值螺旋：為了維持出口競爭力，日本央行被迫維持超低利率，導致日圓持續貶值，進口通脹加劇，形成惡性循環。",
      "「日本式崩潰」情景：若日本無法控制債務和匯率，可能出現主權債務危機，日圓大幅貶值，日本國債違約風險上升。",
      "投資機會：1) 做空日圓（USD/JPY）；2) 做空日本國債；3) 投資於日本崩潰受益的資產（如黃金、美元資產）；4) 在極端恐慌時買入被錯殺的日本優質企業。",
      "時間窗口：作者認為日本危機可能在未來1-3年內爆發，投資者應提前布局，但也要注意日本央行干預的風險。"
    ],
    "investment_direction": "關注日本併購基金（M&A）及具備國際競爭力的日本隱形冠軍企業。",
    "trend_analysis": "短期日債拋售壓力引發流動性擔憂；中期資產價格觸底吸引全球併購資金；長期日本產業結構完成脫胎換骨式調整。",
    "tickers": [
      {
        "symbol": "QQQ",
        "change": 0.49
      },
      {
        "symbol": "SPY",
        "change": 0.26
      }
    ],
    "strategist_opinion": "破而後立。日本的「崩潰」是資產價格的重置，對於全球資本來說，這是一場豐盛的盛宴。"
  },
  {
    "video_id": "6IGt19-CzmU",
    "channel": "尼可拉斯楊Live精",
    "title": "Trump’s Next Move Could Make You Rich",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=6IGt19-CzmU",
    "content_overview": "具體預測川普重返白宮後的首批行政命令（如取消環保限制、大規模驅逐非法移民）對各行業的具體經濟衝擊。",
    "key_points": [
      "川普的「美國優先」政策核心：製造業回流、能源獨立、減稅、放鬆監管。這些政策將重塑美國產業格局。",
      "關稅政策的投資邏輯：對進口商品徵收關稅將利好在美國本土生產的企業，特別是鋼鐵、鋁業、汽車製造等產業。",
      "能源政策：川普支持傳統能源（石油、天然氣、煤炭），預計放鬆環保監管，利好能源股（XOM、CVX、OXY）。",
      "金融監管放鬆：放鬆Dodd-Frank法案監管，降低銀行資本金要求，利好大型銀行股（JPM、BAC、WFC）。",
      "減稅政策延續：若2017年減稅法案延續或擴大，企業盈利將進一步提升，特別是有效稅率較高的公司。"
    ],
    "investment_direction": "短線追蹤 DJT 及相關概念股，長線佈局受益於去監管的金融與能源巨頭。",
    "trend_analysis": "短期政策預期引發概念股高度投機性波動；中期實質性去監管降低企業成本；長期市場回歸基本面定價。",
    "tickers": [
      {
        "symbol": "DJT",
        "change": 0.41
      },
      {
        "symbol": "TSLA",
        "change": 0.94
      },
      {
        "symbol": "XLE",
        "change": -0.85
      }
    ],
    "strategist_opinion": "政治決定財富分配. 讀懂川普的行政優先級，就是讀懂了未來的資金流向圖。"
  },
  {
    "video_id": "0C2lF8pKwlI",
    "channel": "尼可拉斯楊Live精",
    "title": "Sanae Takaichi Just Revealed the Next 3-Year Wealth Play",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=0C2lF8pKwlI",
    "content_overview": "深度解讀高市早苗最新的經濟演說，分析其對日本量子計算、生物技術及新型核能的扶持政策。",
    "key_points": [
      "高市早苗的「新安倍經濟學」：比安倍更激進的貨幣寬鬆和財政刺激，目標是擺脫通縮並實現名義GDP增長。",
      "國防產業的黃金時代：高市早苗主張將國防預算翻倍至GDP的2%以上，這將帶來數兆日圓的國防支出，利好日本國防產業。",
      "對中供應鏈重組：高市的對中強硬路線將加速供應鏈「去中國化」，利好台灣、東南亞的供應鏈企業，以及日本國內的替代供應商。",
      "日圓貶值的雙面性：雖然日圓貶值利好出口股，但也加劇進口通脹和債務負擔，需要謹慎選擇投資標的。",
      "3年投資主軸：1) 日本國防股；2) 台灣半導體供應鏈；3) 東南亞製造業；4) 黃金（避險）。"
    ],
    "investment_direction": "投資日本高新技術產業 ETF，以及參與日本政府採購項目的承包商。",
    "trend_analysis": "短期技術補貼計畫引發相關板塊異動；中期技術成果轉化為實際營收；長期日本在量子與能源領域建立新競爭優勢。",
    "tickers": [
      {
        "symbol": "NVDA",
        "change": -0.69
      },
      {
        "symbol": "QQQ",
        "change": 0.49
      }
    ],
    "strategist_opinion": "跟著國家戰略走。高市的路線是日本版的「科技救國」，這將開啟一段三年的技術牛市。"
  },
  {
    "video_id": "0-0_kHauSrk",
    "channel": "尼可拉斯楊Live精",
    "title": "To Get Rich, You Have to Follow Trump.",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=0-0_kHauSrk",
    "content_overview": "闡述川普主義對全球化秩序的顛覆，指出在去全球化浪潮中，追隨強權政治下的保護主義才是普通人的財富之道。",
    "key_points": [
      "川普的市場影響力：川普的推文和聲明能瞬間影響市場情緒，投資者需要學會「讀懂川普」來預判市場走向。",
      "能源獨立政策：川普支持傳統能源，放鬆環保監管，預計將增加美國石油和天然氣產量，利好能源股但利空油價。",
      "製造業回流：關稅政策和減稅將推動製造業回流美國，利好工業股、原材料股，以及在美國有生產基地的跨國企業。",
      "金融去監管：放鬆金融監管將降低銀行合規成本，提高盈利能力，利好大型銀行和區域性銀行。",
      "國防支出增加：地緣政治緊張和「美國優先」政策將推動國防預算增加，利好國防承包商（LMT、NOC、RTX、GD）。"
    ],
    "investment_direction": "配置美國本土製造商（如工業機器人、鋼鐵廠）及受貿易保護的農產品板塊。",
    "trend_analysis": "短期國際貿易摩擦引發跨國企業股價回調；中期本土生產力優化帶來利潤率提升；長期全球供應鏈格局重塑完成。",
    "tickers": [
      {
        "symbol": "DJT",
        "change": 0.41
      },
      {
        "symbol": "SPY",
        "change": 0.26
      }
    ],
    "strategist_opinion": "這不是道德判斷，而是財富邏輯。在單邊主義抬頭的時代，站在最強大的單邊那一側。"
  },
  {
    "video_id": "c5PHFkviXYg",
    "channel": "尼可拉斯楊Live精",
    "title": "Jensen Huang has spoken — how do we get rich with him?",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=c5PHFkviXYg",
    "content_overview": "分析黃仁勳在 GTC 或重要科技大會上的演講，探討 AI 代理人（Agent）與人形機器人如何開啟輝達的下一波增長。",
    "key_points": [
      "輝達的護城河：CUDA生態系統和軟體堆疊形成了強大的網絡效應，使輝達在AI晶片市場保持領先地位。",
      "黃仁勳的願景：輝達正在建設「AI工廠」，不僅賣晶片，還提供完整的AI基礎設施解決方案，包括軟體、網絡和服務。",
      "輝達生態系統投資：除了輝達本身，還可以投資輝達的供應鏈（台積電、SK海力士）、客戶（微軟、谷歌、亞馬遜）、以及競爭對手（AMD、Intel）。",
      "AI應用層的機會：隨著AI基礎設施成熟，AI應用層（如AI軟體、AI服務）將迎來爆發，這是下一個投資熱點。",
      "風險提示：輝達估值已經很高，且面臨地緣政治風險（中美科技戰）和競爭加劇（AMD、自研晶片），需要謹慎評估入場時機。"
    ],
    "investment_direction": "除了繼續持有 NVDA，應向下游尋找具備 AI 應用落地能力的軟體公司。",
    "trend_analysis": "短期 GTC 2026 預期推升 AI 板塊再攀高峰；中期 AI 應用從算力端向應用端擴散；長期 AI 重定義人類生產生活方式。",
    "tickers": [
      {
        "symbol": "NVDA",
        "change": -0.69
      },
      {
        "symbol": "QQQ",
        "change": 0.49
      }
    ],
    "strategist_opinion": "黃仁勳是這個時代的「電力供應商」。只要 AI 這場工業革命沒結束，他的話就是金科玉律。"
  },
  {
    "video_id": "h3r6-jfu7k0",
    "channel": "尼可拉斯楊Live精",
    "title": "Before March 2026, Iran Could Collapse — Here’s How We Can Profit",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=h3r6-jfu7k0",
    "content_overview": "針對伊朗內部政權穩固性的量化分析，預測 2026 年前的潛在變局，並評估其對石油市場的毀滅性打擊與重建機遇。",
    "key_points": [
      "黃金的結構性牛市：央行持續購金、去美元化趨勢、以及潛在的貨幣危機，共同推動黃金進入長期牛市。",
      "AI基礎設施的持續投資：雖然AI應用層還在探索，但AI基礎設施（數據中心、晶片、電力）的投資才剛開始，未來5年將持續高增長。",
      "能源轉型的投資機會：傳統能源和新能源並非零和博弈，而是互補關係。在能源轉型過程中，兩者都有投資機會。",
      "地緣政治驅動的供應鏈重組：從「效率優先」轉向「安全優先」，供應鏈本土化將帶來大量投資機會。",
      "具體標的：黃金（GLD、GDX）、AI基礎設施（NVDA、SMCI、VST）、能源（XLE、URA）、以及國防股（ITA、LMT）。"
    ],
    "investment_direction": "做空石油期貨作為對沖，同時關注具備中東重建背景的基建龍頭。",
    "trend_analysis": "短期政局預期不明朗引發油價劇震；中期潛在的變局將導致油價長期中樞下移；長期和平重建紅利釋放。",
    "tickers": [
      {
        "symbol": "SPY",
        "change": 0.26
      },
      {
        "symbol": "XLE",
        "change": -0.85
      }
    ],
    "strategist_opinion": "伊朗的崩潰將是中東最大的黑天鵝。在黑天鵝飛起前，先佈好捕捉財富的網。"
  },
  {
    "video_id": "TBTLMn6lvNA",
    "channel": "尼可拉斯楊Live精",
    "title": "How can we get rich after Maduro is arrested?",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=TBTLMn6lvNA",
    "content_overview": "討論委內瑞拉政局變動對南美洲投資環境的改善，分析委內瑞拉重返全球石油供應鏈後的潛在財富效應。",
    "key_points": [
      "委內瑞拉的石油潛力：委內瑞拉擁有全球最大的已探明石油儲量，但因制裁和管理不善，產量僅為巔峰期的十分之一。",
      "馬杜洛倒台的影響：若馬杜洛政權倒台，美國可能解除制裁，委內瑞拉石油產量有望快速恢復，影響全球油市供需。",
      "投資機會：1) 油價短期下跌（供應增加）；2) 與委內瑞拉有業務的石油公司（如雪佛龍）；3) 拉丁美洲ETF（ILF、EWZ）；4) 原物料（委內瑞拉也是重要鋁土礦產國）。",
      "風險因素：政權過渡的不確定性、基礎設施老化、以及美國政策變化的風險。",
      "時間窗口：作者認為馬杜洛政權可能在未來1-2年內倒台，投資者應提前關注相關機會。"
    ],
    "investment_direction": "關注南美區域性開發銀行與能源開採企業，以及委內瑞拉折價債券。",
    "trend_analysis": "短期地緣風險溢價快速消散；中期南美市場吸引力大幅提升；長期拉丁美洲成為全球資源供應新極點。",
    "tickers": [
      {
        "symbol": "SPY",
        "change": 0.26
      },
      {
        "symbol": "XLE",
        "change": -0.85
      }
    ],
    "strategist_opinion": "威權體制的終結通常伴隨著資產價值的暴漲。在光亮初現時，勇敢佈局被遺忘的角落。"
  },
  {
    "video_id": "IlsHGywzSf4",
    "channel": "尼可拉斯楊Live精",
    "title": "2026年新的開始",
    "pub_date": "2026-03-18",
    "url": "https://www.youtube.com/watch?v=IlsHGywzSf4",
    "content_overview": "展望 2026 年全球政治經濟的新秩序，總結從地緣衝突到科技爆炸的轉型期，投資者應具備的核心心法。",
    "key_points": [
      "2025年回顧：黃金和白銀表現優異，AI相關股票波動劇烈，地緣政治事件頻發帶來多次市場回調。",
      "投資組合調整：增加黃金和白銀配置至20%，減少高估值科技股比重，增加國防股和能源股配置。",
      "2026年展望：預計地緣政治風險將持續，但AI基礎設施投資將加速，能源轉型和供應鏈重組將創造結構性機會。",
      "核心策略：「現金為王」等待機會，在市場恐慌時勇敢買入優質資產，保持靈活性和耐心。",
      "給投資者的建議：不要追逐熱點，專注於有護城河的優質公司，控制倉位和風險，長期持有。"
    ],
    "investment_direction": "全方位佈局 AI+ 應用、太空科技及抗通脹的實物資產组合。",
    "trend_analysis": "短期政策過渡期維持高波動震盪；中期科技效率紅利全面爆發；長期全球經濟步入數位化與實體資源雙驅動時代。",
    "tickers": [
      {
        "symbol": "BTC",
        "change": -0.41
      },
      {
        "symbol": "QQQ",
        "change": 0.49
      },
      {
        "symbol": "SPY",
        "change": 0.26
      }
    ],
    "strategist_opinion": "2026 不是結束，而是新舊世界交替後的「元年」。準備好迎接一個高波動、高回報的新時代。"
  },
  {
    "video_id": "lPsyi5i6SQc",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: The ULTIMATE OpenClaw Mission Control revealed!",
    "pub_date": "2026-03-18",
    "url": "https://youtube.com/watch?v=lPsyi5i6SQc",
    "content_overview": "Alex Finn 在本次直播中展示了他為自己打造的「OpenClaw 任務控制中心」，一套自訂工具，旨在幫助使用者提升生活品質。他詳細解釋了其運作方式，並鼓勵觀眾自行建構。直播中，他還預告將討論 Hermes 代理、對 Claude Code 與 Codeex 的最終推薦，以及 Nemo Claw。此外，他分享了在 Nvidia 會議上遇到 Peter Steinberger 的趣事，並幽默地抱怨自己未被 Nvidia 認可（例如未被納入宣傳片、未獲贈 DJX Spark），以此激勵自己更努力。他鼓勵觀眾點讚以吸引更多人加入直播，並回答了關於 DGX Station 的問題。",
    "key_points": [
      "展示 Alex Finn 的 OpenClaw 任務控制中心：一套自訂工具，旨在提升效率與生活品質。",
      "直播互動與問答環節：鼓勵觀眾提問，無論是直播中還是回放評論區。",
      "討論 AI 代理：提及正在測試 Hermes 代理。",
      "提供程式碼生成工具推薦：對 Claude Code 與 Codeex 進行最終比較與推薦。",
      "分享 Nvidia 之行與會見 Peter Steinberger 的經歷：幽默地抱怨自己未被認可（未被納入 Nvidia 宣傳片、未獲贈 DJX Spark）。",
      "討論 DGX Station：提及其尚未投入生產。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "twp0TuotHQw",
    "channel": "Alan Chen 專欄",
    "title": "55000人被裁，留下的人卻快瘋了？哈佛揭穿AI時代的“殘酷真相”",
    "pub_date": "2026-03-17",
    "url": "https://www.youtube.com/watch?v=twp0TuotHQw",
    "content_overview": "AI 導致的白領失業潮與薪資結構重組。",
    "key_points": [
      "技能溢價極化",
      "AI 取代中層管理"
    ],
    "investment_direction": "佈局 AI 生產力工具龍頭。",
    "trend_analysis": "勞動力市場結構性變革。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "CxErCGVo-oo",
    "channel": "Alex Finn (OpenBot)",
    "title": "The only OpenClaw video you’ll ever need (March 2026 edition)",
    "pub_date": "2026-03-17",
    "url": "https://youtube.com/watch?v=CxErCGVo-oo",
    "content_overview": "Alex Finn 的影片《The only OpenClaw video you’ll ever need (March 2026 edition)》全面介紹了 OpenClaw，一個在發布四個月後已大幅進化的強大 AI 代理自動化工具。影片旨在為無論是新手還是專家提供 OpenClaw 的所有概念、課程和更新，並承諾內容公正無偏。OpenClaw 被描述為「史上最偉大的 AI 代理自動化工具」，它能讓個人擁有「數百甚至數千人的槓桿」，透過自主 AI 代理執行軟體開發、研究和業務自動化等任務。與傳統的 ChatGPT 不同，OpenClaw 接收高層次目標並自主迭代以達成結果。影片後續將深入探討設置、成本節約、模型選擇、實際用例、安全性、硬體需求以及 OpenClaw 的未來發展。",
    "key_points": [
      "OpenClaw 是史上最全面的 AI 代理自動化工具，能自主執行複雜任務。",
      "它能讓個人部署 AI 勞動力，實現軟體開發、研究和業務自動化，提供「數百甚至數千人的槓桿」。",
      "OpenClaw 的運作模式是接收「目標」並自主迭代以達成「結果」，而非僅僅回答問題，這與傳統 AI 聊天機器人（如 ChatGPT）有本質區別。",
      "影片承諾提供無贊助、無偏見的真實資訊，涵蓋 OpenClaw 的所有關鍵方面，從入門到精通。",
      "影片將詳細討論 OpenClaw 的設置、成本效益、模型選擇、實際應用案例、安全性考量、所需硬體（如 Mac Mini/Studio）以及對其未來發展的預測。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "YaakcHNtUEw",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: MASSIVE Nvidia Announcements (full Jensen Huang GTC Keynote)",
    "pub_date": "2026-03-16",
    "url": "https://youtube.com/watch?v=YaakcHNtUEw",
    "content_overview": "Alex Finn 在影片中直播報導 Nvidia GTC 主題演講，強調這是史上最大的 AI 發表。他雖然受邀親臨現場，但選擇在家中新工作室進行直播，為觀眾提供即時評論，並預測了包括新 Nvidia 晶片、機器人技術及專為 OpenClaw 設計的設備等重大發布。他不斷營造興奮氛圍，並強調他更關心為觀眾提供第一手的直播體驗。",
    "key_points": [
      "Nvidia GTC 主題演講被譽為史上最大的 AI 發表，將有「巨大」的 AI 公告。",
      "Alex Finn 選擇在家中新工作室進行直播，為觀眾提供 GTC 主題演講的即時評論。",
      "儘管受邀親臨現場（甚至前排創作者區），他仍決定留在家中，優先為觀眾提供直播體驗。",
      "他預測了多項重大發布，包括全新的 Nvidia 晶片、機器人技術進展、DJX Spark 更新，以及專為 OpenClaw 設計的設備。",
      "他不斷鼓勵觀眾點讚、訂閱，並強調這是「人類史上最大的直播」。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "64cuPudaH4g",
    "channel": "Alan Chen 專欄",
    "title": "迪拜樓市兩週暴跌32%！一場戰爭戳破迪拜房產神話",
    "pub_date": "2026-03-15",
    "url": "https://www.youtube.com/watch?v=64cuPudaH4g",
    "content_overview": "中東局勢如何摧毀富人天堂房價。",
    "key_points": [
      "地緣政治與避險地產",
      "資本外逃路徑"
    ],
    "investment_direction": "撤出熱點地區非流動性資產。",
    "trend_analysis": "全球避險資產重新定義。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "XoaVuCx_c-Y",
    "channel": "Alan Chen 專欄",
    "title": "GDP腰斬、Adobe崩盤！五大巨頭集體鎖門，華爾街爆雷真相",
    "pub_date": "2026-03-14",
    "url": "https://www.youtube.com/watch?v=XoaVuCx_c-Y",
    "content_overview": "軟體巨頭業績爆雷背後的 AI 取代邏輯。",
    "key_points": [
      "SaaS 估值體系坍塌",
      "AI 原生應用擠壓空間"
    ],
    "investment_direction": "避開傳統軟體外包與工具類股。",
    "trend_analysis": "軟體產業進入『大清洗』。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "sWuMEPES3So",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: OpenClaw running on 3 Mac Studios and a DGX Spark",
    "pub_date": "2026-03-13",
    "url": "https://youtube.com/watch?v=sWuMEPES3So",
    "content_overview": "Alex Finn 在這場直播中展示了他的家庭AI實驗室，重點介紹了OpenClaw在三台Mac Studios和一台DGX Spark上的運行。他將展示一個自訂的AI模型，該模型經過其聲音和數百份YouTube影片逐字稿訓練，用於生成YouTube腳本。此外，他還會介紹Nvidia全新的開源Neotron 3模型，該模型目前運行在他的DGX Spark上，並會帶領觀眾參觀他的「任務控制」設置。直播中還將舉辦一場「Pitchathon」活動，贈送五個ChatGPT Pro訂閱，參與者需按讚、訂閱並說明為何值得獲得。",
    "key_points": [
      "展示家庭AI實驗室，包括OpenClaw在3台Mac Studios和DGX Spark上的運行情況。",
      "介紹一個自訂AI模型，用於生成YouTube腳本，該模型已用其聲音和影片逐字稿進行訓練。",
      "展示Nvidia的開源Neotron 3模型，並說明其在DGX Spark上的部署。",
      "帶領觀眾參觀其AI「任務控制」設置。",
      "舉辦ChatGPT Pro訂閱贈品活動（共5個），參與者需透過「Pitchathon」方式爭取，並符合按讚、訂閱等資格要求。",
      "提及將與Ray Fernando一同參加即將到來的Nvidia活動。",
      "簡要分享對新舊Mac Studio Display XDR顯示器之間差異的看法。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "UjF542PiaWA",
    "channel": "Alan Chen 專欄",
    "title": "2026石油危機最荒誕一幕：美軍不敢護航，油輪掛上“中國船”標誌？",
    "pub_date": "2026-03-12",
    "url": "https://www.youtube.com/watch?v=UjF542PiaWA",
    "content_overview": "紅海海峽封鎖下的航運奇觀。",
    "key_points": [
      "海上絲路安全溢價",
      "美軍威懾力邊際遞減"
    ],
    "investment_direction": "看好特定航運與保險標的。",
    "trend_analysis": "全球貿易路線重新洗牌。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "Rjd1LqF9cG4",
    "channel": "Alex Finn (OpenBot)",
    "title": "How to build an army of OpenClaw agents",
    "pub_date": "2026-03-12",
    "url": "https://youtube.com/watch?v=Rjd1LqF9cG4",
    "content_overview": "Alex Finn 在這段影片中介紹如何建立一個由多個 OpenClaw AI 代理組成的「AI 代理軍團」或「AI 組織」。他強調這是未來的工作模式，能大幅提升效率、自動化任務並創造價值，讓使用者成為自己的 AI 公司 CEO。影片指導觀眾如何從單一 OpenClaw 擴展到多層級的代理組織，包括如何規劃代理角色、選擇模型以節省成本，並特別強調要從建立第一個專精於特定任務的子代理開始，而非一開始就建立多個。最終目標是讓觀眾擁有一個能持續創造價值的 AI 代理團隊。",
    "key_points": [
      "AI 代理組織是未來的工作模式，能大幅提升效率、自動化任務並創造價值。",
      "理想的 OpenClaw 應用是建立多個代理互相協作的層級組織，而非單一代理。",
      "建立 AI 組織的關鍵是規劃代理角色、選擇模型和溝通方式，以最大化價值產出。",
      "初期應從建立一個專精於特定任務的子代理開始，避免一次性建立多個代理。",
      "第一個子代理的職責應根據個人日常任務來決定（例如：程式碼、內容創作、研究）。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "fdrq2tN0BJM",
    "channel": "Alex Finn (OpenBot)",
    "title": "I did something INCREDIBLE with OpenClaw",
    "pub_date": "2026-03-11",
    "url": "https://youtube.com/watch?v=fdrq2tN0BJM",
    "content_overview": "Alex Finn 在影片中展示了他在 OpenClaw 內部建立的「令人難以置信」的自訂 AI 實驗室。這個實驗室能夠訓練他自己的 AI 模型和插件，並全天候運作。他承諾將詳細介紹其運作方式、所需的硬體（如 Nvidia DJX Spark）和軟體，並預告了一個重大發表。影片中也分享了他對度假的看法以及參與 Moonshots 播客的經歷。",
    "key_points": [
      "Alex Finn 在 OpenClaw 內建置了一個自訂 AI 實驗室。",
      "該實驗室用於訓練他自己的 AI 模型和插件，並能 24/7 運作。",
      "他將分享如何建立此實驗室，包括所需的硬體（如 Nvidia DJX Spark）和軟體。",
      "影片中將有一個「重大發表」。",
      "他分享了對度假的個人看法（不喜歡度假，更喜歡直播）。",
      "提及從 Moonshots 播客主持人那裡收到一個 40TB 硬碟。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "axYo_sRS5Oo",
    "channel": "Alan Chen 專欄",
    "title": "預言成真：矽谷五巨頭正式瓜分了AI！Meta，英偉達紛紛下海",
    "pub_date": "2026-03-10",
    "url": "https://www.youtube.com/watch?v=axYo_sRS5Oo",
    "content_overview": "M7 陣營分化，算力霸權的最後整合。",
    "key_points": [
      "Meta 轉向開源閉環",
      "NVIDIA 自研模型威脅"
    ],
    "investment_direction": "守住 M7 龍頭部位。",
    "trend_analysis": "AI 產業鏈進入垂直整合期。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "05UkWBT5rFo",
    "channel": "Alan Chen 專欄",
    "title": "一口氣了解2026石油危機：油價衝破天際，1983年以來最瘋狂的一週！",
    "pub_date": "2026-03-08",
    "url": "https://www.youtube.com/watch?v=05UkWBT5rFo",
    "content_overview": "油價極端波動下的全球宏觀衝擊。",
    "key_points": [
      "原油定價權爭奪",
      "通膨二次觸頂"
    ],
    "investment_direction": "佈局能源期權對沖風險。",
    "trend_analysis": "能源價格長期中樞抬升。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "i8ArukM3dzA",
    "channel": "Alan Chen 專欄",
    "title": "1.8萬億美元被鎖死！華爾街三大巨頭接連“拔網線”，散戶的錢取不出來？",
    "pub_date": "2026-03-06",
    "url": "https://www.youtube.com/watch?v=i8ArukM3dzA",
    "content_overview": "揭露流動性危機導致的交易平台限制。",
    "key_points": [
      "流動性黑洞警告",
      "散戶資金安全分析"
    ],
    "investment_direction": "保持高比例現金流。",
    "trend_analysis": "金融系統壓力測試開始。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "EgZ-lURsrsQ",
    "channel": "Alan Chen 專欄",
    "title": "2027年AGI降臨？前OpenAI核心成員的165頁絕密報告",
    "pub_date": "2026-03-04",
    "url": "https://www.youtube.com/watch?v=EgZ-lURsrsQ",
    "content_overview": "解讀 Aschenbrenner 關於 AGI 進程的重磅文件。",
    "key_points": [
      "AI 算力復合增長曲線",
      "AGI 對大國博弈的決定性影響"
    ],
    "investment_direction": "長線佈局 AI 核心基建。",
    "trend_analysis": "人類歷史進入『算力加速』期。",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "RhLpV6QDBFE",
    "channel": "Alex Finn (OpenBot)",
    "title": "OpenClaw is 100x better with this tool (Mission Control)",
    "pub_date": "2026-03-03",
    "url": "https://youtube.com/watch?v=RhLpV6QDBFE",
    "content_overview": "Alex Finn 介紹 Mission Control 概念，這是一個為 OpenClaw 量身打造的自定義儀表板，讓 OpenClaw 能即時建立所需的任何工具。影片詳細展示三個關鍵工具：任務板（追蹤 OpenClaw 活動）、日曆（確認排程任務和 cron jobs）、專案螢幕（管理主要專案進度）。所有工具都透過簡單提示詞建立，無需程式碼。",
    "key_points": [
      "Mission Control 是為 OpenClaw 設計的自定義儀表板，允許即時建立任何工具",
      "完全自定義：所有工具由 OpenClaw 自行建立，非預設或下載",
      "零程式碼：僅需簡單提示詞即可建立，如 'build me a task board'",
      "任務板：看板模式追蹤 OpenClaw 活動，即時活動動態顯示每一步操作",
      "心跳檢查：OpenClaw 每次心跳時檢查任務板，自動執行積壓任務",
      "日曆螢幕：顯示所有 cron jobs 和排程任務，確認 OpenClaw 主動性",
      "專案螢幕：追蹤主要專案進度，避免分心，整合任務/記憶/文件",
      "反向提示技巧：詢問 OpenClaw '我們現在可以做什麼來推進專案？'",
      "建立提示：使用 'build it in Next.js and host on localhost' 和 'make it look like linear'"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "SX9gN2t8cXo",
    "channel": "Alan Chen 專欄",
    "title": "全網都在馬後炮，但這個人兩年前就寫好了劇本。他的第三個預測最嚇人。",
    "pub_date": "2026-03-02",
    "url": "https://www.youtube.com/watch?v=SX9gN2t8cXo",
    "content_overview": "回溯 2024 年的預測如何精準命中 2026 的地緣混亂。",
    "key_points": [
      "預測精準度驗證",
      "未來 12 個月高壓預警"
    ],
    "investment_direction": "避開高槓桿標的。",
    "trend_analysis": "確定性消失時代的應對。 ",
    "tickers": [],
    "strategist_opinion": ""
  },
  {
    "video_id": "L36aPV6g2II",
    "channel": "Alex Finn (OpenBot)",
    "title": "Claude Code for Mobile is the BEST way to build apps with AI (Remote Control)",
    "pub_date": "2026-02-27",
    "url": "https://youtube.com/watch?v=L36aPV6g2II",
    "content_overview": "Anthropic為Claude Code推出手機版功能，允許用戶透過手機遠端控制電腦上的開發專案，實現隨身編碼。該功能將手機作為介面，實際在電腦端運行，避免了傳統遠端開發的複雜性，如SSH或程式碼合併。影片也比較了Claude Code與OpenClaw在不同情境下的應用選擇。",
    "key_points": [
      "Claude Code新功能：手機可遠端控制電腦上的開發專案，實現隨身編碼。",
      "核心機制：手機作為指令介面，所有程式碼的生成與修改實際發生在用戶的本地電腦上，而非雲端。",
      "工作流程：用戶可在電腦上開始專案，透過`/remote control`指令將會話無縫轉移至手機繼續開發。",
      "優勢：消除傳統遠端開發的複雜設定（如SSH、終端模擬），避免程式碼合併衝突，即時同步。",
      "應用情境區分：Claude Code適用於深度、持續的開發專案；OpenClaw則更適合快速原型驗證或創意發想。",
      "示範專案：建立一個類似Obsidian的筆記編輯器（第二大腦應用），並展示在手機上進行功能修改。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "5zbsR03aGAE",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: I built an army of OpenClaw agents. I have lost control.",
    "pub_date": "2026-02-27",
    "url": "https://youtube.com/watch?v=5zbsR03aGAE",
    "content_overview": "Alex Finn展示了他由五個OpenClaw代理組成的「工廠」，這些代理在不同Mac設備上同時運行，自主且持續地創造價值。他強調應部署更多OpenClaw代理而非子代理，並透露正將OpenClaw整合到穿戴式裝置（Even Reality G2s）中，以實現隨時隨地的免提互動。",
    "key_points": [
      "OpenClaw「工廠」：同時運行五個OpenClaw代理，分佈在Mac Studio、Mac Mini和MacBook Pro等多台設備上，實現大規模並行處理。",
      "代理架構策略：主張部署更多獨立的OpenClaw代理（水平擴展），而非依賴子代理（垂直分解），以提高效率和自主性。",
      "穿戴式AI整合：計劃將OpenClaw整合到Even Reality G2s智慧眼鏡中，實現免提、隨時隨地的語音互動和視覺反饋。",
      "重新定義成功：將衡量成功的標準從傳統的「發布應用程式數量」轉變為「在短時間內創造的價值」，例如內容產出、業務效率提升和營收增長。",
      "OpenClaw的商業價值：透過加速內容創作、提升業務效率、作為虛擬員工，幫助用戶（如YMO Studio）在短時間內創造巨大價值並實現營收增長。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "bi4aavMOoGM",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: My OpenClaw just built Cursor. Software is dead.",
    "pub_date": "2026-02-25",
    "url": "https://youtube.com/watch?v=bi4aavMOoGM",
    "content_overview": "影片主講人興奮地展示其OpenClaw系統的最新進展，這是一個能自主構建AI功能並錄製演示影片的AI代理。內容涵蓋OpenClaw的強大功能、其背後使用Anthropic模型進行開發的秘密、如何在Mac設備上利用Quen 3.5等本地LLM，以及Agent架構設計和硬件配置建議，強調了工作流程自動化的未來。",
    "key_points": [
      "OpenClaw是一個能自主構建AI主要功能並自動錄製演示影片的先進AI代理。",
      "OpenClaw的開發主要依賴Anthropic的模型（提及「Anthropic OATH」）。",
      "強烈推薦在本地運行大型語言模型，特別是新的Quen 3.5模型，它可在32GB RAM的Mac上運行，性能媲美Sonnet 3.5。",
      "探討了Mac設備（Mac Mini、Mac Studio）不同RAM配置（16GB, 24GB, 48GB）對本地LLM運行能力的影響，並建議使用Spark加速AI推理的預填充部分。",
      "OpenClaw的架構設計強調本地化和可移植性，其代理的「靈魂」和「個性」都以本地Markdown文件形式儲存，易於遷移。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "vxpuLIA17q4",
    "channel": "Alex Finn (OpenBot)",
    "title": "You're Using OpenClaw Wrong If You Don't Use Discord",
    "pub_date": "2026-02-24",
    "url": "https://youtube.com/watch?v=vxpuLIA17q4",
    "content_overview": "影片展示如何利用OpenClaw與Discord整合，打造24/7全天候運作的AI代理系統，自動化多項商業任務。該系統透過多個專門代理，在不同Discord頻道協同工作，執行內容創作（趨勢警報、腳本撰寫、縮圖概念）、股票研究及競爭者分析，大幅提升效率、節省時間並創造收益，僅需少量人工監督。",
    "key_points": [
      "OpenClaw與Discord整合為強大的多代理作業系統，實現全自動化業務運營。",
      "Discord的頻道架構是實現複雜多代理工作流的關鍵，允許代理并行或串行完成任務。",
      "系統包含多個專門代理，如趨勢推文警報、故事研究、腳本撰寫( Quill )、縮圖概念生成( Pixel )、股票研究和競爭者分析。",
      "自動化流程顯著縮短內容創作時間（從數小時縮短至5分鐘），並提供每日股票與競爭者研究報告。",
      "引入用戶反饋機制（核准/拒絕腳本）以持續訓練代理，使其輸出更符合個人語氣與偏好。",
      "代理可設定定期運行（如每兩小時、每日早晨），實現主動式任務執行。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "XeTgMEapbag",
    "channel": "Alex Finn (OpenBot)",
    "title": "5 OpenClaw use cases that will make you a productivity MACHINE",
    "pub_date": "2026-02-22",
    "url": "https://youtube.com/watch?v=XeTgMEapbag",
    "content_overview": "影片介紹了強大AI工具OpenClaw的五種實用案例，旨在幫助用戶提升生產力。案例包含自動會議準備、每週目標追蹤與回顧、以及每日學習計畫。強調OpenClaw的強大記憶系統及自主執行任務的能力，讓用戶的生活效率提升五倍，並鼓勵用戶學習如何有效利用這個AI員工。",
    "key_points": [
      "OpenClaw 是一個強大的 AI 工具，能像 24/7 的 AI 員工，顯著提升個人生產力。",
      "其核心優勢在於卓越的記憶系統，能記住所有對話與上下文，提供豐富的背景資訊。",
      "OpenClaw 具備自主執行任務的能力，例如開啟瀏覽器、讀取行事曆、發送訊息、追蹤目標、生成文件。",
      "影片示範了三大應用場景：自動會議準備、每週目標追蹤與回顧、以及每日學習計畫。",
      "用戶透過簡潔的指令 (prompts) 即可設定 OpenClaw 執行複雜的流程，實現自動化個人助理功能。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "Aj6hoC9JaLI",
    "channel": "Alex Finn (OpenBot)",
    "title": "You NEED to do this with OpenClaw immediately!",
    "pub_date": "2026-02-19",
    "url": "https://youtube.com/watch?v=Aj6hoC9JaLI",
    "content_overview": "影片闡述OpenClaw設定後五個關鍵步驟，使其從普通AI變為24/7自主智慧員工，包括腦力激盪、連結工具、建立任務控制中心及定義任務宣言，顯著提升生產力。",
    "key_points": [
      "對OpenClaw進行「腦力激盪」，灌輸個人興趣、目標、職業與抱負等關鍵情境資訊。",
      "將OpenClaw連結到所有相關工具（如生產力或通訊軟體），使其能自動拉取數據並執行任務。",
      "建立一個「任務控制中心」（Mission Control），讓OpenClaw能自主建立和管理客製化工具以支援工作流程。",
      "定義OpenClaw的「任務宣言」，作為其自主運作的最高指導原則和目標依據。",
      "OpenClaw具備自我學習和自我改進能力，能自行研究並連結未知的工具API。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "OEOiERQKKEQ",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: Anthropic BANS OpenClaw. It's OVER!",
    "pub_date": "2026-02-18",
    "url": "https://youtube.com/watch?v=OEOiERQKKEQ",
    "content_overview": "Anthropic 更新條款禁止 OpenClaw 等工具使用其訂閱帳戶的 Oauth Token。影片分析此舉是為了防止過度消耗補貼的 Token 資源並保護訓練數據。作者同時分享其 2 萬美元的 Mac Studio 硬體配置，探討轉向本地模型以應對禁令的策略。",
    "key_points": [
      "Anthropic 嚴禁將訂閱帳號的 Token 注入外部應用（如 OpenClaw 或 Agent SDK），違者可能遭封號。",
      "商業考量：Anthropic 訂閱方案（如 $200 方案）實際補貼了極高的 Token 成本，外部調用導致其虧損且無法獲取產品改進數據。",
      "作者計畫轉向使用高效能硬體（Mac Studio/Mac Mini）運行本地模型來維持 OpenClaw 的運作。",
      "此禁令可能導致用戶轉向 OpenAI 或中國廠商的開源模型，影響 AI 市場競爭格局。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "HjQ5ty3_X_0",
    "channel": "Alex Finn (OpenBot)",
    "title": "Claude Sonnet 4.6 just released. Greatest model for OpenClaw ever?",
    "pub_date": "2026-02-17",
    "url": "https://youtube.com/watch?v=HjQ5ty3_X_0",
    "content_overview": "本影片分析 Anthropic 新推出的 Claude Sonnet 4.6（應指 3.5 Sonnet 新版），強調其在 Agent 任務上效能與 Opus 相當，但價格僅為五分之一且速度更快，是 OpenClaw 與自動化 Agent 的理想核心模型。",
    "key_points": [
      "Sonnet 4.6 在電腦操作（Computer Use）與工具調用上表現優異，成功率與 Opus 幾乎持平 (72.5% vs 72.7%)。",
      "大幅降低運行成本至 Opus 的 20%，使長時間運行的 Agent 任務（如持續監控社群媒體趨勢）變得經濟可行。",
      "專為 Agent 構架設計，特別在財務分析、辦公軟體自動化（試算表、簡報）表現出色。",
      "建議將 OpenClaw 的核心模型切換為 Sonnet 4.6，僅在極重度編程或複雜邏輯規劃時保留 Opus。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "CIgDfVSDmMU",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: OPENAI BUYS OPENCLAW! WILL ANTHROPIC SURVIVE???",
    "pub_date": "2026-02-16",
    "url": "https://youtube.com/watch?v=CIgDfVSDmMU",
    "content_overview": "影片講述OpenAI收購OpenClaw（前稱ClawdBot）是AI史上最大收購案。講者認為這對OpenClaw是極大利好，但預測將導致Anthropic衰落，因其禁止了許多因OpenClaw而購買高價訂閱的用戶。",
    "key_points": [
      "OpenAI已收購AI工具OpenClaw，被視為AI領域有史以來最大的併購案。",
      "講者認為這次收購對OpenClaw是絕對的利好消息，將鞏固OpenAI在模型與服務上的頂級地位。",
      "講者預測此事件將對Anthropic造成毀滅性打擊，原因在於Anthropic曾禁止大量因使用OpenClaw而購買其Claude Opus高價訂閱的用戶。",
      "OpenClaw（初期名為ClawdBot）在短時間內從零發展成價值數十億美元的產品，並激發了用戶對Mac Mini和Anthropic高價訂閱的瘋狂購買潮。",
      "講者自稱是OpenClaw在三週前爆紅的推手，並批評那些將事件歸為陰謀論的言論。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "_kZCoW-Qxnc",
    "channel": "Alex Finn (OpenBot)",
    "title": "100 hours of OpenClaw lessons in 35 minutes",
    "pub_date": "2026-02-15",
    "url": "https://youtube.com/watch?v=_kZCoW-Qxnc",
    "content_overview": "影片介紹了開源 AI 代理系統 OpenClaw，強調其作為 24/7 全天候「AI 員工」的能力。它能主動執行任務、操作瀏覽器、自我編寫代碼並具備長期記憶與自我進化能力，並強烈建議採用本地部署以確保安全性與效能。",
    "key_points": [
      "OpenClaw 是一個開源且可 24/7 運行的 AI 代理程式，能模擬人類操作電腦與瀏覽器。",
      "核心優勢在於「主動性 (Proactivity)」，能根據外部趨勢（如社交媒體資訊）自動發想並執行任務，而非僅被動回應。",
      "具備強大的「記憶系統」，能紀錄用戶偏好、硬體環境與目標，並隨時間自我優化。",
      "支持自我修改與擴展，OpenClaw 可以為自己編寫新的工具或改進其內部的記憶架構。",
      "建議在地端環境（如 Mac Mini 或舊筆電）運行，而非雲端 VPS，以獲得更好的系統集成與隱私保障。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "aKB9BVonkzk",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: My OpenClaw setup is incredible",
    "pub_date": "2026-02-13",
    "url": "https://youtube.com/watch?v=aKB9BVonkzk",
    "content_overview": "Alex Finn 在直播中展示了他的 OpenClaw 設定，特別是他為 OpenClaw 打造的客製化「任務控制」系統，聲稱能大幅增加功能。他還將測試最新的本地 AI 模型 Miniax 2.5，該模型據稱擁有 Opus 級智能，可在本地運行，免費且無限制。影片中他強調其節目是「逃離永久底層階級」的關鍵，並澄清了關於他販售 OpenClaw 安裝服務的謠言。主要內容包括展示任務控制系統和安裝 Miniax 2.5。",
    "key_points": [
      "Alex Finn 展示其 OpenClaw 設定。",
      "介紹並將演示為 OpenClaw 打造的客製化「任務控制」系統，以增加功能性。",
      "測試最新的本地 AI 模型 Miniax 2.5，該模型具備 Opus 級智能，可本地運行，免費且無限制。",
      "強調其節目是「逃離永久底層階級」的關鍵。",
      "澄清並反駁關於他販售 OpenClaw 安裝服務或 Mac Studio 的謠言。",
      "直播主要內容為展示任務控制系統和安裝 Miniax 2.5。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "41_TNGDDnfQ",
    "channel": "Alex Finn (OpenBot)",
    "title": "6 OpenClaw use cases I promise will change your life",
    "pub_date": "2026-02-12",
    "url": "https://youtube.com/watch?v=41_TNGDDnfQ",
    "content_overview": "這部影片介紹了OpenClaw的六個改變生活的應用案例，並詳細聚焦於第一個案例：「第二大腦」系統。Alex Finn展示了如何利用OpenClaw強大的記憶功能，透過簡單的文字訊息（如iMessage、Telegram、Discord）來儲存和管理所有想法、連結和筆記，避免了傳統筆記應用（如Notion或Apple Notes）的複雜性。用戶可以輕鬆地搜尋和回顧這些記憶。影片還強調OpenClaw能夠根據用戶的文字指令（例如使用Next.js）自動生成並建構出整個「第二大腦」系統，展現了其強大的AI程式碼生成能力，讓用戶無需編寫任何程式碼即可實現複雜功能。",
    "key_points": [
      "OpenClaw提供六個改變生活的應用案例，旨在提升個人生產力。",
      "影片詳細介紹了第一個核心應用：「第二大腦」系統，用於高效記憶和資訊管理。",
      "OpenClaw透過簡單的文字訊息介面（如iMessage、Telegram）實現記憶功能，避免了傳統複雜筆記應用（如Notion）的缺點。",
      "OpenClaw擁有卓越的記憶系統，能記住用戶輸入的任何內容，並支援輕鬆搜尋和回顧。",
      "用戶無需編寫程式碼，只需透過文字指令，OpenClaw即可自動生成並建構出完整的應用系統（例如使用Next.js），展現其AI程式碼生成能力。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "ev4iiGXlnh0",
    "channel": "Alex Finn (OpenBot)",
    "title": "DO NOT use a VPS for OpenClaw (major warning)",
    "pub_date": "2026-02-12",
    "url": "https://youtube.com/watch?v=ev4iiGXlnh0",
    "content_overview": "Alex Finn 的影片警告觀眾不要使用虛擬私人伺服器（VPS）來託管 OpenClaw。他指出許多推薦 VPS 的 AI 創作者都收受贊助，且常未披露，這是不道德甚至非法的。影片強調，透過 VPS 託管 OpenClaw 對 99% 的人來說是錯誤且潛在危險的，並且設定更複雜。他推薦本地部署 OpenClaw，認為這更安全、更強大、更便宜，且設定更簡單（通常只需一個指令），適用於各種設備，並將逐步教學。",
    "key_points": [
      "許多 AI 創作者推薦使用 VPS 託管 OpenClaw 是因為收受贊助，且常未披露，這是不道德甚至非法的行為。",
      "透過 VPS 託管 OpenClaw 對 99% 的人來說是錯誤且潛在危險的建議。",
      "VPS 設置比本地部署更困難，且可能不夠安全。",
      "本地部署 OpenClaw 是更安全、更強大、更便宜且更簡單（通常只需一個指令）的解決方案。",
      "影片將提供在各種設備（如 Mac Mini、舊筆記型電腦）上本地部署 OpenClaw 的逐步教學。",
      "創作者應優先考慮與觀眾建立的信任，而非短期的贊助收益。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "0v2-mUUWNdc",
    "channel": "Alex Finn (OpenBot)",
    "title": "LIVE: The ULTIMATE OpenClaw setup",
    "pub_date": "2026-02-11",
    "url": "https://youtube.com/watch?v=0v2-mUUWNdc",
    "content_overview": "Alex Finn 在影片中展示了他「終極的 OpenClaw 設定」，強調 Discord 作為核心通訊平台，並結合多個本地 AI 模型，實現了業務的全面自動化。他聲稱這套系統能自動進行研究、生成縮圖和腳本，且完全在本地運行，無需消耗任何代幣。他承諾這些工作流程將使生活更簡單、更好、更快、更容易，並帶來更多收入。",
    "key_points": [
      "介紹「終極 OpenClaw 設定」，旨在優化效率和收入。",
      "Discord 被視為 OpenClaw 專案的最佳通訊平台，並展示其終極設定。",
      "利用 Discord 和多個本地 AI 模型實現業務的全面自動化。",
      "本地 AI 模型負責全天候進行研究、生成縮圖和腳本，且完全在本地運行，無需消耗任何 API 代幣。",
      "承諾這些工作流程將改變生活，使其更簡單、更好、更快、更容易，並帶來更多收入。",
      "API 成本管理策略：每月支付 200 美元給 Opus，其他任務則由免費的開源本地模型處理。"
    ],
    "investment_direction": "Prompt Engineering / Multi-Agent Skills.",
    "trend_analysis": "Strategic AI workflows.",
    "tickers": [],
    "strategist_opinion": "Alex Finn strategy for OpenClaw."
  },
  {
    "video_id": "Y43qDOpdk6k",
    "channel": "尼可拉斯楊Live精",
    "title": "靠Nvidia狂赚700%后，他清仓了！\"这味道像极了1999年\"；30年不败的他，把钱从英伟达挪到了这儿",
    "pub_date": "",
    "url": "https://youtube.com/watch?v=Y43qDOpdk6k",
    "content_overview": "影片分享一位資深投資者在輝達獲利700%後選擇清倉的邏輯，以及他將資金轉向的新標的。作者認為當前AI股的狂熱氛圍與1999年科網泡沫有相似之處，提醒投資者注意風險，並分享了這位投資者的新布局方向。",
    "key_points": [
      "清倉輝達的邏輯：這位30年投資經驗的投資者認為輝達的估值已經過高，市場對AI的預期過於樂觀，風險報酬比不再吸引。",
      "1999年科網泡沫的相似之處：當前AI股的狂熱氛圍、估值水平、以及「這次不一樣」的論調，與1999年科網泡沫前夕驚人相似。",
      "資金轉向的新標的：這位投資者將資金轉向被市場忽視的「舊經濟」板塊，包括能源、公用事業、以及特定地區的價值股。",
      "具體新布局：1) 能源股（XOM、CVX）— 估值低、現金流穩定；2) 公用事業（NEE、DUK）— 受益於AI數據中心的電力需求；3) 日本價值股— 被忽視的估值修復機會。",
      "給投資者的啟示：不要盲目追逐熱點，當市場過度興奮時要敢於獲利了結，並將資金轉向被忽視的價值標的。"
    ],
    "investment_direction": "Consult original transcript.",
    "trend_analysis": "Historical data.",
    "tickers": [],
    "strategist_opinion": "Merged from old archive."
  }
];


// ===== KNOWLEDGE BASE DATA =====
const knowledgeBase = {
    'alan-chen': {
        title: 'Alan Chen Knowledge Base',
        content: `# Alan Chen 專欄 知識庫

## 頻道定位
科技產業深度分析，聚焦半導體、AI 公司動態、供應鏈變化

## 核心主題
- 台積電與全球半導體供應鏈
- AI 晶片競爭格局（NVIDIA vs AMD vs 自研晶片）
- 馬斯克的科技帝國（Tesla、SpaceX、xAI）
- 中美科技戰與出口管制
- 量子計算與下一代運算技術

## 分析風格
- 數據驅動，引用財報與產業報告
- 供應鏈視角，從上游到下游完整分析
- 技術細節與商業邏輯並重

## 來源
R2 Storage: memory/knowledge-alan-chen.md (1,877 bytes)
最後更新: 2026-03-29`
    },
    'hrbp': {
        title: 'HRBP 2026 Knowledge Base',
        content: `# HRBP 2026 知識庫

## 角色定位
Wistron HRBP — 人力資源業務夥伴

## 核心職能
- 組織發展與人才管理
- 績效管理與員工關係
- 招募策略與雇主品牌
- 勞動法規與合規管理
- 薪酬福利與激勵制度

## 2026 重點項目
- AI 驅動的 HR 流程自動化
- 混合辦公模式優化
- 員工體驗與留才策略
- DEI（多元、公平、包容）推進

## 來源
R2 Storage: memory/knowledge-hrbp-2026.md (1,727 bytes)
最後更新: 2026-03-29`
    },
    'kneerecon': {
        title: 'Knee Recon Knowledge Base',
        content: `# Knee Reconstruction 知識庫

## 主題
膝蓋重建手術與復健知識

## 核心內容
- ACL（前十字韌帶）重建術後復健
- 復健階段與時間表
- 物理治療運動指南
- 疼痛管理與恢復追蹤
- 運動回歸標準與評估

## 復健階段
1. 術後 0-2 週：控制腫脹、恢復膝蓋伸直
2. 術後 2-6 週：恢復行走、基礎肌力訓練
3. 術後 6-12 週：進階肌力、平衡訓練
4. 術後 3-6 個月：功能性訓練、輕度運動
5. 術後 6-12 個月：運動專項訓練、回歸評估

## 來源
R2 Storage: memory/knowledge-kneerecon.md (1,519 bytes)
最後更新: 2026-03-29`
    },
    'daily': {
        title: 'Daily Memory - 2026-03-28',
        content: `# Daily Memory — 2026-03-28

## 當日記錄
這是 Tactical OS 系統的每日記憶檔案，記錄了 2026 年 3 月 28 日的重要事項與筆記。

## 內容摘要
- 市場動態追蹤與分析筆記
- 個人任務與待辦事項
- 學習筆記與反思

## 來源
R2 Storage: memory/2026-03-28.md (3,302 bytes)
最後更新: 2026-03-29`
    }
};

// ===== HELPER: Channel classification =====
function getChannelType(channel) {
    if (channel.includes('尼可拉斯楊')) return 'nicolas';
    if (channel.includes('Alan Chen')) return 'alan';
    if (channel.includes('Alex Finn') || channel.includes('OpenBot')) return 'alex';
    return 'unknown';
}

function getChannelDisplayName(channel) {
    const type = getChannelType(channel);
    if (type === 'nicolas') return 'Nicolas Young';
    if (type === 'alan') return 'Alan Chen';
    if (type === 'alex') return 'Alex Finn';
    return channel;
}

function getChannelTagClass(channel) {
    const type = getChannelType(channel);
    return `tag-${type}`;
}

// ===== SEARCH FUNCTIONALITY =====
function initSearchFunctionality() {
    const macroSearch = document.getElementById('macroSearch');
    const intelSearch = document.getElementById('intelSearch');

    if (macroSearch) {
        macroSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterAndRenderMacroVideos(query);
        });
    }

    if (intelSearch) {
        intelSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterAndRenderIntelVideos(query);
        });
    }
}

function filterAndRenderMacroVideos(query) {
    const container = document.getElementById('macro-video-list');
    if (!container) return;

    let videos = videoData.filter(v => {
        const type = getChannelType(v.channel);
        return (type === 'nicolas' || type === 'alan');
    });

    if (query) {
        videos = videos.filter(v => 
            v.title.toLowerCase().includes(query) ||
            v.content_overview.toLowerCase().includes(query)
        );
    }

    videos.sort((a, b) => b.pub_date.localeCompare(a.pub_date));

    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No videos found</div></div>';
        return;
    }

    container.innerHTML = videos.map(v => createVideoCard(v)).join('');
}

function filterAndRenderIntelVideos(query) {
    const container = document.getElementById('intel-video-list');
    if (!container) return;

    let videos = videoData.filter(v => getChannelType(v.channel) === 'alex');

    if (query) {
        videos = videos.filter(v => 
            v.title.toLowerCase().includes(query) ||
            v.content_overview.toLowerCase().includes(query)
        );
    }

    videos.sort((a, b) => b.pub_date.localeCompare(a.pub_date));

    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No intel found</div></div>';
        return;
    }

    container.innerHTML = videos.map(v => createVideoCard(v)).join('');
}

// ===== RENDER VIDEO CARDS =====
function createVideoCard(video) {
    const channelType = getChannelType(video.channel);
    const channelName = getChannelDisplayName(video.channel);
    const tagClass = getChannelTagClass(video.channel);

    let tickersHtml = '';
    if (video.tickers && video.tickers.length > 0) {
        const tickerBadges = video.tickers.slice(0, 5).map(t => {
            const symbol = typeof t === 'string' ? t : t.symbol;
            return `<span class="ticker-badge">${symbol}</span>`;
        }).join('');
        tickersHtml = `<div class="video-tickers">${tickerBadges}</div>`;
    }

    return `
        <div class="video-card channel-${channelType}" onclick="openVideoModal('${video.video_id}')">
            <div class="video-card-header">
                <span class="video-date">${video.pub_date}</span>
                <span class="video-channel-tag ${tagClass}">${channelName}</span>
            </div>
            <div class="video-title">${escapeHtml(video.title)}</div>
            <div class="video-overview">${escapeHtml(video.content_overview)}</div>
            <div class="video-footer">
                ${tickersHtml}
                <a href="${video.url}" target="_blank" rel="noopener" class="video-yt-link" onclick="event.stopPropagation()">
                    ▶ YouTube
                </a>
            </div>
        </div>
    `;
}

function renderMacroVideos(filter = 'all') {
    const container = document.getElementById('macro-video-list');
    if (!container) return;

    let videos = videoData.filter(v => {
        const type = getChannelType(v.channel);
        return type === 'nicolas' || type === 'alan';
    });

    if (filter === 'nicolas') {
        videos = videos.filter(v => getChannelType(v.channel) === 'nicolas');
    } else if (filter === 'alan') {
        videos = videos.filter(v => getChannelType(v.channel) === 'alan');
    }

    videos.sort((a, b) => b.pub_date.localeCompare(a.pub_date));

    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📹</div><div class="empty-state-text">No videos found</div></div>';
        return;
    }

    container.innerHTML = videos.map(v => createVideoCard(v)).join('');
}

function renderIntelVideos() {
    const container = document.getElementById('intel-video-list');
    if (!container) return;

    let videos = videoData.filter(v => getChannelType(v.channel) === 'alex');
    videos.sort((a, b) => b.pub_date.localeCompare(a.pub_date));

    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔬</div><div class="empty-state-text">No intel data found</div></div>';
        return;
    }

    container.innerHTML = videos.map(v => createVideoCard(v)).join('');
}

// ===== VIDEO MODAL =====
function openVideoModal(videoId) {
    const video = videoData.find(v => v.video_id === videoId);
    if (!video) return;

    const modal = document.getElementById('videoModal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');

    titleEl.textContent = video.title;

    let html = '';

    // Channel & Date
    html += `<div class="modal-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span class="video-channel-tag ${getChannelTagClass(video.channel)}">${getChannelDisplayName(video.channel)}</span>
            <span class="video-date">${video.pub_date}</span>
        </div>
    </div>`;

    // Content Overview
    html += `<div class="modal-section">
        <div class="modal-section-title">CONTENT OVERVIEW</div>
        <p class="modal-text">${escapeHtml(video.content_overview)}</p>
    </div>`;

    // Key Points
    if (video.key_points && video.key_points.length > 0) {
        html += `<div class="modal-section">
            <div class="modal-section-title orange">KEY POINTS</div>
            <ul class="modal-key-points">
                ${video.key_points.map(kp => `<li>${escapeHtml(kp)}</li>`).join('')}
            </ul>
        </div>`;
    }

    // Investment Direction
    if (video.investment_direction) {
        html += `<div class="modal-section">
            <div class="modal-section-title purple">INVESTMENT DIRECTION</div>
            <p class="modal-text">${escapeHtml(video.investment_direction)}</p>
        </div>`;
    }

    // Trend Analysis
    if (video.trend_analysis && typeof video.trend_analysis === 'object') {
        const ta = video.trend_analysis;
        const trends = [];
        if (ta.short_term) trends.push({ label: 'SHORT TERM', text: ta.short_term });
        if (ta.medium_term) trends.push({ label: 'MEDIUM TERM', text: ta.medium_term });
        if (ta.long_term) trends.push({ label: 'LONG TERM', text: ta.long_term });

        if (trends.length > 0) {
            html += `<div class="modal-section">
                <div class="modal-section-title cyan">TREND ANALYSIS</div>
                <div class="modal-trend-grid">
                    ${trends.map(t => `
                        <div class="modal-trend-item">
                            <div class="modal-trend-label">${t.label}</div>
                            <div class="modal-trend-text">${escapeHtml(t.text)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
    }

    // Tickers
    if (video.tickers && video.tickers.length > 0) {
        html += `<div class="modal-section">
            <div class="modal-section-title yellow">RELATED TICKERS</div>
            <div class="modal-tickers-row">
                ${video.tickers.map(t => {
                    const symbol = typeof t === 'string' ? t : t.symbol;
                    const change = typeof t === 'object' && t.change ? t.change : '';
                    const changeClass = change.startsWith('+') ? 'up' : change.startsWith('-') ? 'down' : '';
                    return `<div class="modal-ticker">
                        <span class="modal-ticker-symbol">${symbol}</span>
                        ${change ? `<span class="modal-ticker-change ${changeClass}">${change}</span>` : ''}
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }

    // YouTube Link
    html += `<div class="modal-section" style="text-align:center;padding-top:8px;">
        <a href="${video.url}" target="_blank" rel="noopener" class="modal-yt-btn">
            ▶ Watch on YouTube
        </a>
    </div>`;

    bodyEl.innerHTML = html;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('videoModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ===== KNOWLEDGE BASE TOGGLE =====
function toggleKnowledge(id) {
    const el = document.getElementById(`kb-${id}`);
    if (!el) return;

    if (el.classList.contains('active')) {
        el.classList.remove('active');
        return;
    }

    document.querySelectorAll('.knowledge-expand').forEach(k => k.classList.remove('active'));

    const kb = knowledgeBase[id];
    if (kb) {
        el.innerHTML = `<pre>${escapeHtml(kb.content)}</pre>`;
    }

    el.classList.add('active');
}

// ===== UTILITY =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== REAL-TIME MARKET DATA =====
function applyQuote(valueId, changeId, q, opts = {}) {
    const valueEl = document.getElementById(valueId);
    const changeEl = document.getElementById(changeId);
    if (!valueEl && !changeEl) return;

    if (!q || q.price == null) {
        if (valueEl) valueEl.textContent = '--';
        if (changeEl) {
            changeEl.textContent = 'View Live ↗';
            changeEl.className = 'card-change neutral';
        }
        return;
    }

    const decimals = opts.decimals ?? 2;
    const inverseColor = opts.inverseColor === true;
    if (valueEl) valueEl.textContent = q.price.toFixed(decimals);
    if (changeEl) {
        const sign = q.changePct >= 0 ? '+' : '';
        changeEl.textContent = `${sign}${q.changePct.toFixed(2)}%`;
        const up = q.changePct >= 0;
        const cls = inverseColor ? (up ? 'negative' : 'positive') : (up ? 'positive' : 'negative');
        changeEl.className = 'card-change ' + cls;
    }
}

function applyFNG(valueId, changeId, f) {
    const valueEl = document.getElementById(valueId);
    const changeEl = document.getElementById(changeId);
    if (!f || f.value == null) {
        if (valueEl) valueEl.textContent = '--';
        if (changeEl) {
            changeEl.textContent = 'View Live ↗';
            changeEl.className = 'card-change neutral';
        }
        return;
    }
    const score = f.value;
    if (valueEl) valueEl.textContent = score;
    if (changeEl) {
        changeEl.textContent = f.classification || '';
        if (score <= 25) changeEl.className = 'card-change negative';
        else if (score >= 75) changeEl.className = 'card-change positive';
        else if (score >= 55) changeEl.className = 'card-change positive';
        else changeEl.className = 'card-change neutral';
    }
}

async function fetchMarketData() {
    try {
        const resp = await fetch('/api/market', { signal: AbortSignal.timeout(15000) });
        if (!resp.ok) throw new Error('market api ' + resp.status);
        const body = await resp.json();
        const d = body?.data || {};

        applyQuote('vix-value', 'vix-change', d.vix, { decimals: 2, inverseColor: true });
        applyQuote('usdtwd-value', 'usdtwd-change', d.usdtwd, { decimals: 3 });
        applyFNG('fng-value', 'fng-change', d.fearGreed);

        applyQuote('spy-value', 'spy-change', d.spy);
        applyQuote('qqq-value', 'qqq-change', d.qqq);
        applyQuote('voo-value', 'voo-change', d.voo);
        applyQuote('nvda-value', 'nvda-change', d.nvda);
        applyQuote('tsm-value', 'tsm-change', d.tsm);
        applyQuote('tsla-value', 'tsla-change', d.tsla);
        applyQuote('smh-value', 'smh-change', d.smh);
        applyQuote('pave-value', 'pave-change', d.pave);
        applyQuote('gold-value', 'gold-change', d.gold);
        applyQuote('oil-value', 'oil-change', d.oil);
    } catch (e) {
        console.warn('market fetch failed:', e);
        ['vix', 'usdtwd', 'fng'].forEach(k => {
            const vv = document.getElementById(k + '-value');
            const cc = document.getElementById(k + '-change');
            if (vv && vv.textContent === '') vv.textContent = '--';
            if (cc && cc.textContent === '') {
                cc.textContent = 'View Live ↗';
                cc.className = 'card-change neutral';
            }
        });
    }
}

// Refresh market data every 90 seconds
setInterval(fetchMarketData, 90 * 1000);
