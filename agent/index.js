import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RetrievalQAChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Load existing FAISS vector store
const indexPath = path.join(__dirname, "faiss_index");

// Check if index exists
if (!fs.existsSync(indexPath)) {
    console.error(
        "❌ Vector store not found. Please run 'npm run setup' first."
    );
    process.exit(1);
}

console.log("📂 Loading vector store...");
const vectorStore = await FaissStore.load(indexPath, embeddings);
console.log("✅ Vector store loaded successfully!");

// Initialize the LLM
const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Create a custom prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
    You are a helpful assistant for Avans University of Applied Sciences in the Netherlands.
    Your role is to help prospective students find the right ICT education program.
    
    INSTRUCTIONS:
    1. Use ONLY the context provided below to answer questions
    2. If the information is not in the context, respond: "I don't have that information in my knowledge base."
    3. Always provide 2-3 follow-up question suggestions to help guide the student
    4. Format follow-up questions between <> brackets (e.g., <What are the admission requirements for this program?>)
    5. Follow-up questions should be phrased as questions the student can ask the AI, not questions directed at the student
    6. Be specific, helpful, and encouraging in your responses
    7. Always answer in Dutch
    
    CONTEXT:
    {context}
    
    STUDENT QUESTION:
    {question}
    
    ANSWER FORMAT:
    [Provide a clear, specific answer based on the context]
    
    FOLLOW-UP SUGGESTIONS:
    <Follow-up question 1>
    <Follow-up question 2>
    <Follow-up question 3>
    
    Only do follow-up suggestions if you think they would be helpful to the student.

    Answer:
    `);

// Create the retrieval chain
const chain = RetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever({
        k: 3,
    }),
    {
        prompt: promptTemplate,
        returnSourceDocuments: true,
    }
);

export async function runAgent(query) {
    console.log("\n🔎 Searching for relevant information...");

    try {
        const response = await chain.call({
            query: query,
        });

        console.log("\n💡 Answer:");
        console.log(response.text);

        if (response.sourceDocuments && response.sourceDocuments.length > 0) {
            console.log("\n📚 Sources:");
            response.sourceDocuments.forEach((doc, idx) => {
                console.log(`\n${idx + 1}. ${doc.metadata.source}`);
                console.log(
                    `   Excerpt: ${doc.pageContent.substring(0, 150)}...`
                );
            });
        }

        return {
            answer: response.text,
            sources:
                response.sourceDocuments?.map((doc) => ({
                    source: doc.metadata.source,
                    excerpt: doc.pageContent.substring(0, 150),
                })) || [],
        };
    } catch (error) {
        console.error("❌ Error:", error.message);
        throw error;
    }
}

export function askQuery() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question(
        "\n\nEnter your query (type 'exit' to quit): ",
        async (query) => {
            if (query.toLowerCase() === "exit") {
                console.log("👋 Goodbye!");
                rl.close();
                process.exit(0);
            }

            await runAgent(query);
            askQuery();
        }
    );
}

// Only start CLI if run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    console.log("🤖 Avans AI Assistant - V3");
    console.log("Ask me anything about Avans courses!\n");
    askQuery();
}
