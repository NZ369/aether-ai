import { llama2model, gpt35_3 } from "@/lib/llm";
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

export async function selectSearch(
    conversation: string,
    query: string
) {
    const extract_prompt = PromptTemplate.fromTemplate(
        "Based on the conversation: {conversation} and the user's question: {query}. If you think to answer the user's query requires a search within the knowledge base respond with 0.  Otherwise respond with 1. Example output: 0"
      );
      const chain = new LLMChain({ llm: gpt35_3, prompt: extract_prompt, verbose: true });
      
      // Call the chain with the inputs and a callback for the streamed tokens
      const res = await chain.call({ conversation: conversation, query: query });

      return res.text
};