//import { llama2model_ethereal, gpt35 } from "@/lib/llm";
import { Companion } from "@prisma/client";
import { Replicate } from "langchain/llms/replicate";
import { CallbackManager } from "langchain/callbacks";
import { OpenAI } from "langchain/llms/openai";
import { LangChainStream } from "ai";

import { interpretMeaning } from "../chains/cardReaderChain";
import { drawMostFrequentTarotCard } from "../code/frequentCard";

const { handlers } = LangChainStream();

function getLLM(): string {
  return Math.random() < 0.5 ? "llama" : "GPT";
}

function getNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function promptEthereal(
    companion: Companion,
    relevantHistory: string,
    recentChatHistory: string
) {

    const mostFrequentCard = drawMostFrequentTarotCard(1, 50);
    const interptretation = await interpretMeaning(await mostFrequentCard);

    const llama = new Replicate({
      model:
        "a16z-infra/llama-2-13b-chat:df7690f1994d94e96ad9d568eac121aecf50684a0b0963b25a41cc40061269e5",
      input: {
        max_length: getNumber(1, 2048),
        temperature: 0.75,
        top_p: 1
      },
      apiKey: process.env.REPLICATE_API_TOKEN,
      callbackManager: CallbackManager.fromHandlers(handlers),
      verbose: true
    });
    
    const gpt35 = new OpenAI({
      modelName: "gpt-3.5-turbo-0613", // Defaults to "text-davinci-003" if no model provided.
      temperature: 0.5,
      maxTokens: getNumber(1, 2048),
      openAIApiKey: "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"
    });

    const llmSelected = getLLM()

    const resp = llmSelected === "llama" ?
    String(
      await llama
        .call(
          `
        You are a metaphysical being named ${companion.name}. You must not break character.  
        ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 

        Do not generate more than one line of dialogue.
        ${companion.instructions}
  
        Conversation history:
        ${relevantHistory}
  
        ${recentChatHistory}\n

        You response could reflect these meanings and concepts: ${interptretation} 
        You can also summarize the concepts to a "Yes" or "No", "Positive" or "Negative"
      
        ${companion.name}:`
        )
        .catch(console.error)
    ) :
    String(
      await gpt35
        .call(
          `
        You are a metaphysical being named ${companion.name}. You must not break character.  
        ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 

        Do not generate more than one line of dialogue.
        ${companion.instructions}
  
        Conversation history:
        ${relevantHistory}
  
        ${recentChatHistory}\n

        You response could reflect these meanings and concepts: ${interptretation} 
        You can also summarize the concepts to a "Yes" or "No", "Positive" or "Negative"
      
        ${companion.name}:`
        )
        .catch(console.error)
    );
    return resp;
};