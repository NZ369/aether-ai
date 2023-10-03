//import { llama2model_ethereal, gpt35 } from "@/lib/llm";
import { Companion } from "@prisma/client";
import { OpenAI } from "langchain/llms/openai";
import { interpretMeaning } from "../chains/cardReaderChain";
import { drawMostFrequentTarotCard } from "../code/frequentCard";
import { Replicate } from "langchain/llms/replicate";

function getNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function promptEthereal(
    companion: Companion,
    prompt: string,
    relevantHistory: string,
    recentChatHistory: string
) {

    const mostFrequentCard = drawMostFrequentTarotCard(1, 50);
    const interptretation = await interpretMeaning(await mostFrequentCard);

    const llama = new Replicate({
      model:
        "a16z-infra/llama-2-13b-chat:df7690f1994d94e96ad9d568eac121aecf50684a0b0963b25a41cc40061269e5",
      input: {
        max_length: 2048,
        temperature: 0.75,
        top_p: 1
      },
      apiKey: process.env.REPLICATE_API_TOKEN,
      verbose: true
    });
    
    const gpt35 = new OpenAI({
      modelName: "gpt-3.5-turbo-0613", // Defaults to "text-davinci-003" if no model provided.
      temperature: 0.5,
      maxTokens: getNumber(10, 2048),
      openAIApiKey: "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",
      timeout: 120000,
      verbose: true,
    });

    const resp =
    String(
      await gpt35
        .call(
          `
        You are a metaphysical being named ${companion.name}. You must not break character.  
        ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 

        Do not generate more than one line of dialogue.
        ${companion.instructions}
  
        Conversation History:
        ${recentChatHistory}

        You response could reflect these meanings and concepts: ${interptretation} 
        You can also summarize the concepts to a "Yes" or "No", "Positive" or "Negative"
        You can also create stories that reflect the meanings.

        User: ${prompt}
      
        ${companion.name}:`
        )
        .catch(console.error)
    );
    
    const chunks = resp.split(/user:|User:/);
    const response = chunks[0];

    return response;
};