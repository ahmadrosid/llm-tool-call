import Anthropic from '@anthropic-ai/sdk';
import dotenv from "dotenv";
dotenv.config();
import assert from 'node:assert';

const client = new Anthropic(); // gets API Key from environment variable ANTHROPIC_API_KEY

async function main() {
  const userMessage = {
    role: 'user',
    content: 'What is the weather in SF?',
  };
  const tools = [
    {
      name: 'get_weather',
      description: 'Get the weather for a specific location',
      input_schema: {
        type: 'object',
        properties: { location: { type: 'string' } },
      },
    },
  ];

  const message = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [userMessage],
    tools,
  });

  assert(message.stop_reason === 'tool_use');

  const tool = message.content.find(
    (content) => content.type === 'tool_use',
  );
  assert(tool);

  const allMessages = [
    userMessage,
    { role: message.role, content: message.content },
    {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: tool.id,
          content: [{ type: 'text', text: 'The weather is 73f' }],
        },
      ],
    },
  ];
  const result = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    stream: true,
    messages: allMessages,
    tools,
  });
  console.log('\nFinal response');
  for await (const event of result) {
    // console.log(event)
    if (event.delta) 
      if (event.delta.text)
        process.stdout.write(event.delta.text);
  }
  process.stdout.write("\n\n")

  console.log(JSON.stringify(allMessages))
}

main();
