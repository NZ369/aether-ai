import { Replicate } from "langchain/llms/replicate";
import { CallbackManager } from "langchain/callbacks";
import { OpenAI } from "langchain/llms/openai";
import { LangChainStream } from "ai";

const { handlers } = LangChainStream();
// Change model and insert agent here
export const llama2model = new Replicate({
  model:
    "a16z-infra/llama-2-13b-chat:df7690f1994d94e96ad9d568eac121aecf50684a0b0963b25a41cc40061269e5",
  input: {
    max_length: 2048,
    temperature: 0.5,
    top_p: 1,
    //repetition_penalty_sustain: 50,
  },
  apiKey: process.env.REPLICATE_API_TOKEN,
  callbackManager: CallbackManager.fromHandlers(handlers),
  verbose: true
});

// "a16z-infra/llama-2-13b-chat:df7690f1994d94e96ad9d568eac121aecf50684a0b0963b25a41cc40061269e5",

export const gpt35_3 = new OpenAI({
  modelName: "gpt-3.5-turbo-0613", // Defaults to "text-davinci-003" if no model provided.
  temperature: 0.5,
  maxTokens: 3,
  openAIApiKey: "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", // In Node.js defaults to process.env.OPENAI_API_KEY
});

export const gpt35_20 = new OpenAI({
  modelName: "gpt-3.5-turbo-0613", // Defaults to "text-davinci-003" if no model provided.
  temperature: 0.5,
  maxTokens: 20,
  openAIApiKey: "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", // In Node.js defaults to process.env.OPENAI_API_KEY
});

export const gpt35_2048 = new OpenAI({
  modelName: "gpt-3.5-turbo-0613", // Defaults to "text-davinci-003" if no model provided.
  temperature: 0.5,
  maxTokens: 2048,
  openAIApiKey: "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", // In Node.js defaults to process.env.OPENAI_API_KEY
});