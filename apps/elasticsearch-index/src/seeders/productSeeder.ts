import "reflect-metadata";
import {appContainer} from "../app/appContainer.js";
import {TYPES} from "@my/common";
import {SequelizeManager} from "@my/sequelize";
import {ProductService} from "../services/ProductService.js";

const CATEGORIES = [
    "Electronics",
    "Clothing",
    "Books",
    "Home & Garden",
    "Sports & Outdoors",
    "Toys & Games",
    "Health & Beauty",
    "Automotive",
    "Food & Beverages",
    "Office Supplies"
];

const PRODUCT_TEMPLATES: Record<string, string[]> = {
    "Electronics": [
        "Wireless Bluetooth Headphones",
        "Smart Watch Pro",
        "Portable Charger 20000mAh",
        "4K Ultra HD Monitor",
        "Mechanical Gaming Keyboard",
        "Wireless Mouse",
        "USB-C Hub Adapter",
        "External SSD 1TB",
        "Webcam HD 1080p",
        "LED Desk Lamp"
    ],
    "Clothing": [
        "Cotton T-Shirt",
        "Denim Jeans",
        "Running Shoes",
        "Winter Jacket",
        "Leather Belt",
        "Baseball Cap",
        "Yoga Pants",
        "Hoodie Sweatshirt",
        "Dress Shirt",
        "Athletic Socks"
    ],
    "Books": [
        "The Complete Guide to Programming",
        "Mystery Novel Collection",
        "Cooking Made Easy",
        "Self-Help Best Seller",
        "Historical Biography",
        "Science Fiction Epic",
        "Children's Adventure Book",
        "Business Strategy Guide",
        "Travel Photography Book",
        "Language Learning Course"
    ],
    "Home & Garden": [
        "Stainless Steel Cookware Set",
        "Garden Tool Kit",
        "LED String Lights",
        "Throw Pillow Set",
        "Plant Pot Collection",
        "Bath Towel Set",
        "Picture Frame Set",
        "Storage Basket",
        "Wall Clock",
        "Indoor Plant"
    ],
    "Sports & Outdoors": [
        "Yoga Mat",
        "Camping Tent",
        "Water Bottle",
        "Hiking Backpack",
        "Resistance Bands Set",
        "Bicycle Helmet",
        "Fishing Rod",
        "Soccer Ball",
        "Tennis Racket",
        "Skateboard"
    ],
    "Toys & Games": [
        "Building Blocks Set",
        "Board Game Classic",
        "Puzzle 1000 Pieces",
        "Remote Control Car",
        "Stuffed Animal",
        "Art Supplies Kit",
        "Educational STEM Toy",
        "Action Figure",
        "Card Game",
        "Musical Instrument Toy"
    ],
    "Health & Beauty": [
        "Facial Cleanser",
        "Hair Dryer",
        "Essential Oil Set",
        "Massage Gun",
        "Skincare Set",
        "Electric Toothbrush",
        "Makeup Brush Set",
        "Fitness Tracker",
        "Vitamin Supplements",
        "Nail Care Kit"
    ],
    "Automotive": [
        "Car Phone Mount",
        "Dash Cam",
        "Tire Pressure Gauge",
        "Car Vacuum Cleaner",
        "Jump Starter",
        "Car Air Freshener",
        "Seat Covers",
        "Floor Mats",
        "Car Charger",
        "Windshield Sunshade"
    ],
    "Food & Beverages": [
        "Organic Coffee Beans",
        "Green Tea Collection",
        "Protein Powder",
        "Organic Honey",
        "Dried Fruit Mix",
        "Gourmet Chocolate",
        "Olive Oil Extra Virgin",
        "Spice Collection",
        "Energy Bars Box",
        "Herbal Tea Set"
    ],
    "Office Supplies": [
        "Notebook Set",
        "Gel Pen Pack",
        "Desk Organizer",
        "Sticky Notes",
        "Paper Clips Box",
        "Stapler",
        "File Folders",
        "Whiteboard Markers",
        "Calculator",
        "Tape Dispenser"
    ]
};

const DESCRIPTIONS = [
    "High quality product designed for everyday use",
    "Premium materials with excellent durability",
    "Perfect for home or office use",
    "Great value for money",
    "Customer favorite - highly rated",
    "Latest model with advanced features",
    "Eco-friendly and sustainable",
    "Professional grade quality",
    "Ergonomic design for comfort",
    "Compact and portable"
];

