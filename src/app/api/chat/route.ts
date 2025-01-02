// src/app/api/chat/route.ts
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received prompt:", body.prompt);

    // Create Bedrock client
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    // Prepare the payload for the model
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      temperature: 0.8,
      system:
        "You are a zen master who explains coding through peaceful metaphors.",
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: body.prompt }],
        },
      ],
    };

    // Create streaming command
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: "anthropic.claude-v2:1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    // Get the stream response
    const response = await client.send(command);

    // Check if stream exists
    if (!response.body) {
      throw new Error("No response stream available");
    }

    const responseBody = response.body; // Store in a new variable after the check

    // Create a new ReadableStream
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            // Process each chunk from the stream
            for await (const chunk of responseBody) {
              // Use the new variable here
              // Check if chunk and bytes exist
              if (chunk.chunk?.bytes) {
                // Decode and parse the chunk
                const decoded = new TextDecoder().decode(chunk.chunk.bytes);
                const parsed = JSON.parse(decoded);

                // Send the text content if it exists
                if (parsed.delta?.text) {
                  controller.enqueue(parsed.delta.text);
                }
              }
            }
            controller.close();
          } catch (error) {
            console.error("Stream processing error:", error);
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
