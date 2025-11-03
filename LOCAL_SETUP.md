# 🏠 Running This MCP Server Locally

This guide helps you run the MCP server on your local machine to use tools like `research-reddit-pain-points` that require non-datacenter IP addresses.

## 📋 Prerequisites

- **Node.js 20+** installed ([Download here](https://nodejs.org/))
- **Git** installed ([Download here](https://git-scm.com/))
- A terminal/command prompt

## 🚀 Quick Start

### Step 1: Download the Project

**Option A: Clone from Replit**
```bash
git clone https://replit.com/@YOUR_USERNAME/YOUR_REPL_NAME.git
cd YOUR_REPL_NAME
```

**Option B: Download as ZIP**
1. Click the three-dot menu in Replit
2. Select "Download as ZIP"
3. Extract and navigate to the folder

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages (Express, xmcp, rss-parser, etc.)

### Step 3: Set Your API Key

The server requires a `SESSION_SECRET` for authentication.

**⚠️ Important:** 
- Choose your own secret key (e.g., `mySecretKey2024` or any random string)
- **Remember this value** - you'll need it again when connecting your MCP client!
- Use the **exact same value** everywhere (server, client config, curl commands)

**On Mac/Linux:**
```bash
export SESSION_SECRET="mySecretKey2024"
```

**On Windows (Command Prompt):**
```cmd
set SESSION_SECRET=mySecretKey2024
```

**On Windows (PowerShell):**
```powershell
$env:SESSION_SECRET="mySecretKey2024"
```

💡 **Tip:** Choose a strong, random string for production use

### Step 4: Start the Server

```bash
npm start
```

You should see:
```
✔ MCP Server running on http://0.0.0.0:3000/mcp
✔ Express server running on http://0.0.0.0:5000
✔ Homepage: http://0.0.0.0:5000/
✔ MCP endpoint: http://0.0.0.0:5000/mcp
```

### Step 5: Test the Server

**View the Homepage:**
Open your browser to: http://localhost:5000

**Test with curl:**
```bash
# Replace "mySecretKey2024" with YOUR SESSION_SECRET value!
curl -H "x-api-key: mySecretKey2024" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:5000/mcp \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/list"
     }'
```

You should see a list of all available tools!

**If you get a 401 error:** Make sure the `x-api-key` value matches your SESSION_SECRET exactly.

## 🧪 Testing the Reddit Pain Points Tool

Now that you're running locally, the Reddit tool will work:

```bash
# Replace "mySecretKey2024" with YOUR SESSION_SECRET value!
curl -H "x-api-key: mySecretKey2024" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:5000/mcp \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/call",
       "params": {
         "name": "research-reddit-pain-points",
         "arguments": {
           "subreddit": "SaaS",
           "timeRange": "week",
           "limit": 25,
           "sortBy": "top",
           "minScore": 10
         }
       }
     }'
```

This will return **real pain points** from r/SaaS with engagement scores and project ideas! 🎉

## 🔌 Connect Your MCP Client

Once the server is running locally, configure your MCP client:

**Claude Desktop (config.json):**
```json
{
  "mcpServers": {
    "my-local-mcp-server": {
      "url": "http://localhost:5000/mcp",
      "headers": {
        "x-api-key": "mySecretKey2024"
      }
    }
  }
}
```

**⚠️ CRITICAL:** Replace `"mySecretKey2024"` with your actual SESSION_SECRET value!

**Cline / Continue / Other Clients:**
- URL: `http://localhost:5000/mcp`
- Header: `x-api-key: mySecretKey2024` (replace with your SESSION_SECRET)

## 🛠️ Development Mode

For development with hot-reload:

```bash
npm run dev
```

This automatically rebuilds when you edit files in `src/`.

## 📝 Available Tools

When running locally, all tools work perfectly:

1. **greet** - Simple greeting example
2. **get-server-info** - Server capabilities and info
3. **get-ai-hackernews** - Latest AI articles from Hacker News (works everywhere)
4. **research-reddit-pain-points** - Reddit market research (works locally only)

## ❓ Troubleshooting

### Port Already in Use
If ports 3000 or 5000 are taken:

**Find and kill the process:**
```bash
# Mac/Linux
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Missing SESSION_SECRET
If you see authentication errors, make sure you:
1. Set `SESSION_SECRET` environment variable
2. Use the same value in both server and client config

### Reddit Still Not Working
1. Verify you're running on your local machine (not a VPS/cloud)
2. Check your internet connection
3. Try a different subreddit (some may be private)
4. Verify the subreddit name has no "r/" prefix

## 🔄 Updating the Code

After making changes to tools, prompts, or resources:

```bash
npm run build
npm start
```

The server will automatically discover new tools!

## 📦 Adding New Dependencies

```bash
npm install <package-name>
npm run build
```

## 🌐 Why Run Locally?

**Reddit IP Blocking:** Reddit blocks datacenter IPs (including Replit, AWS, etc.) to prevent automated scraping. Running on your home/office network avoids this.

**Full Control:** Test all features without restrictions, debug easily, and customize freely.

**Privacy:** Your API keys and data stay on your machine.

---

## 🎯 Next Steps

1. ✅ Run the server locally
2. ✅ Test the Reddit tool with your favorite subreddits
3. ✅ Connect your MCP client
4. ✅ Start finding pain points and validating startup ideas!

**Questions?** Check the main [README](./replit.md) or [xmcp documentation](https://xmcp.dev/docs).
