# Migration Guide: PKMS v1 to v2 (DDD Architecture)

This guide helps you migrate from the original PKMS structure to the new Domain-Driven Design (DDD) architecture.

## What Changed

### Architecture
- **v1**: Monolithic structure with mixed concerns
- **v2**: Clean DDD architecture with separated layers:
  - **Domain**: Core business logic and entities
  - **Application**: Use cases and orchestration
  - **Infrastructure**: External dependencies (ChromaDB, OpenAI, File System)
  - **UI**: CLI interface

### File Structure
```
# v1 Structure
pkms/
├── chat.ts                 # Main chat interface
├── scripts/
│   ├── simple-embed.ts
│   ├── update-embeddings.ts
│   └── test-embeddings.ts
└── data/                   # Work logs

# v2 Structure
pkms/
├── src/
│   ├── domain/             # Core business logic
│   ├── application/        # Use cases and services
│   ├── infrastructure/     # External integrations
│   ├── ui/                 # CLI interface
│   └── main/               # Entry points
├── scripts/                # Legacy scripts (still work)
├── data/                   # Work logs (unchanged)
└── chat.ts                 # Legacy entry point (still works)
```

## Migration Steps

### 1. Update Dependencies
The new architecture uses the same dependencies, but with better organization:

```bash
# Install any missing dependencies
yarn install
```

### 2. Update Your Scripts

#### Old Commands (still work):
```bash
npx ts-node chat.ts
npx ts-node scripts/simple-embed.ts
npx ts-node scripts/update-embeddings.ts
npx ts-node scripts/test-embeddings.ts
```

#### New Commands (recommended):
```bash
npm run chat
npm run embed
npm run update-embeddings
npm run test-embeddings
```

### 3. Environment Variables
No changes needed - still uses `.env` file with `OPENAI_API_KEY`.

### 4. Data Directory
No changes needed - still uses `data/` directory with the same structure.

## Benefits of v2 Architecture

### 1. **Separation of Concerns**
- Domain logic is isolated from infrastructure
- Business rules are clearly defined
- Easy to test individual components

### 2. **Maintainability**
- Clear layer boundaries
- Single responsibility principle
- Easier to modify and extend

### 3. **Testability**
- Domain logic can be tested without external dependencies
- Mock implementations for testing
- Clear interfaces between layers

### 4. **Scalability**
- Easy to add new features
- Simple to change external dependencies
- Clear extension points

## Backward Compatibility

All v1 commands still work:
- `npx ts-node chat.ts` → Uses legacy chat interface
- `npx ts-node scripts/simple-embed.ts` → Uses legacy embedding script
- Legacy scripts are preserved in the `scripts/` directory

## New Features in v2

### 1. **Better Error Handling**
- Comprehensive error messages
- Graceful degradation
- Clear troubleshooting guidance

### 2. **Improved CLI Interface**
- Better user experience
- More informative output
- Status checking commands

### 3. **Enhanced Architecture**
- Clean separation of concerns
- Dependency injection
- Interface-based design

## Troubleshooting

### Common Issues

1. **TypeScript Path Mapping**
   - The new architecture uses path mapping (`@domain/*`, `@application/*`, etc.)
   - Make sure your IDE supports TypeScript path mapping

2. **Import Errors**
   - If you see import errors, try running `npm run build` to check TypeScript compilation
   - Ensure all dependencies are installed with `yarn install`

3. **Legacy Scripts**
   - Legacy scripts in `scripts/` directory still work as before
   - Use `npm run legacy:*` commands if needed

### Getting Help

If you encounter issues:
1. Check that ChromaDB is running: `chroma run --host localhost --port 8000`
2. Verify your `.env` file has `OPENAI_API_KEY`
3. Try the legacy commands to ensure basic functionality works
4. Run `npm run test-embeddings` to verify the system is working

## Recommended Workflow

### For New Users
Use the new v2 commands:
```bash
npm run embed          # Create embeddings
npm run chat           # Start chat interface
npm run test-embeddings # Test the system
```

### For Existing Users
You can continue using legacy commands or migrate to v2:
```bash
# Continue with legacy (works as before)
npx ts-node chat.ts

# Or migrate to v2 (recommended)
npm run chat
```

Both approaches work with the same data and configuration.
