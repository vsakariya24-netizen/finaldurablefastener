import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to fetch all products from database
async function fetchProducts() {
    console.log('📡 Fetching products from database...');
    
    // Remove the status filter since column doesn't exist
    // Just fetch all products from the table
    const { data: products, error } = await supabase
        .from('products')
        .select('*');
        // Removed .eq('status', 'active') - this column doesn't exist
        // .order('created_at', { ascending: false }); // Remove if created_at doesn't exist
    
    if (error) {
        console.error('❌ Error fetching products:', error.message);
        console.log('💡 Please check if your table name is "products"');
        return [];
    }
    
    console.log(`✅ Found ${products?.length || 0} products in database`);
    return products || [];
}

// Function to generate unique HTML for each product
function generateProductHTML(product) {
    // Map database columns to what our template expects
    const productData = {
        slug: product.slug || product.id,
        title: product.title || product.name || 'Product',
        metaDescription: product.meta_description || product.seo_description || product.description?.substring(0, 160) || '',
        metaKeywords: product.meta_keywords || product.seo_keywords || '',
        h1: product.h1_title || product.title || product.name,
        subHeading: product.subheading || product.tagline || '',
        description: product.long_description || product.description || '',
        shortDescription: product.short_description || '',
        features: product.features || [],
        specifications: product.specifications || {},
        applications: product.applications || [],
        imageUrl: product.main_image || product.image_url || '',
        galleryImages: product.gallery_images || [],
        price: product.price,
        sku: product.sku,
        material: product.material,
        sizes: product.sizes
    };
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(productData.title)} | Durable Fastener Manufacturer</title>
    <meta name="description" content="${escapeHtml(productData.metaDescription || productData.shortDescription || '')}">
    <meta name="keywords" content="${escapeHtml(productData.metaKeywords || '')}">
    <link rel="canonical" href="https://durablefastener.com/product/${productData.slug}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(productData.title)}">
    <meta property="og:description" content="${escapeHtml(productData.metaDescription || productData.shortDescription || '')}">
    <meta property="og:url" content="https://durablefastener.com/product/${productData.slug}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Durable Fastener">
    <meta property="og:image" content="${productData.imageUrl || '/images/default-product.jpg'}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(productData.title)}">
    <meta name="twitter:description" content="${escapeHtml(productData.metaDescription || productData.shortDescription || '')}">
    <meta name="twitter:image" content="${productData.imageUrl || '/images/default-product.jpg'}">
    
    <!-- Schema.org Product Markup -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "${escapeHtml(productData.title)}",
        "description": "${escapeHtml(productData.metaDescription || productData.shortDescription || '')}",
        "sku": "${productData.sku || productData.slug}",
        ${productData.price ? `"offers": {
            "@type": "Offer",
            "price": "${productData.price}",
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
        },` : ''}
        "brand": {
            "@type": "Brand",
            "name": "Durable Fastener"
        },
        "manufacturer": {
            "@type": "Organization",
            "name": "Durable Fastener Private Limited"
        }
    }
    </script>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            color: #1a1a1a;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        
        /* Header */
        .product-header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: white;
            padding: 4rem 0;
            border-bottom: 4px solid #FFC800;
        }
        .product-header h1 {
            font-size: 3rem;
            color: #FFC800;
            margin-bottom: 0.5rem;
        }
        .product-header .sub-heading {
            font-size: 1.2rem;
            color: #FFC800;
            opacity: 0.9;
            margin-bottom: 1rem;
        }
        .product-header .description {
            font-size: 1.1rem;
            color: #cccccc;
            max-width: 800px;
            margin-top: 1.5rem;
        }
        
        /* Product Info */
        .product-info {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        /* Features */
        .features-section, .specs-section, .applications-section {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .features-section h2, .specs-section h2, .applications-section h2 {
            font-size: 1.8rem;
            color: #FFC800;
            margin-bottom: 1.5rem;
            border-left: 4px solid #FFC800;
            padding-left: 1rem;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        .feature-card {
            background: #f9f9f9;
            padding: 1.2rem;
            border-radius: 8px;
            border-left: 3px solid #FFC800;
        }
        .feature-card h3 { color: #1a1a1a; margin-bottom: 0.5rem; font-size: 1.1rem; }
        
        /* Specifications Table */
        .specs-table {
            width: 100%;
            border-collapse: collapse;
        }
        .specs-table tr { border-bottom: 1px solid #e0e0e0; }
        .specs-table td { padding: 1rem; }
        .specs-table td:first-child {
            font-weight: bold;
            width: 30%;
            background: #f9f9f9;
        }
        
        /* Applications */
        .applications-list {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .application-tag {
            background: #FFC80020;
            color: #1a1a1a;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        /* CTA */
        .cta-section {
            background: #FFC800;
            color: #1a1a1a;
            text-align: center;
            padding: 3rem;
            border-radius: 12px;
            margin: 2rem 0;
        }
        .cta-button {
            display: inline-block;
            background: #1a1a1a;
            color: #FFC800;
            padding: 0.8rem 2rem;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 1rem;
            transition: all 0.3s;
        }
        .cta-button:hover { background: #333; transform: translateY(-2px); }
        
        footer {
            background: #1a1a1a;
            color: #999;
            text-align: center;
            padding: 2rem;
            margin-top: 3rem;
        }
        footer a { color: #FFC800; text-decoration: none; }
        
        @media (max-width: 768px) {
            .product-header h1 { font-size: 2rem; }
            .container { padding: 0 1rem; }
            .features-grid { grid-template-columns: 1fr; }
            .specs-table td { display: block; width: 100%; }
            .specs-table td:first-child { background: none; }
        }
    </style>
</head>
<body>
    <div class="product-header">
        <div class="container">
            <h1>${escapeHtml(productData.h1)}</h1>
            ${productData.subHeading ? `<div class="sub-heading">${escapeHtml(productData.subHeading)}</div>` : ''}
            <p class="description">${escapeHtml(productData.description || productData.shortDescription)}</p>
        </div>
    </div>
    
    <div class="container">
        ${productData.imageUrl ? `
        <div class="product-info">
            <img src="${productData.imageUrl}" alt="${escapeHtml(productData.title)}" style="max-width: 100%; border-radius: 8px;">
            ${productData.sku ? `<p><strong>SKU:</strong> ${productData.sku}</p>` : ''}
            ${productData.material ? `<p><strong>Material:</strong> ${productData.material}</p>` : ''}
            ${productData.sizes ? `<p><strong>Sizes:</strong> ${productData.sizes}</p>` : ''}
            ${productData.price ? `<p><strong>Price:</strong> ₹${productData.price}</p>` : ''}
        </div>
        ` : ''}
        
        ${productData.features?.length > 0 ? `
        <div class="features-section">
            <h2>Key Features</h2>
            <div class="features-grid">
                ${productData.features.map(feature => `
                    <div class="feature-card">
                        <h3>✓ ${escapeHtml(feature)}</h3>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${productData.specifications && Object.keys(productData.specifications).length > 0 ? `
        <div class="specs-section">
            <h2>Technical Specifications</h2>
            <table class="specs-table">
                ${Object.entries(productData.specifications).map(([key, value]) => `
                    <tr>
                        <td>${escapeHtml(key.charAt(0).toUpperCase() + key.slice(1))}</td>
                        <td>${escapeHtml(value)}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
        ` : ''}
        
        ${productData.applications?.length > 0 ? `
        <div class="applications-section">
            <h2>Applications</h2>
            <div class="applications-list">
                ${productData.applications.map(app => `
                    <span class="application-tag">✓ ${escapeHtml(app)}</span>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="cta-section">
            <h3>Need This Product?</h3>
            <p>Contact us for bulk orders, wholesale pricing, and custom specifications.</p>
            <a href="/contact" class="cta-button">Get a Quote →</a>
        </div>
    </div>
    
    <footer>
        <div class="container">
            <p>&copy; 2026 Durable Fastener Private Limited. All Rights Reserved.</p>
            <p style="margin-top: 1rem;">
                <a href="/privacy-policy">Privacy Policy</a> | 
                <a href="/terms-and-conditions">Terms & Conditions</a> |
                <a href="/contact">Contact Us</a>
            </p>
        </div>
    </footer>
</body>
</html>`;
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Main prerender function
async function prerender() {
    console.log('🚀 Starting dynamic pre-rendering...\n');
    
    // Fetch products from database
    const products = await fetchProducts();
    
    if (!products || products.length === 0) {
        console.log('⚠️ No products found in database');
        console.log('💡 Please add products to your "products" table first');
        console.log('💡 Or check if your table name is correct');
        return;
    }
    
    // Generate HTML for each product
    for (const product of products) {
        const slug = product.slug || product.id;
        console.log(`📄 Generating: /product/${slug}/`);
        
        const html = generateProductHTML(product);
        
        const folderPath = path.join(__dirname, 'dist', 'product', slug);
        const filePath = path.join(folderPath, 'index.html');
        
        await fs.mkdir(folderPath, { recursive: true });
        await fs.writeFile(filePath, html);
        
        console.log(`✅ Generated: /product/${slug}/index.html`);
        console.log(`   Title: ${product.title}\n`);
    }
    
    console.log(`🎉 Successfully generated ${products.length} product pages!`);
}

// Run the prerender
prerender().catch(console.error);