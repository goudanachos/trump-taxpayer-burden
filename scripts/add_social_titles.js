const fs = require('fs').promises;
const path = require('path');

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error('Please set API_KEY environment variable');
  process.exit(1);
}

async function generateSocialTitles(data) {
  // Generate 9 title options
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://trumptaxburden.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
      messages: [{
        role: 'system',
        content: 'Create 9 factual viral social media titles about government spending. CRITICAL: Only use facts from the provided data - never invent details like "gold toilet paper" or made-up comparisons. Focus on the real activities and actual costs. Make each unique: start with cost, use questions, make comparisons to relatable items (cars, houses, salaries), be matter-of-fact. Avoid patterns like "Trump\'s Single Day..." or clickbait language. Number them 1-9, one per line.'
      }, {
        role: 'user',
        content: `Generate 9 different viral social media titles about Trump's expenditures on this day. Here's the data: ${JSON.stringify(data, null, 2)}`
      }]
    })
  });

  const result = await response.json();
  
  if (!result.choices || !result.choices[0] || !result.choices[0].message) {
    console.error('Invalid API response from generator:', result);
    return null;
  }
  
  const rawTitles = result.choices[0].message.content.trim();
  
  // Parse the 9 titles
  const titles = rawTitles
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering
    .filter(line => line.length > 0)
    .slice(0, 9); // Take first 9
    
  if (titles.length < 3) { // Accept if we get at least 3 titles
    console.error('Did not get enough titles, got:', titles.length);
    return null;
  }
  
  // Now have GLM-4.5-Air create the best version
  const improvementResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://trumptaxburden.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'z-ai/glm-4.5-air:free',
      messages: [{
        role: 'system',
        content: 'You are an expert at viral social media content. Review these titles and write ONE improved version that combines the best elements. Requirements: 1) Must be 100% factually accurate using only the provided data, 2) Engaging and shareable, 3) Clear and direct, 4) Avoids clickbait language, 5) Should make people think "holy shit, really?". Output ONLY the final improved title - no explanations.'
      }, {
        role: 'user',
        content: `Here are candidate titles about Trump's government spending:\n\n${titles.map((title, i) => `${i+1}. ${title}`).join('\n')}\n\nBased on this spending data: ${JSON.stringify(data, null, 2)}\n\nWrite the best possible social media title that will make people think "holy shit, really?" Focus on what's most shocking about this spending:`
      }]
    })
  });

  const improvementResult = await improvementResponse.json();
  
  if (!improvementResult.choices || !improvementResult.choices[0] || !improvementResult.choices[0].message) {
    console.error('Invalid API response from improver:', improvementResult);
    return titles[0]; // Default to first title
  }
  
  const improvedTitle = improvementResult.choices[0].message.content.trim()
    .replace(/^\*\*/g, '') // Remove leading **
    .replace(/\*\*$/g, '') // Remove trailing **
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/!+$/g, '') // Remove trailing exclamation points
    .split('\n')[0]; // Take only first line
  
  console.log(`Generated ${titles.length} titles, GLM-4.5-Air created improved version: "${improvedTitle}"`);
  return improvedTitle;
}

async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  
  let data;
  try {
    data = JSON.parse(content);
  } catch (error) {
    console.error(`Invalid JSON in ${filePath}:`, error.message);
    return;
  }
  
  // Handle edge cases: single numbers, arrays, or missing structure
  if (typeof data === 'number') {
    console.log(`Skipping ${filePath} - file contains single number: ${data}`);
    return;
  }
  
  if (Array.isArray(data)) {
    console.log(`Skipping ${filePath} - file contains array`);
    return;
  }
  
  if (!data || typeof data !== 'object' || typeof data.total_cost !== 'number') {
    console.log(`Skipping ${filePath} - missing or invalid data structure`);
    return;
  }

  if (!data.social_title) {
    // Skip $0 days completely - they're not interesting
    if (data.total_cost === 0) {
      console.log(`Skipping ${filePath} - $0 day`);
      return;
    }
    
    // Skip low-cost days
    if (data.total_cost < 100000) {
      console.log(`Skipping ${filePath} - boring day ($${data.total_cost})`);
      return;
    }
    
    console.log(`Processing ${filePath}...`);
    const socialTitle = await generateSocialTitles(data);
    
    if (!socialTitle) {
      console.log(`Failed to generate title for ${filePath}, skipping...`);
      return;
    }
    
    console.log(`Generated title: "${socialTitle}"`);
    data.social_title = socialTitle;
    
    const newContent = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath} with social title`);
  } else {
    console.log(`Skipping ${filePath} - already has social_title`);
  }
}

async function main() {
  const expendituresDir = path.join(__dirname, '..', 'src', '_data', 'expenditures');
  const files = await fs.readdir(expendituresDir);

  for (const file of files) {
    if (file.endsWith('.yml') && file !== '.yml') {
      await processFile(path.join(expendituresDir, file));
    }
  }
}

main().catch(console.error);