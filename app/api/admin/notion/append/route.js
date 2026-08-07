import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error('NOTION_API_KEY is not set in environment variables');
  }
  return new Client({ auth: apiKey });
}

export async function POST(request) {
  try {
    const { blockId, type } = await request.json();

    if (!blockId || !type) {
      return NextResponse.json({ error: 'Missing blockId or type' }, { status: 400 });
    }

    const notion = getNotionClient();

    let newBlock = {};

    switch (type) {
      case 'paragraph':
        newBlock = { type: 'paragraph', paragraph: { rich_text: [{ text: { content: '' } }] } };
        break;
      case 'heading_1':
        newBlock = { type: 'heading_1', heading_1: { rich_text: [{ text: { content: '' } }] } };
        break;
      case 'heading_2':
        newBlock = { type: 'heading_2', heading_2: { rich_text: [{ text: { content: '' } }] } };
        break;
      case 'heading_3':
        newBlock = { type: 'heading_3', heading_3: { rich_text: [{ text: { content: '' } }] } };
        break;
      case 'to_do':
        newBlock = { type: 'to_do', to_do: { rich_text: [{ text: { content: '' } }], checked: false } };
        break;
      case 'bulleted_list_item':
        newBlock = { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '' } }] } };
        break;
      case 'numbered_list_item':
        newBlock = { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: '' } }] } };
        break;
      case 'toggle':
        newBlock = { type: 'toggle', toggle: { rich_text: [{ text: { content: '' } }] } };
        break;
      case 'quote':
        newBlock = { type: 'quote', quote: { rich_text: [{ text: { content: '' } }] } };
        break;
      case 'code':
        newBlock = { type: 'code', code: { rich_text: [{ text: { content: '' } }], language: 'javascript' } };
        break;
      default:
        return NextResponse.json({ error: 'Invalid block type' }, { status: 400 });
    }

    const response = await notion.blocks.children.append({
      block_id: blockId,
      children: [newBlock]
    });

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Notion Append API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to append block' },
      { status: 500 }
    );
  }
}
