import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error('NOTION_API_KEY is not set in environment variables');
  }
  return new Client({ auth: apiKey });
}

// Helper to extract clean page title
function getPageTitle(page) {
  if (page.object === 'database') {
    return page.title?.[0]?.plain_text || 'Untitled Database';
  }
  
  if (page.properties) {
    for (const key of Object.keys(page.properties)) {
      const prop = page.properties[key];
      if (prop.type === 'title' && prop.title?.length > 0) {
        return prop.title.map(t => t.plain_text).join('');
      }
    }
  }
  
  return 'Untitled Page';
}

// Helper to recursively fetch child blocks for rich document rendering
async function fetchAllBlocks(notion, blockId) {
  let blocks = [];
  let cursor = undefined;

  do {
    const { results, next_cursor, has_more } = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of results) {
      if (block.has_children && block.type !== 'child_page' && block.type !== 'child_database') {
        try {
          const children = await fetchAllBlocks(notion, block.id);
          block.children = children;
        } catch {
          block.children = [];
        }
      }
      blocks.push(block);
    }

    cursor = has_more ? next_cursor : undefined;
  } while (cursor);

  return blocks;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const pageId = searchParams.get('pageId');
    const query = searchParams.get('query') || '';

    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NOTION_API_KEY missing in environment variables. Please check your .env.local file.' },
        { status: 400 }
      );
    }

    const notion = getNotionClient();

    if (action === 'list' || action === 'search') {
      // Search / List all shared Notion pages & databases
      const searchOptions = {
        page_size: 50,
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
      };

      if (query.trim()) {
        searchOptions.query = query.trim();
      }

      const response = await notion.search(searchOptions);

      const items = response.results.map((item) => {
        const title = getPageTitle(item);
        const icon = item.icon?.emoji || item.icon?.external?.url || item.icon?.file?.url || null;
        const cover = item.cover?.external?.url || item.cover?.file?.url || null;

        return {
          id: item.id,
          object: item.object, // 'page' or 'database'
          title,
          icon,
          cover,
          url: item.url,
          createdTime: item.created_time,
          lastEditedTime: item.last_edited_time,
          parent: item.parent,
          archived: item.archived,
        };
      });

      return NextResponse.json({ success: true, items, count: items.length });
    }

    if (action === 'blocks' && pageId) {
      // Fetch rich content blocks for a specific page
      const blocks = await fetchAllBlocks(notion, pageId);
      
      // Also fetch page header info (fallback to database if pageId is a database)
      let pageInfo;
      try {
        pageInfo = await notion.pages.retrieve({ page_id: pageId });
      } catch {
        try {
          pageInfo = await notion.databases.retrieve({ database_id: pageId });
        } catch (dbErr) {
          throw dbErr;
        }
      }
      
      const title = getPageTitle(pageInfo);
      const icon = pageInfo.icon?.emoji || pageInfo.icon?.external?.url || pageInfo.icon?.file?.url || null;
      const cover = pageInfo.cover?.external?.url || pageInfo.cover?.file?.url || null;

      return NextResponse.json({
        success: true,
        page: {
          id: pageInfo.id,
          title,
          icon,
          cover,
          url: pageInfo.url,
          lastEditedTime: pageInfo.last_edited_time,
        },
        blocks,
      });
    }

    return NextResponse.json(
      { error: 'Invalid parameters. Specify action=list or action=blocks&pageId=...' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Notion API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to communicate with Notion API' },
      { status: 500 }
    );
  }
}
