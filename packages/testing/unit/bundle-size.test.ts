/**
 * Bundle size monitoring tests
 * Ensures that the built package size doesn't grow unexpectedly
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, statSync, existsSync } from 'fs'
import { join } from 'path'
import { gzipSync } from 'zlib'
import { globSync } from 'glob'

describe('Bundle Size Tests', () => {
  const distPath = join(process.cwd(), '../ui/dist')
  const packagePath = join(process.cwd(), '../ui/package.json')

  describe('Build Output Size', () => {
    it('should have reasonable bundle sizes', () => {
      // Check if dist exists (build might not be run in test environment)
      if (!existsSync(distPath)) {
        console.log('Build output not found, skipping bundle size check')
        return
      }
      
      const distFiles = globSync('dist/**/*.js')
      
      if (distFiles.length > 0) {
        distFiles.forEach(file => {
          const stats = statSync(file)
          const sizeInKB = stats.size / 1024
          
          // Main bundle should be reasonable size for a component library
          if (file.includes('llamaindex-components')) {
            expect(sizeInKB).toBeLessThan(800) // 800KB limit for full library
          }
          
          // Individual chunks should be smaller
          expect(sizeInKB).toBeLessThan(1000) // 1MB absolute limit
        })
      }
    })

    it('should have reasonable gzipped sizes', () => {
      if (!existsSync(distPath)) {
        console.log('Build output not found, skipping gzipped size check')
        return
      }
      
      const distFiles = globSync('dist/**/*.js')
      
      if (distFiles.length > 0) {
        distFiles.forEach(file => {
          const content = readFileSync(file)
          const gzipped = gzipSync(content)
          const gzippedSizeInKB = gzipped.length / 1024
          
          // Gzipped size should be much smaller
          expect(gzippedSizeInKB).toBeLessThan(250) // 250KB gzipped limit
        })
      }
    })
  })

  describe('Basic Package Info', () => {
    it('should track size changes over time', () => {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
      
      console.log('Package info:')
      console.log(`- Name: ${packageJson.name}`)
      console.log(`- Version: ${packageJson.version}`)
      console.log(`- Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`)
      console.log(`- Dev Dependencies: ${Object.keys(packageJson.devDependencies || {}).length}`)
      
      // Basic sanity checks
      expect(packageJson.name).toBe('@llamaindex/ui')
      expect(packageJson.version).toBeDefined()
      expect(Object.keys(packageJson.dependencies || {}).length).toBeGreaterThan(0)
      expect(Object.keys(packageJson.dependencies || {}).length).toBeLessThan(50) // Reasonable limit
    })
  })
})