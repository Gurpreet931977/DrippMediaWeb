import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error('NOTION_API_KEY is not set in environment variables');
  }
  return new Client({ auth: apiKey });
}

export async function PATCH(request) {
  try {
    const { blockId, type, content, richTextArray, checked } = await request.json();

    if (!blockId || !type) {
      return NextResponse.json({ error: 'Missing blockId or type' }, { status: 400 });
    }

    const notion = getNotionClient();
    let payload = {};

    if (type === 'to_do') {
      payload = {
        to_do: {
          checked: checked !== undefined ? checked : false
        }
      };
      if (richTextArray) {
         payload.to_do.rich_text = richTextArray;
      } else if (content !== undefined) {
         payload.to_do.rich_text = [{ text: { content } }];
      }
    } else if (['paragraph', 'heading_1', 'heading_2', 'heading_3'].includes(type)) {
      payload = {
        [type]: {
          rich_text: richTextArray || [{ text: { content } }]
        }
      };
    } else {
      return NextResponse.json({ error: `Unsupported block type for inline editing: ${type}` }, { status: 400 });
    }

    const response = await notion.blocks.update({
      block_id: blockId,
      ...payload
    });

    return NextResponse.json({ success: true, block: response });
  } catch (error) {
    console.error('Notion Update API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update Notion block' },
      { status: 500 }
    );
  }
}
