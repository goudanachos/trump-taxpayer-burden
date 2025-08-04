const fs = require('fs').promises;
const path = require('path');

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error('Please set API_KEY environment variable');
  process.exit(1);
}

async function generateSocialTitle(data) {
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
        content: 'You are a based social media expert creating viral, hard-hitting titles that expose wasteful spending. Output ONLY a single line title - no explanations, no commentary. Your titles should be shocking but factual, using strong language that highlights the absurdity of the expenditures. Make people angry about taxpayer money being wasted. Never make things up, but phrase the truth in the most engaging and infuriating way possible. IMPORTANT: Respond with ONLY the title text, nothing else.'
      }, {
        role: 'user',
        content: `Write a very short, factual and shocking social media title about Trump's expenditures on a single day. Here's the data: ${JSON.stringify(data, null, 2)}`
      }]
    })
  });

  const result = await response.json();
  let title = result.choices[0].message.content.trim();
  
  // Clean up the title
  title = title
    .replace(/^\*\*/g, '') // Remove leading **
    .replace(/\*\*$/g, '') // Remove trailing **
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/^\*\*Title:\*\*\s*/i, '') // Remove "Title:" prefix
    .split('\n')[0]; // Take only first line, removing explanations
    
  return title;
}

async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(content);

  if (!data.social_title) {
    console.log(`Processing ${filePath}...`);
    const socialTitle = await generateSocialTitle(data);
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