# Product Requirements Document: Database Migration from Supabase to PostgreSQL

## 1. Executive Summary

This document outlines the detailed requirements for migrating the Sufi Essences e-commerce website's database from Supabase to a self-hosted PostgreSQL solution. The migration aims to provide greater control, customization, and cost optimization while maintaining all existing functionality.

## 2. Current State Analysis

### 2.1 Technology Stack
- **Current Database**: Supabase (PostgreSQL-based Backend-as-a-Service)
- **Frontend**: React with TypeScript, Vite
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Real-time Subscriptions

### 2.2 Database Schema Overview
The current database contains the following key tables:
- `profiles` - User profiles and roles
- `categories` - Product categories
- `products` - Product catalog with variants
- `cart_items` - Shopping cart functionality
- `wishlist_items` - Wishlist functionality
- `orders` and `order_items` - Order management
- `reviews` - Product reviews
- `addresses` - User address management
- `payment_methods` - Payment method storage
- `inventory_transactions` - Inventory tracking
- `user_preferences` and `user_security_settings` - User settings

### 2.3 Key Features
- Row Level Security (RLS) policies for data protection
- Stored procedures for business logic
- Real-time data synchronization
- Authentication and authorization
- Comprehensive CRUD operations

## 3. Migration Objectives

### 3.1 Primary Goals
1. **Maintain Zero Downtime**: Ensure continuous operation during migration
2. **Data Integrity**: Preserve all existing data without loss
3. **Functionality Parity**: Maintain all existing features and performance
4. **Security**: Implement equivalent or better security measures
5. **Performance**: Maintain or improve current performance levels

### 3.2 Secondary Goals
1. **Cost Optimization**: Reduce operational costs compared to Supabase
2. **Customization**: Enable deeper database customization
3. **Control**: Gain full administrative control over the database

## 4. Technical Requirements

### 4.1 PostgreSQL Server Setup
- **Version**: PostgreSQL 17 (matching current Supabase version)
- **Hosting**: Self-hosted solution (cloud or dedicated server)
- **Extensions Required**:
  - `uuid-ossp` for UUID generation
  - `pgcrypto` for encryption functions
- **Security Configuration**:
  - SSL/TLS encryption
  - Role-based access control
  - Connection pooling
  - Regular security updates

### 4.2 Database Schema Migration
- **Schema Replication**: Exact replication of all existing tables
- **Constraints**: Primary keys, foreign keys, unique constraints
- **Indexes**: All existing indexes for performance
- **Triggers**: Update timestamp triggers
- **Views**: Statistical and analytical views
- **Stored Procedures**: All existing functions and procedures

### 4.3 Data Migration
- **Data Transfer**: Complete transfer of all existing data
- **Validation**: Data integrity checks post-migration
- **Transformation**: Any necessary data format conversions
- **Incremental Sync**: Continuous sync during cutover period

## 5. Component-by-Component Migration Plan

### 5.1 Authentication System
**Current Implementation**: Supabase Auth with custom profile tables
**Migration Approach**: 
1. Implement custom authentication system using PostgreSQL sessions
2. Migrate user data from `auth.users` to custom tables
3. Preserve existing user profiles in `public.profiles`

**Requirements**:
- User registration and login functionality
- Password hashing and security
- Session management
- Role-based access control
- Password reset functionality

### 5.2 User Profiles and Roles
**Current Implementation**: `profiles`, `user_preferences`, `user_security_settings` tables
**Migration Approach**: Direct schema and data migration

**Requirements**:
- Maintain all existing profile fields
- Preserve user preferences and security settings
- Ensure RLS policy equivalent implementation

### 5.3 Product Catalog
**Current Implementation**: `categories`, `products`, `product_variants` tables
**Migration Approach**: Direct schema and data migration

**Requirements**:
- Maintain all product attributes
- Preserve category hierarchy
- Keep product variant relationships
- Maintain search and filtering capabilities

### 5.4 Shopping Cart
**Current Implementation**: `cart_items` table with stored procedures
**Migration Approach**: Direct schema and data migration

