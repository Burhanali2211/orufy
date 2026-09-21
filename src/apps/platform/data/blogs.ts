export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  seoKeywords: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'how-to-start-ecommerce-business-kashmir',
    title: 'How to Start an E-commerce Business in Kashmir Easily',
    excerpt: 'A simple step-by-step guide to taking your local Kashmiri business online. Sell your products to everyone in India.',
    content: `
      <h2>Why take your business online in Kashmir?</h2>
      <p>Kashmir has amazing local products like dry fruits, saffron, handicrafts, and pashmina. But selling them only in local shops limits your customers. By starting an e-commerce website, you can sell to people all over India and the world.</p>
      
      <h2>Step 1: Choose the right platform</h2>
      <p>Many platforms like Shopify are very complex and charge in dollars. Oru is made to be simple. You can create your online store in just 1 minute without any technical knowledge. It is the best e-commerce platform in Kashmir.</p>

      <h2>Step 2: Take good photos</h2>
      <p>People buy what they see. Use your smartphone to take clear, bright pictures of your products.</p>

      <h2>Step 3: Setup payments</h2>
      <p>With Oru, you do not need to register for complex payment gateways. The money from sales comes directly into your UPI or bank account. You can also offer Cash on Delivery (COD).</p>

      <h2>Start Today</h2>
      <p>Do not wait. Start your online business today with Oru and grow your sales.</p>
    `,
    author: 'Oru Team',
    date: '2023-10-25',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1000&auto=format&fit=crop',
    seoKeywords: 'start online business in Kashmir, e-commerce website in Kashmir, sell online Kashmir, online dukan, business tips Kashmir',
  },
  {
    id: '2',
    slug: 'sell-dry-fruits-online',
    title: 'How to Sell Kashmiri Dry Fruits Online and Make More Profit',
    excerpt: 'Learn how to reach direct customers across India and increase your profit margins by selling dry fruits online.',
    content: `
      <h2>The Demand for Kashmiri Dry Fruits</h2>
      <p>Walnuts, almonds, and saffron from Kashmir are famous everywhere. But if you sell to middlemen, your profit is low. Selling online directly to customers gives you the maximum profit.</p>

      <h2>How Oru Helps You</h2>
      <p>Oru is a multi-tenant website in Kashmir that lets you make your own shop in seconds. You just share your link on WhatsApp or Instagram.</p>

      <h2>Building Trust</h2>
      <p>Customers want authentic products. On your Oru store, you can write about your farm or shop to build trust. Since the money comes directly to you, customers feel safe buying from a direct seller.</p>
    `,
    author: 'Oru Team',
    date: '2023-11-05',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1000&auto=format&fit=crop',
    seoKeywords: 'sell dry fruits online, multi-tenant website in Kashmir, e-commerce in Kashmir, Kashmiri walnuts online, start business',
  }
];
