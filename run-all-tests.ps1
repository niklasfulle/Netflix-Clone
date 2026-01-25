#!/usr/bin/env pwsh

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧪 Netflix Clone - Comprehensive Test Suite" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n📝 Running tests in jsdom environment (Components, Hooks, Actions)..." -ForegroundColor Green
yarn test --testEnvironment=jsdom --coverage --collectCoverageFrom='!app/api/**' 2>&1

Write-Host "`n📝 Running API tests in node environment..." -ForegroundColor Green
yarn test --testEnvironment=node app/api 2>&1

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
