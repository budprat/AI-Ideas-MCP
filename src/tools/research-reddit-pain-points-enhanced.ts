/**
 * Tool: Research Reddit Pain Points (Enhanced Edition)
 * 
 * Advanced market research tool that analyzes Reddit discussions with:
 * - Industry-specific keywords (AI, DevOps, Content Creation, SaaS)
 * - Sentiment scoring for problem severity
 * - Category detection (UX, Pricing, Performance, Features, etc.)
 * - Competitor tracking and switching opportunities
 * - Urgency detection for hot problems
 * - Price sensitivity analysis
 * - AI-powered project idea generation
 * - Skill-matched templates (Python, DevOps, Next.js, etc.)
 * 
 * Perfect for validating AI/tech product ideas, finding competitors' weaknesses,
 * and spotting market trends.
 * 
 * NOTE: Reddit may block requests from cloud/datacenter IPs (including Replit).
 * For best results, run this MCP server locally on your own machine.
 * 
 * Learn more: https://xmcp.dev/docs/core-concepts/tools
 */

import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import Parser from "rss-parser";
import OpenAI from "openai";

// Initialize OpenAI client with Replit AI Integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

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

interface EnhancedPainPoint {
  problem: string;
  category: string;
  sentimentScore: number;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  priceSignals: string[];
  competitorMentions: string[];
  mentions: number;
  engagementScore: number;
  posts: Array<{
    title: string;
    link: string;
    score: number;
    comments: number;
  }>;
  projectIdea: string;
  aiGeneratedIdea?: string;
  skillMatch: string[];
}

export const schema = {
  subreddit: z.string()
    .min(1)
    .describe("Subreddit name to analyze (without r/ prefix, e.g., 'SaaS', 'entrepreneur', 'devops', 'ChatGPT')"),
  
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
  
  useAI: z.boolean()
    .default(false)
    .optional()
    .describe("Use AI to generate custom project ideas (costs credits, default: false)"),
};

