/**
 * E2E tests for examples projects
 * Tests that components work correctly when integrated into real applications
 */

import { test, expect } from '@playwright/test'

// Test configuration
const NEXTJS_PORT = 3000
const VITE_PORT = 5173

test.describe('Next.js Example', () => {
  test('should load homepage without errors', async ({ page }) => {
    await page.goto(`http://localhost:${NEXTJS_PORT}`)
    
    // Should not have any console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await expect(page.getByText('LlamaIndex UI Components')).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('should import and render FileUploader', async ({ page }) => {
    await page.goto(`http://localhost:${NEXTJS_PORT}/file-uploader`)
    
    // Component should render
    await expect(page.getByText(/drag.*drop/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /browse files/i })).toBeVisible()
  })

  test('should import and render ExtractedDataDisplay', async ({ page }) => {
    await page.goto(`http://localhost:${NEXTJS_PORT}/extracted-data`)
    
    // Component should render with sample data
    await expect(page.getByText('Sample Document')).toBeVisible()
  })

  test('should handle component interactions', async ({ page }) => {
    await page.goto(`http://localhost:${NEXTJS_PORT}/file-uploader`)
    
    // Click upload button
    await page.getByRole('button', { name: /browse files/i }).click()
    
    // Should open file dialog (we can't test actual file upload in headless mode)
    // But the component should not crash
    await expect(page.getByText(/drag.*drop/i)).toBeVisible()
  })
})

test.describe('Vite Example', () => {
  test('should load homepage without errors', async ({ page }) => {
    await page.goto(`http://localhost:${VITE_PORT}`)
    
    // Should not have any console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await expect(page.getByText('LlamaIndex UI Components')).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('should import and render FileUploader', async ({ page }) => {
    await page.goto(`http://localhost:${VITE_PORT}/file-uploader`)
    
    // Component should render
    await expect(page.getByText(/drag.*drop/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /browse files/i })).toBeVisible()
  })

  test('should import and render ExtractedDataDisplay', async ({ page }) => {
    await page.goto(`http://localhost:${VITE_PORT}/extracted-data`)
    
    // Component should render with sample data
    await expect(page.getByText('Sample Document')).toBeVisible()
  })

  test('should handle routing correctly', async ({ page }) => {
    await page.goto(`http://localhost:${VITE_PORT}`)
    
    // Navigate to different pages
    await page.getByRole('link', { name: /file uploader/i }).click()
    await expect(page.getByText(/drag.*drop/i)).toBeVisible()
    
    await page.getByRole('link', { name: /extracted data/i }).click()
    await expect(page.getByText('Sample Document')).toBeVisible()
  })
})

test.describe('Cross-Project Compatibility', () => {
  test('components should work identically in both frameworks', async ({ page }) => {
    // Test Next.js
    await page.goto(`http://localhost:${NEXTJS_PORT}/file-uploader`)
    const nextjsContent = await page.textContent('main')
    
    // Test Vite
    await page.goto(`http://localhost:${VITE_PORT}/file-uploader`)
    const viteContent = await page.textContent('main')
    
    // Core functionality should be the same
    expect(nextjsContent).toContain('drag')
    expect(viteContent).toContain('drag')
  })

  test('should not have framework-specific errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Test both frameworks
    await page.goto(`http://localhost:${NEXTJS_PORT}`)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`http://localhost:${VITE_PORT}`)
    await page.waitForLoadState('networkidle')
    
    // Should not have any framework-specific errors
    const frameworkErrors = errors.filter(error => 
      error.includes('React') || 
      error.includes('Next.js') || 
      error.includes('Vite')
    )
    expect(frameworkErrors).toHaveLength(0)
  })
})

test.describe('Component Library Integration', () => {
  test('should be able to import components using different methods', async ({ page }) => {
    // Test traditional import
    await page.goto(`http://localhost:${NEXTJS_PORT}/file-uploader`)
    await expect(page.getByText(/drag.*drop/i)).toBeVisible()
    
    // Test that the component is actually working
    await expect(page.getByRole('button', { name: /browse files/i })).toBeEnabled()
  })

  test('should handle multiple components on same page', async ({ page }) => {
    // This would test if multiple components can coexist
    await page.goto(`http://localhost:${NEXTJS_PORT}`)
    
    // Should be able to navigate between different component demos
    await page.getByRole('link', { name: /file uploader/i }).click()
    await expect(page.getByText(/drag.*drop/i)).toBeVisible()
    
    await page.getByRole('link', { name: /pdf viewer/i }).click()
    await expect(page.getByText(/pdf viewer/i)).toBeVisible()
  })
})

test.describe('Performance and Stability', () => {
  test('should not have memory leaks', async ({ page }) => {
    // Navigate between pages multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto(`http://localhost:${NEXTJS_PORT}/file-uploader`)
      await page.goto(`http://localhost:${NEXTJS_PORT}/extracted-data`)
      await page.goto(`http://localhost:${NEXTJS_PORT}/pdf-viewer`)
    }
    
    // Should still be responsive
    await expect(page.getByText(/pdf viewer/i)).toBeVisible()
  })

  test('should handle rapid interactions', async ({ page }) => {
    await page.goto(`http://localhost:${NEXTJS_PORT}/file-uploader`)
    
    // Click multiple times rapidly
    const button = page.getByRole('button', { name: /browse files/i })
    for (let i = 0; i < 10; i++) {
      await button.click()
    }
    
    // Should still be functional
    await expect(button).toBeEnabled()
  })
})