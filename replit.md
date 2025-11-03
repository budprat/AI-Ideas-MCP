# xmcp MCP Server

## Overview
The xmcp MCP Server is a Model Context Protocol (MCP) server built with the xmcp TypeScript framework. It provides a platform for AI agents to interact with a suite of tools, prompts, and resources. The project features a minimalist, responsive homepage for user interaction and API key authentication for secure access. Its purpose is to facilitate efficient and secure communication between AI agents and diverse functionalities, serving as a core component for AI-powered applications.

## User Preferences
- Clean, minimalist design aesthetic
- Secure API key authentication
- Beautiful UI at root URL for easy access
- MCP UI for interactive tool interfaces
- Static files for easy customization

## System Architecture
The system employs a dual-server architecture: an Express.js server (Port 5000) for public-facing interactions and an internal xmcp server (Port 3000) for handling MCP protocol requests.

**UI/UX Decisions:**
- **Homepage:** A static `public/index.html` with a clean, minimalist design and external `public/styles.css`. It features dynamic URL generation, copy-to-clipboard functionality, responsive design, comprehensive listings of tools, prompts, and resources with descriptions, and direct links to xmcp documentation.
- **Branding:** Visual branding is enhanced with Replit logo integration and updated documentation links.

**Technical Implementations:**
- **API Key Authentication:** All requests to the `/mcp` endpoint require an `x-api-key` header, secured by the `SESSION_SECRET` environment variable.
- **Dynamic API Endpoints:** `/api/tools`, `/api/prompts`, and `/api/resources` dynamically query the xmcp server using MCP JSON-RPC methods (`tools/list`, `prompts/list`, `resources/list`).
- **Tooling:**
    - `greet`: A simple example tool.
    - `get-server-info`: Provides comprehensive server information.
    - `get-ai-hackernews`: Fetches AI-related articles from Hacker News via RSS.
    - `research-reddit-pain-points`: Analyzes Reddit discussions for pain points.
    - `research-reddit-pain-points-enhanced`: An advanced version with sentiment scoring, category detection, competitor tracking, urgency detection, price sensitivity analysis, and AI-powered project ideas. All tools include inline documentation.
- **Prompts:** Includes an enhanced `review-code` prompt.
- **Resources:** Example resources like `app-config` and `user-profile`.

**System Design Choices:**
- **Express Server (Port 5000):** Serves the custom homepage and acts as a proxy, routing `/mcp` requests to the internal xmcp server. It also exposes API endpoints for dynamic content loading.
- **xmcp Server (Port 3000):** Runs internally, handles MCP protocol requests, enforces API key authentication, and automatically discovers tools, prompts, and resources.
- **Clean Architecture:** Simplified project structure focusing on a clean boilerplate.
- **Static HTML/CSS/JS:** The homepage is pure static content, making it easy to customize and maintain without server-side rendering.

## External Dependencies
- **Framework**: xmcp (TypeScript MCP framework)
- **Web Server**: Express.js
- **Runtime**: Node.js (20+)
- **Protocol**: Model Context Protocol (MCP)
- **UI**: MCP UI (for interface resources)
- **Validation**: Zod (for schema validation)
- **Proxy**: `http-proxy-middleware` (for routing)
- **RSS Parsing**: `rss-parser` (used by `get-ai-hackernews`)
- **AI/ML**: OpenAI (lazy-loaded for enhanced pain points analysis)