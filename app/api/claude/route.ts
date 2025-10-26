import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { message, model = 'claude-3-5-sonnet-20241022', max_tokens = 1024 } = body;

    // Validate that a message was provided
    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required',
        },
        { status: 400 }
      );
    }

    // Validate API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Anthropic API key not configured',
        },
        { status: 500 }
      );
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: max_tokens,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    // Extract the text content from the response
    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent && textContent.type === 'text' ? textContent.text : '';

    return NextResponse.json({
      success: true,
      data: {
        response: responseText,
        model: response.model,
        usage: response.usage,
        id: response.id,
      },
    });

  } catch (error) {
    console.error('Error calling Claude API:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to call Claude API',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
