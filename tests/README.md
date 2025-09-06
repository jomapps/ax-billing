# AX Billing - External Services Testing

This directory contains comprehensive tests for all external service integrations used in the AX Billing system.

## Overview

The testing suite validates the connectivity, configuration, and functionality of all external services including:

- **MongoDB Database** - Primary data storage
- **Cloudflare R2 Storage** - File storage (S3 compatible)
- **Gupshup WhatsApp API** - WhatsApp messaging service
- **OpenRouter AI** - Vehicle image processing and AI services
- **Fiuu Payment Gateway** - Payment processing
- **Network Connectivity** - General internet and DNS resolution

## Test Structure

### 1. Health Check Script (`scripts/test-external-services.ts`)
A comprehensive health check that validates all external services and provides a detailed report.

**Usage:**
```bash
pnpm run test:services
```

**Features:**
- Environment variable validation
- Service connectivity testing
- Configuration validation
- Detailed health report
- Non-destructive testing (no actual API calls that cost money)

### 2. Integration Tests (`tests/int/`)

#### `external-services.int.spec.ts`
Tests service initialization, configuration validation, and utility functions without making expensive API calls.

**Covers:**
- Database connection via Payload CMS
- Service class initialization
- Configuration validation
- Utility function testing (phone formatting, signature verification, etc.)
- Environment variable presence

#### `network-connectivity.int.spec.ts`
Tests actual network connectivity to external service endpoints.

**Covers:**
- API endpoint reachability
- DNS resolution
- Network connectivity validation
- Service-specific endpoint testing

#### `api.int.spec.ts`
Basic Payload CMS integration test.

## Running Tests

### Quick Health Check
```bash
pnpm run test:services
```
Runs the comprehensive health check script that validates all services.

### Integration Tests Only
```bash
pnpm run test:int
```
Runs integration tests in jsdom environment (excludes network tests).

### Network Tests Only
```bash
pnpm run test:network
```
Runs network connectivity tests in Node.js environment.

### Full Test Suite
```bash
pnpm run test:services:full
```
Runs all tests: health check + integration tests + network tests.

### All Tests (Including E2E)
```bash
pnpm run test
```
Runs integration tests + end-to-end tests.

## Environment Requirements

All tests require the following environment variables to be set in `.env`:

### Database
- `DATABASE_URI` - MongoDB connection string
- `PAYLOAD_SECRET` - Payload CMS secret key

### Cloudflare R2 Storage
- `S3_ENDPOINT` - R2 endpoint URL
- `S3_REGION` - R2 region
- `S3_BUCKET` - Bucket name
- `S3_ACCESS_KEY_ID` - Access key
- `S3_SECRET_ACCESS_KEY` - Secret key
- `S3_PUBLIC_BUCKET` - Public bucket URL

### WhatsApp (Gupshup)
- `GUPSHUP_API_KEY` - Gupshup API key
- `GUPSHUP_APP_NAME` - App name
- `GUPSHUP_SOURCE_NUMBER` - WhatsApp business number
- `GUPSHUP_TEST_CUSTOMER_NUMBER` - Test customer number
- `GUPSHUP_WEBHOOK_SECRET` - Webhook secret (optional)

### AI Services (OpenRouter)
- `OPENROUTER_API_KEY` - OpenRouter API key

### Payment Gateway (Fiuu)
- `FIUU_MERCHANT_ID` - Merchant ID
- `FIUU_VERIFY_KEY` - Verification key
- `FIUU_SECRET_KEY` - Secret key
- `FIUU_SANDBOX` - Sandbox mode flag

### Application
- `NEXT_PUBLIC_APP_URL` - Application URL

## Test Configuration

### Vitest Configurations

#### `vitest.config.mts`
- Environment: jsdom
- Includes: All integration tests except network tests
- Suitable for: Service initialization, utility functions, database tests

#### `vitest.network.config.mts`
- Environment: node
- Includes: Only network connectivity tests
- Suitable for: API endpoint testing, network validation

## Test Results Interpretation

### Health Check Results
- ✅ **Healthy**: Service is properly configured and accessible
- ⚠️ **Warning**: Service is accessible but may have minor issues
- ❌ **Error**: Service is not accessible or misconfigured

### Integration Test Results
- Tests validate service functionality without making expensive API calls
- Network-related tests are separated to avoid CORS issues in jsdom environment
- Database tests create and clean up test records

### Network Test Results
- Tests actual connectivity to external service endpoints
- Validates DNS resolution and network accessibility
- Uses timeouts to prevent hanging on network issues

## Adding New Service Tests

When adding a new external service:

1. **Add environment variables** to the health check script
2. **Create service tests** in `external-services.int.spec.ts`
3. **Add network tests** in `network-connectivity.int.spec.ts` if needed
4. **Update this README** with the new service information

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loaded**
   - Ensure `.env` file exists and is properly formatted
   - Check that `dotenv/config` is imported in test setup

2. **Network Test Failures**
   - Check internet connectivity
   - Verify firewall settings
   - Ensure API endpoints are accessible

3. **Database Connection Issues**
   - Verify MongoDB is running
   - Check database URI format
   - Ensure database exists

4. **CORS Errors in Tests**
   - Network tests should use Node.js environment
   - Service tests should use jsdom environment
   - Separate configurations handle this automatically

### Debug Mode

To run tests with more verbose output:
```bash
DEBUG=* pnpm run test:services:full
```

## Security Notes

- Tests avoid making actual API calls that incur costs
- No sensitive data is logged in test output
- API keys are masked in health check reports
- Test data is cleaned up after database tests
