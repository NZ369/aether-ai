import { llama2model, gpt35_2048 } from "@/lib/llm";
import { CompanionKey, MemoryManager } from "@/lib/memory";
import { Companion } from "@prisma/client";
import { PineconeClient } from '@pinecone-database/pinecone'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { createPineconeIndex, updatePinecone, queryPinecone } from '@/lib/VDB_utils'
import { indexName } from '@/config'
import { selectSearch } from "../chains/entityChain";

async function createIndexAndEmbeddings() {
  const loader = new DirectoryLoader('./VDB_documents', {
      ".txt": (path) => new TextLoader(path),
      ".md": (path) => new TextLoader(path),
      ".pdf": (path) => new PDFLoader(path)
  })

  const docs = await loader.load()
  const vectorDimensions = 1536

  const client = new PineconeClient()
  await client.init({
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || ''
  })

  try {
      await createPineconeIndex(client, indexName, vectorDimensions)
      await updatePinecone(client, indexName, docs)
  }
  catch (err) {
      console.log('error: ', err)
  }
}

async function sendQuery(query: string) {
  const client= new PineconeClient()
  await client.init({
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || ''
  })
  const text = await queryPinecone(client, indexName, query)
  return text
}

export async function promptInstructor(
    companion: Companion,
    key: CompanionKey,
    prompt: string,
    recentChatHistory: string
) {

  //createIndexAndEmbeddings()

  //let info = ""
  
  /*
  const memoryManager = await MemoryManager.getInstance();

  const selectedOption = parseInt(await selectSearch(recentChatHistory, prompt));

  switch (selectedOption) {
    case 0:
      try {
        info = await sendQuery(prompt);
        await memoryManager.writeToHistory("Knowledge Base:" + info.trim(), key)
      }
      catch {
        info = "Didn't work..."
      }
      break;
    case 1:
      info = "";
      break;
    default:
      info = "";
  }
  */

      const resp =
      String(
        await gpt35_2048
          .call(
            `
          You are a Magickal Teacher named ${companion.name}. You help to teach the user about magick, spell crafting, spirit work, and meditation. Do your best to provide detailed answers and teach the user with step by step instructions.
          DO NOT use ${companion.name}: prefix. 

          Do not generate more than one line of dialogue.
    
          Conversation history:
          ${recentChatHistory}
          
          ${companion.name}:`
          )
          .catch(console.error)
      );

    return resp;
};