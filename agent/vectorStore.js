import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVectorStore() {
    console.log("🔄 Loading documents...");

    // Load all .txt files from training-data directory
    const loader = new DirectoryLoader(
        path.join(__dirname, "../training-data"),
        {
            ".txt": (path) => new TextLoader(path),
        }
    );

    const docs = await loader.load();
    console.log(`📄 Loaded ${docs.length} documents`);

    // Split documents into chunks
    console.log("✂️  Splitting documents into chunks...");
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
    });

    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`📝 Created ${splitDocs.length} chunks`);

    // Create embeddings and store in FAISS
    console.log(
        "🧠 Creating embeddings and storing in FAISS vector database..."
    );
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

    // Save the vector store to disk
    const directory = path.join(__dirname, "faiss_index");
    await vectorStore.save(directory);

    console.log(`✅ Vector store saved to ${directory}`);
    return vectorStore;
}

// Run setup if this file is executed directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
    console.log("Starting vector store setup...\n");
    await setupVectorStore();
    console.log("\n✅ Setup complete!");
    process.exit(0);
}
