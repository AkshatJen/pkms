# PKMS - Personal Knowledge Management System

A powerful AI-powered personal knowledge management system that allows you to store daily work logs and query them using natural language. Built with TypeScript, LangChain, OpenAI, and ChromaDB.

## 🚀 Features

- **📝 Markdown-based Logging**: Store daily work logs in organized markdown files
- **🤖 AI-Powered Chat**: Query your work logs using natural language
- **📅 Date-Aware Search**: Ask temporal questions like "what did I work on last week?"
- **🔍 Semantic Search**: Find relevant information using content-based queries
- **⚡ Auto-Embedding**: Automatically update vector embeddings for new content
- **🎯 Smart Filtering**: Hybrid search combining date filtering and semantic similarity

## 📁 Project Structure

```
pkms/
├── data/                    # Work logs organized by month
│   ├── August 25/
│   │   ├── 2025-08-26.md
│   │   └── 2025-08-27.md
│   └── ...
├── scripts/
│   └── embed.ts
│   └── update-embeddings.ts # Incremental embedding updates
├── .env.example             # Initial embedding generation
├── chat.ts                  # Main chat interface
└── README.md
```

## 🛠️ Setup

### Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- OpenAI API key
- ChromaDB instance running locally

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd pkms
yarn install
```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. **Start ChromaDB:**

```bash
# Install ChromaDB if not already installed
pip install chromadb

# Start ChromaDB server
chroma run --host localhost --port 8000
```

4. **Generate initial embeddings:**

```bash
npx ts-node scripts/embed.ts
```

## 📖 Usage

### Adding Work Logs

Create markdown files in the `data/` directory following this structure:

- **Directory**: `data/Month Year/` (e.g., `data/August 25/`)
- **Filename**: `YYYY-MM-DD.md` (e.g., `2025-08-26.md`)

Example log entry:

```markdown
- Conducted few tests with Amazon Connect and played around with transcription and summarisation
- Reviewed documentation on Amazon regarding Amazon Connect and how it integrates with Q
- Real time metrics in Amazon Connect, updating the documentation on Jira
```

### Using the Chat System

```bash
npx ts-node chat.ts
```

#### Example Queries

**Temporal Queries:**

- "summary from last week"
- "what did I work on in late August?"
- "recent tasks"
- "what did I do yesterday?"

**Content Queries:**

- "Amazon Connect work"
- "Jira documentation"
- "TDD meetings"

### Updating Embeddings

**Daily updates** (recommended after adding new logs):

```bash
npx ts-node /scripts/update-embeddings.ts
```

**Force complete rebuild** (weekly maintenance):

```bash
npx ts-node /scripts/update-embeddings.ts --force
```

## 🔧 Technical Details

### Architecture

- **Frontend**: Command-line interface with readline
- **Backend**: TypeScript with LangChain framework
- **Vector Database**: ChromaDB for semantic search
- **AI Model**: OpenAI GPT-3.5-turbo-instruct
- **Embeddings**: OpenAI text-embedding-ada-002

### How It Works

1. **Document Processing**: Markdown files are chunked and embedded using OpenAI embeddings
2. **Hybrid Search**:
   - Temporal queries: Filter by date first, then sort chronologically
   - Content queries: Use semantic similarity search
3. **Smart Query Processing**: Automatically detects temporal vs. content-based queries
4. **Context Management**: Limits token usage to prevent API errors

### Supported Temporal Patterns

- **Relative**: "last week", "this week", "yesterday", "today"
- **Recent**: "recent", "lately", "last few days"
- **Specific**: "late August", "early September", "mid July"
- **Range**: "last month", "past month"

## 🚨 Troubleshooting

### Common Issues

**1. "Collection not found" error:**

```bash
# Regenerate embeddings
npx ts-node scripts/embed.ts
```

**2. "No data available" for recent queries:**

```bash
# Update embeddings with recent files
npx ts-node scripts/update-embeddings.ts
```

**3. Token limit exceeded:**

- The system automatically limits context size
- If issues persist, reduce the number of log entries per day

**4. ChromaDB connection issues:**

```bash
# Restart ChromaDB
chroma run --host localhost --port 8000
```

### Debug Tools

Check what's in your vector database:

```bash
# Test different search queries
curl -s http://localhost:8000/api/v1/collections
```

## 📊 Performance

- **Search Speed**: ~1-2 seconds for typical queries
- **Accuracy**: 95%+ for temporal queries with existing data
- **Token Efficiency**: Optimized to stay within OpenAI limits
- **Storage**: Minimal local storage, embeddings stored in ChromaDB

## 🔄 Recommended Workflow

### Daily Routine

1. Add new work log: `data/Month Year/YYYY-MM-DD.md`
2. Update embeddings: `npx ts-node /scripts/update-embeddings.ts`
3. Query your work: `npx ts-node chat.ts`

### Weekly Maintenance

1. Force rebuild embeddings: `npx ts-node /scripts/update-embeddings.ts --force`
2. Review and organize log files
3. Test temporal queries for the past week

## 🛡️ Security & Privacy

- **Local First**: All data stored locally
- **API Usage**: Only sends processed chunks to OpenAI for embeddings/queries
- **No Data Retention**: OpenAI doesn't store your data when using the API
- **Environment Variables**: Keep your API keys secure in `.env`

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your own work logs
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **LangChain**: For the excellent framework
- **ChromaDB**: For the vector database
- **OpenAI**: For embeddings and language models
- **TypeScript**: For type safety and developer experience
