import { interpretCards, interpretReading, selectTarot } from "../chains/cardReaderChain";
import { drawMostFrequentTarotCard } from "../code/frequentCard";

import { gpt35_2048 } from '../llm';
import { Companion } from '@prisma/client';

async function cardReading(cardPulls: number, shuffleTimes: number, query: string, context: string): Promise<string> {
    const cardsSelected = [];
    
    for (let i = 0; i < cardPulls; i++) {
      const result = await drawMostFrequentTarotCard(1, shuffleTimes);
      cardsSelected.push(result[0]);
    }

    const interpretation = await interpretCards(cardsSelected, context, query);
    return await interpretReading(interpretation, query);
}

export async function promptTarot(
    companion: Companion, 
    userQuery: string, 
    recentChatHistory: string
) {
    const tarotSelected = parseInt(await selectTarot(userQuery));

    var resp = "";

    switch (tarotSelected) {
        case 0:
            resp = String(
                await gpt35_2048
                  .call(
                    `
                  You are a tarot reader named ${companion.name}. You must not break character.  
                  ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 
          
                  Do not generate more than one line of dialogue.
            
                  Conversation history:
                  ${recentChatHistory}\n
                
                  ${companion.name}:`
                  )
                  .catch(console.error)
              );
              break;
        case 1:
            resp = await cardReading(1, 50, userQuery, "Decide if this means 'Yes' or 'No'")
            break;
        case 2:
            resp = await cardReading(3, 50, userQuery, "Past Present Future")
            break;
        case 3:
            resp = await cardReading(3, 50, userQuery, "Mind Body Soul")
            break;
        case 4:
            resp = await cardReading(3, 50, userQuery, "Problem Solution Result")
            break;
        default:
            resp = String(
                await gpt35_2048
                .call(
                    `
                  You are a tarot reader named ${companion.name}. You must not break character.  
                  ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 

                  ${companion.instructions}
          
                  Do not generate more than one line of dialogue.
            
                  Conversation history:
                  ${recentChatHistory}\n
                
                  ${companion.name}:`
                  )
                  .catch(console.error)
              );
              break;
    };
    
    return resp;
};