# MarketPilot Checklist

Use this file to track the buildout of the app in order.

## 1. Foundation
- [x] Auth is wired up with Google + Prisma
- [x] Confirm environment variables for auth and database
- [ ] Harden `requireUser()` and shared session handling
- [ ] Replace the default starter homepage
- [ ] Set real app metadata and branding

## 2. Trades
- [ ] Implement `POST /api/trades`
- [ ] Implement `GET /api/trades/[id]`
- [ ] Implement `PATCH /api/trades/[id]`
- [ ] Implement `DELETE /api/trades/[id]`
- [ ] Add validation for trade inputs
- [ ] Add ownership checks for all trade routes
- [ ] Add list filtering, sorting, and pagination
- [ ] Build trade create/edit UI
- [ ] Build trade history UI

## 3. Analytics
- [ ] Implement `GET /api/analytics`
- [ ] Decide the first analytics metrics to ship
- [ ] Add date-range filtering
- [ ] Add summary cards and charts
- [ ] Add cached or computed-on-demand strategy

## 4. Import
- [ ] Implement `POST /api/upload`
- [ ] Decide supported import formats
- [ ] Add CSV parsing and validation
- [ ] Add preview before import commit
- [ ] Add import error handling

## 5. AI
- [ ] Implement `POST /api/ai/analyze-trades`
- [ ] Define the AI output format
- [ ] Restrict AI to the current user’s data
- [ ] Render analysis results in the UI
- [ ] Add guardrails and fallback states

## 6. Data Model
- [ ] Review `prisma/schema.prisma` for missing fields
- [ ] Add enums where strict values make sense
- [ ] Add trade tags, strategy, timeframe, or setup fields if needed
- [ ] Run migrations for schema updates

## 7. Quality
- [ ] Add tests for auth-protected routes
- [ ] Add tests for trade CRUD
- [ ] Add tests for analytics calculations
- [ ] Run lint and build cleanly
- [ ] Fix TypeScript and route handler issues

## Notes
- Keep this file updated as scope changes.
- Check items off as each feature is fully working end-to-end.
