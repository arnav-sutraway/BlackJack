import os
import sys

from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai

# Anaconda / old envs often have google-generativeai==0.1.0rc1, which has no GenerativeModel.
# Current releases require Python 3.9+; pip will not upgrade the package on Python 3.8.
if not hasattr(genai, "GenerativeModel"):
    raise ImportError(
        "google-generativeai is too old or broken (no GenerativeModel). "
        "Use Python 3.9+ and reinstall: pip install -U 'google-generativeai>=0.8' "
        f"(see requirements.txt). Current interpreter: {sys.executable} "
        f"{sys.version_info.major}.{sys.version_info.minor}"
    )

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class BlackjackAgent:
    def __init__(self):
        # Grounding data: Probability of YOU busting
        self.your_bust_odds = {21: 100, 20: 92, 19: 85, 18: 77, 17: 69, 16: 62, 15: 58, 14: 56, 13: 39, 12: 31}
        # Grounding data: Probability of DEALER busting
        self.dealer_bust_odds = {2: 35, 3: 37, 4: 40, 5: 42, 6: 42, 7: 26, 8: 24, 9: 23, 10: 23, 11: 17}

    def reason_with_gemini(self, player_cards, dealer_card):
        # Safety check in case the input is empty
        if not player_cards:
            return "### 📡 Agent Status: Scanning for cards..."
            
        total = sum(player_cards)
        my_risk = self.your_bust_odds.get(total, 0)
        d_risk = self.dealer_bust_odds.get(dealer_card, 0)

        # The System Prompt: Guiding the Agent's logic
        prompt = f"""
        You are a professional Blackjack Strategy Agent.
        Game State: Player Total {total}, Dealer Shows {dealer_card}.
        Player Bust Risk: {my_risk}%. Dealer Bust Risk: {d_risk}%.

        Provide a response in this EXACT format:
        THOUGHT: [1 sentence explaining the strategy referencing the math]
        ACTION: [HIT, STAND, or DOUBLE]
        """

        # THE FIX: Hardcode the stats to always appear at the top of the UI
        stats_header = f"### Live Math\n**Player Bust Risk:** {my_risk}% | **Dealer Bust Risk:** {d_risk}%\n\n---\n\n### Agent Reasoning\n"

        try:
            # Use a current stable model; gemini-1.5-flash is deprecated / often 404 for new keys.
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)

            # .text raises ValueError when the reply was blocked or has no text parts.
            try:
                text = response.text
            except ValueError:
                text = ''
            if not text and response.candidates:
                c0 = response.candidates[0]
                parts = (c0.content.parts if c0.content else None) or []
                text = ''.join(p.text for p in parts if getattr(p, 'text', None))
            if not text:
                raise ValueError('Empty or blocked model response (no text parts)')

            return stats_header + text
        except Exception as e:
            # Emergency Fallback if the API fails during the demo
            print(f"API Error: {type(e).__name__}: {e}")
            if total >= 17: 
                return stats_header + "THOUGHT: High total reached. | ACTION: STAND"
            return stats_header + "THOUGHT: Low total, safe to proceed. | ACTION: HIT"