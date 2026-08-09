import { Client } from '@notionhq/client';
import fs from 'fs';

const envContent = fs.readFileSync('./.env.local', 'utf-8');
const notionKeyLine = envContent.split('\n').find(line => line.startsWith('NOTION_API_KEY='));
const notionKey = notionKeyLine ? notionKeyLine.split('=')[1].trim() : null;
const notion = new Client({ auth: notionKey });

async function run() {
  const pageId = '3b59c779-1706-81f9-b62a-d67194745319';
  console.log('Fetching blocks for:', pageId);
  try {
    let blocks = [];
    let cursor = undefined;
    do {
      const { results, next_cursor, has_more } = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100,
      });
      for (const block of results) {
        blocks.push(block);
      }
      cursor = has_more ? next_cursor : undefined;
    } while (cursor);
    console.log('Total blocks:', blocks.length);
    console.log(JSON.stringify(blocks, null, 2));
  } catch(err) {
    console.error(err.message);
  }
}
run();
