# HackJack - BlackJack AI Assistant 🃏

A Blackjack game that uses computer vision and the Gemini API to recognize 
cards in real time and recommend the optimal move.

## Features
- 📷 Real-time card recognition using computer vision
- 🤖 AI-powered move suggestions via the Gemini API
- 💡 Recommends Hit, Stand, Double Down, and more
- Built with JavaScript, Python, CSS, and HTML

## Tech Stack
- **JavaScript** (56.9%) — Frontend game logic and UI
- **Python** (20.9%) — Card recognition and Gemini API integration
- **CSS** (18.4%) — Styling
- **HTML** (3.8%) — Structure

## How It Works
1. The app uses computer vision to detect and recognize the cards on screen
2. The recognized cards are sent to the Gemini API
3. Gemini analyzes the hand and recommends the best move based on 
   standard Blackjack strategy

## Setup & Installation
1. Clone the repository
```bash
   git clone https://github.com/arnav-sutraway/BlackJack.git
   cd BlackJack
```
2. Install Python dependencies
```bash
   pip install -r requirements.txt
```
3. Add your Gemini API key to your environment
```bash
   export GEMINI_API_KEY=your_api_key_here
```
4. Open `index.html` in your browser or run the local server

## Usage
- Start the game and point your camera at your Blackjack hand
- The AI will automatically recognize your cards and the dealer's up card
- Follow the recommended action: **Hit**, **Stand**, **Double Down**, etc.

## Contributors
- [@arnav-sutraway](https://github.com/arnav-sutraway)
- [@TarunIsCOde](https://github.com/TarunIsCOde)
- [@rajprian123-bit](https://github.com/rajprian123-bit)
- [@Shayan-kam](https://github.com/Shayan-kam)
