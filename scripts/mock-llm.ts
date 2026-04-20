/**
 * Mock LLM Service for demonstrating dynamic chat flow.
 * In a real app, this would integrate with a library like react-native-llama.
 */

export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: string;
  senderName?: string;
  isThinking?: boolean;
}

const MOCK_RESPONSES = [
  "I've analyzed the logs. It looks like your CPU is hitting 95°C under load, which is triggering a clock speed reduction of 40%.",
  "Based on the thermal patterns, I recommend checking your thermal paste or ensuring sufficient airflow around the chassis.",
  "That's a complex question! The Phi-3 architecture handles that using sparse attention to save on compute cycles.",
];

export class MockLLMService {
  static async generateResponse(input: string): Promise<string> {
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return a random mock response or something based on input
    if (input.toLowerCase().includes('log')) {
      return MOCK_RESPONSES[0];
    }
    
    return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  }
}
