import { request } from '@playwright/test'

// Runs once before all test files — resets server state to clean dummy data
async function globalSetup() {
  const ctx = await request.newContext()
  await ctx.post('http://localhost:3000/api/reset')
  await ctx.dispose()
}

export default globalSetup
