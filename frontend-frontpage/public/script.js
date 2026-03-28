let inGame = false;
let playerHandValues = [];
let dealerCardValue = 0;

// DOM Elements
const btnDeal = document.getElementById('btn-deal');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnSplit = document.getElementById('btn-split');
const btnDouble = document.getElementById('btn-double');

const dealerZone = document.getElementById('dealer-hand');
const playerZone = document.getElementById('player-hand');
const chatContentBox = document.getElementById('chat-content-box');

// Suits & Values
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Math Logic
const getValueFromRank = (rank) => {
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    if (rank === 'A') return 11;
    return parseInt(rank);
};

// Chat UI Appender
const addChatMessage = (htmlMarkup, isSystem = false) => {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${isSystem ? 'loading-msg' : ''}`;
    
    // Native markdown -> HTML converter
    let parsedText = htmlMarkup
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/---/g, '<hr>')
        .replace(/\n/g, '<br>');

    msgEl.innerHTML = `<div class="msg-bubble">${parsedText}</div>`;
    chatContentBox.appendChild(msgEl);
    chatContentBox.scrollTop = chatContentBox.scrollHeight;
};

// API Bridge
const getAIAdvice = async () => {
    // Completely clear the chat to only show the CURRENT active suggestion
    chatContentBox.innerHTML = '';
    addChatMessage("Analyzing cards with Gemini 1.5...", true);
    
    try {
        const response = await fetch('http://127.0.0.1:8000/advise', {
            method: 'POST',
            body: JSON.stringify({
                player_cards: playerHandValues,
                dealer_card: dealerCardValue
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        // Remove loading state
        const msgs = chatContentBox.querySelectorAll('.chat-message');
        if (msgs.length > 0) msgs[msgs.length - 1].remove();

        if (result.success) {
            addChatMessage(result.advice);
        } else {
            addChatMessage(`Error: ${result.error}`);
        }
    } catch (e) {
        // Remove loading state
        const msgs = chatContentBox.querySelectorAll('.chat-message');
        if (msgs.length > 0) msgs[msgs.length - 1].remove();
        addChatMessage("Could not connect to Python Server. Please open your terminal and run <strong>python server.py</strong>!", true);
    }
};

const setGameState = (playing) => {
    inGame = playing;
    btnDeal.disabled = playing;
    btnHit.disabled = !playing;
    btnStand.disabled = !playing;
    btnDouble.disabled = !playing;
    btnSplit.disabled = !playing;
};

const dealCardTo = (zone, targetStr, delay = 0) => {
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
        if (targetStr === 'dealer' && dealerCardValue === 0) {
            dealerCardValue = val;
        }
    }, delay);
};

// Deal Initial Hand
btnDeal.addEventListener('click', () => {
    setGameState(true);
    dealerZone.innerHTML = '';
    playerZone.innerHTML = '';
    chatContentBox.innerHTML = ''; 
    
    playerHandValues = [];
    dealerCardValue = 0;
    
    dealCardTo(playerZone, 'player', 100);
    dealCardTo(dealerZone, 'dealer', 500);
    dealCardTo(playerZone, 'player', 900);
    // Hidden hole card logic mock
    dealCardTo(dealerZone, 'dealer_hidden', 1300);

    setTimeout(() => {
        getAIAdvice();
    }, 1500);
});

// Hit
btnHit.addEventListener('click', () => {
    dealCardTo(playerZone, 'player', 50);
    setTimeout(() => {
        getAIAdvice();
    }, 300);
});

// Stand
btnStand.addEventListener('click', () => {
    addChatMessage("You stood. Dealing finishes...", true);
    setGameState(false);
});

// Double Down
btnDouble.addEventListener('click', () => {
    dealCardTo(playerZone, 'player', 50);
    setTimeout(() => {
        setGameState(false);
        getAIAdvice();
    }, 300);
});
