const API_BASE = 'http://127.0.0.1:8000';

let inGame = false;
let playerHandValues = [];
let dealerCardValue = 0;
let dealerHoleValue = 0;
/** Index of next card to take from GET /detect/state last_committed (after reset). */
let scanCommitIndex = 0;

const btnDeal = document.getElementById('btn-deal');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnSplit = document.getElementById('btn-split');
const btnDouble = document.getElementById('btn-double');
const useCameraEl = document.getElementById('use-camera');

const dealerZone = document.getElementById('dealer-hand');
const playerZone = document.getElementById('player-hand');
const chatContentBox = document.getElementById('chat-content-box');

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getValueFromRank = (rank) => {
    const r = String(rank).trim();
    if (['J', 'Q', 'K'].includes(r)) return 10;
    if (r === 'A') return 11;
    return parseInt(r, 10);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const addChatMessage = (htmlMarkup, isSystem = false) => {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${isSystem ? 'loading-msg' : ''}`;
    let parsedText = htmlMarkup
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/---/g, '<hr>')
        .replace(/\n/g, '<br>');
    msgEl.innerHTML = `<div class="msg-bubble">${parsedText}</div>`;
    chatContentBox.appendChild(msgEl);
    chatContentBox.scrollTop = chatContentBox.scrollHeight;
};

async function postDetectReset() {
    const res = await fetch(`${API_BASE}/detect/reset`, { method: 'POST' });
    let data = {};
    try {
        data = await res.json();
    } catch {
        throw new Error('Bad response from server (is server.py running?)');
    }
    if (!res.ok || !data.ok) throw new Error(data.error || `Camera reset failed (${res.status})`);
}

async function fetchDetectState() {
    const res = await fetch(`${API_BASE}/detect/state`);
    return res.json();
}

async function waitForCommittedCount(n, timeoutMs = 120000, pollMs = 200) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
        const s = await fetchDetectState();
        if (!s.available) {
            await sleep(pollMs);
            continue;
        }
        if (s.last_committed && s.last_committed.length >= n) return s.last_committed;
        await sleep(pollMs);
    }
    throw new Error(`Timed out waiting for ${n} scanned cards (show each card clearly to the phone).`);
}

async function waitForNextScannedCard(timeoutMs = 90000, pollMs = 200) {
    const needLen = scanCommitIndex + 1;
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
        const s = await fetchDetectState();
        if (s.available && s.last_committed && s.last_committed.length >= needLen) {
            const rank = s.last_committed[scanCommitIndex];
            scanCommitIndex += 1;
            return String(rank).trim();
        }
        await sleep(pollMs);
    }
    throw new Error('Timed out waiting for next scanned card.');
}

const getAIAdvice = async () => {
    chatContentBox.innerHTML = '';
    addChatMessage('Analyzing cards with Gemini...', true);
    try {
        const response = await fetch(`${API_BASE}/advise`, {
            method: 'POST',
            body: JSON.stringify({
                player_cards: playerHandValues,
                dealer_card: dealerCardValue,
            }),
            headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        const msgs = chatContentBox.querySelectorAll('.chat-message');
        if (msgs.length > 0) msgs[msgs.length - 1].remove();
        if (result.success) {
            addChatMessage(result.advice);
            if (result.advice.toUpperCase().includes('BUST') || result.advice.includes('21')) {
                const audio = new Audio('/fuhh.mp3');
                audio.play().catch(() => {});
            }
        } else {
            addChatMessage(`Error: ${result.error}`);
        }
    } catch (e) {
        const msgs = chatContentBox.querySelectorAll('.chat-message');
        if (msgs.length > 0) msgs[msgs.length - 1].remove();
        addChatMessage('Could not connect to Python server. Run <strong>python server.py</strong>!', true);
    }
};

const setGameState = (playing) => {
    inGame = playing;
    btnDeal.disabled = playing;
    btnHit.disabled = !playing;
    btnStand.disabled = !playing;
    btnDouble.disabled = !playing;
    btnSplit.disabled = !playing;
    if (useCameraEl) useCameraEl.disabled = playing;
};

/**
 * Deal a specific rank. targetStr: 'player' | 'dealer' | 'dealer_hole'
 */
const dealKnownCard = (zone, targetStr, rankStr, { faceDown = false, delay = 0 } = {}) => {
    setTimeout(() => {
        const rank = String(rankStr).trim();
        const val = getValueFromRank(rank);
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const isRed = suit === '♥' || suit === '♦';
        const cardEl = document.createElement('div');
        cardEl.className = `card ${isRed ? 'red-suit' : ''}${faceDown ? ' face-down' : ''}`;

        if (faceDown) {
            cardEl.innerHTML = '<div class="card-back"></div>';
        } else {
            cardEl.innerHTML = `
                <div class="top-left">${rank}<br>${suit}</div>
                <div class="center-suit">${suit}</div>
                <div class="bottom-right">${rank}<br>${suit}</div>
            `;
        }
        zone.appendChild(cardEl);

        if (targetStr === 'player') playerHandValues.push(val);
        if (targetStr === 'dealer') dealerCardValue = val;
        if (targetStr === 'dealer_hole') dealerHoleValue = val;
    }, delay);
};

/** Random card (offline / no camera). */
const dealRandomCard = (zone, targetStr, delay = 0) => {
    setTimeout(() => {
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const rank = values[Math.floor(Math.random() * values.length)];
        const isRed = suit === '♥' || suit === '♦';
        const cardEl = document.createElement('div');
        cardEl.className = `card ${isRed ? 'red-suit' : ''}`;
        cardEl.innerHTML = `
            <div class="top-left">${rank}<br>${suit}</div>
            <div class="center-suit">${suit}</div>
            <div class="bottom-right">${rank}<br>${suit}</div>
        `;
        zone.appendChild(cardEl);
        const val = getValueFromRank(rank);
        if (targetStr === 'player') playerHandValues.push(val);
        if (targetStr === 'dealer' && dealerCardValue === 0) dealerCardValue = val;
        if (targetStr === 'dealer_hole') dealerHoleValue = val;
    }, delay);
};

function dealInitialRandom() {
    dealRandomCard(playerZone, 'player', 100);
    dealRandomCard(dealerZone, 'dealer', 500);
    dealRandomCard(playerZone, 'player', 900);
    dealRandomCard(dealerZone, 'dealer_hole', 1300);
    setTimeout(() => getAIAdvice(), 1500);
}

async function dealInitialCamera() {
    addChatMessage(
        '<strong>Camera mode:</strong> Resetting detector. Deal in order so the model locks in: ' +
            '<strong>your 1st card → dealer up → your 2nd → dealer hole</strong> (hold each steady until it counts).',
        true
    );
    await postDetectReset();
    scanCommitIndex = 0;
    await sleep(400);

    addChatMessage('Waiting for <strong>4</strong> committed scans from your phone...', true);
    const committed = await waitForCommittedCount(4);
    const p1 = String(committed[0]).trim();
    const dUp = String(committed[1]).trim();
    const p2 = String(committed[2]).trim();
    const dHole = String(committed[3]).trim();
    scanCommitIndex = 4;

    playerHandValues = [];
    dealerCardValue = 0;
    dealerHoleValue = 0;

    dealKnownCard(playerZone, 'player', p1, { delay: 100 });
    dealKnownCard(dealerZone, 'dealer', dUp, { delay: 500 });
    dealKnownCard(playerZone, 'player', p2, { delay: 900 });
    dealKnownCard(dealerZone, 'dealer_hole', dHole, { faceDown: true, delay: 1300 });

    setTimeout(() => getAIAdvice(), 1500);
}

btnDeal.addEventListener('click', async () => {
    const useCam = useCameraEl && useCameraEl.checked;
    setGameState(true);
    dealerZone.innerHTML = '';
    playerZone.innerHTML = '';
    chatContentBox.innerHTML = '';
    playerHandValues = [];
    dealerCardValue = 0;
    dealerHoleValue = 0;
    scanCommitIndex = 0;

    if (useCam) {
        try {
            await dealInitialCamera();
        } catch (e) {
            addChatMessage(`<strong>Camera deal failed:</strong> ${e.message}`, true);
            setGameState(false);
        }
    } else {
        dealInitialRandom();
    }
});

btnHit.addEventListener('click', async () => {
    const useCam = useCameraEl && useCameraEl.checked;
    if (useCam) {
        addChatMessage('Show the next <strong>player</strong> card to the camera...', true);
        try {
            const rank = await waitForNextScannedCard();
            dealKnownCard(playerZone, 'player', rank, { delay: 50 });
            setTimeout(() => getAIAdvice(), 350);
        } catch (e) {
            addChatMessage(e.message, true);
        }
    } else {
        dealRandomCard(playerZone, 'player', 50);
        setTimeout(() => getAIAdvice(), 300);
    }
});

btnStand.addEventListener('click', () => {
    addChatMessage('You stood. Dealing finishes...', true);
    setGameState(false);
});

btnDouble.addEventListener('click', async () => {
    const useCam = useCameraEl && useCameraEl.checked;
    if (useCam) {
        addChatMessage('Show one more <strong>player</strong> card for double...', true);
        try {
            const rank = await waitForNextScannedCard();
            dealKnownCard(playerZone, 'player', rank, { delay: 50 });
            setTimeout(() => {
                setGameState(false);
                getAIAdvice();
            }, 350);
        } catch (e) {
            addChatMessage(e.message, true);
        }
    } else {
        dealRandomCard(playerZone, 'player', 50);
        setTimeout(() => {
            setGameState(false);
            getAIAdvice();
        }, 300);
    }
});