export const metadata: ToolMetadata = {
  name: "research-reddit-pain-points-enhanced",
  description: "Advanced Reddit pain point analyzer with sentiment scoring, category detection, competitor tracking, urgency detection, price sensitivity analysis, and AI-powered project ideas. Perfect for validating AI/tech product ideas.",
  annotations: {
    title: "Research Reddit Pain Points (Enhanced)",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// ===== ENHANCED KEYWORD SETS =====

// General pain point keywords
const GENERAL_PAIN_KEYWORDS = [
  "frustrated", "annoying", "annoyed", "problem", "issue", "issues", "bug", "bugs",
  "wish", "need", "needed", "want", "wanted", "struggling", "struggle", "difficult",
  "hard", "hate", "hated", "sucks", "terrible", "awful", "pain", "painful",
  "broken", "doesn't work", "not working", "failed", "failing", "slow", "confusing",
  "complicated", "missing", "lack", "no way to", "impossible", "can't", "cannot",
  "why is", "why does", "how do i", "help with", "anyone else", "does anyone",
];

// AI & Content Creation specific keywords
const AI_CONTENT_KEYWORDS = [
  "hallucination", "hallucinating", "prompt", "prompting", "context window", "token limit",
  "rate limit", "api cost", "expensive api", "slow generation", "quality issues",
  "inconsistent output", "can't control", "copyright", "watermark", "content rights",
  "seo issues", "plagiarism", "fact checking", "accuracy", "bias", "biased output",
  "training data", "fine-tuning", "model selection", "embedding", "vector database",
];

// AI Products specific keywords
const AI_PRODUCTS_KEYWORDS = [
  "ml ops", "mlops", "model deployment", "model serving", "inference cost",
  "latency", "cold start", "gpu costs", "scaling ai", "ai monitoring",
  "model drift", "data labeling", "annotation", "synthetic data", "llm fine-tuning",
  "prompt engineering", "rag", "retrieval", "vector search", "ai observability",
];

// DevOps & Infrastructure keywords  
const DEVOPS_KEYWORDS = [
  "ci/cd", "pipeline", "deployment", "kubernetes", "docker", "container",
  "orchestration", "monitoring", "logging", "alerting", "downtime", "outage",
  "scaling", "load balancer", "infrastructure", "terraform", "ansible",
  "secrets management", "environment variables", "config management",
];

// Developer Tools keywords
const DEVTOOLS_KEYWORDS = [
  "debugging", "testing", "code review", "linting", "formatting", "refactoring",
  "documentation", "api docs", "sdk", "cli", "ide", "extension", "plugin",
  "build time", "compile time", "hot reload", "dev server", "local development",
];

// SaaS Business keywords
const SAAS_KEYWORDS = [
  "onboarding", "churn", "retention", "activation", "trial", "conversion",
  "payment", "billing", "subscription", "invoicing", "pricing", "tier",
  "analytics", "metrics", "reporting", "dashboard", "integration", "api",
];

// High urgency indicators
const URGENCY_PATTERNS = [
  /urgent/i, /asap/i, /immediately/i, /right now/i, /critical/i, /emergency/i,
  /losing money/i, /costing us/i, /can't wait/i, /need this yesterday/i,
  /blocking us/i, /showstopper/i, /production down/i, /clients leaving/i,
];

// Competitor switching signals
const COMPETITOR_PATTERNS = [
  /switching from (\w+)/i, /migrating from (\w+)/i, /leaving (\w+)/i,
  /ditching (\w+)/i, /(\w+) is terrible/i, /better than (\w+)/i,
  /alternative to (\w+)/i, /replace (\w+)/i, /(\w+) doesn't work/i,
];

// Price sensitivity patterns
const PRICE_PATTERNS = [
  /too expensive/i, /overpriced/i, /\$\d+.*expensive/i, /cheaper alternative/i,
  /free tier/i, /pricing sucks/i, /can't afford/i, /budget/i, /cost too much/i,
  /willing to pay/i, /would pay.*for/i, /worth.*\$/i,
];

// Sentiment scoring keywords (higher score = more pain)
const HIGH_SENTIMENT_KEYWORDS = {
  "hate": 5, "hated": 5, "awful": 5, "terrible": 5, "unusable": 5,
  "frustrated": 4, "annoying": 4, "painful": 4, "broken": 4,
  "difficult": 3, "confusing": 3, "slow": 3, "missing": 3,
  "need": 2, "want": 2, "wish": 2, "problem": 2,
};

// ===== CATEGORY DETECTION =====
function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  
  if (/ux|ui|interface|design|usability|user experience/i.test(lower)) return "UX/UI";
  if (/price|pricing|cost|expensive|billing|payment/i.test(lower)) return "Pricing";
  if (/slow|latency|performance|speed|lag|timeout/i.test(lower)) return "Performance";
  if (/feature|functionality|capability|support|missing/i.test(lower)) return "Features";
  if (/integration|api|connect|sync|import|export/i.test(lower)) return "Integrations";
  if (/onboard|setup|install|configure|getting started/i.test(lower)) return "Onboarding";
  if (/support|help|documentation|docs|tutorial/i.test(lower)) return "Support";
  if (/bug|error|crash|broken|not working/i.test(lower)) return "Bugs/Reliability";
  if (/security|privacy|data|compliance|gdpr/i.test(lower)) return "Security/Privacy";
  if (/scale|scaling|growth|enterprise|team/i.test(lower)) return "Scalability";
  
  return "General";
}

// ===== SENTIMENT SCORING =====
function calculateSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  
  for (const [keyword, value] of Object.entries(HIGH_SENTIMENT_KEYWORDS)) {
    if (lower.includes(keyword)) {
      score += value;
    }
  }
  
  // Bonus for exclamation marks (indicates emotion)
  score += (text.match(/!/g) || []).length * 0.5;
  
  // Bonus for ALL CAPS words (indicates frustration)
  const capsWords = text.match(/\b[A-Z]{3,}\b/g) || [];
  score += capsWords.length * 1;
  
  return Math.min(score, 10); // Cap at 10
}

// ===== URGENCY DETECTION =====
function detectUrgency(text: string): "low" | "medium" | "high" | "critical" {
  const lower = text.toLowerCase();
  
  for (const pattern of URGENCY_PATTERNS) {
    if (pattern.test(lower)) {
      if (/critical|emergency|production down|clients leaving/i.test(lower)) {
        return "critical";
      }
      return "high";
    }
  }
  
  if (/soon|quickly|fast/i.test(lower)) return "medium";
  
  return "low";
}

// ===== COMPETITOR TRACKING =====
function extractCompetitors(text: string): string[] {
  const competitors: string[] = [];
  
  for (const pattern of COMPETITOR_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
    for (const match of matches) {
      if (match[1]) {
        const competitor = match[1].trim();
        if (competitor.length > 2 && competitor.length < 30) {
          competitors.push(competitor);
        }
      }
    }
  }
  
  return [...new Set(competitors)]; // Remove duplicates
}

