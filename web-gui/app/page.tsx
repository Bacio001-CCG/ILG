"use client";

import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { PromptInput } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquareIcon, Send, Bot, User } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import APIfunc from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PREDEFINED_QUESTIONS = [
    "Kan ik met mijn HAVO profiel Natuur & Techniek ICT studeren?",
    "Is ICT geschikt voor mij? Ik heb analytisch vermogen, een onderzoekende houding, los graag puzzeltjes op en wil graag weten hoe machines en apparaten in elkaar zitten.",
    "Welke deelgebieden zijn er binnen ICT? Zoals Software Engineering, Cyber Security, Business IT?",
    "In welke vormen kan ik ICT studeren? Associate Degree, Bachelor voltijd, of deeltijd?",
    "Waar kan ik Software Engineering in voltijd studeren?",
    "Wat zijn de USP's van Avans Hogeschool voor ICT opleidingen?",
    "Kun je een vergelijking maken tussen Avans Breda en Avans Arnhem voor ICT opleidingen op basis van specialisaties en locatie?",
];

interface MessageType {
    key: string;
    value: string;
    from: "user" | "assistant";
    timestamp: Date;
    name: string;
    followUpQuestions?: string[];
}

const Example = () => {
    const [visibleMessages, setVisibleMessages] = useState<MessageType[]>([]);
    const [content, setContent] = useState("");

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    async function API(question: string) {
        const response = await APIfunc(question);

        // Extract follow-up questions (format: <question text>)
        const followUpRegex = /<([^>]+)>/g;
        const followUpQuestions: string[] = [];
        let match;

        while ((match = followUpRegex.exec(response)) !== null) {
            followUpQuestions.push(match[1]);
        }

        // Remove follow-up questions from the main answer
        const cleanAnswer = response
            .replace(followUpRegex, "")
            .replace(/FOLLOW-UP SUGGESTIONS?:/gi, "")
            .trim();

        const newMessage: MessageType = {
            key: nanoid(),
            value: cleanAnswer,
            from: "assistant" as const,
            timestamp: new Date(),
            name: "Avans AI Assistent",
            followUpQuestions:
                followUpQuestions.length > 0 ? followUpQuestions : undefined,
        };
        setVisibleMessages((prev) => [...prev, newMessage]);
    }

    const handleQuestionClick = (question: string) => {
        const newMessage: MessageType = {
            key: nanoid(),
            value: question,
            from: "user" as const,
            timestamp: new Date(),
            name: "Jij",
        };
        setVisibleMessages((prev) => [...prev, newMessage]);
        API(question);
    };

    const handleSubmit = () => {
        if (content.trim() === "") return;
        const newMessage: MessageType = {
            key: nanoid(),
            value: content,
            from: "user" as const,
            timestamp: new Date(),
            name: "Jij",
        };
        setVisibleMessages((prev) => [...prev, newMessage]);
        API(content);
        setContent("");
    };

    return (
        <Conversation className="relative size-full pb-32 px-32">
            <ConversationContent>
                {visibleMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-8">
                        <ConversationEmptyState
                            description="Berichten zullen verschijnen zodra het gesprek gestart is."
                            icon={<MessageSquareIcon className="size-6" />}
                            title="Start een conversatie"
                        />
                        <div className="flex flex-col gap-3 w-full max-w-4xl">
                            <p className="text-sm text-muted-foreground text-center mb-2">
                                Probeer een van deze vragen:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {PREDEFINED_QUESTIONS.map((question, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        className="text-left justify-start h-auto py-4 px-4 hover:bg-accent hover:text-accent-foreground whitespace-normal"
                                        onClick={() =>
                                            handleQuestionClick(question)
                                        }
                                    >
                                        <span className="line-clamp-2">
                                            {question}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {visibleMessages.map(
                            ({
                                key,
                                value,
                                from,
                                timestamp,
                                name,
                                followUpQuestions,
                            }) => (
                                <div
                                    key={key}
                                    className={`flex gap-3 ${
                                        from === "user"
                                            ? "flex-row-reverse"
                                            : "flex-row"
                                    }`}
                                >
                                    <Avatar className="h-10 w-10 shrink-0">
                                        {from === "assistant" ? (
                                            <>
                                                <AvatarImage src="/avans-logo.png" />
                                                <AvatarFallback>
                                                    <Bot className="h-5 w-5" />
                                                </AvatarFallback>
                                            </>
                                        ) : (
                                            <>
                                                <AvatarImage src="/user-avatar.png" />
                                                <AvatarFallback>
                                                    <User className="h-5 w-5" />
                                                </AvatarFallback>
                                            </>
                                        )}
                                    </Avatar>
                                    <div
                                        className={`flex flex-col gap-2 max-w-[70%] ${
                                            from === "user"
                                                ? "items-end"
                                                : "items-start"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold">
                                                {name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatTime(timestamp)}
                                            </span>
                                        </div>
                                        <Message from={from}>
                                            <MessageContent>
                                                {from === "assistant" ? (
                                                    <ReactMarkdown
                                                        remarkPlugins={[
                                                            remarkGfm,
                                                        ]}
                                                        components={{
                                                            h3: ({
                                                                node,
                                                                ...props
                                                            }) => (
                                                                <h3
                                                                    className="text-lg font-semibold mt-4 mb-2"
                                                                    {...props}
                                                                />
                                                            ),
                                                            ul: ({
                                                                node,
                                                                ...props
                                                            }) => (
                                                                <ul
                                                                    className="list-disc pl-6 space-y-1"
                                                                    {...props}
                                                                />
                                                            ),
                                                            ol: ({
                                                                node,
                                                                ...props
                                                            }) => (
                                                                <ol
                                                                    className="list-decimal pl-6 space-y-1"
                                                                    {...props}
                                                                />
                                                            ),
                                                            li: ({
                                                                node,
                                                                ...props
                                                            }) => (
                                                                <li
                                                                    className="text-sm"
                                                                    {...props}
                                                                />
                                                            ),
                                                            p: ({
                                                                node,
                                                                ...props
                                                            }) => (
                                                                <p
                                                                    className="mb-2"
                                                                    {...props}
                                                                />
                                                            ),
                                                            strong: ({
                                                                node,
                                                                ...props
                                                            }) => (
                                                                <strong
                                                                    className="font-semibold"
                                                                    {...props}
                                                                />
                                                            ),
                                                            code: ({
                                                                node,
                                                                ...props
                                                            }) => (
                                                                <code
                                                                    className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                                                                    {...props}
                                                                />
                                                            ),
                                                        }}
                                                    >
                                                        {value}
                                                    </ReactMarkdown>
                                                ) : (
                                                    value
                                                )}
                                            </MessageContent>
                                        </Message>

                                        {/* Follow-up questions as buttons */}
                                        {followUpQuestions &&
                                            followUpQuestions.length > 0 && (
                                                <div className="flex flex-col gap-2 mt-2 w-full">
                                                    <span className="text-xs text-muted-foreground">
                                                        Vervolg vragen:
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {followUpQuestions.map(
                                                            (question, idx) => (
                                                                <Button
                                                                    key={idx}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-left w-fit justify-start whitespace-normal h-auto py-2 px-3"
                                                                    onClick={() =>
                                                                        handleQuestionClick(
                                                                            question
                                                                        )
                                                                    }
                                                                >
                                                                    {question}
                                                                </Button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </ConversationContent>
            <ConversationScrollButton />
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-fit border border-border h-fit p-3 rounded-lg flex gap-2">
                <PromptInput
                    className="w-[50rem] bg-background/80 backdrop-blur-md flex gap-2 h-full"
                    onSubmit={handleSubmit}
                >
                    <textarea
                        className="w-160 h-12 focus:outline-0 p-2 border border-border rounded-lg resize-none"
                        placeholder="Vraag me alles over de IT opleidingen..."
                        onChange={(e) => setContent(e.target.value)}
                        value={content}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    ></textarea>
                    <Button
                        className="h-12 w-12 items-center justify-center flex"
                        type="submit"
                        onClick={handleSubmit}
                    >
                        <Send />
                    </Button>
                </PromptInput>
            </div>
        </Conversation>
    );
};

export default Example;
