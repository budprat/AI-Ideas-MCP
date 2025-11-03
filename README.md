# MCP Server on Replit

A Model Context Protocol (MCP) server built with [xmcp](https://xmcp.dev), featuring tools for AI/developer workflows including Hacker News RSS feeds and Reddit pain point research.

## 🚀 Getting Started

### Running on Replit
1. **Set SESSION_SECRET** - Add `SESSION_SECRET` to your Replit Secrets (use any random string)
2. **Click Run** - Start the server
3. **View Homepage** - See all available tools, prompts, and resources
4. **Connect Your MCP Client** - Use the configuration shown on the homepage (use your SESSION_SECRET value)

**⚠️ Note:** The Reddit research tool won't work on Replit due to IP blocking.

### Running Locally (Recommended)
For full functionality including Reddit pain point research:

**📖 See [LOCAL_SETUP.md](./LOCAL_SETUP.md) for complete instructions**

Quick start:
```bash
git clone <your-replit-url>  # Replace with your actual Replit URL
cd <project-name>             # Replace with your folder name
npm install
export SESSION_SECRET="mySecretKey2024"  # Replace with your own secret key
npm start
```

**Important:** Use the same SESSION_SECRET value when connecting your MCP client!

## 🛠️ Available Tools

1. **get-ai-hackernews** - Fetches AI-related articles from Hacker News via RSS
2. **research-reddit-pain-points** - Analyzes Reddit discussions to find pain points and generate project ideas (local only)
3. **get-server-info** - Returns server capabilities and information
4. **greet** - Simple greeting example

## 🔌 Connecting Your MCP Client

```json
{
  "mcpServers": {
    "my-replit-mcp-server": {
      "url": "https://[my-url.replit.app]/mcp",
      "headers": {
        "x-api-key": "your-session-secret"
      }
    }
  }
}
```

That's it! Your MCP server is ready to use.

## 📝 What You Get

- ✅ Beautiful custom homepage with tool listings
- ✅ API key authentication (via `SESSION_SECRET`)
- ✅ AI Hacker News RSS feeds
- ✅ Reddit pain point research (when run locally)
- ✅ Auto-discovered tools, prompts, and resources
- ✅ MCP protocol endpoint at `/mcp`

## 🏗️ Development

```bash
npm run dev      # Development with hot-reload
npm run build    # Build for production
npm start        # Run production server
```

### Adding New Tools
1. Create a file in `src/tools/`
2. Run `npm run build`
3. Tool is auto-discovered and registered

## 📚 Documentation

- **Full Documentation**: [replit.md](./replit.md)
- **Local Setup Guide**: [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- [xmcp Documentation](https://xmcp.dev/docs)
- [MCP Specification](https://modelcontextprotocol.io/)

---

Built with ❤️ using [xmcp](https://xmcp.dev) on [Replit](https://replit.com)
