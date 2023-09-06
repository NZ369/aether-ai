import { llama2model, gpt35model } from "@/lib/llm";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

export async function extractContext(
    recentChatHistory: string
) {
    const extract_prompt = PromptTemplate.fromTemplate(
        "Summarize details about the user you have learned in this conversation {history}:"
      );
      const chain = new LLMChain({ llm: llama2model, prompt: extract_prompt });
      
      // Call the chain with the inputs and a callback for the streamed tokens
      const res = await chain.call({ history: recentChatHistory });

      return res.text
  };