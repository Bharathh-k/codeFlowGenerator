import sys
import os
from analyzeLogs import analyze_and_store_logs
from langchain_groq import ChatGroq
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_community.vectorstores import Chroma

os.environ["GROQ_API_KEY"] = "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"

if len(sys.argv) < 2:
    print("Error: No question provided")
    sys.exit(1)

question = sys.argv[1]

# Run log analysis
analyze_and_store_logs()

# Load files
file_paths = os.listdir("./uploads")
docs = []
for file_path in file_paths:
    file_path = "uploads/" + file_path
    loader = TextLoader(file_path)
    docs.extend(loader.load())

# Split text into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
split_docs = text_splitter.split_documents(docs)

# Initialize embeddings & retriever
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = Chroma.from_documents(split_docs, embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# Initialize LLM
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.5)

prompt = ChatPromptTemplate.from_template(
    """Answer the question using ONLY the context below. Keep responses detailed.
    
    <context>
    {context}
    </context>
    
    Question: {input}"""
)

document_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, document_chain)

# Get response
response = rag_chain.invoke({"input": question})
print(response["answer"])
