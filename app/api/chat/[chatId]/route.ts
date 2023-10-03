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
import { promptInstructor } from "@/lib/agents/instructorAgent";

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

    const records = await memoryManager.readLatestHistory(companionKey);
    if (records.length === 0) {
      await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
    }
    await memoryManager.writeToHistory("User: " + prompt + "\n", companionKey);

    const recentChatHistory = await memoryManager.readLatestHistory(companionKey);

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
      case "4ffb5aed-62a1-4f8d-84af-7eb1a1693361": //Ethereal Companions
        resp = await promptEthereal(companion, prompt, relevantHistory, recentChatHistory);
        break;
      case "9bd017a0-280c-4059-8d18-74cd6c25c174": //Character Companions
        resp = await promptCharacter(companion, relevantHistory, recentChatHistory);
        break;
      case "80df7a64-1b3b-4714-9973-bd7cee6feece": //Counselling Companions
        resp = await promptCounsellor(companion, relevantHistory, recentChatHistory);
        break;
      case "c5c91acc-cd2b-4c7d-b777-1c16838afc83": //Learning Companions
        resp = await promptInstructor(companion, companionKey, prompt, recentChatHistory);
        break;
      case "005e4c54-9eef-4730-b49a-df01ba65c3a8": //Divination Companions
        resp = await promptTarot(companion, prompt, recentChatHistory)
        break;
      default:
        resp = await promptCharacter(companion, relevantHistory, recentChatHistory);
        break;
    }

    var Readable = require("stream").Readable;

    let s = new Readable();
    s.push(resp);
    s.push(null);
    if (resp !== undefined && resp.length > 1) {
      await memoryManager.writeToHistory(companion.name + ":" + resp.trim(), companionKey);

      await prismadb.companion.update({
        where: {
          id: params.chatId
        },
        data: {
          messages: {
            create: {
              content: resp.trim(),
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