**Requirements**:
- Preserve all cart functionality
- Maintain stored procedure logic
- Ensure real-time updates (if applicable)

### 5.5 Order Management
**Current Implementation**: `orders`, `order_items`, `order_tracking` tables
**Migration Approach**: Direct schema and data migration

**Requirements**:
- Maintain all order statuses and workflows
- Preserve order tracking functionality
- Keep payment integration points

### 5.6 Inventory Management
**Current Implementation**: `inventory_transactions`, `low_stock_alerts` tables
**Migration Approach**: Direct schema and data migration

**Requirements**:
- Maintain stock level tracking
- Preserve transaction history
- Keep low stock alerting functionality

### 5.7 Reviews and Ratings
**Current Implementation**: `reviews` table with triggers
**Migration Approach**: Direct schema and data migration

**Requirements**:
- Maintain review approval workflow
- Preserve rating calculation triggers
- Keep helpful count functionality

### 5.8 User Addresses and Payment Methods
**Current Implementation**: `addresses`, `payment_methods` tables
**Migration Approach**: Direct schema and data migration

**Requirements**:
- Maintain address book functionality
- Preserve payment method storage
- Keep default selection logic

## 6. Client-Side Implementation Requirements

### 6.1 Database Connection Layer
**Requirement**: Replace Supabase client with PostgreSQL client

**Implementation Steps**:
1. Install `pg` (node-postgres) client library
2. Create connection pool configuration
3. Implement connection management utilities
4. Replace all Supabase calls with direct PostgreSQL queries

### 6.2 Query Builder
**Requirement**: Maintain structured querying capabilities

