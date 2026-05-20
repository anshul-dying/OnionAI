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
  static async generateResponse(input: string, systemPrompt?: string, temperature?: number): Promise<string> {
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let response = "";
    
    // Return a random mock response or something based on input
    if (input.toLowerCase().includes('log')) {
      response = MOCK_RESPONSES[0];
    } else {
      response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    }

    // Apply simulation rules driven by the System Prompt
    const normPrompt = (systemPrompt || '').toLowerCase();
    
    if (normPrompt.includes('brief') || normPrompt.includes('concise')) {
      const sentence = response.split('.')[0];
      response = sentence ? `${sentence}. (Brief Mode)` : response;
    } else if (normPrompt.includes('code') || normPrompt.includes('coding') || normPrompt.includes('expert')) {
      response = `\`\`\`typescript\n// Workstation Code block simulated via system prompt\nconst localConfig = {\n  system: "OnionAI",\n  prompt: "${systemPrompt?.substring(0, 25)}...",\n  temp: ${temperature ?? 0.7}\n};\nconsole.log(localConfig);\n\`\`\``;
    } else if (normPrompt.includes('creative')) {
      response = `✨ [Creative Mode Active] ${response} Let your imagination explore local computing borders! ✨`;
    }

    // If high temperature, add extra creative emojis
    if (temperature && temperature > 1.2) {
      response = `🌪️🔥🚀 ${response} 🌀🔮✨`;
    } else if (temperature && temperature < 0.2) {
      response = `[Deterministic] ${response}`;
    }

    return response;
  }
}
