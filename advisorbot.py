import os
import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()

# Configure the legacy SDK natively
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
            # Utilizing the widespread compatible SDK version
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            # Combine the hard math with the AI reasoning
            return stats_header + response.text
        except Exception as e:
            # Emergency Fallback if the API fails during the demo
            print(f"API Error: {e}")
            if total >= 17: 
                return stats_header + "THOUGHT: High total reached. | ACTION: STAND"
            return stats_header + "THOUGHT: Low total, safe to proceed. | ACTION: HIT"