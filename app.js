// ===== Tactical OS V2.6 - App Logic =====

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    updateDateTime();
    loadDailyContent();
});

// ===== NAVIGATION =====
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.dataset.page;

            // Update nav state
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Update page state
            pages.forEach(p => p.classList.remove('active'));
            const target = document.getElementById(`page-${targetPage}`);
            if (target) {
                target.classList.add('active');
            }
        });
    });

    // Macro arrow click -> go to MACRO page
    const macroArrow = document.querySelector('.macro-arrow');
    if (macroArrow) {
        macroArrow.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            const macroNav = document.querySelector('[data-page="macro"]');
            const macroPage = document.getElementById('page-macro');
            if (macroNav) macroNav.classList.add('active');
            if (macroPage) macroPage.classList.add('active');
        });
    }
}

// ===== DATE & TIME =====
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
    };
    const dateStr = now.toLocaleDateString('en-US', options);
    
    // Add date to subtitle
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        subtitle.innerHTML = `Command. <span class="date-display">${dateStr}</span>`;
    }
}

// ===== DAILY CONTENT =====
// Quotes pool with Chinese translations
const quotes = [
    {
        text: '"A lot of people say they want to be great, but they\'re not willing to make the sacrifices necessary to achieve greatness."',
        zh: '很多人說他們想要變得卓越，但他們不願意為了卓越做出必要的犧牲。（卓越是犧牲的選擇。）',
        author: 'KOBE BRYANT'
    },
    {
        text: '"The only way to do great work is to love what you do."',
        zh: '做出偉大工作的唯一方法就是熱愛你所做的事。',
        author: 'STEVE JOBS'
    },
    {
        text: '"In the middle of difficulty lies opportunity."',
        zh: '在困難之中，蘊藏著機會。',
        author: 'ALBERT EINSTEIN'
    },
    {
        text: '"It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change."',
        zh: '生存下來的不是最強壯的物種，也不是最聰明的，而是最能適應變化的。',
        author: 'CHARLES DARWIN'
    },
    {
        text: '"The market can stay irrational longer than you can stay solvent."',
        zh: '市場保持非理性的時間，可以比你保持償付能力的時間更長。',
        author: 'JOHN MAYNARD KEYNES'
    },
    {
        text: '"Risk comes from not knowing what you are doing."',
        zh: '風險來自於你不知道自己在做什麼。',
        author: 'WARREN BUFFETT'
    },
    {
        text: '"The best time to plant a tree was 20 years ago. The second best time is now."',
        zh: '種一棵樹最好的時間是二十年前，其次是現在。',
        author: 'CHINESE PROVERB'
    },
    {
        text: '"Success is not final, failure is not fatal: it is the courage to continue that counts."',
        zh: '成功不是終點，失敗也不是致命的：重要的是繼續前進的勇氣。',
        author: 'WINSTON CHURCHILL'
    },
    {
        text: '"Be fearful when others are greedy, and greedy when others are fearful."',
        zh: '當別人貪婪時要恐懼，當別人恐懼時要貪婪。',
        author: 'WARREN BUFFETT'
    },
    {
        text: '"The harder I work, the luckier I get."',
        zh: '我越努力，就越幸運。',
        author: 'GARY PLAYER'
    },
    {
        text: '"Discipline is the bridge between goals and accomplishment."',
        zh: '紀律是目標與成就之間的橋樑。',
        author: 'JIM ROHN'
    },
    {
        text: '"Price is what you pay. Value is what you get."',
        zh: '價格是你付出的，價值是你得到的。',
        author: 'WARREN BUFFETT'
    }
];

// History events pool
const historyEvents = [
    {
        year: '1932',
        event: 'First splitting of the atom using a particle accelerator.',
        zh: '首次使用粒子加速器分裂原子。'
    },
    {
        year: '1990',
        event: 'The Hubble Space Telescope was launched aboard Space Shuttle Discovery.',
        zh: '哈伯太空望遠鏡搭乘發現號太空梭發射升空。'
    },
    {
        year: '1953',
        event: 'Watson and Crick published their discovery of the DNA double helix structure.',
        zh: '華生和克里克發表了DNA雙螺旋結構的發現。'
    },
    {
        year: '1969',
        event: 'ARPANET, the precursor to the Internet, transmitted its first message.',
        zh: 'ARPANET（網際網路前身）傳送了第一條訊息。'
    },
    {
        year: '2010',
        event: 'The Deepwater Horizon oil rig exploded in the Gulf of Mexico.',
        zh: '深水地平線鑽油平台在墨西哥灣爆炸。'
    },
    {
        year: '1986',
        event: 'The Chernobyl nuclear disaster occurred in Ukraine.',
        zh: '車諾比核災在烏克蘭發生。'
    },
    {
        year: '1915',
        event: 'Albert Einstein presented his general theory of relativity.',
        zh: '愛因斯坦發表了廣義相對論。'
    }
];

