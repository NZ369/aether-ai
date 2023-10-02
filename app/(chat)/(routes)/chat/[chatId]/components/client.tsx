"use client";

import { useCompletion } from "ai/react";
import { FormEvent, useState } from "react";
import styled from '@emotion/styled'; 
import { Companion, Message } from "@prisma/client";
import { useRouter } from "next/navigation";

import { ChatForm } from "@/components/chat-form";
import { ChatHeader } from "@/components/chat-header";
import { ChatMessages } from "@/components/chat-messages";
import { ChatMessageProps } from "@/components/chat-message";

interface ChatClientProps {
  companion: Companion & {
    messages: Message[];
    _count: {
      messages: number;
    }
  };
};

export const ChatClient = ({
  companion,
}: ChatClientProps) => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageProps[]>(companion.messages);
  
  const {
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    setInput,
  } = useCompletion({
    api: `/api/chat/${companion.id}`,
    onFinish(_prompt, completion) {
      const systemMessage: ChatMessageProps = {
        role: "system",
        content: completion
      };
      setMessages((current) => [...current, systemMessage]);
      setInput("");

      router.refresh();
    },
  });

  const StyledBackground = styled.div`
  background-image: url(${(props: { imageUrl: any; }) => props.imageUrl});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.5;
  z-index: -1;`;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const userMessage: ChatMessageProps = {
      role: "user",
      content: input
    };

    setMessages((current) => [...current, userMessage]);

    handleSubmit(e);
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-2">
      {companion.background && companion.background !== "" && (
        <StyledBackground imageUrl={companion.background}></StyledBackground>
      )}
      <ChatHeader companion={companion} />
      <ChatMessages 
        companion={companion}
        isLoading={isLoading}
        messages={messages}
      />
      <ChatForm 
        isLoading={isLoading} 
        input={input} 
        handleInputChange={handleInputChange} 
        onSubmit={onSubmit} 
      />
    </div>
   );
}