import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { gpt35 } from "@/lib/llm";
import { Companion } from "@prisma/client";
import { Calculator } from "langchain/tools/calculator";

const tools = [new Calculator()];

export async function promptAssistant(
    companion: Companion,
    userPrompt: string
) {

  const prefix =
  `
  You are an assistant named ${companion.name}.

  ${companion.instructions}
  `
  const executor = await initializeAgentExecutorWithOptions(tools, gpt35, {
    agentType: "openai-functions",
    verbose: true,
    agentArgs: {
      prefix,
    },
  });

  return await executor.run(userPrompt);
}