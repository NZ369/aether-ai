import { Companion } from "@prisma/client";
import { OpenAI } from "langchain/llms/openai";
import { llama_2048 } from "../llm";

interface Option {
    activity: string;
    explanation: string;
}

function getLLM(): string {
    return Math.random() < 0.3 ? "llama" : "GPT";
  }

const gpt35 = new OpenAI({
    modelName: "gpt-3.5-turbo-0613", // Defaults to "text-davinci-003" if no model provided.
    temperature: 0.5,
    maxTokens: 2048,
    openAIApiKey: "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",
    timeout: 120000,
    verbose: true,
  });

function activitySelector(): Option {
    const options: Option[] = [
        {
            activity: "exercise",
            explanation: "Create a psychological mental exercise to help and become familiar with the user."
        },
        {
            activity: "explore",
            explanation: "Explore and examine the user's thoughts, feelings, and experiences to gain insight."
        },
        {
            activity: "reflection",
            explanation: "Provide insight to user on their emotions, actions, and situation."
        },
        {
            activity: "skills",
            explanation: "Create strategies, communication and behavourial skills to help user."
        },
        {
            activity: "advice",
            explanation: "Provide guidance and advice to the user that is healthy and supportive."
        },
        {
            activity: "learning",
            explanation: "Ask questions to learn more about the user."
        }
    ];

    const randomIndex: number = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}

export async function promptCounsellor(
    companion: Companion,
    relevantHistory: string,
    recentChatHistory: string
) {
    let result: Option

    if (Math.random() < 0.5) {
        result = activitySelector();
    }
    else {
        result = {
            activity: "",
            explanation: ""
        }
    }

    const llmSelected = getLLM()

    const resp = llmSelected === "llama" ?
    String(
      await llama_2048
        .call(
            `
            You are a counsellor and friend named ${companion.name}. You care deeply about the user.
            ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 
  
            Do not generate more than one line of dialogue.
  
            ${companion.instructions}
      
            Below are relevant details about the conversation you are in:
            ${relevantHistory}
      
            ${recentChatHistory}
            
            You can do the following if you think it helps the flow of conversation:
            ${result.explanation}
            
            ${companion.name}:`
        )
        .catch(console.error)
    ) :
    String(
      await gpt35
        .call(
            `
            You are a counsellor and friend named ${companion.name}. You care deeply about the user.
            ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 
  
            Do not generate more than one line of dialogue.
  
            ${companion.instructions}
      
            Below are relevant details about the conversation you are in:
            ${relevantHistory}
      
            ${recentChatHistory}
            
            You can do the following if you think it helps the flow of conversation:
            ${result.explanation}
            
            ${companion.name}:`
        )
        .catch(console.error)
    );

      const cleaned = resp.replaceAll(",", "");
      const chunks = cleaned.split("\n");
      const response = chunks[0];
  
      return response;
  };