// ===== PRICE SENSITIVITY ANALYSIS =====
function extractPriceSignals(text: string): string[] {
  const signals: string[] = [];
  
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      signals.push(match[0]);
    }
  }
  
  return signals;
}

// ===== SKILL MATCHING =====
function matchSkills(problem: string): string[] {
  const lower = problem.toLowerCase();
  const skills: string[] = [];
  
  // AI/ML Skills
  if (/ai|llm|gpt|ml|machine learning|neural/i.test(lower)) skills.push("AI/ML");
  if (/python|pytorch|tensorflow|scikit/i.test(lower)) skills.push("Python");
  
  // Web Development
  if (/web|frontend|react|vue|angular|next\.?js/i.test(lower)) skills.push("Next.js/React");
  if (/api|backend|server|node/i.test(lower)) skills.push("Backend/API");
  
  // DevOps
  if (/docker|kubernetes|ci\/cd|deploy|devops|infrastructure/i.test(lower)) skills.push("DevOps");
  if (/aws|azure|gcp|cloud/i.test(lower)) skills.push("Cloud");
  
  // Data
  if (/database|sql|postgres|mongo/i.test(lower)) skills.push("Database");
  if (/analytics|data|metrics/i.test(lower)) skills.push("Data/Analytics");
  
  if (skills.length === 0) skills.push("General");
  
  return skills;
}

// ===== ENHANCED PROJECT IDEA GENERATION =====
function generateProjectIdea(problem: string, category: string, skills: string[]): string {
  const lower = problem.toLowerCase();
  
  // AI Content Creation Ideas
  if (skills.includes("AI/ML") && /content|writing|blog|article/i.test(lower)) {
    return "Build an AI content generation platform with brand voice consistency, fact-checking, and SEO optimization (Python + GPT API + Next.js)";
  }
  
  if (skills.includes("AI/ML") && /prompt|prompting/i.test(lower)) {
    return "Create a prompt engineering IDE with A/B testing, version control, and performance analytics (Next.js + Python + Vector DB)";
  }
  
  // AI Products Ideas
  if (skills.includes("AI/ML") && /deploy|serving|inference/i.test(lower)) {
    return "Develop a serverless AI model deployment platform with auto-scaling and cost optimization (Python + Kubernetes + FastAPI)";
  }
  
  if (skills.includes("AI/ML") && /monitor|observability/i.test(lower)) {
    return "Build an AI observability platform tracking model drift, latency, and cost metrics (Python + Time-series DB + Next.js)";
  }
  
  // DevOps Ideas
  if (skills.includes("DevOps") && /ci\/cd|pipeline/i.test(lower)) {
    return "Create a visual CI/CD pipeline builder with cost tracking and deployment previews (Next.js + Docker + GitHub Actions)";
  }
  
  if (skills.includes("DevOps") && /secrets|config/i.test(lower)) {
    return "Build a developer-friendly secrets management tool with auto-rotation and audit logs (Python + Vault + CLI)";
  }
  
  // Next.js/Web Ideas
  if (skills.includes("Next.js/React") && /dashboard|analytics/i.test(lower)) {
    return "Develop a no-code analytics dashboard builder with real-time updates and AI insights (Next.js + WebSockets + OpenAI)";
  }
  
  // Category-specific fallbacks
  if (category === "Pricing") {
    return "Create a dynamic pricing optimization tool with competitor tracking and willingness-to-pay analysis (Python + Next.js + ML)";
  }
  
  if (category === "Onboarding") {
    return "Build an interactive onboarding builder with user analytics and personalized flows (Next.js + Python + Analytics)";
  }
  
  if (category === "Integrations") {
    return "Develop a no-code integration platform with pre-built connectors and workflow automation (Next.js + Python + Message Queue)";
  }
  
  // Generic but tech-stack specific
  return `Solve "${problem.substring(0, 60)}..." using ${skills.join(" + ")} stack`;
}

