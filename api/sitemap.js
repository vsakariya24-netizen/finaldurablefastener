import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: blogs } = await supabase.from('blogs').select('slug');
console.log("Fetched Blogs:", blogs); // Vercel logs mein check karein

    // Supabase se data fetch karein
   
    const { data: products } = await supabase.from('products').select('slug');

    const STATIC_URLS = [
  'https://durablefastener.com/',
  'https://durablefastener.com/products',
  'https://durablefastener.com/products/fasteners-segment', // Add karein
  'https://durablefastener.com/products/fittings',          // Add karein
  'https://durablefastener.com/manufacturing',
  'https://durablefastener.com/about',
  'https://durablefastener.com/blog',
  'https://durablefastener.com/oem-platform',
  'https://durablefastener.com/careers',
  'https://durablefastener.com/contact'
];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static URLs
    STATIC_URLS.forEach(url => {
      sitemap += `<url><loc>${url}</loc><priority>0.8</priority></url>`;
    });

    // Blogs URLs
    blogs?.forEach(blog => {
      sitemap += `<url><loc>https://durablefastener.com/blog/${blog.slug}</loc><priority>0.7</priority></url>`;
    });

    // Products URLs
    products?.forEach(product => {
      sitemap += `<url><loc>https://durablefastener.com/product/${product.slug}</loc><priority>0.9</priority></url>`;
    });

    sitemap += `</urlset>`;

    // XML Headers set karein
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=0, stale-while-revalidate');
    res.write(sitemap);
    res.end();

  } catch (error) {
    res.status(500).send("Error generating sitemap");
  }
}