// Trivia pool
const triviaFacts = [
    {
        fact: 'On April 14, 1932, John Cockcroft and Ernest Walton split the atom (lithium) using a particle accelerator for the first time.',
        zh: '1932年4月14日，約翰·考克饒夫和歐內斯特·沃爾頓首次使用粒子加速器分裂了原子（鋰）。'
    },
    {
        fact: 'The New York Stock Exchange was founded in 1792 under a buttonwood tree on Wall Street.',
        zh: '紐約證券交易所於1792年在華爾街的一棵梧桐樹下成立。'
    },
    {
        fact: 'The term "bull market" comes from the way a bull attacks — thrusting its horns upward.',
        zh: '「牛市」一詞源自公牛攻擊的方式——用牛角向上頂。'
    },
    {
        fact: 'The first electronic stock ticker was invented by Thomas Edison in 1869.',
        zh: '第一台電子股票報價機由湯瑪斯·愛迪生於1869年發明。'
    },
    {
        fact: 'Japan\'s stock market (Nikkei 225) took over 34 years to recover from its 1989 peak.',
        zh: '日本股市（日經225指數）花了超過34年才從1989年的高峰恢復。'
    },
    {
        fact: 'The VIX index, known as the "fear gauge," was introduced by CBOE in 1993.',
        zh: 'VIX指數，又稱「恐慌指標」，由CBOE於1993年推出。'
    },
    {
        fact: 'Taiwan Semiconductor (TSMC) manufactures over 90% of the world\'s most advanced chips.',
        zh: '台積電生產了全球超過90%的最先進晶片。'
    }
];

function loadDailyContent() {
    // Use day of year as seed for daily rotation
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Select daily content
    const quote = quotes[dayOfYear % quotes.length];
    const history = historyEvents[dayOfYear % historyEvents.length];
    const trivia = triviaFacts[dayOfYear % triviaFacts.length];

    // Update quote
    const quoteText = document.getElementById('quote-text');
    const quoteZh = document.getElementById('quote-zh');
    const quoteAuthor = document.getElementById('quote-author');
    if (quoteText) quoteText.textContent = quote.text;
    if (quoteZh) quoteZh.textContent = quote.zh;
    if (quoteAuthor) quoteAuthor.textContent = `— ${quote.author}`;

    // Update history
    const historyYear = document.getElementById('history-year');
    const historyEvent = document.getElementById('history-event');
    const historyEventZh = document.getElementById('history-event-zh');
    if (historyYear) historyYear.textContent = history.year;
    if (historyEvent) historyEvent.textContent = history.event;
    if (historyEventZh) historyEventZh.textContent = history.zh;

    // Update trivia
    const triviaFact = document.getElementById('trivia-fact');
    const triviaFactZh = document.getElementById('trivia-fact-zh');
    if (triviaFact) triviaFact.textContent = trivia.fact;
    if (triviaFactZh) triviaFactZh.textContent = trivia.zh;
}

// ===== DATA PLACEHOLDER VALUES =====
// These can be replaced with real API calls later
const placeholderData = {
    vix: { value: '19.23', change: '-1.33%', direction: 'negative' },
    fng: { value: '30', change: '/100', direction: 'neutral' },
    usdtwd: { value: '31.727', change: '+0.003%', direction: 'positive' },
    us10y: '4.42%',
    putcall: '0.98'
};

// Future API integration point
// async function fetchLiveData() {
//     try {
//         // VIX API
//         // CNN Fear & Greed API
//         // USD/TWD API
//         // US 10Y Yield API
//         // Put/Call Ratio API
//     } catch (error) {
//         console.error('Failed to fetch live data:', error);
//     }
// }
