#!/usr/bin/env tsx

import dotenv from 'dotenv'
import path from 'path'
import { execSync } from 'child_process'
import fs from 'fs'

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Verify environment variables are loaded
console.log('Environment check:')
console.log('DATABASE_URI:', process.env.DATABASE_URI ? 'Set' : 'Missing')

function parseMongoUri(uri: string) {
  try {
    const url = new URL(uri)
    return {
      host: url.hostname,
      port: url.port || '27017',
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username || undefined,
      password: url.password || undefined,
    }
  } catch (error) {
    console.error('❌ Error parsing MongoDB URI:', error)
    process.exit(1)
  }
}

function listAvailableBackups(): string[] {
  const backupDir = path.resolve(process.cwd(), 'backups')
  
  if (!fs.existsSync(backupDir)) {
    console.error('❌ Backups directory does not exist')
    process.exit(1)
  }

  const backupFiles = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('backup-') && file.endsWith('.tar.gz'))
    .sort()
    .reverse() // Most recent first

  if (backupFiles.length === 0) {
    console.error('❌ No backup files found in backups directory')
    process.exit(1)
  }

  return backupFiles
}

function selectBackupFile(filename?: string): string {
  const backupDir = path.resolve(process.cwd(), 'backups')
  const availableBackups = listAvailableBackups()

  if (filename) {
    // User specified a filename
    let targetFile = filename
    
    // Add .tar.gz extension if not present
    if (!targetFile.endsWith('.tar.gz')) {
      targetFile += '.tar.gz'
    }
    
    // Add backup- prefix if not present
    if (!targetFile.startsWith('backup-')) {
      targetFile = `backup-${targetFile}`
    }

    const backupPath = path.join(backupDir, targetFile)
    
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Backup file not found: ${targetFile}`)
      console.log('\n📋 Available backups:')
      availableBackups.forEach((file, index) => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        const size = (stats.size / 1024 / 1024).toFixed(2)
        console.log(`  ${index + 1}. ${file} (${size} MB)`)
      })
      process.exit(1)
    }
    
    return backupPath
  } else {
    // Use the latest backup
    const latestBackup = availableBackups[0]
    console.log(`🔄 No backup file specified, using latest: ${latestBackup}`)
    return path.join(backupDir, latestBackup)
  }
}

async function restoreDatabase(backupFilename?: string) {
  const databaseUri = process.env.DATABASE_URI
  
  if (!databaseUri) {
    console.error('❌ DATABASE_URI environment variable is not set')
    process.exit(1)
  }

  console.log('🔄 Starting MongoDB restore...')

  const mongoConfig = parseMongoUri(databaseUri)
  const backupPath = selectBackupFile(backupFilename)
  const tempDir = path.join(path.dirname(backupPath), 'temp-restore')

  console.log(`📦 Restoring from: ${path.basename(backupPath)}`)
  console.log(`🗄️  Target database: ${mongoConfig.database}`)

  try {
    // Extract the backup archive
    console.log('📂 Extracting backup archive...')
    if (fs.existsSync(tempDir)) {
      execSync(`rm -rf "${tempDir}"`, { stdio: 'inherit' })
    }
    fs.mkdirSync(tempDir, { recursive: true })
    
    execSync(`tar -xzf "${backupPath}" -C "${tempDir}"`, { stdio: 'inherit' })

    // Find the database directory in the extracted files
    const dbDir = path.join(tempDir, mongoConfig.database)
    if (!fs.existsSync(dbDir)) {
      console.error(`❌ Database directory not found in backup: ${mongoConfig.database}`)
      process.exit(1)
    }

    // Confirm before proceeding
    console.log('\n⚠️  WARNING: This will replace all data in the target database!')
    console.log(`Database: ${mongoConfig.database}`)
    console.log(`Host: ${mongoConfig.host}:${mongoConfig.port}`)
    
    // In a script environment, we'll proceed automatically
    // In interactive mode, you might want to add a prompt here
    
    // Build mongorestore command
    let mongorestoreCmd = `mongorestore --host ${mongoConfig.host}:${mongoConfig.port} --db ${mongoConfig.database} --drop "${dbDir}"`
    
    // Add authentication if provided
    if (mongoConfig.username && mongoConfig.password) {
      mongorestoreCmd += ` --username "${mongoConfig.username}" --password "${mongoConfig.password}"`
    }

    console.log('🔄 Running mongorestore...')
    console.log(`Command: ${mongorestoreCmd.replace(/--password "[^"]*"/, '--password "***"')}`)
    
    execSync(mongorestoreCmd, { stdio: 'inherit' })

    console.log('✅ Database restore completed successfully!')
    console.log(`📊 Database: ${mongoConfig.database}`)
    console.log(`📦 Restored from: ${path.basename(backupPath)}`)

  } catch (error) {
    console.error('❌ Restore failed:', error)
    process.exit(1)
  } finally {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      execSync(`rm -rf "${tempDir}"`, { stdio: 'inherit' })
    }
  }
}

// Check if mongorestore is available
try {
  execSync('mongorestore --version', { stdio: 'pipe' })
} catch (error) {
  console.error('❌ mongorestore is not installed or not in PATH')
  console.error('Please install MongoDB Database Tools: https://docs.mongodb.com/database-tools/installation/')
  process.exit(1)
}

// Parse command line arguments
const args = process.argv.slice(2)
const backupFilename = args[0]

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: pnpm db:restore [backup-filename]')
  console.log('')
  console.log('Arguments:')
  console.log('  backup-filename  Optional. Name of backup file to restore.')
  console.log('                   If not provided, the latest backup will be used.')
  console.log('')
  console.log('Examples:')
  console.log('  pnpm db:restore                           # Restore latest backup')
  console.log('  pnpm db:restore backup-2024-01-15.tar.gz # Restore specific backup')
  console.log('  pnpm db:restore 2024-01-15               # Restore specific backup (auto-complete filename)')
  process.exit(0)
}

restoreDatabase(backupFilename)
