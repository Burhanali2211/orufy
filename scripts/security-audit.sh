#!/bin/bash

# Security Audit Script for Perfumes E-Commerce Platform
# This script runs various security checks and generates a comprehensive report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Output directory
OUTPUT_DIR="security-audit-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/security-audit-$TIMESTAMP.txt"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Security Audit - Perfumes Platform${NC}"
echo -e "${BLUE}  $(date)${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Start report
{
    echo "========================================="
    echo "  SECURITY AUDIT REPORT"
    echo "  Date: $(date)"
    echo "========================================="
    echo ""

    # 1. NPM Audit
    print_section "1. NPM Dependency Audit"
    echo "Running npm audit..."
    
    if npm audit --json > "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" 2>&1; then
        print_success "No vulnerabilities found in npm dependencies"
        echo "✓ No vulnerabilities found" >> "$REPORT_FILE"
    else
        print_warning "Vulnerabilities found in npm dependencies"
        echo "⚠ Vulnerabilities found - see npm-audit-$TIMESTAMP.json" >> "$REPORT_FILE"
        npm audit >> "$REPORT_FILE" 2>&1 || true
    fi

    # 2. Check for sensitive files
    print_section "2. Sensitive Files Check"
    echo "Checking for sensitive files in repository..."
    
    SENSITIVE_FILES=(".env" "*.pem" "*.key" "*.p12" "*.pfx" "id_rsa" "id_dsa")
    FOUND_SENSITIVE=false
    
    for pattern in "${SENSITIVE_FILES[@]}"; do
        if find . -name "$pattern" -not -path "./node_modules/*" -not -path "./.git/*" | grep -q .; then
            print_error "Found sensitive file matching pattern: $pattern"
            echo "✗ Found: $pattern" >> "$REPORT_FILE"
            FOUND_SENSITIVE=true
        fi
    done
    
    if [ "$FOUND_SENSITIVE" = false ]; then
        print_success "No sensitive files found in repository"
        echo "✓ No sensitive files found" >> "$REPORT_FILE"
    fi

    # 3. Check environment variables
    print_section "3. Environment Variables Check"
    echo "Checking for hardcoded secrets..."
    
    # Check for common secret patterns
    if grep -r -E "(password|secret|api_key|private_key|token).*=.*['\"][^'\"]{8,}['\"]" \
        --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" \
        --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
        . > "$OUTPUT_DIR/hardcoded-secrets-$TIMESTAMP.txt" 2>&1; then
        print_warning "Potential hardcoded secrets found"
        echo "⚠ Potential hardcoded secrets found - see hardcoded-secrets-$TIMESTAMP.txt" >> "$REPORT_FILE"
    else
        print_success "No obvious hardcoded secrets found"
        echo "✓ No obvious hardcoded secrets found" >> "$REPORT_FILE"
    fi

    # 4. Check for SQL injection vulnerabilities
    print_section "4. SQL Injection Check"
    echo "Checking for potential SQL injection vulnerabilities..."
    
    if grep -r -E "query\(.*\+.*\)" \
        --include="*.ts" --include="*.js" \
        --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
        . > "$OUTPUT_DIR/sql-injection-$TIMESTAMP.txt" 2>&1; then
        print_warning "Potential SQL injection vulnerabilities found"
        echo "⚠ Potential SQL injection found - see sql-injection-$TIMESTAMP.txt" >> "$REPORT_FILE"
    else
        print_success "No obvious SQL injection vulnerabilities found"
        echo "✓ No obvious SQL injection vulnerabilities" >> "$REPORT_FILE"
    fi

    # 5. Check CORS configuration
    print_section "5. CORS Configuration Check"
    echo "Checking CORS configuration..."
    
    if grep -r "cors()" --include="*.ts" --include="*.js" \
        --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git . | grep -q .; then
        print_warning "CORS middleware found - verify configuration is secure"
        echo "⚠ CORS middleware found - manual review required" >> "$REPORT_FILE"
    else
        print_success "No CORS middleware found or properly configured"
        echo "✓ CORS check passed" >> "$REPORT_FILE"
    fi

    # 6. Check for console.log statements
    print_section "6. Debug Statements Check"
    echo "Checking for console.log statements in production code..."
    
    CONSOLE_COUNT=$(grep -r "console\\.log" \
        --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" \
        --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
        --exclude-dir=__tests__ . | wc -l)
    
    if [ "$CONSOLE_COUNT" -gt 10 ]; then
        print_warning "Found $CONSOLE_COUNT console.log statements"
        echo "⚠ Found $CONSOLE_COUNT console.log statements" >> "$REPORT_FILE"
    else
        print_success "Minimal console.log statements found ($CONSOLE_COUNT)"
        echo "✓ Console.log check passed ($CONSOLE_COUNT found)" >> "$REPORT_FILE"
    fi

} | tee -a "$REPORT_FILE"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Security Audit Complete${NC}"
echo -e "${GREEN}  Report saved to: $REPORT_FILE${NC}"
echo -e "${GREEN}========================================${NC}\n"

