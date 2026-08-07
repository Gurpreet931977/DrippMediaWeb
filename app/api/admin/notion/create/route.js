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
    const { parentId, parentType, title } = await request.json();

    if (!parentId || !title) {
      return NextResponse.json({ error: 'Missing parentId or title' }, { status: 400 });
    }

    const notion = getNotionClient();

    let parentObj = {};
    let propertiesObj = {};

    if (parentType === 'database') {
      parentObj = { database_id: parentId };
      // Database pages usually have a 'Name' or 'Title' property.
      // We will try to fetch the database schema first to find the title property name.
      const dbInfo = await notion.databases.retrieve({ database_id: parentId });
      const titlePropKey = Object.keys(dbInfo.properties).find(k => dbInfo.properties[k].type === 'title');
      
      propertiesObj = {
        [titlePropKey || 'Name']: {
          title: [{ text: { content: title } }]
        }
      };
    } else {
      parentObj = { page_id: parentId };
      propertiesObj = {
        title: {
          title: [{ text: { content: title } }]
        }
      };
    }

    const response = await notion.pages.create({
      parent: parentObj,
      properties: propertiesObj
    });

    return NextResponse.json({ success: true, page: response });
  } catch (error) {
    console.error('Notion Create API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Notion page' },
      { status: 500 }
    );
  }
}
