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
        to_do: {}
      };
      if (checked !== undefined) {
        payload.to_do.checked = checked;
      }
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
    } else if (type === 'page' || type === 'database') {
      // For updating page/database titles
      try {
        const response = await notion.pages.update({
          page_id: blockId,
          properties: {
            title: {
              title: richTextArray || [{ text: { content } }]
            }
          }
        });
        return NextResponse.json({ success: true, block: response });
      } catch (pageErr) {
        // Fallback: If 'title' property isn't found (common in DBs where title is named 'Name')
        const response = await notion.pages.update({
          page_id: blockId,
          properties: {
            Name: {
              title: richTextArray || [{ text: { content } }]
            }
          }
        });
        return NextResponse.json({ success: true, block: response });
      }
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

export async function DELETE(request) {
  try {
    const { blockId } = await request.json();

    if (!blockId) {
      return NextResponse.json({ error: 'Missing blockId' }, { status: 400 });
    }

    const notion = getNotionClient();
    
    // Deleting a block in Notion API is equivalent to archiving it
    const response = await notion.blocks.delete({
      block_id: blockId,
    });

    return NextResponse.json({ success: true, block: response });
  } catch (error) {
    console.error('Notion Delete API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete Notion block' },
      { status: 500 }
    );
  }
}
