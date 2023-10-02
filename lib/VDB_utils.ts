/*
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { ChatOpenAI } from "langchain/chat_models/openai"
import { RetrievalQAChain, VectorDBQAChain, loadQAChain, loadQAStuffChain } from "langchain/chains"
import { Document } from "langchain/document"
import { indexName, timeout } from "@/config"
import { PineconeStore } from "langchain/vectorstores/pinecone"
import { OpenAI } from "langchain/llms/openai"
import { PineconeClient } from "@pinecone-database/pinecone"

export const createPineconeIndex = async (
    client: { listIndexes: () => any; createIndex: (arg0: { createRequest: { name: any; dimension: any; metric: string } }) => any },
    indexName: any,
    vectorDimension: any
) => {
    console.log(`Checking "${indexName}"...`)
    const existingIndexes = await client.listIndexes()
    if (!existingIndexes.includes(indexName)) {
        console.log(`Creating "${indexName}"...`)
        await client.createIndex({
            createRequest: {
                name: indexName,
                dimension: vectorDimension,
                metric: 'cosine'
            }
        })

        console.log('Creating index...  Wait for it to complete initializing.')
        await new Promise((resolve) => setTimeout(resolve, timeout))
    } 
    else {
        console.log(`${indexName} index already exists.`)
    }
}

export const updatePinecone = async (client: { Index: (arg0: any) => any }, indexName: any, docs: undefined) => {
    const index = client.Index(indexName)
    console.log(`Pinecone index retrieved: ${indexName}`)

    for (const doc of docs) {
        console.log(`Processing document: ${doc.metadata.source}`)
        const txtPath = doc.metadata.source
        const text = doc.pageContent

        const textSplitter = new RecursiveCharacterTextSplitter ({
            chunkSize: 1000
        })
        const chunks = await textSplitter.createDocuments([text])
        console.log(`Text split into ${chunks.length} chunks`)
        console.log(`Calling OpenAI's Embedding endpoint documents with ${chunks.length} text chunks...`)
        const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
            chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
        )

        const batchSize = 100
        let batch:any = []
        for (let idx=0; idx<chunks.length; idx++) {
            const chunk = chunks[idx]
            const vector = {
                id: `${txtPath}_${idx}`,
                values: embeddingsArrays[idx],
                metadata: {
                    ...chunk.metadata,
                    loc: JSON.stringify(chunk.metadata.loc),
                    pageContent: chunk.pageContent,
                    txtPath: txtPath,
                }
            }
            batch = [...batch, vector]

            if (batch.length === batchSize || idx === chunks.length - 1) {
                await index.upsert({
                    upsertRequest: {
                        vectors: batch
                    }
                })
                batch = []
            }
        }
    }
}

export const queryPinecone = async (client: PineconeClient, indexName: string, question: string) => {
    console.log('Querying Pinecone vector store...')
    const index = client.Index(indexName)
    const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question)
    let queryResponse = await index.query({
        queryRequest: {
            topK: 10,
            vector: queryEmbedding,
            includeMetadata: true,
            includeValues: true,
        }
    })

    if (queryResponse.matches && queryResponse.matches.length) {
        const llm = new ChatOpenAI({ temperature: 0.5, timeout: 20000 })
        const chain = loadQAStuffChain(llm)

        const concatenatedPageContent = queryResponse.matches
            .filter(match => match.metadata) // Filter out undefined metadata
            .map((match) => match.metadata as { pageContent: string }) // Type assertion
            .map((metadata) => metadata.pageContent)
            .join(" ")

        const result = await chain.call({
            input_documents: [new Document({ pageContent: concatenatedPageContent })],
            question: question
        })

        console.log(`Answer: ${result.text}`)
        return result.text
    }
    else {
        console.log('No matches found.')
    }
}
*/