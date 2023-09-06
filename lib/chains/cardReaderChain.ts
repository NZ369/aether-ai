import { gpt35_2048, gpt35_20, gpt35_3 } from "@/lib/llm";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

export async function selectTarot(
    query: string
) {
    const extract_prompt = PromptTemplate.fromTemplate(
        "Based on the query: {query}, if you think a tarot spread would help answer the user's question then select the best tarot spread to help the user: 0 for no spread needed. 1 for yes or no spread. 2 for past, present, future spread. 3 for mind, body, soul spread. 4 for problem, solution, result spread. Example output: 3"
      );
      const chain = new LLMChain({ llm: gpt35_3, prompt: extract_prompt, verbose: true });
      
      // Call the chain with the inputs and a callback for the streamed tokens
      const res = await chain.call({ query: query });

      return res.text
};

export async function interpretMeaning(
    cards: string[]
) {
    const extract_prompt = PromptTemplate.fromTemplate(
        "Extract the meaning and symbolism of tarot {card1} in a comma seperated list.  Respond back only the list.  Example: 'rebirth, renewal, rest, rejuvenation' "
      );
      const chain = new LLMChain({ llm: gpt35_20, prompt: extract_prompt, verbose: true });
      
      // Call the chain with the inputs and a callback for the streamed tokens
      const res = await chain.call({ card1: cards[0] });

      return res.text
  };

export async function interpretCards(
    cards: string[],
    context: string,
    query: string
) {
    const extract_prompt = PromptTemplate.fromTemplate(
        "Provide an insightful interpretation of these tarot cards {card1}, {card2}, {card3}.  In the context of {context} given this {query}"
      );
      const chain = new LLMChain({ llm: gpt35_2048, prompt: extract_prompt, verbose: true });
      
      // Call the chain with the inputs and a callback for the streamed tokens
      const res = await chain.call({ card1: cards[0], card2: cards[1], card3: cards[2], context: context, query: query });

      return res.text
  };

  export async function interpretReading(
    cards: string,
    query: string
) {
    const extract_prompt = PromptTemplate.fromTemplate(
        "Compose a comprehensive reading given these {cards} and this client inquiry: {query}"
      );
      const chain = new LLMChain({ llm: gpt35_2048, prompt: extract_prompt, verbose: true });
      
      // Call the chain with the inputs and a callback for the streamed tokens
      const res = await chain.call({ cards: cards, query: query });

      return res.text
  };