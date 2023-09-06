import { Redis } from "@upstash/redis";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { ChatOpenAI } from "langchain/chat_models/openai"
import { loadQAStuffChain } from "langchain/chains"
import { Document } from "langchain/document"

export type CompanionKey = {
  companionName: string;
  userId: string;
};

export class MemoryManager {
  private static instance: MemoryManager;
  private history: Redis;
  /*
  private vectorDBClient: PineconeClient;
  private vectorDimensions: number;
  */

  public constructor() {
    this.history = Redis.fromEnv();
    /*
    this.vectorDBClient = new PineconeClient();
    this.vectorDimensions = 1536;
    */
  }

  public async init() {
    /*
    if (this.vectorDBClient instanceof PineconeClient) {
      await this.vectorDBClient.init({
        apiKey: process.env.PINECONE_API_KEY!,
        environment: process.env.PINECONE_ENVIRONMENT!,
      });
    }
    */
  }

  public static async getInstance(): Promise<MemoryManager> {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
      await MemoryManager.instance.init();
    }
    return MemoryManager.instance;
  }

  private generateRedisCompanionKey(companionKey: CompanionKey): string {
    return `${companionKey.companionName}-${companionKey.userId}`;
  }

  private indexName(companionKey: CompanionKey) {
    let result = ""

    if (companionKey.userId.startsWith("user_")) {
      const cleanedString = companionKey.userId.substring(5);
      result = cleanedString + companionKey.companionName.replace(/-/g, "");
    } else {
      result = companionKey.userId + companionKey.companionName.replace(/-/g, "");
    }

    if (result.length > 45) {
      result = result.substring(0, 45);
    }

    return result.toLowerCase();
  }

  public async writeToHistory(text: string, companionKey: CompanionKey) {
    if (!companionKey || typeof companionKey.userId == "undefined") {
      console.log("Companion key set incorrectly");
      return "";
    }

    const key = this.generateRedisCompanionKey(companionKey);
    const result = await this.history.zadd(key, {
      score: Date.now(),
      member: text,
    });
    /*
    try {
      await this.updatePinecone(companionKey, text)
    }
    catch (err) {
        console.log('error: ', err)
    }
    */
    return result;
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    if (!companionKey || typeof companionKey.userId == "undefined") {
      console.log("Companion key set incorrectly");
      return "";
    }

    const key = this.generateRedisCompanionKey(companionKey);
    let result = await this.history.zrange(key, 0, Date.now(), {
      byScore: true,
    });

    result = result.slice(-10).reverse();
    const recentChats = result.reverse().join("\n");
    return recentChats;
  }

  public async seedChatHistory(
    seedContent: String,
    delimiter: string = "\n",
    companionKey: CompanionKey
  ) {
    const key = this.generateRedisCompanionKey(companionKey);
    if (await this.history.exists(key)) {
      console.log("User already has chat history");
      return;
    }

    const content = seedContent.split(delimiter);
    let counter = 0;
    for (const line of content) {
      await this.history.zadd(key, { score: counter, member: line });
      counter += 1;
    }
/*
    try {
        await this.createPineconeIndex(companionKey)
    }
    catch (err) {
        console.log('error: ', err)
    }*/
  }

  public async deleteChatHistory(
    companionKey: CompanionKey
  ) {
    const key = this.generateRedisCompanionKey(companionKey);

    if (await this.history.exists(key)) {
      console.log("Chat history with this companion exists.");
      try {
        this.history.del(key)
      }
      catch (error) {
        console.error('Error deleting companion chat history:', error);
      }
    }
    else {
      console.log("No chat history with this companion exists.");
    }
    return
  }

  /*
  public async createPineconeIndex (
    companionKey: CompanionKey,
  ) {
    const timeout = 80000
    const pineconeClient = <PineconeClient>this.vectorDBClient;
  
    console.log(`Checking for index "${this.indexName(companionKey)}"...`)
    const existingIndexes = await pineconeClient.listIndexes()
    if (!existingIndexes.includes(this.indexName(companionKey))) {
        console.log(`Creating "${this.indexName(companionKey)}"...`)
        await pineconeClient.createIndex({
            createRequest: {
                name: this.indexName(companionKey),
                dimension: this.vectorDimensions,
                metric: 'cosine'
            }
        })
        await new Promise((resolve) => setTimeout(resolve, timeout))
    } 
    else {
        console.log(`${this.indexName(companionKey)} index already exists.`)
    }
  }
  
  public async updatePinecone (
    companionKey: CompanionKey,
    docs: string
  ) {
    const pineconeClient = <PineconeClient>this.vectorDBClient;
    this.createPineconeIndex(companionKey)
    const index = pineconeClient.Index(this.indexName(companionKey))
    console.log(`Pinecone index retrieved: ${this.indexName(companionKey)}`)
  
    // Embed the docs string with OpenAI before sending it to pinecone
    console.log(`Calling OpenAI's Embedding endpoint with docs string...`)
    const docsEmbedding = await new OpenAIEmbeddings(
      {
      azureOpenAIApiKey: "56633e25d78d4914925dc5b7e93c8309",
      azureOpenAIBasePath: "https://llmgeekweek5.openai.azure.com/openai/deployments", 
      azureOpenAIApiDeploymentName: "ADA",
      azureOpenAIApiVersion: "2023-05-15",
      }
    ).embedDocuments([docs])
  
    // Create a vector object with the docs string and its embedding
    const vector = {
      id: docs,
      values: docsEmbedding[0],
      metadata: {
        source: docs
      }
    }
  
    // Upsert the vector to the pinecone index
    await index.upsert({
      upsertRequest: {
        vectors: [vector]
      }
    })
  }

  public async searchMemory(
    companionKey: CompanionKey,
    recentChatHistory: string,
    companionFileName: string
  ) {
    const pineconeClient = <PineconeClient>this.vectorDBClient;

    const pineconeIndex = pineconeClient.Index(this.indexName(companionKey))

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY
      }),
      { pineconeIndex }
    ); 

    const similarDocs = await vectorStore
      .similaritySearch(recentChatHistory, 3, { fileName: companionFileName })
      .catch((err) => {
        console.log("WARNING: failed to get vector search results.", err);
      });
    return similarDocs;
  }
  
  public async queryMemory (
    companionKey: CompanionKey,
    question: string
    ) {
    const pineconeClient = <PineconeClient>this.vectorDBClient;
    console.log('Querying Pinecone vector store...')
    const index = pineconeClient.Index(this.indexName(companionKey))
    const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question)
    let queryResponse = await index.query({
        queryRequest: {
            topK: 10,
            vector: queryEmbedding,
            includeMetadata: true,
            includeValues: true,
        }
    })
  
    if (queryResponse.matches?.length) {
        const llm = new ChatOpenAI({ temperature: 0.5, timeout: 20000 })
        const chain = loadQAStuffChain(llm)
  
        const concatenatedPageContent = queryResponse.matches
        .map((match) => (match as any).metadata.pageContent)
        .join(" ");
  
        const result = await chain.call({
            input_documents: [new Document({ pageContent: concatenatedPageContent })],
            question: question
        })
  
        console.log(`Pinecone found: ${result.text}`)
        return result.text
    }
    else {
        console.log('No matches found.')
    }
  }*/
}