const TAGS_BY_CATEGORY: Record<string, string[]> = {
    "Electronics": ["tech", "gadget", "digital", "smart", "wireless"],
    "Clothing": ["fashion", "apparel", "style", "comfort", "trendy"],
    "Books": ["reading", "literature", "education", "entertainment", "bestseller"],
    "Home & Garden": ["home", "decor", "lifestyle", "garden", "interior"],
    "Sports & Outdoors": ["fitness", "outdoor", "active", "adventure", "sports"],
    "Toys & Games": ["kids", "fun", "educational", "entertainment", "family"],
    "Health & Beauty": ["wellness", "beauty", "selfcare", "health", "cosmetics"],
    "Automotive": ["car", "vehicle", "auto", "driving", "accessories"],
    "Food & Beverages": ["organic", "natural", "gourmet", "healthy", "snacks"],
    "Office Supplies": ["office", "stationery", "work", "business", "productivity"]
};

function generateSKU(category: string, index: number): string {
    const categoryCode = category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${categoryCode}-${timestamp}-${String(index).padStart(4, '0')}`;
}

function randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomPrice(min: number = 9.99, max: number = 999.99): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomStock(): number {
    return Math.floor(Math.random() * 500);
}

function randomStatus(): "active" | "inactive" | "discontinued" {
    const rand = Math.random();
    if (rand < 0.8) return "active";
    if (rand < 0.95) return "inactive";
    return "discontinued";
}

const args = process.argv.slice(2);
const countArg = args.find(arg => arg.startsWith("--count="));
const count = countArg ? parseInt(countArg.split("=")[1]) : 100;

await appContainer.run(async (app) => {
    try {
        const sequelizeManager = app.get<SequelizeManager>(TYPES.SequelizeManager);
        await sequelizeManager.connection();
        const productService = app.get<ProductService>("ProductService");
        const productsToCreate = [];
        console.log(`Generating ${count} products...`);

        for (let i = 0; i < count; i++) {
            const category = randomElement(CATEGORIES);
            const productTemplates = PRODUCT_TEMPLATES[category];
            const name = randomElement(productTemplates);
            const description = randomElement(DESCRIPTIONS);
            const tags = TAGS_BY_CATEGORY[category];

            const numTags = Math.floor(Math.random() * 3) + 2;
            const selectedTags: string[] = [];
            for (let j = 0; j < numTags; j++) {
                const tag = randomElement(tags);
                if (!selectedTags.includes(tag)) {
                    selectedTags.push(tag);
                }
            }

            productsToCreate.push({
                name: `${name} - ${category}`,
                description,
                sku: generateSKU(category, i),
                price: randomPrice(),
                category,
                stock_quantity: randomStock(),
                status: randomStatus(),
                tags: selectedTags
            });
        }

        console.log("");
        console.log("Creating products in batches...");
        console.log("");

        let created = 0;
        let failed = 0;

        const BATCH_SIZE = 10;
        for (let i = 0; i < productsToCreate.length; i += BATCH_SIZE) {
            const batch = productsToCreate.slice(i, i + BATCH_SIZE);

            const results = await productService.bulkCreateProducts(batch);

            created += results.length;
            failed += (batch.length - results.length);

            const progress = Math.round(((i + batch.length) / productsToCreate.length) * 100);
            console.log(`Progress: ${progress}% (${i + batch.length}/${productsToCreate.length})`);
        }

        console.log("");
        console.log("=".repeat(60));
        console.log("Seeding Summary");
        console.log("=".repeat(60));
        console.log(`Total products:       ${count}`);
        console.log(`Successfully created: ${created}`);
        console.log(`Failed:               ${failed}`);
        console.log("=".repeat(60));

        console.log("");
        console.log("Product Statistics:");
        const stats = await productService.getProductStats();
        console.log(`Total products:   ${stats.total}`);
        console.log(`Total value:      $${stats.totalValue.toFixed(2)}`);
        console.log("");
        console.log("By Status:");
        Object.entries(stats.byStatus).forEach(([status, count]) => {
            console.log(`  ${status}: ${count}`);
        });
        console.log("");
        console.log("By Category:");
        Object.entries(stats.byCategory).forEach(([category, count]) => {
            console.log(`  ${category}: ${count}`);
        });

        console.log("");
        console.log("✓ Seeding completed successfully!");
        console.log("");
        console.log("Next steps:");
        console.log("  1. Run 'npm run sync:initial' to sync products to Elasticsearch");
        console.log("  2. Run 'npm run worker:sync' to start the real-time sync worker");
        console.log("");

    } catch (error) {
        console.error("✗ Seeding failed:", error);
        process.exit(1);
    }
});