// ===== AI-POWERED IDEA GENERATION =====
async function generateAIProjectIdea(problem: string, category: string, competitors: string[]): Promise<string> {
  try {
    const prompt = `You are a startup advisor. Analyze this pain point and suggest a specific, actionable product idea.

Pain Point: "${problem}"
Category: ${category}
${competitors.length > 0 ? `Competitors mentioned: ${competitors.join(", ")}` : ""}

Suggest ONE specific product idea that:
1. Solves this exact problem
2. Can be built with Python, Next.js, or AI/ML tech
3. Has clear monetization potential
4. Is different from existing competitors

Format: One sentence, max 30 words, actionable and specific.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || "AI generation failed";
  } catch (error) {
    console.error("AI idea generation error:", error);
    return "AI generation unavailable";
  }
}

// ===== ENHANCED PAIN POINT DETECTION =====
function detectPainPoints(posts: RedditPost[], minScore: number): Map<string, EnhancedPainPoint> {
  const painPointsMap = new Map<string, EnhancedPainPoint>();
  
  // Combine all keyword sets
  const allKeywords = [
    ...GENERAL_PAIN_KEYWORDS,
    ...AI_CONTENT_KEYWORDS,
    ...AI_PRODUCTS_KEYWORDS,
    ...DEVOPS_KEYWORDS,
    ...DEVTOOLS_KEYWORDS,
    ...SAAS_KEYWORDS,
  ];
  
  for (const post of posts) {
    if (post.score < minScore) continue;
    
    const fullText = `${post.title} ${post.selftext}`;
    const lowerText = fullText.toLowerCase();
    
    // Check if post contains pain point keywords
    let foundKeyword = false;
    for (const keyword of allKeywords) {
      if (lowerText.includes(keyword)) {
        foundKeyword = true;
        break;
      }
    }
    
    // Also include questions (often indicate problems)
    if (!foundKeyword && !post.title.includes("?")) {
      continue;
    }
    
    const key = post.title.substring(0, 100);
    const engagementScore = post.score + (post.num_comments * 2);
    
    // Analyze the pain point
    const category = detectCategory(fullText);
    const sentimentScore = calculateSentiment(fullText);
    const urgencyLevel = detectUrgency(fullText);
    const competitorMentions = extractCompetitors(fullText);
    const priceSignals = extractPriceSignals(fullText);
    const skillMatch = matchSkills(fullText);
    const projectIdea = generateProjectIdea(post.title, category, skillMatch);
    
    if (painPointsMap.has(key)) {
      const existing = painPointsMap.get(key)!;
      existing.mentions += 1;
      existing.engagementScore += engagementScore;
      existing.sentimentScore = Math.max(existing.sentimentScore, sentimentScore);
      existing.posts.push({
        title: post.title,
        link: `https://reddit.com${post.permalink}`,
        score: post.score,
        comments: post.num_comments,
      });
    } else {
      painPointsMap.set(key, {
        problem: post.title,
        category,
        sentimentScore,
        urgencyLevel,
        priceSignals,
        competitorMentions,
        mentions: 1,
        engagementScore,
        posts: [{
          title: post.title,
          link: `https://reddit.com${post.permalink}`,
          score: post.score,
          comments: post.num_comments,
        }],
        projectIdea,
        skillMatch,
      });
    }
  }
  
  return painPointsMap;
}

