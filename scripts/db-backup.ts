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

async function backupDatabase() {
  const databaseUri = process.env.DATABASE_URI
  
  if (!databaseUri) {
    console.error('❌ DATABASE_URI environment variable is not set')
    process.exit(1)
  }

  console.log('🗄️  Starting MongoDB backup...')

  const mongoConfig = parseMongoUri(databaseUri)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'backups')
  const backupPath = path.join(backupDir, `backup-${timestamp}`)

  // Ensure backups directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
    console.log('📁 Created backups directory')
  }

  try {
    // Build mongodump command
    let mongodumpCmd = `mongodump --host ${mongoConfig.host}:${mongoConfig.port} --db ${mongoConfig.database} --out "${backupPath}"`
    
    // Add authentication if provided
    if (mongoConfig.username && mongoConfig.password) {
      mongodumpCmd += ` --username "${mongoConfig.username}" --password "${mongoConfig.password}"`
    }

    console.log('🔄 Running mongodump...')
    console.log(`Command: ${mongodumpCmd.replace(/--password "[^"]*"/, '--password "***"')}`)
    
    execSync(mongodumpCmd, { stdio: 'inherit' })

    // Create a compressed archive
    const archiveName = `backup-${timestamp}.tar.gz`
    const archivePath = path.join(backupDir, archiveName)
    
    console.log('🗜️  Compressing backup...')
    execSync(`tar -czf "${archivePath}" -C "${backupPath}" .`, { stdio: 'inherit' })
    
    // Remove the uncompressed directory
    execSync(`rm -rf "${backupPath}"`, { stdio: 'inherit' })

    console.log('✅ Database backup completed successfully!')
    console.log(`📦 Backup saved to: ${archivePath}`)
    console.log(`📊 Database: ${mongoConfig.database}`)
    console.log(`🕐 Timestamp: ${timestamp}`)

    // List all backups
    console.log('\n📋 Available backups:')
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.tar.gz'))
      .sort()
      .reverse() // Most recent first

    backupFiles.forEach((file, index) => {
      const filePath = path.join(backupDir, file)
      const stats = fs.statSync(filePath)
      const size = (stats.size / 1024 / 1024).toFixed(2) // Size in MB
      console.log(`  ${index + 1}. ${file} (${size} MB)`)
    })

  } catch (error) {
    console.error('❌ Backup failed:', error)
    
    // Clean up failed backup directory if it exists
    if (fs.existsSync(backupPath)) {
      execSync(`rm -rf "${backupPath}"`, { stdio: 'inherit' })
    }
    
    process.exit(1)
  }
}

// Check if mongodump is available
try {
  execSync('mongodump --version', { stdio: 'pipe' })
} catch (error) {
  console.error('❌ mongodump is not installed or not in PATH')
  console.error('Please install MongoDB Database Tools: https://docs.mongodb.com/database-tools/installation/')
  process.exit(1)
}

backupDatabase()
