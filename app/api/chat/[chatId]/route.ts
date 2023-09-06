import dotenv from "dotenv";
import { StreamingTextResponse, LangChainStream } from "ai";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";

import { promptEthereal } from "@/lib/agents/etherealAgent";
import { promptCounsellor } from "@/lib/agents/counselingAgent";
import { promptCharacter } from "@/lib/agents/characterAgent";
import { promptTarot } from "@/lib/agents/tarotAgent";

dotenv.config({ path: `.env` });

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { prompt } = await request.json();
    const user = await currentUser();

    if (!user || !user.firstName || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);

    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    const companion = await prismadb.companion.update({
      where: {
        id: params.chatId
      },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            userId: user.id,
          },
        },
      }
    });

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }

    const name = companion.id;
    const companion_file_name = name + ".txt";

    const companionKey = {
      companionName: name!,
      userId: user.id
    };
    const memoryManager = await MemoryManager.getInstance();

    await memoryManager.writeToHistory("User: " + prompt, companionKey);

    const recentChatHistory = await memoryManager.readLatestHistory(companionKey);
    if (recentChatHistory.length === 0) {
      await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
    }

    let relevantHistory = ""
/*
    if (recentChatHistory.length > 10) {
      relevantHistory = await extractContext(recentChatHistory)
    }
    else {
      relevantHistory = ""
    }*/

    /*
    const similarDocs = await memoryManager.searchMemory(
      companionKey,
      recentChatHistory,
      companion_file_name
    );

    let relevantHistory = "";
    if (!!similarDocs && similarDocs.length !== 0) {
      relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
    }
    */

    let resp = ""

    console.log("\nCategory Id: "+ companion.categoryId + "\n")

    switch (companion.categoryId) {
      case "d29db2df-b459-482f-850f-4deb3cc5fbcb": //Ethereal Companions
        resp = await promptEthereal(companion, relevantHistory, recentChatHistory);
        break;
      case "97151349-6835-47f9-a9ec-9bcf4f1d9016": //Character Companions
        resp = await promptCharacter(companion, relevantHistory, recentChatHistory);
        break;
      case "441b6d51-f7da-49f3-b392-b7ecb79a271f": //Counselling Companions
        resp = await promptCounsellor(companion, relevantHistory, recentChatHistory);
        break;
      case "11d9292c-e594-4214-b30f-d2d5b1721c1f": //Learning Companions
        resp = await promptCounsellor(companion, relevantHistory, recentChatHistory);
        break;
      case "3f9e3423-134f-4542-95a5-226532ac4bce": //Social Companions
        resp = await promptCounsellor(companion, relevantHistory, recentChatHistory);
        break;
      case "e09067c1-5fcb-42c0-853f-870fbf8547d9": //Divination Companions
        resp = await promptTarot(companion, prompt, recentChatHistory)
        break;
      default:
        resp = await promptCharacter(companion, relevantHistory, recentChatHistory);
        break;
    }
    
    const cleaned = resp.replaceAll(",", "");
    const chunks = cleaned.split("\n");
    const response = chunks[0];

    var Readable = require("stream").Readable;

    let s = new Readable();
    s.push(response);
    s.push(null);
    if (response !== undefined && response.length > 1) {
      await memoryManager.writeToHistory(companion.name + ":" + response.trim(), companionKey);

      await prismadb.companion.update({
        where: {
          id: params.chatId
        },
        data: {
          messages: {
            create: {
              content: response.trim(),
              role: "system",
              userId: user.id,
            },
          },
        }
      });
    }

    return new StreamingTextResponse(s);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
};