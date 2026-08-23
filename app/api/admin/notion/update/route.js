import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error('NOTION_API_KEY is not set in environment variables');
  }
  return new Client({ auth: apiKey });
}

function sanitizeRichTextForNotion(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (!item) return { type: 'text', text: { content: '' } };
    const content = item.text?.content || item.plain_text || '';
    const linkUrl = item.text?.link?.url || item.href || null;
    
    const sanitizedItem = {
      type: 'text',
      text: {
        content,
        link: linkUrl ? { url: linkUrl } : null
      }
    };

    if (item.annotations) {
      sanitizedItem.annotations = {
        bold: !!item.annotations.bold,
        italic: !!item.annotations.italic,
        strikethrough: !!item.annotations.strikethrough,
        underline: !!item.annotations.underline,
        code: !!item.annotations.code,
        color: item.annotations.color || 'default'
      };
    }

    return sanitizedItem;
  });
}

export async function PATCH(request) {
  try {
    const { blockId, type, content, richTextArray, checked } = await request.json();

    if (!blockId || !type) {
      return NextResponse.json({ error: 'Missing blockId or type' }, { status: 400 });
    }

    const notion = getNotionClient();
    let payload = {};
    const sanitizedRichText = richTextArray ? sanitizeRichTextForNotion(richTextArray) : (content !== undefined ? [{ text: { content } }] : undefined);

    if (type === 'to_do') {
      payload = {
        to_do: {}
      };
      if (checked !== undefined) {
        payload.to_do.checked = checked;
      }
      if (sanitizedRichText) {
        payload.to_do.rich_text = sanitizedRichText;
      }
    } else if (['paragraph', 'heading_1', 'heading_2', 'heading_3'].includes(type)) {
      payload = {
        [type]: {
          rich_text: sanitizedRichText || [{ text: { content: '' } }]
        }
      };
    } else if (type === 'page' || type === 'database') {
      // For updating page/database titles
      try {
        const response = await notion.pages.update({
          page_id: blockId,
          properties: {
            title: {
              title: sanitizedRichText || [{ text: { content: '' } }]
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
              title: sanitizedRichText || [{ text: { content: '' } }]
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
