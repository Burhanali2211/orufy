# PostgreSQL Server Setup Guide for Sufi Essences Migration

## Overview
This guide provides step-by-step instructions for setting up a PostgreSQL server environment for the Sufi Essences database migration from Supabase. The setup includes installing PostgreSQL 17, configuring security settings, and preparing the environment for the migration.

## Prerequisites
- Server with at least 4GB RAM and 20GB free disk space
- Ubuntu 20.04 LTS or newer (or equivalent Linux distribution)
- Root or sudo access to the server
- Basic knowledge of Linux command line

## Installation Steps

### 1. Update System Packages
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install PostgreSQL Repository
```bash
# Import the repository signing key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Add the PostgreSQL APT repository
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
```

### 3. Install PostgreSQL 17
```bash
# Update package list
sudo apt update

# Install PostgreSQL 17
sudo apt install -y postgresql-17 postgresql-client-17 postgresql-contrib-17
```

### 4. Start and Enable PostgreSQL Service
```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Check service status
sudo systemctl status postgresql
```

## Configuration

### 1. Configure PostgreSQL Settings
Edit the main configuration file:
```bash
sudo nano /etc/postgresql/17/main/postgresql.conf
```

Modify the following settings:
```conf
# Connection settings
listen_addresses = 'localhost,127.0.0.1'  # Add your server IP if needed
port = 5432
max_connections = 200

# Memory settings (adjust based on your server resources)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# SSL settings
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

### 2. Configure Client Authentication
Edit the authentication configuration:
```bash
sudo nano /etc/postgresql/17/main/pg_hba.conf
```

Add or modify the following lines:
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# Application connection (adjust IP range as needed)
host    sufi_essences   app_user        192.168.1.0/24          md5
```

### 3. Restart PostgreSQL Service
```bash
sudo systemctl restart postgresql
```

## Database and User Setup

### 1. Access PostgreSQL as Superuser
```bash
sudo -u postgres psql
```

### 2. Create Database and Users
```sql
-- Create the application database
CREATE DATABASE sufi_essences OWNER postgres;

-- Create application user
CREATE USER app_user WITH PASSWORD 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sufi_essences TO app_user;

-- Connect to the new database
\c sufi_essences

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO app_user;
```

### 3. Enable Required Extensions
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify extensions
SELECT name FROM pg_available_extensions WHERE installed_version IS NOT NULL;
```

### 4. Exit PostgreSQL
```sql
\q
```

## Security Configuration

### 1. Set Strong Passwords
```bash
# Change postgres user password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'very_secure_postgres_password';"
```

### 2. Configure Firewall
```bash
# Allow PostgreSQL through firewall (if using ufw)
sudo ufw allow 5432/tcp

# Or restrict to specific IP range
sudo ufw allow from 192.168.1.0/24 to any port 5432
```

### 3. SSL Certificate Setup (Production)
For production environments, replace the default self-signed certificate:
```bash
# Place your SSL certificate and key in PostgreSQL directory
sudo cp your_server.crt /etc/ssl/certs/postgresql.crt
sudo cp your_private.key /etc/ssl/private/postgresql.key

# Set proper permissions
sudo chown postgres:postgres /etc/ssl/certs/postgresql.crt
sudo chown postgres:postgres /etc/ssl/private/postgresql.key
sudo chmod 600 /etc/ssl/private/postgresql.key

# Update PostgreSQL configuration to use your certificates
sudo nano /etc/postgresql/17/main/postgresql.conf
```

Update the SSL settings:
```conf
ssl_cert_file = '/etc/ssl/certs/postgresql.crt'
ssl_key_file = '/etc/ssl/private/postgresql.key'
```

## Backup and Recovery Setup

### 1. Create Backup Script
Create a backup script at `/usr/local/bin/backup-postgres.sh`:
```bash
#!/bin/bash
# PostgreSQL Backup Script

# Configuration
DB_NAME="sufi_essences"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U postgres -h localhost $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 7 days
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### 2. Make Script Executable
```bash
sudo chmod +x /usr/local/bin/backup-postgres.sh
```

### 3. Schedule Automated Backups
Add to crontab for daily backups at 2 AM:
```bash
sudo crontab -e
```

Add the following line:
```cron
0 2 * * * /usr/local/bin/backup-postgres.sh
```

## Testing the Setup

### 1. Test Database Connection
```bash
# Test local connection
psql -U postgres -d sufi_essences -h localhost

# Test application user connection
psql -U app_user -d sufi_essences -h localhost
```

### 2. Verify Extensions
```sql
-- Connect to database and verify extensions
SELECT name FROM pg_available_extensions WHERE installed_version IS NOT NULL;
```

### 3. Test Basic Operations
```sql
-- Create test table
CREATE TABLE test_table (id SERIAL PRIMARY KEY, name VARCHAR(100));

-- Insert test data
INSERT INTO test_table (name) VALUES ('Test Entry');

-- Query test data
SELECT * FROM test_table;

-- Clean up
DROP TABLE test_table;
```

## Performance Tuning

### 1. Monitor Performance
```bash
# Check current connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('sufi_essences'));"
```

### 2. Enable Query Logging (for debugging)
Add to `postgresql.conf`:
```conf
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000  # Log queries taking longer than 1 second
```

## Troubleshooting

### Common Issues and Solutions

1. **Connection Refused**
   - Check if PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify `listen_addresses` in `postgresql.conf`
   - Check firewall settings

2. **Authentication Failed**
   - Verify entries in `pg_hba.conf`
   - Check user passwords
   - Ensure correct username and database name

3. **Permission Denied**
   - Verify user privileges with `GRANT` statements
   - Check schema permissions

4. **Insufficient Memory**
   - Adjust `shared_buffers` and `work_mem` settings
   - Monitor system resources with `htop`

## Next Steps

After completing this setup, proceed with:
1. Creating the database schema as defined in the migration documentation
2. Setting up the application connection pool
3. Testing connectivity from the application server
4. Implementing the data migration process

## Security Best Practices

1. **Regular Updates**: Keep PostgreSQL updated with security patches
2. **Strong Passwords**: Use complex passwords and rotate them periodically
3. **Network Security**: Restrict database access to specific IP ranges
4. **Encryption**: Use SSL/TLS for all connections
5. **Auditing**: Enable logging for security-relevant events
6. **Backups**: Regular backups with secure storage
7. **Monitoring**: Continuous monitoring for suspicious activity

This setup provides a solid foundation for the Sufi Essences database migration to PostgreSQL, ensuring security, performance, and reliability for the production environment.