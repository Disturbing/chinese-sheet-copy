import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Extend CloudflareEnv to include our environment variables
interface Env {
  ANTHROPIC_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_AI_GATEWAY: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get Cloudflare environment variables
    const { env } = (await getCloudflareContext()) as { env: Env };
    
    // Parse the request body
    const body = (await request.json()) as { image?: string };
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate image is base64
    if (!image.match(/^data:image\/(jpeg|jpg|png|webp);base64,/)) {
      return NextResponse.json(
        { error: 'Invalid image format. Must be base64 encoded image.' },
        { status: 400 }
      );
    }

    // Extract base64 data and media type
    const matches = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Failed to parse image data' },
        { status: 400 }
      );
    }

    const mediaTypeMap = {
      'jpeg': 'image/jpeg' as const,
      'jpg': 'image/jpeg' as const,
      'png': 'image/png' as const,
      'webp': 'image/webp' as const,
    };

    type MediaTypeKey = keyof typeof mediaTypeMap;
    const mediaType = mediaTypeMap[matches[1] as MediaTypeKey];
    const base64Data = matches[2];

    // Get environment variables from Cloudflare context
    const apiKey = env.ANTHROPIC_API_KEY;
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const gatewayName = env.CLOUDFLARE_AI_GATEWAY;

    if (!apiKey || !accountId || !gatewayName) {
      console.error('Missing environment variables:', { 
        hasApiKey: !!apiKey, 
        hasAccountId: !!accountId, 
        hasGateway: !!gatewayName 
      });
      return NextResponse.json(
        { error: 'Server configuration error - missing environment variables' },
        { status: 500 }
      );
    }

    // Initialize Anthropic client with Cloudflare AI Gateway
    const gatewayURL = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayName}/anthropic`;
    
    const anthropic = new Anthropic({
      apiKey: apiKey,
      baseURL: gatewayURL,
    });

    // Call Claude with the image
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analyze this TRADITIONAL CHINESE (繁體字) vocabulary worksheet image and extract the unique words from the grid/table.

📖 IMPORTANT CONTEXT:
This worksheet is written in TRADITIONAL CHINESE characters (繁體字), commonly used in Hong Kong, Taiwan, and Macau.
You are analyzing Traditional Chinese text - recognize and preserve these characters exactly as they appear.

🔍 ANALYSIS PROCESS - FOLLOW CAREFULLY:
1. Look at the worksheet title/heading at the top - it's in TRADITIONAL Chinese (e.g., "形容詞篇", "動物篇")
2. Identify the grid/table with vocabulary words - all written in TRADITIONAL Chinese
3. Go through EACH BOX/CELL in the grid ONE BY ONE, left to right, top to bottom
4. Each box contains ONE UNIQUE vocabulary word in TRADITIONAL Chinese characters
5. Carefully read and extract the TRADITIONAL Chinese word from each box
6. Keep track of words you've already extracted to avoid duplicates
7. DO NOT add the same word twice to your list - each word appears only ONCE
8. Count the total number of boxes and ensure you extract that many UNIQUE words

⚠️ CRITICAL CHARACTER REQUIREMENTS:
- The worksheet IS WRITTEN IN Traditional Chinese (繁體字) - analyze it as such
- MUST OUTPUT Traditional Chinese characters ONLY (繁體字)
- DO NOT convert to Simplified Chinese (简体字)
- Recognize Traditional characters: 長 動 詞 綠 藍 紅 動物 形容詞
- These are NOT simplified: 长 动 词 绿 蓝 红 动物 形容词

⚠️ CRITICAL UNIQUENESS REQUIREMENTS:
- Each grid box has a UNIQUE word - no duplicates exist in the worksheet
- You MUST NOT output the same word twice
- If you see what looks like a duplicate, look more carefully - it's likely a different word
- Check your final word list before returning - remove any duplicates
- Count the number of boxes in the grid and ensure you have that many UNIQUE words

📋 EXTRACTION RULES:
- This is a TRADITIONAL Chinese worksheet - all text is in 繁體字
- Extract the main title/heading exactly as written in TRADITIONAL Chinese
- Extract ONLY the vocabulary words from grid cells - written in TRADITIONAL Chinese
- Read each character carefully - Traditional Chinese has more strokes (e.g., 動 has more strokes than 动)
- Preserve the Traditional Chinese characters exactly as they appear in the image
- Ignore handwritten English notes (like "short", "flat", "fat")
- Ignore numbers, checkmarks, grid borders, and instructional text
- Ignore teacher notes and dates at the bottom
- Each word should appear EXACTLY ONCE in your output - NO DUPLICATES

✅ QUALITY CHECK BEFORE RETURNING:
1. Count the boxes in the image grid (e.g., 20 boxes = 20 unique words)
2. Count the words in your JSON array
3. Check for any duplicate words in your array - if found, you made an error
4. If duplicates exist, re-examine the image and remove duplicates
5. Verify all characters are Traditional Chinese (繁體字) with proper stroke counts
6. Verify the count matches the number of grid boxes
7. Double-check you're outputting Traditional (繁體字) not Simplified (简体字)
8. Remember: The worksheet is in Traditional Chinese - analyze it correctly

Return as a JSON object with this exact format:
{
  "title": "worksheet title in TRADITIONAL Chinese",
  "words": ["詞語1", "詞語2", "詞語3", ...]
}

FINAL REMINDERS:
- The worksheet is written in TRADITIONAL CHINESE (繁體字) - analyze it as Traditional Chinese
- NO DUPLICATES - each unique word should appear only once in your output
- Output Traditional Chinese ONLY (繁體字) - preserve the characters from the image
- One unique word per grid box
- If you see 20 boxes, output exactly 20 UNIQUE words
- Return ONLY the JSON object, no other text`,
            },
          ],
        },
      ],
    });

    // Parse the response
    const firstContent = message.content[0];
    if (firstContent.type !== 'text') {
      return NextResponse.json(
        { error: 'Unexpected response type from AI' },
        { status: 500 }
      );
    }
    
    const responseText = firstContent.text;
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
    
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to extract data from image' },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!data.title || !data.words || !Array.isArray(data.words)) {
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // Server-side duplicate removal as a safety net
    const uniqueWords = Array.from(new Set(data.words));
    
    return NextResponse.json({
      title: data.title,
      words: uniqueWords,
      usage: message.usage,
    });

  } catch (error) {
    console.error('Error analyzing photo:', error);
    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    );
  }
}

