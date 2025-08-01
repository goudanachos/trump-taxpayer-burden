const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");

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
        expenditures.push({ data: data, filename: file });
      });
    }
    
    return expenditures;
  });

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