export default async function researchRedditPainPointsEnhanced({
  subreddit,
  timeRange = "month",
  limit = 50,
  sortBy = "top",
  minScore = 5,
  useAI = false,
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
          text: `No posts found in r/${subreddit}. Reddit may be blocking cloud IPs. Try running locally.`,
        }],
        structuredContent: {
          success: false,
          error: "No posts retrieved",
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
    let painPoints = Array.from(painPointsMap.values())
      .sort((a, b) => {
        // Sort by: urgency > sentiment > engagement
        const urgencyWeight = { critical: 1000, high: 100, medium: 10, low: 1 };
        const aScore = urgencyWeight[a.urgencyLevel] * 10 + a.sentimentScore * 5 + a.engagementScore;
        const bScore = urgencyWeight[b.urgencyLevel] * 10 + b.sentimentScore * 5 + b.engagementScore;
        return bScore - aScore;
      })
      .slice(0, 15);
    
    // Generate AI ideas if requested
    if (useAI && painPoints.length > 0) {
      const topPainPoints = painPoints.slice(0, 5); // Only generate for top 5
      for (const pp of topPainPoints) {
        pp.aiGeneratedIdea = await generateAIProjectIdea(pp.problem, pp.category, pp.competitorMentions);
      }
    }
    
    if (painPoints.length === 0) {
      return {
        content: [{
          type: "text",
          text: `Analyzed ${posts.length} posts from r/${subreddit} but found no clear pain points.`,
        }],
        structuredContent: {
          success: true,
          painPoints: [],
        },
      };
    }
    
    // Group by category
    const byCategory = painPoints.reduce((acc, pp) => {
      if (!acc[pp.category]) acc[pp.category] = [];
      acc[pp.category].push(pp);
      return acc;
    }, {} as Record<string, EnhancedPainPoint[]>);
    
    // Find all unique competitors
    const allCompetitors = [...new Set(painPoints.flatMap(pp => pp.competitorMentions))];
    
    // Count price-sensitive posts
    const priceSensitive = painPoints.filter(pp => pp.priceSignals.length > 0).length;
    
    const formattedText = `=== 🔬 Enhanced Reddit Pain Point Analysis: r/${subreddit} ===\n\n` +
      `📊 OVERVIEW:\n` +
      `• Analyzed ${posts.length} ${sortBy} posts from past ${timeRange}\n` +
      `• Found ${painPoints.length} pain points across ${Object.keys(byCategory).length} categories\n` +
      `• ${allCompetitors.length} competitor${allCompetitors.length !== 1 ? 's' : ''} mentioned\n` +
      `• ${priceSensitive} posts showing price sensitivity\n\n` +
      `🔥 TOP PAIN POINTS (by urgency + sentiment + engagement):\n\n` +
      painPoints.slice(0, 10).map((pp, index) => 
        `${index + 1}. ${pp.problem}\n` +
        `   📁 Category: ${pp.category}\n` +
        `   😤 Sentiment: ${pp.sentimentScore.toFixed(1)}/10 | ⚡ Urgency: ${pp.urgencyLevel.toUpperCase()}\n` +
        `   📊 Engagement: ${pp.engagementScore} (${pp.posts[0].score} ↑, ${pp.posts[0].comments} 💬)\n` +
        `   🔗 ${pp.posts[0].link}\n` +
        (pp.competitorMentions.length > 0 ? `   🏢 Competitors: ${pp.competitorMentions.join(", ")}\n` : '') +
        (pp.priceSignals.length > 0 ? `   💰 Price Signal: "${pp.priceSignals[0]}"\n` : '') +
        `   🛠️ Skill Match: ${pp.skillMatch.join(", ")}\n` +
        `   💡 Project Idea: ${pp.projectIdea}\n` +
        (pp.aiGeneratedIdea ? `   🤖 AI Idea: ${pp.aiGeneratedIdea}\n` : '')
      ).join('\n') +
      `\n📈 INSIGHTS:\n` +
      `• Most common category: ${Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'N/A'}\n` +
      `• Average sentiment score: ${(painPoints.reduce((sum, pp) => sum + pp.sentimentScore, 0) / painPoints.length).toFixed(1)}/10\n` +
      `• Critical/High urgency: ${painPoints.filter(pp => pp.urgencyLevel === 'critical' || pp.urgencyLevel === 'high').length} posts\n` +
      (allCompetitors.length > 0 ? `• Switching opportunities: ${allCompetitors.join(", ")}\n` : '') +
      (priceSensitive > 0 ? `• Price-sensitive users: ${priceSensitive} posts\n` : '');
    
    return {
      content: [{
        type: "text",
        text: formattedText,
      }],
      structuredContent: {
        success: true,
        painPoints: painPoints.map(pp => ({
          problem: pp.problem,
          category: pp.category,
          sentimentScore: pp.sentimentScore,
          urgencyLevel: pp.urgencyLevel,
          engagementScore: pp.engagementScore,
          competitorMentions: pp.competitorMentions,
          priceSignals: pp.priceSignals,
          skillMatch: pp.skillMatch,
          topPost: pp.posts[0],
          projectIdea: pp.projectIdea,
          aiGeneratedIdea: pp.aiGeneratedIdea,
        })),
        insights: {
          byCategory,
          competitors: allCompetitors,
          priceSensitiveCount: priceSensitive,
          averageSentiment: painPoints.reduce((sum, pp) => sum + pp.sentimentScore, 0) / painPoints.length,
        },
        metadata: {
          subreddit,
          postsAnalyzed: posts.length,
          painPointsFound: painPoints.length,
          timeRange,
          sortBy,
          aiUsed: useAI,
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
            `This is expected on cloud platforms like Replit. Run this MCP server locally for full access.`,
        }],
        structuredContent: {
          success: false,
          error: "Reddit IP block",
        },
      };
    }
    
    return {
      content: [{
        type: "text",
        text: `Failed to fetch Reddit data: ${errorMessage}`,
      }],
      structuredContent: {
        success: false,
        error: errorMessage,
      },
    };
  }
}
