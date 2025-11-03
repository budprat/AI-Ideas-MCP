/**
 * Tool: Research Reddit Pain Points
 * 
 * Analyzes Reddit discussions in specific subreddits to identify pain points,
 * complaints, and problems that could inspire project ideas.
 * 
 * Uses Reddit's public RSS feeds (no authentication required) to:
 * - Fetch recent posts from target subreddits
 * - Detect pain point keywords and patterns
 * - Rank by engagement (upvotes + comments)
 * - Generate project idea suggestions
 * 
 * Perfect for market research, niche validation, and startup ideation.
 * 
 * NOTE: Reddit may block requests from cloud/datacenter IPs (including Replit).
 * If you encounter access issues, try:
 * - Running this MCP server locally on your own machine
 * - Using a different network/IP
 * - Using the official Reddit API with OAuth credentials
 * 
 * Learn more: https://xmcp.dev/docs/core-concepts/tools
 */

import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import Parser from "rss-parser";

interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  author: string;
  created_utc: number;
  permalink: string;
  url: string;
}

interface PainPoint {
  problem: string;
  mentions: number;
  engagementScore: number;
  posts: Array<{
    title: string;
    link: string;
    score: number;
    comments: number;
  }>;
  projectIdea: string;
}

export const schema = {
  subreddit: z.string()
    .min(1)
    .describe("Subreddit name to analyze (without r/ prefix, e.g., 'SaaS', 'entrepreneur')"),
  
  timeRange: z.enum(["hour", "day", "week", "month", "year", "all"])
    .default("month")
    .describe("Time range for posts (default: month)"),
  
  limit: z.number()
    .min(10)
    .max(100)
    .default(50)
    .describe("Number of posts to analyze (10-100, default: 50)"),
  
  sortBy: z.enum(["hot", "new", "top", "controversial"])
    .default("top")
    .describe("How to sort posts (default: top)"),
  
  minScore: z.number()
    .min(0)
    .default(5)
    .optional()
    .describe("Minimum upvotes to consider a post (default: 5)"),
};

export const metadata: ToolMetadata = {
  name: "research-reddit-pain-points",
  description: "Analyze Reddit discussions in a specific subreddit to identify pain points, problems, and complaints that could inspire project ideas. Returns ranked pain points with engagement metrics and project suggestions.",
  annotations: {
    title: "Research Reddit Pain Points",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
  },
};

const PAIN_POINT_KEYWORDS = [
  "frustrated", "annoying", "annoyed", "problem", "issue", "issues", "bug", "bugs",
  "wish", "need", "needed", "want", "wanted", "struggling", "struggle", "difficult",
  "hard", "hate", "hated", "sucks", "terrible", "awful", "pain", "painful",
  "broken", "doesn't work", "not working", "failed", "failing", "slow", "confusing",
  "complicated", "missing", "lack", "no way to", "impossible", "can't", "cannot",
  "why is", "why does", "how do i", "help with", "anyone else", "does anyone",
];

const generateProjectIdea = (problem: string): string => {
  const lowerProblem = problem.toLowerCase();
  
  if (lowerProblem.includes("onboard")) {
    return "Build an interactive, self-service onboarding wizard or tutorial platform";
  } else if (lowerProblem.includes("payment") || lowerProblem.includes("billing")) {
    return "Create an automated payment recovery and dunning management system";
  } else if (lowerProblem.includes("feature") || lowerProblem.includes("request")) {
    return "Develop a feature voting and roadmap management tool";
  } else if (lowerProblem.includes("customer") || lowerProblem.includes("support")) {
    return "Build an AI-powered customer support automation platform";
  } else if (lowerProblem.includes("analytic") || lowerProblem.includes("data") || lowerProblem.includes("metric")) {
    return "Create a simple, visual analytics dashboard for non-technical users";
  } else if (lowerProblem.includes("integration") || lowerProblem.includes("connect")) {
    return "Build a no-code integration platform for connecting multiple tools";
  } else if (lowerProblem.includes("automat")) {
    return "Develop a workflow automation tool to eliminate manual tasks";
  } else if (lowerProblem.includes("notif")) {
    return "Create a smart notification management and filtering system";
  } else if (lowerProblem.includes("search") || lowerProblem.includes("find")) {
    return "Build an AI-powered search tool with natural language queries";
  } else if (lowerProblem.includes("document") || lowerProblem.includes("doc")) {
    return "Develop an automated documentation generator from code/conversations";
  } else if (lowerProblem.includes("price") || lowerProblem.includes("pricing") || lowerProblem.includes("cost")) {
    return "Create a dynamic pricing optimization tool";
  } else if (lowerProblem.includes("time") || lowerProblem.includes("schedule")) {
    return "Build an intelligent scheduling and time management assistant";
  } else {
    return `Develop a solution that addresses: ${problem.length > 100 ? problem.substring(0, 100) + '...' : problem}`;
  }
};