**Implementation Steps**:
1. Enhance existing [QueryBuilder](file:///D:/perfumes/src/lib/queryBuilder.ts#L7-L98) to work with PostgreSQL
2. Implement parameterized queries for security
3. Add connection pooling support

### 6.3 Authentication Client
**Requirement**: Replace Supabase Auth with custom solution

**Implementation Steps**:
1. Implement session management
2. Create authentication API endpoints
3. Replace Supabase auth calls with custom authentication
4. Maintain user context in React contexts

### 6.4 Real-time Functionality
**Requirement**: Maintain real-time updates where critical

**Implementation Options**:
1. PostgreSQL LISTEN/NOTIFY with WebSocket server
2. Polling-based solution for less critical updates
3. Server-Sent Events (SSE) implementation

## 7. Security Requirements

### 7.1 Data Protection
- **Encryption**: SSL/TLS for data in transit
- **At-Rest**: Database encryption for sensitive data
- **Row-Level Security**: Implement equivalent to Supabase RLS
- **Access Control**: Role-based permissions for database users

### 7.2 Authentication Security
- **Password Hashing**: Use industry-standard bcrypt or Argon2
- **Session Management**: Secure session tokens with expiration
- **Rate Limiting**: Implement rate limiting for authentication endpoints
- **Audit Logging**: Log authentication events for security monitoring

### 7.3 API Security
- **Input Validation**: Validate all database inputs
- **SQL Injection Prevention**: Use parameterized queries exclusively
- **CORS Configuration**: Proper CORS settings for web client
- **API Rate Limiting**: Implement rate limiting for API endpoints

## 8. Performance Requirements

### 8.1 Query Performance
- **Indexing**: Implement all existing indexes
- **Query Optimization**: Optimize complex queries
- **Connection Pooling**: Implement efficient connection pooling
- **Caching**: Maintain existing caching strategies

### 8.2 Scalability
- **Read Replicas**: Support for read scaling
- **Partitioning**: Implement table partitioning where beneficial
- **Load Testing**: Conduct performance testing post-migration

### 8.3 Monitoring
- **Health Checks**: Database connectivity monitoring
- **Performance Metrics**: Query performance tracking
- **Alerting**: Notification for performance degradation

## 9. Migration Process

### 9.1 Phase 1: Preparation
1. **Environment Setup**: Provision PostgreSQL server
2. **Schema Creation**: Create all database tables and relationships
3. **Security Configuration**: Implement authentication and authorization
4. **Client Library Integration**: Add PostgreSQL client to application

### 9.2 Phase 2: Data Migration
1. **Initial Data Transfer**: Migrate snapshot of existing data
2. **Validation**: Verify data integrity
3. **Incremental Sync**: Implement continuous sync during testing

### 9.3 Phase 3: Functionality Migration
1. **CRUD Operations**: Migrate all create, read, update, delete operations
2. **Stored Procedures**: Recreate all database functions
3. **Triggers**: Implement all database triggers
4. **Views**: Recreate all database views

### 9.4 Phase 4: Client-Side Updates
1. **API Layer**: Replace Supabase calls with PostgreSQL queries
2. **Authentication**: Replace Supabase Auth with custom solution
3. **Real-time Features**: Implement real-time functionality
4. **Testing**: Comprehensive testing of all features

### 9.5 Phase 5: Cutover
1. **Final Sync**: Last data synchronization
2. **Testing**: Final validation of all functionality
3. **Go-Live**: Switch application to use new PostgreSQL database
4. **Monitoring**: Monitor system performance and stability

## 10. Detailed CRUD Operations Migration

### 10.1 User Management CRUD

#### Create (User Registration)
**Current**: Supabase auth.signUp() + profile creation
**New Implementation**:
1. Validate user input (email, password, name)
2. Hash password using bcrypt
3. Insert user record into custom users table
4. Create profile in profiles table
5. Send verification email
6. Return session token

#### Read (User Authentication)
**Current**: Supabase auth.signIn() + profile retrieval
**New Implementation**:
1. Validate email and password
2. Compare hashed password
3. Generate session token
4. Retrieve user profile
5. Return user data and session

#### Update (Profile Management)
**Current**: Supabase profile updates
**New Implementation**:
1. Validate session token
2. Authorize user for requested update
3. Update profile in database
4. Return updated profile data

#### Delete (Account Deletion)
**Current**: Supabase user deletion
**New Implementation**:
1. Validate user authorization
2. Delete related data (cascading deletes)
3. Remove user record
4. Invalidate session

### 10.2 Product Management CRUD

#### Create (Product Addition)
**Current**: Direct product insertion
**New Implementation**:
1. Validate admin/seller authorization
2. Validate product data
3. Insert product into products table
4. Create product variants if applicable
5. Update search indexes

#### Read (Product Retrieval)
**Current**: Supabase product queries
**New Implementation**:
1. Implement parameterized queries for:
   - Product by ID
   - Products by category
   - Product search
   - Featured products
2. Include related data (categories, variants)
3. Implement pagination
4. Add sorting options

#### Update (Product Modification)
**Current**: Supabase product updates
**New Implementation**:
1. Validate seller/admin authorization
2. Validate update data
3. Update product record
4. Update related variants
5. Update search indexes

#### Delete (Product Removal)
**Current**: Supabase product deletion
**New Implementation**:
1. Validate seller/admin authorization
2. Check for dependencies (orders, cart items)
3. Soft delete or cascade delete based on business rules
4. Update related data

### 10.3 Order Management CRUD

#### Create (Order Placement)
**Current**: Order creation with stored procedures
**New Implementation**:
1. Validate user/cart data
2. Calculate order totals
3. Insert order record
4. Insert order items
5. Update inventory
6. Send confirmation emails

#### Read (Order Retrieval)
**Current**: Supabase order queries
**New Implementation**:
1. Implement queries for:
   - User orders
   - Order by ID
   - Order tracking
2. Include related data (items, products)
3. Implement filtering by status

#### Update (Order Status)
**Current**: Order status updates
**New Implementation**:
1. Validate admin/seller authorization
2. Validate status transitions
3. Update order record
4. Add tracking information
5. Send status update emails

#### Delete (Order Cancellation)
**Current**: Order cancellation
**New Implementation**:
1. Validate user/admin authorization
2. Check cancellation policy
3. Update order status
4. Restore inventory
5. Process refunds if applicable

## 11. Testing Requirements

### 11.1 Unit Testing
- **Database Functions**: Test all stored procedures
- **CRUD Operations**: Validate all create, read, update, delete operations
- **Authentication**: Test login, registration, session management
- **Authorization**: Validate role-based access control

### 11.2 Integration Testing
- **API Endpoints**: Test all database-connected endpoints
- **Data Flow**: Validate data consistency across operations
- **Error Handling**: Test error scenarios and recovery

### 11.3 Performance Testing
- **Query Performance**: Benchmark query execution times
- **Load Testing**: Test system under expected load
- **Stress Testing**: Validate system behavior under peak load

### 11.4 Security Testing
- **SQL Injection**: Validate parameterized query implementation
- **Authentication**: Test authentication security
- **Authorization**: Validate access controls
- **Data Protection**: Verify encryption implementation

## 12. Rollback Plan

### 12.1 Conditions for Rollback
- Critical data loss
- Performance degradation beyond acceptable thresholds
- Security vulnerabilities
- Extended downtime

### 12.2 Rollback Process
1. **Immediate Actions**: Switch back to Supabase
2. **Data Recovery**: Restore from backup if needed
3. **Communication**: Notify stakeholders
4. **Analysis**: Identify root cause of issues
5. **Remediation**: Fix issues before retrying migration

## 13. Success Criteria

### 13.1 Functional Requirements
- [ ] All existing features work as before
- [ ] No data loss during migration
- [ ] Authentication and authorization work correctly
- [ ] Performance meets or exceeds current levels

### 13.2 Non-Functional Requirements
- [ ] System availability >= 99.9%
- [ ] Query response times within acceptable limits
- [ ] Security vulnerabilities reduced or maintained
- [ ] Cost savings achieved compared to Supabase

### 13.3 User Experience
- [ ] No degradation in user experience
- [ ] Faster or equivalent page load times
- [ ] Reliable real-time functionality where implemented

## 14. Timeline and Milestones

### 14.1 Phase 1: Preparation (2 weeks)
- Environment setup
- Schema creation
- Security configuration
- Client library integration

### 14.2 Phase 2: Data Migration (1 week)
- Initial data transfer
- Validation
- Incremental sync implementation

### 14.3 Phase 3: Functionality Migration (3 weeks)
- CRUD operations migration
- Stored procedures recreation
- Triggers implementation
- Views recreation

### 14.4 Phase 4: Client-Side Updates (2 weeks)
- API layer replacement
- Authentication replacement
- Real-time features implementation
- Testing

### 14.5 Phase 5: Cutover (1 week)
- Final sync
- Final testing
- Go-live
- Monitoring

## 15. Risk Assessment

### 15.1 Technical Risks
- **Data Loss**: Mitigated by comprehensive backups
- **Downtime**: Mitigated by phased approach and rollback plan
- **Performance Degradation**: Mitigated by performance testing
- **Security Vulnerabilities**: Mitigated by security testing

### 15.2 Operational Risks
- **Resource Constraints**: Mitigated by proper planning
- **Skill Gaps**: Mitigated by training and documentation
- **Third-party Dependencies**: Mitigated by vendor evaluation

### 15.3 Business Risks
- **Customer Impact**: Mitigated by zero-downtime approach
- **Revenue Impact**: Mitigated by phased rollout
- **Compliance Issues**: Mitigated by security and audit measures

## 16. Monitoring and Maintenance

### 16.1 Database Monitoring
- Connection pool utilization
- Query performance metrics
- Storage utilization
- Backup status

### 16.2 Application Monitoring
- API response times
- Error rates
- User experience metrics
- Real-time functionality status

### 16.3 Maintenance Procedures
- Regular backups
- Security updates
- Performance tuning
- Capacity planning

## 17. Documentation and Knowledge Transfer

### 17.1 Technical Documentation
- Database schema documentation
- API documentation
- Security procedures
- Operational procedures

### 17.2 Knowledge Transfer
- Team training sessions
- Operational handover
- Support procedures
- Contact information for key personnel

## 18. Conclusion

This PRD provides a comprehensive guide for migrating the Sufi Essences website from Supabase to a self-hosted PostgreSQL solution. By following this detailed plan, the migration can be executed with minimal risk while maintaining all existing functionality and improving long-term maintainability and cost efficiency.