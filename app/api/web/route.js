import { getWebPortfolioItems, INITIAL_WEB_PROJECTS } from '../../lib/webPortfolioStore.js';

export async function GET() {
  try {
    const items = await getWebPortfolioItems();
    
    // Format items for public web portfolio
    const formatted = (items || [])
      .filter(item => item.is_visible !== false)
      .map(item => ({
        id: item.id || String(item.title).toLowerCase().replace(/\s+/g, '-'),
        title: item.title,
        tagline: item.tagline || '',
        category: item.category || 'Enterprise Digital Platform',
        badge: item.badge || item.category || 'Production',
        desc: item.desc || item.description || '',
        url: item.url,
        displayUrl: item.display_url || item.displayUrl || (item.url ? item.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : ''),
        image: item.image_url || item.image || '/images/web-portfolio/bharatup.jpg',
        color: item.color || '#3b82f6',
        stats: Array.isArray(item.stats) ? item.stats : (typeof item.stats === 'string' ? JSON.parse(item.stats || '[]') : []),
        techStack: Array.isArray(item.tech_stack || item.techStack) 
          ? (item.tech_stack || item.techStack) 
          : ((item.tech_stack || item.techStack || '').split(',').map(s => s.trim()).filter(Boolean)),
        challenge: item.case_study_challenge || item.challenge || '',
        solution: item.case_study_solution || item.solution || '',
        is_visible: item.is_visible !== false,
        sort_order: item.sort_order || 0
      }));

    return Response.json(formatted.length > 0 ? formatted : INITIAL_WEB_PROJECTS);
  } catch (err) {
    console.error('Error fetching web portfolio:', err);
    return Response.json(INITIAL_WEB_PROJECTS);
  }
}
