import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchProductsFromDB() {
    console.log('📡 Fetching products from database...');
    
    const { data: products, error } = await supabase
        .from('products')
        .select('*');
    
    if (error) {
        console.error('❌ Error:', error.message);
        return [];
    }
    
    console.log(`✅ Found ${products?.length || 0} products`);
    return products || [];
}

function generateProductHTML(product) {
    // Exact mapping based on your database columns
    const productData = {
        // Basic info
        slug: product.slug,
        name: product.name,
        
        // SEO fields
        title: product.name,  // name column se title banega
        metaDescription: product.short_description || `${product.name} - High quality fastener from Durable Fastener.`,
        
        // Content fields
        shortDescription: product.short_description || '',
        longDescription: product.long_description || '',
        
        // Specifications - handle array of objects
        specifications: Array.isArray(product.specifications) ? product.specifications : [],
        
        // Applications - handle array of objects
        applications: Array.isArray(product.applications) ? product.applications : [],
        
        // Features - handle array (currently empty but ready)
        features: Array.isArray(product.features) && product.features.length > 0 ? product.features : [],
        
        // Images
        images: Array.isArray(product.images) ? product.images : [],
        
        // Material & Technical
        material: product.material || '',
        headType: product.head_type || '',
        threadType: product.thread_type || '',
        driveType: product.drive_type || '',
        
        // Certifications
        certifications: Array.isArray(product.certifications) ? product.certifications : [],
        
        // FAQs
        faqs: Array.isArray(product.faqs) ? product.faqs : []
    };
    
    // Agar features empty hai, toh specifications se features extract karein
    if (productData.features.length === 0 && productData.specifications.length > 0) {
        productData.features = productData.specifications.slice(0, 6).map(spec => spec.key || spec);
    }
    
    // Agar features abhi bhi empty hai, toh default features
    if (productData.features.length === 0) {
        productData.features = [
            'Premium quality material',
            'Corrosion resistant',
            'Durable and long lasting',
            'Easy to install',
            'Precision engineered',
            'Available in various sizes'
        ];
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(productData.name)} | Durable Fastener - Premium Fastener Manufacturer</title>
    <meta name="description" content="${escapeHtml(productData.shortDescription || productData.name)}">
    <meta name="keywords" content="${escapeHtml(productData.name)}, screws, fasteners, industrial fasteners, Durable Fastener">
    <link rel="canonical" href="https://durablefastener.com/product/${productData.slug}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(productData.name)} | Durable Fastener">
    <meta property="og:description" content="${escapeHtml(productData.shortDescription || productData.name)}">
    <meta property="og:url" content="https://durablefastener.com/product/${productData.slug}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Durable Fastener">
    ${productData.images[0] ? `<meta property="og:image" content="${productData.images[0]}">` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(productData.name)}">
    <meta name="twitter:description" content="${escapeHtml(productData.shortDescription || productData.name)}">
    
    <!-- Schema.org -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "${escapeHtml(productData.name)}",
        "description": "${escapeHtml(productData.shortDescription || productData.name)}",
        "brand": {
            "@type": "Brand",
            "name": "Durable Fastener"
        },
        "manufacturer": {
            "@type": "Organization",
            "name": "Durable Fastener Private Limited"
        },
        ${productData.material ? `"material": "${escapeHtml(productData.material)}",` : ''}
        "sku": "${productData.slug}"
    }
    </script>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f5f5f5; color: #1a1a1a; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        
        .product-header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: white;
            padding: 4rem 0;
            border-bottom: 4px solid #FFC800;
        }
        .product-header h1 { font-size: 3rem; color: #FFC800; margin-bottom: 0.5rem; }
        .product-header .short-description { font-size: 1.2rem; color: #cccccc; margin-top: 1rem; }
        .product-header .description { font-size: 1.1rem; color: #cccccc; max-width: 800px; margin-top: 1.5rem; }
        
        .product-info {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .features-section, .specs-section, .certifications-section {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        h2 { font-size: 1.8rem; color: #FFC800; margin-bottom: 1.5rem; border-left: 4px solid #FFC800; padding-left: 1rem; }
        
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
        
        .specs-table { width: 100%; border-collapse: collapse; }
        .specs-table tr { border-bottom: 1px solid #e0e0e0; }
        .specs-table td { padding: 1rem; }
        .specs-table td:first-child { font-weight: bold; width: 35%; background: #f9f9f9; }
        
        .material-badge {
            display: inline-block;
            background: #FFC80020;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            margin: 0.5rem 0;
        }
        
        .certification-list {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .cert-badge {
            background: #1a1a1a;
            color: #FFC800;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
        }
        
        .cta-section {
            background: #FFC800;
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
        }
        
        footer { background: #1a1a1a; color: #999; text-align: center; padding: 2rem; margin-top: 3rem; }
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
            <h1>${escapeHtml(productData.name)}</h1>
            ${productData.shortDescription ? `<div class="short-description">${escapeHtml(productData.shortDescription)}</div>` : ''}
            ${productData.material ? `<div class="material-badge">Material: ${escapeHtml(productData.material)}</div>` : ''}
        </div>
    </div>
    
    <div class="container">
        ${productData.images[0] ? `
        <div class="product-info">
            <img src="${productData.images[0]}" alt="${escapeHtml(productData.name)}" style="max-width: 100%; border-radius: 8px;">
        </div>
        ` : ''}
        
        ${productData.features.length > 0 ? `
        <div class="features-section">
            <h2>Key Features</h2>
            <div class="features-grid">
                ${productData.features.map(f => `
                    <div class="feature-card">
                        <h3>✓ ${escapeHtml(typeof f === 'string' ? f : f.key || f.name || 'Premium Quality')}</h3>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${productData.specifications.length > 0 ? `
        <div class="specs-section">
            <h2>Technical Specifications</h2>
            <table class="specs-table">
                ${productData.specifications.map(spec => `
                    <tr>
                        <td>${escapeHtml(spec.key || 'Specification')}</td>
                        <td>${escapeHtml(spec.value || spec)}</td>
                    </tr>
                `).join('')}
                ${productData.headType ? `
                <tr>
                    <td>Head Type</td>
                    <td>${escapeHtml(productData.headType)}</td>
                </tr>
                ` : ''}
                ${productData.threadType ? `
                <tr>
                    <td>Thread Type</td>
                    <td>${escapeHtml(productData.threadType)}</td>
                </tr>
                ` : ''}
                ${productData.driveType ? `
                <tr>
                    <td>Drive Type</td>
                    <td>${escapeHtml(productData.driveType)}</td>
                </tr>
                ` : ''}
            </table>
        </div>
        ` : ''}
        
        ${productData.certifications.length > 0 ? `
        <div class="certifications-section">
            <h2>Certifications & Standards</h2>
            <div class="certification-list">
                ${productData.certifications.map(cert => `
                    <span class="cert-badge">${escapeHtml(cert.title || cert)}</span>
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
            <p><a href="/privacy-policy">Privacy Policy</a> | <a href="/terms-and-conditions">Terms & Conditions</a></p>
        </div>
    </footer>
</body>
</html>`;
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function prerender() {
    console.log('🚀 Starting pre-rendering...\n');
    
    const products = await fetchProductsFromDB();
    
    if (!products || products.length === 0) {
        console.log('⚠️ No products found');
        return;
    }
    
    for (const product of products) {
        console.log(`📄 Generating: /product/${product.slug}/`);
        
        const html = generateProductHTML(product);
        const folderPath = path.join(__dirname, 'dist', 'product', product.slug);
        const filePath = path.join(folderPath, 'index.html');
        
        await fs.mkdir(folderPath, { recursive: true });
        await fs.writeFile(filePath, html);
        
        console.log(`✅ Generated: ${product.name}\n`);
    }
    
    console.log(`🎉 Successfully generated ${products.length} product pages!`);
}

prerender().catch(console.error);