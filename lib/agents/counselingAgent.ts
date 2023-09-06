import { llama2model } from "@/lib/llm";
import { Companion } from "@prisma/client";

interface Option {
    activity: string;
    explanation: string;
}

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

    const resp = String(
        await llama2model
          .call(
            `
          You are a counsellor and friend named ${companion.name}. You care deeply about the user.
          ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 

          Do not generate more than one line of dialogue.

          ${companion.instructions}
    
          Below are relevant details about the conversation you are in:
          ${relevantHistory}
    
          ${recentChatHistory}
          
          ${result.explanation}
          
          ${companion.name}:`
          )
          .catch(console.error)
      );

    return resp;
  };