const detectPainPoints = (posts: RedditPost[], minScore: number): Map<string, PainPoint> => {
  const painPointsMap = new Map<string, PainPoint>();
  
  for (const post of posts) {
    if (post.score < minScore) continue;
    
    const fullText = `${post.title} ${post.selftext}`.toLowerCase();
    let foundKeyword = false;
    
    for (const keyword of PAIN_POINT_KEYWORDS) {
      if (fullText.includes(keyword)) {
        foundKeyword = true;
        break;
      }
    }
    
    if (!foundKeyword && !post.title.toLowerCase().includes("?")) {
      continue;
    }
    
    const key = post.title.substring(0, 100);
    const engagementScore = post.score + (post.num_comments * 2);
    
    if (painPointsMap.has(key)) {
      const existing = painPointsMap.get(key)!;
      existing.mentions += 1;
      existing.engagementScore += engagementScore;
      existing.posts.push({
        title: post.title,
        link: `https://reddit.com${post.permalink}`,
        score: post.score,
        comments: post.num_comments,
      });
    } else {
      painPointsMap.set(key, {
        problem: post.title,
        mentions: 1,
        engagementScore,
        posts: [{
          title: post.title,
          link: `https://reddit.com${post.permalink}`,
          score: post.score,
          comments: post.num_comments,
        }],
        projectIdea: generateProjectIdea(post.title),
      });
    }
  }
  
  return painPointsMap;
};

