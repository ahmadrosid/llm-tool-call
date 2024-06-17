import Anthropic from "@anthropic-ai/sdk";
import FireCrawlApp from "@mendable/firecrawl-js";
import dotenv from "dotenv";
dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const app = new FireCrawlApp({ apiKey: process.env.FIRE_CRAWL_API_KEY });

async function getMarkdownContentFromUrl(url) {
  console.log("scraping", url);
  const scrapeResult = await app.scrapeUrl(url, {
    pageOptions: {
      onlyMainContent: true,
      includeHtml: false,
    },
  });

  return scrapeResult.data?.markdown || "";
}

const tools = [
  {
    name: "getMarkdownContentFromUrl",
    description: "Retrieves the markdown content from a given URL",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to scrape for markdown content",
        },
      },
      required: ["url"],
    },
  },
];


async function runConversation() {
  const userMessage = {
    role: "user",
    content:
      "help me generate a skit based on this news article https://www.sbs.com.au/news/article/twelve-people-injured-after-qatar-airways-plane-hits-turbulence/zjy8ccy8l",
  };

  const message = await anthropic.beta.tools.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 1024,
    messages: [userMessage],
    tools,
  });

  console.log("Initial response:");
  console.dir(message, { depth: 4 });

  if (message.stop_reason === "tool_use") {
    const tool = message.content.find((content) => content.type === "tool_use");

    console.log(JSON.stringify(
      { role: message.role, content: message.content }));
    process.exit(1);

    if (tool) {
      const functionArgs = tool.input;
      const functionResponse = await getMarkdownContentFromUrl(
        functionArgs.url
      );

      const newMessages = [
        userMessage,
        { role: message.role, content: message.content },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: tool.id,
              content: [{ type: "text", text: functionResponse }],
            },
          ],
        },
      ];

      console.log(JSON.stringify({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: tool.id,
            content: [{ type: "text", text: functionResponse }],
          },
        ],
      }));

      console.dir(newMessages, { depth: 4 });
      process.exit(1);

      const result = await anthropic.beta.tools.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: newMessages,
        tools,
      });

      console.log("\nFinal response");
      console.dir(result, { depth: 4 });

      for (const content of result.content) {
        console.log(content.text)
      }
    }
  }
}

runConversation().catch(console.error);
