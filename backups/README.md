# Database Backup and Restore

This directory contains MongoDB database backups for the ax-billing project.

## Scripts

### Backup Database
```bash
pnpm db:backup
```

Creates a compressed backup of the MongoDB database in the `/backups` folder with timestamp.

**Features:**
- Automatically reads database configuration from `.env` file
- Creates timestamped backup files (e.g., `backup-2025-09-07T10-57-16-511Z.tar.gz`)
- Compresses backups using tar.gz for space efficiency
- Lists all available backups after completion
- Supports authentication if configured in DATABASE_URI

### Restore Database
```bash
# Restore latest backup
pnpm db:restore

# Restore specific backup
pnpm db:restore backup-2025-09-07T10-57-16-511Z.tar.gz

# Restore with partial filename (auto-completes)
pnpm db:restore 2025-09-07T10-57-16-511Z

# Show help
pnpm db:restore --help
```

**Features:**
- Automatically uses latest backup if no filename specified
- Supports partial filename matching with auto-completion
- Drops existing collections before restore (--drop flag)
- Extracts compressed backups automatically
- Cleans up temporary files after restore

## Requirements

- MongoDB Database Tools must be installed
- `mongodump` and `mongorestore` commands must be available in PATH
- Install from: https://docs.mongodb.com/database-tools/installation/

## Backup File Format

Backup files are named with the pattern: `backup-YYYY-MM-DDTHH-mm-ss-sssZ.tar.gz`

Example: `backup-2025-09-07T10-57-16-511Z.tar.gz`

## Environment Variables

The scripts read the following environment variables from `.env`:

- `DATABASE_URI`: MongoDB connection string (required)

Example:
```
DATABASE_URI=mongodb://127.0.0.1:27017/ax-billing
```

## Safety Features

- **Backup**: Creates timestamped files to prevent overwrites
- **Restore**: Shows warning before proceeding with database replacement
- **Error Handling**: Cleans up temporary files on failure
- **Validation**: Checks for required tools and environment variables

## Storage

- Backups are stored in the `/backups` directory
- Files are compressed using tar.gz format
- Directory is automatically created if it doesn't exist
- Old backups are preserved (manual cleanup required)
