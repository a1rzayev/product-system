# Product System

A comprehensive e-commerce product management system built with Next.js, Prisma, and PostgreSQL.

## Features

### 🛍️ Product Management
- **Products**: Full CRUD operations with rich metadata
- **Categories**: Hierarchical category system with parent-child relationships
- **Product Variants**: Support for different sizes, colors, storage options, etc.
- **Product Images**: Multiple images per product with ordering
- **Inventory Management**: Stock tracking with reserved quantities

### 👥 User Management
- **User Authentication**: Role-based access (Admin/Customer)
- **User Profiles**: Personal information and order history
- **Shopping Cart**: Persistent cart functionality

### 📦 Order Management
- **Orders**: Complete order lifecycle management
- **Order Items**: Detailed order line items with variants
- **Order Status**: Multiple status tracking (Pending, Confirmed, Processing, Shipped, etc.)

### ⭐ Reviews & Ratings
- **Product Reviews**: Customer reviews with ratings
- **Review Verification**: Verified purchase reviews
- **Rating System**: 1-5 star rating system

### 🛒 Shopping Experience
- **Product Search**: Search by name, description, or SKU
- **Category Filtering**: Filter products by category
- **Featured Products**: Highlight special products
- **Pagination**: Efficient product browsing

## Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Authentication**: JWT-based (ready for NextAuth.js)

## Database Schema

### Core Models

1. **User** - Authentication and user management
2. **Product** - Main product information
3. **Category** - Product categorization with hierarchy
4. **ProductImage** - Product images with ordering
5. **ProductVariant** - Product variations (size, color, etc.)
6. **Inventory** - Stock management
7. **Order** - Customer orders
8. **OrderItem** - Individual items in orders
9. **Review** - Product reviews and ratings
10. **CartItem** - Shopping cart items

### Key Relationships

- Products belong to Categories (with hierarchical support)
- Products have multiple Images and Variants
- Products have Inventory tracking
- Users can place Orders with multiple OrderItems
- Users can write Reviews for Products
- Users have Shopping Cart with CartItems

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd product-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/product_system"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   JWT_SECRET="your-jwt-secret-here"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and apply migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

## Sample Data

The seed script creates:

- **Categories**: Electronics, Clothing, Home & Garden with subcategories
- **Products**: iPhone 15 Pro, MacBook Pro, T-Shirt, Summer Dress
- **Users**: Admin (admin@example.com) and Customer (customer@example.com)
- **Product Variants**: Storage options for electronics, sizes for clothing
- **Reviews**: Sample customer reviews
- **Inventory**: Stock quantities for all products

### Default Credentials

- **Admin**: admin@example.com / admin123
- **Customer**: customer@example.com / customer123

## Project Structure

```
product-system/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seed script
├── src/
│   ├── app/              # Next.js app directory
│   ├── lib/
│   │   ├── prisma.ts     # Prisma client
│   │   └── db.ts         # Database service functions
│   └── types/
│       └── index.ts      # TypeScript type definitions
├── .env.example          # Environment variables template
└── package.json          # Dependencies and scripts
```

## API Structure

The system is designed with a service layer pattern:

- **productService**: Product CRUD operations
- **categoryService**: Category management
- **userService**: User authentication and management
- **orderService**: Order processing and management
- **reviewService**: Review and rating operations
- **cartService**: Shopping cart functionality

## Development

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma`
2. **Generate Client**: Run `npm run db:generate`
3. **Apply Changes**: Run `npm run db:push` or `npm run db:migrate`
4. **Update Types**: Modify `src/types/index.ts` if needed
5. **Add Services**: Extend `src/lib/db.ts` with new functions
6. **Create API Routes**: Add Next.js API routes in `src/app/api/`

### Code Style

- Use TypeScript for type safety
- Follow Next.js 13+ app directory conventions
- Use Prisma for all database operations
- Implement proper error handling
- Add JSDoc comments for complex functions

## Production Deployment

### Environment Variables

Ensure all required environment variables are set:

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="your-production-domain"
NEXTAUTH_SECRET="your-production-secret"
JWT_SECRET="your-production-jwt-secret"
```

### Database Migration

```bash
# Generate production migration
npm run db:migrate

# Apply migrations to production
npx prisma migrate deploy
```

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
