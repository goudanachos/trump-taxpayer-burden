const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");

  // Generate social share images and QR codes
  eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');
    const QRCode = require('qrcode');
    
    // Create social images directory
    const socialDir = path.join(dir.output, 'images', 'social');
    if (!fs.existsSync(socialDir)) {
      fs.mkdirSync(socialDir, { recursive: true });
    }
    
    // Create QR codes directory
    const qrDir = path.join(dir.output, 'images', 'qr');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    
    // Generate QR codes for cryptocurrency addresses
    try {
      const addrFile = path.join(__dirname, 'src/_data/addr.json');
      if (fs.existsSync(addrFile)) {
        const addrData = JSON.parse(fs.readFileSync(addrFile, 'utf8'));
        
        const cryptos = [
          { key: 'btc', name: 'Bitcoin', symbol: '₿' },
          { key: 'eth', name: 'Ethereum', symbol: 'Ξ' },
          { key: 'sol', name: 'Solana', symbol: '◎' },
          { key: 'trump', name: 'TRUMP', symbol: '$TRUMP' },
          { key: 'doge', name: 'Dogecoin', symbol: 'Ð' }
        ];
        
        for (const crypto of cryptos) {
          const address = addrData[crypto.key];
          if (address) {
            const svgString = await QRCode.toString(address, {
              type: 'svg',
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            
            // Wrap in styled SVG with federal styling
            const styledSvg = generateCryptoQRSVG(svgString, crypto.name, crypto.symbol, address);
            fs.writeFileSync(path.join(qrDir, `${crypto.key}.svg`), styledSvg);
          }
        }
        
        console.log('Generated cryptocurrency QR codes');
      }
    } catch (error) {
      console.error('Failed to generate QR codes:', error);
    }
    
    // Generate images for daily pages
    const expendituresDir = path.join(__dirname, 'src/_data/expenditures');
    if (fs.existsSync(expendituresDir)) {
      const files = fs.readdirSync(expendituresDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
      
      files.forEach(file => {
        const filePath = path.join(expendituresDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const [year, month, day] = dateMatch[1].split('-').map(n => parseInt(n, 10));
          const date = new Date(year, month - 1, day); // month is 0-based
          const dateStr = dateMatch[1];
          const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long',
            day: 'numeric' 
          });
          
          const svgContent = generateDailySocialImage(formattedDate, data.location, data.total_cost);
          fs.writeFileSync(path.join(socialDir, `day-${dateStr}.svg`), svgContent);
        }
      });
    }
    
    // Generate images for weekly pages
    const weeklyData = getWeeklyData();
    Object.keys(weeklyData).forEach(weekKey => {
      const week = weeklyData[weekKey];
      const svgContent = generateWeeklySocialImage(week);
      fs.writeFileSync(path.join(socialDir, `week-${week.year}-${String(week.weekNumber).padStart(2, '0')}.svg`), svgContent);
    });
    
    // Generate data.json file
    const dataJson = generateDataJson();
    fs.writeFileSync(path.join(dir.output, 'data.json'), JSON.stringify(dataJson, null, 2));
    
    // Generate sitemaps
    generateSitemaps(dir.output);
    
    console.log(`Generated daily and weekly social share images`);
    console.log(`Generated data.json with ${dataJson.expenditures.length} expenditures`);
    console.log(`Generated sitemap index and individual sitemaps`);
  });

  // Watch CSS files for changes
  eleventyConfig.addWatchTarget("src/css/");

  // Date filters
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("LLLL dd, yyyy");
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  // Currency filter
  eleventyConfig.addFilter("currency", (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  });

  // String format filter (pad with zeros)
  eleventyConfig.addFilter("padZeros", (num, length = 2) => {
    return String(num).padStart(length, '0');
  });

  // Get all expenditures from data directory
  eleventyConfig.addCollection("expenditures", function(collectionApi) {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');
    
    const expendituresDir = path.join(__dirname, 'src/_data/expenditures');
    const expenditures = [];
    
    if (fs.existsSync(expendituresDir)) {
      const files = fs.readdirSync(expendituresDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .sort().reverse(); // Sort by filename (date) descending
      
      files.forEach(file => {
        const filePath = path.join(expendituresDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        
        // Add date from filename if not present
        if (!data.date) {
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            data.date = dateMatch[1];
          }
        }
        
        expenditures.push({ data: data, filename: file });
      });
    }
    
    return expenditures;
  });

  // Generate weekly summaries
  eleventyConfig.addCollection("weeklySummaries", function(collectionApi) {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');
    
    const expendituresDir = path.join(__dirname, 'src/_data/expenditures');
    const expenditures = [];
    
    if (fs.existsSync(expendituresDir)) {
      const files = fs.readdirSync(expendituresDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .sort().reverse();
      
      files.forEach(file => {
        const filePath = path.join(expendituresDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        expenditures.push(data);
      });
    }
    
    const weeklyData = {};
    
    expenditures.forEach(exp => {
      if (!exp.date) return;
      
      const [year, month, day] = exp.date.split('-').map(n => parseInt(n, 10));
      const date = new Date(year, month - 1, day); // month is 0-based
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1); // Get Monday of the week
      const weekKey = monday.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart: weekKey,
          weekEnd: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          year: monday.getFullYear(),
          weekNumber: getWeekNumber(monday),
          expenditures: [],
          totalCost: 0,
          activityCount: 0,
          locations: new Set(),
          tags: new Set()
        };
      }
      
      weeklyData[weekKey].expenditures.push(exp);
      weeklyData[weekKey].totalCost += exp.total_cost || 0;
      weeklyData[weekKey].activityCount += exp.activities ? exp.activities.length : 0;
      if (exp.location) weeklyData[weekKey].locations.add(exp.location);
      if (exp.tags) exp.tags.forEach(tag => weeklyData[weekKey].tags.add(tag));
    });
    
    // Convert sets to arrays and sort by week
    const weeks = Object.keys(weeklyData).map(weekKey => {
      const week = weeklyData[weekKey];
      week.locations = Array.from(week.locations);
      week.tags = Array.from(week.tags);
      return { data: week };
    }).sort((a, b) => new Date(b.data.weekStart) - new Date(a.data.weekStart));
    
    return weeks;
  });

  // Generate year rollups
  eleventyConfig.addCollection("yearlyRollups", function(collectionApi) {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');
    
    const expendituresDir = path.join(__dirname, 'src/_data/expenditures');
    const expenditures = [];
    
    if (fs.existsSync(expendituresDir)) {
      const files = fs.readdirSync(expendituresDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
      
      files.forEach(file => {
        const filePath = path.join(expendituresDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        
        // Add date from filename if not present
        if (!data.date) {
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            data.date = dateMatch[1];
          }
        }
        
        expenditures.push(data);
      });
    }
    
    const yearlyData = {};
    
    expenditures.forEach(exp => {
      if (!exp.date) return;
      
      const year = exp.date.substring(0, 4);
      
      if (!yearlyData[year]) {
        yearlyData[year] = {
          year: parseInt(year),
          expenditures: [],
          total_cost: 0,
          activity_count: 0,
          locations: new Set(),
          tags: new Set(),
          categories: {},
          months: new Set()
        };
      }
      
      yearlyData[year].expenditures.push(exp);
      yearlyData[year].total_cost += exp.total_cost || 0;
      yearlyData[year].activity_count += exp.activities ? exp.activities.length : 0;
      if (exp.location) yearlyData[year].locations.add(exp.location);
      if (exp.tags) {
        const tags = Array.isArray(exp.tags) ? exp.tags : exp.tags.split(',').map(t => t.trim());
        tags.forEach(tag => yearlyData[year].tags.add(tag));
      }
      yearlyData[year].months.add(exp.date.substring(0, 7)); // YYYY-MM
      
      // Category totals
      if (exp.activities) {
        exp.activities.forEach(activity => {
          if (activity.category) {
            yearlyData[year].categories[activity.category] = 
              (yearlyData[year].categories[activity.category] || 0) + (activity.cost || 0);
          }
        });
      }
    });
    
    // Convert sets to arrays and sort
    const years = Object.keys(yearlyData).map(year => {
      const data = yearlyData[year];
      data.locations = Array.from(data.locations);
      data.tags = Array.from(data.tags);
      data.months = Array.from(data.months).sort();
      data.top_categories = Object.entries(data.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, total]) => ({ category, total }));
      delete data.categories;
      return { data };
    }).sort((a, b) => b.data.year - a.data.year);
    
    return years;
  });

  // Generate month rollups
  eleventyConfig.addCollection("monthlyRollups", function(collectionApi) {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');
    
    const expendituresDir = path.join(__dirname, 'src/_data/expenditures');
    const expenditures = [];
    
    if (fs.existsSync(expendituresDir)) {
      const files = fs.readdirSync(expendituresDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
      
      files.forEach(file => {
        const filePath = path.join(expendituresDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        
        // Add date from filename if not present
        if (!data.date) {
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            data.date = dateMatch[1];
          }
        }
        
        expenditures.push(data);
      });
    }
    
    const monthlyData = {};
    
    expenditures.forEach(exp => {
      if (!exp.date) return;
      
      const monthKey = exp.date.substring(0, 7); // YYYY-MM
      const [year, month] = monthKey.split('-');
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          year: parseInt(year),
          month: parseInt(month),
          month_key: monthKey,
          expenditures: [],
          total_cost: 0,
          activity_count: 0,
          locations: new Set(),
          tags: new Set(),
          categories: {}
        };
      }
      
      monthlyData[monthKey].expenditures.push(exp);
      monthlyData[monthKey].total_cost += exp.total_cost || 0;
      monthlyData[monthKey].activity_count += exp.activities ? exp.activities.length : 0;
      if (exp.location) monthlyData[monthKey].locations.add(exp.location);
      if (exp.tags) {
        const tags = Array.isArray(exp.tags) ? exp.tags : exp.tags.split(',').map(t => t.trim());
        tags.forEach(tag => monthlyData[monthKey].tags.add(tag));
      }
      
      // Category totals
      if (exp.activities) {
        exp.activities.forEach(activity => {
          if (activity.category) {
            monthlyData[monthKey].categories[activity.category] = 
              (monthlyData[monthKey].categories[activity.category] || 0) + (activity.cost || 0);
          }
        });
      }
    });
    
    // Convert sets to arrays and sort
    const months = Object.keys(monthlyData).map(monthKey => {
      const data = monthlyData[monthKey];
      data.locations = Array.from(data.locations);
      data.tags = Array.from(data.tags);
      data.top_categories = Object.entries(data.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, total]) => ({ category, total }));
      delete data.categories;
      return { data };
    }).sort((a, b) => b.data.month_key.localeCompare(a.data.month_key));
    
    return months;
  });

  // Helper function to get week number
  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  }

  // Helper function to get weekly data for social image generation
  function getWeeklyData() {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');
    
    const expendituresDir = path.join(__dirname, 'src/_data/expenditures');
    const expenditures = [];
    
    if (fs.existsSync(expendituresDir)) {
      const files = fs.readdirSync(expendituresDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
      
      files.forEach(file => {
        const filePath = path.join(expendituresDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        
        // Add date from filename if not present
        if (!data.date) {
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            data.date = dateMatch[1];
          }
        }
        
        expenditures.push(data);
      });
    }
    
    const weeklyData = {};
    
    expenditures.forEach(exp => {
      if (!exp.date) return;
      
      const [year, month, day] = exp.date.split('-').map(n => parseInt(n, 10));
      const date = new Date(year, month - 1, day); // month is 0-based
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1);
      const weekKey = monday.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart: weekKey,
          year: monday.getFullYear(),
          weekNumber: getWeekNumber(monday),
          expenditures: [],
          totalCost: 0,
          activityCount: 0,
          locations: new Set()
        };
      }
      
      weeklyData[weekKey].expenditures.push(exp);
      weeklyData[weekKey].totalCost += exp.total_cost || 0;
      weeklyData[weekKey].activityCount += exp.activities ? exp.activities.length : 0;
      if (exp.location) weeklyData[weekKey].locations.add(exp.location);
    });
    
    // Convert sets to arrays
    Object.keys(weeklyData).forEach(weekKey => {
      weeklyData[weekKey].locations = Array.from(weeklyData[weekKey].locations);
    });
    
    return weeklyData;
  }

  // Generate sitemaps
  function generateSitemaps(outputDir) {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');
    
    const baseUrl = 'https://trumptaxburden.com';
    const now = new Date().toISOString();
    
    // Get all expenditure data
    const expendituresDir = path.join(__dirname, 'src/_data/expenditures');
    const expenditures = [];
    
    if (fs.existsSync(expendituresDir)) {
      const files = fs.readdirSync(expendituresDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
      
      files.forEach(file => {
        const filePath = path.join(expendituresDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        
        if (!data.date) {
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            data.date = dateMatch[1];
          }
        }
        
        expenditures.push(data);
      });
    }

    // Generate main sitemap (static pages)
    const mainSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/archive/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/data.json</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

    // Generate daily expenditures sitemap
    const dailySitemapUrls = expenditures.filter(exp => exp.date).map(exp => {
      const [year, month, day] = exp.date.split('-').map(n => parseInt(n, 10));
      const date = new Date(year, month - 1, day); // month is 0-based
      const lastmod = date.toISOString();
      return `  <url>
    <loc>${baseUrl}/day/${exp.date.replace(/-/g, '/')}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('\n');

    const dailySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${dailySitemapUrls}
</urlset>`;

    // Generate year rollups sitemap
    const years = [...new Set(expenditures.filter(exp => exp.date).map(exp => exp.date.substring(0, 4)))].sort();
    const yearSitemapUrls = years.map(year => {
      return `  <url>
    <loc>${baseUrl}/${year}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join('\n');

    const yearSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${yearSitemapUrls}
</urlset>`;

    // Generate month rollups sitemap
    const months = [...new Set(expenditures.filter(exp => exp.date).map(exp => exp.date.substring(0, 7)))].sort();
    const monthSitemapUrls = months.map(month => {
      const [year, monthNum] = month.split('-');
      return `  <url>
    <loc>${baseUrl}/${year}/${monthNum}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }).join('\n');

    const monthSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${monthSitemapUrls}
</urlset>`;

    // Generate sitemap index
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-main.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-daily.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-years.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-months.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

    // Write all sitemap files
    fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemapIndex);
    fs.writeFileSync(path.join(outputDir, 'sitemap-main.xml'), mainSitemap);
    fs.writeFileSync(path.join(outputDir, 'sitemap-daily.xml'), dailySitemap);
    fs.writeFileSync(path.join(outputDir, 'sitemap-years.xml'), yearSitemap);
    fs.writeFileSync(path.join(outputDir, 'sitemap-months.xml'), monthSitemap);
  }

  // Generate comprehensive data.json file
  function generateDataJson() {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('js-yaml');
    
    const expendituresDir = path.join(__dirname, 'src/_data/expenditures');
    const expenditures = [];
    
    if (fs.existsSync(expendituresDir)) {
      const files = fs.readdirSync(expendituresDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .sort().reverse();
      
      files.forEach(file => {
        const filePath = path.join(expendituresDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        
        // Add date from filename if not present
        if (!data.date) {
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            data.date = dateMatch[1];
          }
        }
        
        expenditures.push(data);
      });
    }
    
    // Calculate top-level metrics
    const totalCost = expenditures.reduce((sum, exp) => sum + (exp.total_cost || 0), 0);
    const totalDays = expenditures.length;
    const totalActivities = expenditures.reduce((sum, exp) => sum + (exp.activities ? exp.activities.length : 0), 0);
    
    // Get unique locations
    const locations = [...new Set(expenditures.map(exp => exp.location).filter(Boolean))];
    
    // Get date range
    const dates = expenditures.map(exp => exp.date).filter(Boolean).sort();
    const dateRange = dates.length > 0 ? {
      start: dates[0],
      end: dates[dates.length - 1]
    } : null;
    
    // Calculate average daily cost
    const avgDailyCost = totalDays > 0 ? Math.round(totalCost / totalDays) : 0;
    
    // Most expensive day
    const mostExpensiveDay = expenditures.reduce((max, exp) => 
      (exp.total_cost || 0) > (max.total_cost || 0) ? exp : max, expenditures[0] || {});
    
    // Category breakdown
    const categoryTotals = {};
    expenditures.forEach(exp => {
      if (exp.activities) {
        exp.activities.forEach(activity => {
          if (activity.category) {
            categoryTotals[activity.category] = (categoryTotals[activity.category] || 0) + (activity.cost || 0);
          }
        });
      }
    });
    
    // Sort categories by total cost
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([category, total]) => ({ category, total }));
    
    return {
      generated: new Date().toISOString(),
      summary: {
        total_cost: totalCost,
        total_days: totalDays,
        total_activities: totalActivities,
        avg_daily_cost: avgDailyCost,
        date_range: dateRange,
        unique_locations: locations.length,
        most_expensive_day: {
          date: mostExpensiveDay.date,
          location: mostExpensiveDay.location,
          cost: mostExpensiveDay.total_cost
        }
      },
      categories: topCategories,
      locations: locations,
      expenditures: expenditures.map(exp => ({
        date: exp.date,
        location: exp.location,
        total_cost: exp.total_cost,
        activities: exp.activities ? exp.activities.map(activity => ({
          name: activity.name,
          cost: activity.cost,
          category: activity.category,
          description: activity.description
        })) : [],
        social_description: exp.social_description,
        tags: Array.isArray(exp.tags) ? exp.tags : (exp.tags ? exp.tags.split(',').map(t => t.trim()) : []),
        confidence_level: exp.confidence_level,
        source_urls: exp.source_urls || []
      }))
    };
  }

  // Social image generators
  function generateDailySocialImage(date, location, cost) {
    const costFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cost);

    return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .authority-font { font-family: 'Public Sans', 'Arial Black', sans-serif; font-weight: 900; }
          .command-font { font-family: 'Source Sans Pro', 'Arial', sans-serif; font-weight: 700; }
          .standard-font { font-family: 'Source Sans Pro', 'Arial', sans-serif; font-weight: 400; }
        </style>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="#000000"/>
      
      <!-- Top Classification Bar -->
      <rect x="0" y="0" width="1200" height="40" fill="#DC143C"/>
      <text x="600" y="25" text-anchor="middle" class="authority-font" font-size="14" fill="white" letter-spacing="2px">
        /// CLASSIFIED: DAILY TAXPAYER BURDEN ANALYSIS ///
      </text>
      
      <!-- Eagle Seal -->
      <g transform="translate(100, 100)">
        <circle cx="40" cy="40" r="35" stroke="white" stroke-width="2" fill="transparent"/>
        <text x="40" y="47" text-anchor="middle" class="authority-font" font-size="28" fill="white">🦅</text>
      </g>
      
      <!-- Main Content -->
      <text x="200" y="150" class="authority-font" font-size="32" fill="white" letter-spacing="1px">
        TRUMP TAXPAYER BURDEN
      </text>
      
      <text x="200" y="210" class="command-font" font-size="48" fill="white">
        ${date}
      </text>
      
      <text x="200" y="270" class="standard-font" font-size="24" fill="#BBBBBB">
        ${location}
      </text>
      
      <!-- Cost Display -->
      <rect x="200" y="320" width="800" height="120" fill="white" stroke="#DC143C" stroke-width="3"/>
      <text x="600" y="350" text-anchor="middle" class="standard-font" font-size="18" fill="#666">
        TOTAL TAXPAYER COST
      </text>
      <text x="600" y="410" text-anchor="middle" class="command-font" font-size="64" fill="#DC143C">
        ${costFormatted}
      </text>
      
      <!-- Bottom Authority -->
      <text x="600" y="570" text-anchor="middle" class="standard-font" font-size="16" fill="#888" letter-spacing="1px">
        AUTHORIZED FOR PUBLIC DISCLOSURE • TRUMPTAXBURDEN.COM
      </text>
      
      <!-- Bottom Classification Bar -->
      <rect x="0" y="590" width="1200" height="40" fill="#DC143C"/>
      <text x="600" y="615" text-anchor="middle" class="authority-font" font-size="14" fill="white" letter-spacing="2px">
        /// UNCLASSIFIED: FISCAL TRANSPARENCY INITIATIVE ///
      </text>
    </svg>`;
  }

  function generateWeeklySocialImage(week) {
    const costFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(week.totalCost);

    const weekStart = new Date(week.weekStart);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    const dateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .authority-font { font-family: 'Public Sans', 'Arial Black', sans-serif; font-weight: 900; }
          .command-font { font-family: 'Source Sans Pro', 'Arial', sans-serif; font-weight: 700; }
          .standard-font { font-family: 'Source Sans Pro', 'Arial', sans-serif; font-weight: 400; }
        </style>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="#000000"/>
      
      <!-- Top Classification Bar -->
      <rect x="0" y="0" width="1200" height="40" fill="#DC143C"/>
      <text x="600" y="25" text-anchor="middle" class="authority-font" font-size="14" fill="white" letter-spacing="2px">
        /// CLASSIFIED: WEEKLY EXPENDITURE SUMMARY ///
      </text>
      
      <!-- Eagle Seal -->
      <g transform="translate(100, 100)">
        <circle cx="40" cy="40" r="35" stroke="white" stroke-width="2" fill="transparent"/>
        <text x="40" y="47" text-anchor="middle" class="authority-font" font-size="28" fill="white">🦅</text>
      </g>
      
      <!-- Main Content -->
      <text x="200" y="150" class="authority-font" font-size="32" fill="white" letter-spacing="1px">
        TRUMP TAXPAYER BURDEN
      </text>
      
      <text x="200" y="210" class="command-font" font-size="48" fill="white">
        WEEK ${week.weekNumber}, ${week.year}
      </text>
      
      <text x="200" y="270" class="standard-font" font-size="24" fill="#BBBBBB">
        ${dateRange}
      </text>
      
      <!-- Cost Display -->
      <rect x="200" y="320" width="800" height="120" fill="white" stroke="#DC143C" stroke-width="3"/>
      <text x="600" y="350" text-anchor="middle" class="standard-font" font-size="18" fill="#666">
        TOTAL WEEKLY TAXPAYER COST
      </text>
      <text x="600" y="410" text-anchor="middle" class="command-font" font-size="64" fill="#DC143C">
        ${costFormatted}
      </text>
      
      <!-- Stats -->
      <text x="200" y="490" class="standard-font" font-size="20" fill="#BBBBBB">
        ${week.expenditures.length} days tracked • ${week.activityCount} activities • ${week.locations.length} locations
      </text>
      
      <!-- Bottom Authority -->
      <text x="600" y="570" text-anchor="middle" class="standard-font" font-size="16" fill="#888" letter-spacing="1px">
        AUTHORIZED FOR PUBLIC DISCLOSURE • TRUMPTAXBURDEN.COM
      </text>
      
      <!-- Bottom Classification Bar -->
      <rect x="0" y="590" width="1200" height="40" fill="#DC143C"/>
      <text x="600" y="615" text-anchor="middle" class="authority-font" font-size="14" fill="white" letter-spacing="2px">
        /// UNCLASSIFIED: FISCAL TRANSPARENCY INITIATIVE ///
      </text>
    </svg>`;
  }

  // Generate styled QR code SVG with federal styling
  function generateCryptoQRSVG(qrSvgString, cryptoName, cryptoSymbol, address) {
    // Extract the actual QR content - QRCode.js generates rect elements, not paths
    const qrMatch = qrSvgString.match(/<svg[^>]*viewBox="([^"]*)"[^>]*>(.*?)<\/svg>/s);
    if (!qrMatch) {
      console.error('Failed to parse QR SVG');
      return '';
    }
    
    const viewBox = qrMatch[1];
    const qrContent = qrMatch[2];
    
    return `<svg width="300" height="350" viewBox="0 0 300 350" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .authority-font { font-family: 'Public Sans', 'Arial Black', sans-serif; font-weight: 900; }
          .standard-font { font-family: 'Source Sans Pro', 'Arial', sans-serif; font-weight: 400; }
          .mono-font { font-family: 'SF Mono', 'Monaco', 'Menlo', monospace; font-weight: 500; }
        </style>
      </defs>
      
      <!-- Background -->
      <rect width="300" height="350" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      
      <!-- Top Classification Bar -->
      <rect x="0" y="0" width="300" height="25" fill="#DC143C"/>
      <text x="150" y="16" text-anchor="middle" class="authority-font" font-size="8" fill="white" letter-spacing="1px">
        /// CRYPTO ADDRESS QR ///
      </text>
      
      <!-- Crypto Info -->
      <text x="150" y="45" text-anchor="middle" class="authority-font" font-size="14" fill="#000000" letter-spacing="0.5px">
        ${cryptoName.toUpperCase()}
      </text>
      <text x="150" y="62" text-anchor="middle" class="standard-font" font-size="20" fill="#DC143C">
        ${cryptoSymbol}
      </text>
      
      <!-- QR Code Container -->
      <rect x="50" y="80" width="200" height="200" fill="white" stroke="#6C757D" stroke-width="1"/>
      
      <!-- QR Code - Embed the actual generated QR -->
      <svg x="60" y="90" width="180" height="180" viewBox="${viewBox}">
        ${qrContent}
      </svg>
      
      <!-- Address Preview (truncated) -->
      <text x="150" y="300" text-anchor="middle" class="mono-font" font-size="8" fill="#6C757D">
        ${address.substring(0, 12)}...${address.substring(address.length - 8)}
      </text>
      
      <!-- Authority Footer -->
      <text x="150" y="320" text-anchor="middle" class="standard-font" font-size="7" fill="#888" letter-spacing="0.5px">
        SCAN OR COPY ADDRESS FOR PAYMENT
      </text>
      
      <!-- Bottom Classification Bar -->
      <rect x="0" y="325" width="300" height="25" fill="#DC143C"/>
      <text x="150" y="341" text-anchor="middle" class="authority-font" font-size="7" fill="white" letter-spacing="1px">
        /// UNCLASSIFIED: PUBLIC USE ///
      </text>
    </svg>`;
  }

  // Configuration
  return {
    templateFormats: ["md", "njk", "html", "liquid"],
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid",
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};