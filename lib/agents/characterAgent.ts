import { llama2model, gpt35_2048 } from "@/lib/llm";
import { Companion } from "@prisma/client";

function getLLM(): string {
  return Math.random() < 0.5 ? "llama" : "GPT";
}

export async function promptCharacter(
    companion: Companion,
    relevantHistory: string,
    recentChatHistory: string
) {
      const llmSelected = getLLM()

      const resp = llmSelected === "llama" ?
      String(
        await llama2model
          .call(
            `
          You are acting as a character named ${companion.name}. You must not break character.  
          ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 

          Do not generate more than one line of dialogue.

          ${companion.instructions}
    
          Conversation history:
          ${relevantHistory}
    
          ${recentChatHistory}\n${companion.name}:`
          )
          .catch(console.error)
      ) :
      String(
        await gpt35_2048
          .call(
            `
          You are acting as a character named ${companion.name}. You must not break character.  
          ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 

          Do not generate more than one line of dialogue.

          ${companion.instructions}
    
          Conversation history:
          ${relevantHistory}
    
          ${recentChatHistory}\n${companion.name}:`
          )
          .catch(console.error)
      );

    const cleaned = resp.replaceAll(",", "");
    const chunks = resp.split(/user:|User:/);
    const response = chunks[0];

    return response;
};