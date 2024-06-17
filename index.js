import dotenv from 'dotenv';
dotenv.config();
import OpenAI from "openai";
const openai = new OpenAI();
import FireCrawlApp from '@mendable/firecrawl-js';

const app = new FireCrawlApp({apiKey: process.env.FIRE_CRAWL_API_KEY});

async function getMarkdownContentFromUrl(url) {
  console.log('scraping', url)
  const scrapeResult = await app.scrapeUrl(url, {
    "pageOptions": {
      "onlyMainContent": true,
      "includeHtml": false
    }
  });
  
  return scrapeResult.data?.markdown
}
const tools = [
  {
    type: "function",
    function: {
      name: "getMarkdownContentFromUrl",
      description: "Retrieves the markdown content from a given URL",
      parameters: {
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
  },
];


async function runConversation() {
  // Step 1: send the conversation and available functions to the model
  const messages = [
    { role: "user", content: "help me generate a skit based on this news article https://www.sbs.com.au/news/article/twelve-people-injured-after-qatar-airways-plane-hits-turbulence/zjy8ccy8l" },
  ];


  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    tools: tools,
    tool_choice: "auto", // auto is default, but we'll be explicit
  });
  
  console.log("Initial response:");

  const responseMessage = response.choices[0].message;
  console.log(JSON.stringify(responseMessage));

  // Step 2: check if the model wanted to call a function
  const toolCalls = responseMessage.tool_calls;
  if (responseMessage.tool_calls) {
    // Step 3: call the function
    // Note: the JSON response may not always be valid; be sure to handle errors
    const availableFunctions = {
      getMarkdownContentFromUrl: getMarkdownContentFromUrl,
    }; // only one function in this example, but you can have multiple
    messages.push(responseMessage); // extend conversation with assistant's reply
    for (const toolCall of toolCalls) {
      console.log(toolCall)
      const functionName = toolCall.function.name;
      const functionToCall = availableFunctions[functionName];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      const functionResponse = await functionToCall(
        functionArgs.url,
      );
      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: functionName,
        content: functionResponse,
      }); // extend conversation with function response
    }
    const secondResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    }); // get a new response from the model where it can see the function response
    return secondResponse.choices;
  }
}

runConversation().then(messages => {
  for (const message of messages) {
    console.log(message.message.content)
  }
}).catch(console.error);