export default async function researchRedditPainPoints({
  subreddit,
  timeRange = "month",
  limit = 50,
  sortBy = "top",
  minScore = 5,
}: InferSchema<typeof schema>) {
  const parser = new Parser({
    customFields: {
      item: ['content:encoded', 'category'],
    },
  });
  
  const rssUrl = `https://www.reddit.com/r/${subreddit}/${sortBy}/.rss?limit=${Math.min(limit, 100)}&t=${timeRange}`;
  
  try {
    const feed = await parser.parseURL(rssUrl);
    
    if (!feed.items || feed.items.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No posts found in r/${subreddit}.\n\n` +
            `Possible reasons:\n` +
            `• Subreddit doesn't exist or is private\n` +
            `• Reddit is blocking requests from this server's IP (common for cloud/datacenter IPs)\n` +
            `• No recent posts match the time filter\n\n` +
            `💡 TIP: If running on Replit/cloud hosting, try deploying this MCP server locally on your own machine for better Reddit access.`,
        }],
        structuredContent: {
          success: false,
          error: "No posts retrieved",
          suggestion: "Reddit may be blocking cloud IP addresses. Try running locally or using OAuth API.",
          metadata: {
            subreddit,
            postsAnalyzed: 0,
          },
        },
      };
    }
    
    const posts: RedditPost[] = feed.items.map((item: any) => {
      const contentHtml = item["content:encoded"] || item.content || "";
      const contentText = item.contentSnippet || "";
      const fullContent = contentHtml + " " + contentText;
      
      const commentMatch = fullContent.match(/(\d+)\s+comments?/i);
      const scoreMatch = fullContent.match(/(\d+)\s+points?/i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 1;
      const numComments = commentMatch ? parseInt(commentMatch[1], 10) : 0;
      
      return {
        title: item.title || "Untitled",
        selftext: contentText.substring(0, 500),
        score: score,
        num_comments: numComments,
        author: item.creator || "Unknown",
        created_utc: item.isoDate ? new Date(item.isoDate).getTime() / 1000 : 0,
        permalink: item.link ? item.link.replace('https://www.reddit.com', '') : '',
        url: item.link || '',
      };
    }).filter(post => post.score >= minScore && post.title.length > 10);
    
    const painPointsMap = detectPainPoints(posts, minScore);
    const painPoints = Array.from(painPointsMap.values())
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10);
    
    if (painPoints.length === 0) {
      return {
        content: [{
          type: "text",
          text: `Analyzed ${posts.length} posts from r/${subreddit} but found no clear pain points. Try adjusting filters or choosing a different subreddit where users discuss problems more openly.`,
        }],
        structuredContent: {
          success: true,
          painPoints: [],
          metadata: {
            subreddit,
            postsAnalyzed: posts.length,
            timeRange,
            sortBy,
          },
        },
      };
    }
    
    const formattedText = `=== Reddit Pain Point Analysis: r/${subreddit} ===\n\n` +
      `Analyzed ${posts.length} ${sortBy} posts from past ${timeRange}\n` +
      `Found ${painPoints.length} potential pain points\n\n` +
      `🔥 TOP PAIN POINTS:\n\n` +
      painPoints.map((pp, index) => 
        `${index + 1}. ${pp.problem}\n` +
        `   📊 Engagement Score: ${pp.engagementScore} (${pp.posts[0].score} upvotes, ${pp.posts[0].comments} comments)\n` +
        `   🔗 Thread: ${pp.posts[0].link}\n` +
        `   💡 Project Idea: ${pp.projectIdea}\n`
      ).join('\n') +
      `\n📊 ANALYSIS SUMMARY:\n` +
      `- Total posts analyzed: ${posts.length}\n` +
      `- Pain points identified: ${painPoints.length}\n` +
      `- Average engagement: ${Math.round(painPoints.reduce((sum, pp) => sum + pp.engagementScore, 0) / painPoints.length)}\n` +
      `- Time range: ${timeRange}\n` +
      `- Sort method: ${sortBy}`;
    
    return {
      content: [{
        type: "text",
        text: formattedText,
      }],
      structuredContent: {
        success: true,
        painPoints: painPoints.map(pp => ({
          problem: pp.problem,
          engagementScore: pp.engagementScore,
          topPost: pp.posts[0],
          projectIdea: pp.projectIdea,
        })),
        metadata: {
          subreddit,
          postsAnalyzed: posts.length,
          painPointsFound: painPoints.length,
          timeRange,
          sortBy,
          averageEngagement: Math.round(painPoints.reduce((sum, pp) => sum + pp.engagementScore, 0) / painPoints.length),
        },
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    const isForbidden = errorMessage.includes("403") || errorMessage.includes("Forbidden") || errorMessage.includes("blocked");
    
    if (isForbidden) {
      return {
        content: [{
          type: "text",
          text: `⚠️  Reddit is blocking requests from this server's IP address.\n\n` +
            `This is expected when running on cloud platforms like Replit. Reddit blocks datacenter/cloud IPs to prevent automated scraping.\n\n` +
            `💡 SOLUTIONS:\n` +
            `1. Run this MCP server locally on your own machine (not Replit)\n` +
            `2. Use the official Reddit API with OAuth credentials\n` +
            `3. Deploy to a residential IP or use a proxy service\n\n` +
            `The tool implementation is working correctly - it's just Reddit's IP blocking policy preventing access from this hosting environment.`,
        }],
        structuredContent: {
          success: false,
          error: "Reddit IP block",
          suggestion: "Run MCP server locally for Reddit access",
          metadata: {
            subreddit,
            errorType: "cloud_ip_blocked",
          },
        },
      };
    }
    
    return {
      content: [{
        type: "text",
        text: `Failed to fetch Reddit data: ${errorMessage}\n\n` +
          `Please check:\n` +
          `• Subreddit name is correct (no r/ prefix needed)\n` +
          `• Subreddit exists and is public\n` +
          `• Internet connection is working\n\n` +
          `If the error persists, Reddit may be blocking this server's IP.`,
      }],
      structuredContent: {
        success: false,
        error: errorMessage,
      },
    };
  }
}
