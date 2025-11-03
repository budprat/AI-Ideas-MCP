/**
 * Tool: Get AI-Related Hacker News Articles
 * 
 * Fetches the latest AI-related articles from Hacker News via RSS feed.
 * Uses hnrss.org service to filter for AI, machine learning, GPT, and LLM topics.
 * 
 * This tool demonstrates:
 * - External API integration via RSS
 * - Asynchronous data fetching
 * - Optional parameters with default values
 * 
 * Learn more: https://xmcp.dev/docs/core-concepts/tools
 */

import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import Parser from "rss-parser";

export const schema = {
  limit: z.number()
    .min(1)
    .max(50)
    .default(10)
    .describe("Maximum number of articles to return (1-50, default: 10)"),
  minPoints: z.number()
    .min(0)
    .default(0)
    .optional()
    .describe("Minimum points/upvotes required (optional filter)"),
};

export const metadata: ToolMetadata = {
  name: "get-ai-hackernews",
  description: "Fetch the latest AI-related articles from Hacker News, including topics like artificial intelligence, machine learning, GPT, and LLMs",
  annotations: {
    title: "Get AI Hacker News Articles",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export default async function getAiHackernews({ 
  limit = 10, 
  minPoints = 0 
}: InferSchema<typeof schema>) {
  const parser = new Parser();
  
  const query = "AI+OR+artificial+intelligence+OR+machine+learning+OR+GPT+OR+LLM+OR+neural+network";
  let url = `https://hnrss.org/newest?q=${query}&count=${limit}`;
  
  if (minPoints > 0) {
    url += `&points=${minPoints}`;
  }

  try {
    const feed = await parser.parseURL(url);
    
    if (!feed.items || feed.items.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No AI-related articles found matching the criteria",
        }],
        structuredContent: {
          success: true,
          articles: [],
          metadata: {
            feedTitle: feed.title,
            totalResults: 0,
            filters: {
              limit,
              minPoints: minPoints > 0 ? minPoints : "none",
            },
          },
        },
      };
    }

    const articles = feed.items.slice(0, limit).map((item) => ({
      title: item.title || "Untitled",
      link: item.link || "",
      commentsUrl: item.comments || "",
      pubDate: item.pubDate || item.isoDate || "",
      author: item.creator || "Unknown",
      points: item.contentSnippet?.match(/Points: (\d+)/)?.[1] || "N/A",
      comments: item.contentSnippet?.match(/Comments: (\d+)/)?.[1] || "N/A",
    }));

    const formattedText = articles.map((article, index) => 
      `${index + 1}. ${article.title}\n` +
      `   Author: ${article.author} | Points: ${article.points} | Comments: ${article.comments}\n` +
      `   Article: ${article.link}\n` +
      `   Discuss: ${article.commentsUrl}\n` +
      `   Published: ${article.pubDate}\n`
    ).join('\n');

    return {
      content: [{
        type: "text",
        text: `Found ${articles.length} AI-related Hacker News article${articles.length !== 1 ? 's' : ''}:\n\n${formattedText}`,
      }],
      structuredContent: {
        success: true,
        articles,
        metadata: {
          feedTitle: feed.title,
          totalResults: articles.length,
          filters: {
            limit,
            minPoints: minPoints > 0 ? minPoints : "none",
          },
          source: "hnrss.org",
        },
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{
        type: "text",
        text: `Failed to fetch Hacker News RSS feed: ${errorMessage}`,
      }],
      structuredContent: {
        success: false,
        error: errorMessage,
        articles: [],
      },
    };
  }
}
