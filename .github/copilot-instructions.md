# Elite Dangerous Galaxy Map - Development Instructions

**ALWAYS follow these instructions first and only fallback to search or additional context gathering if the information here is incomplete or found to be in error.**

Elite Dangerous Galaxy Map is a modern 3D galaxy map visualization for Elite Dangerous, rebuilt from Angular.js 1.x to **Next.js 15** with React 19, TypeScript, Three.js, and Tailwind CSS. The repository contains both legacy Angular.js code and the modern Next.js application.

## Working Effectively

### Prerequisites and Installation
- Node.js 18.0.0 or higher (repository tested with Node.js 20.19.4)
- npm (comes with Node.js)

### Essential Commands - NEVER CANCEL These Operations

**Install dependencies:**
```bash
npm install
```
- Takes ~20 seconds. NEVER CANCEL. Set timeout to 60+ seconds.

**Build the modern Next.js application:**
```bash
npm run build
```
- Takes ~7 seconds (first build), ~1.6 seconds (subsequent builds). NEVER CANCEL. Set timeout to 60+ seconds minimum.
- Produces optimized production build in `.next/` directory
- May show ESLint warnings (see Linting section below)

**Run development server:**
```bash
npm run dev
```
- Starts in ~1.5 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Available at http://localhost:3000
- Supports hot reloading for development

**Run production server:**
```bash
npm run build && npm start
```
- Must build first, then start production server. NEVER CANCEL builds. Set timeout to 60+ seconds for build phase.
- Available at http://localhost:3000

### Linting
```bash
npm run lint
```
- Takes ~5 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- **EXPECTED**: Shows 120 problems (91 errors, 29 warnings) - mostly from legacy Angular.js files using CommonJS `require()` statements
- Focus only on errors in `src/` directory (modern Next.js code)
- Legacy code errors in `client/`, `server/`, `config/`, `e2e/` can be ignored unless specifically working on legacy code

## Validation Scenarios

**ALWAYS manually validate changes by running through these complete scenarios:**

### Primary Validation - 3D Galaxy Map
1. Build and start the development server: `npm run dev`
2. Navigate to http://localhost:3000 
3. **Wait for the 3D galaxy map to load** - you should see:
   - Loading spinner initially showing "Loading Galaxy..."
   - 3D visualization with 1000+ star systems rendered as points
   - Color selection panel on the right (Economy, Allegiance, Government options)
   - Ability to click on systems to view detailed information
4. **Test the API**: Verify http://localhost:3000/api/systems returns JSON with 1000 systems
5. **Test interactivity**: Try changing color schemes and clicking on star systems

### Build Validation
1. Run full production build: `npm run build`
2. Start production server: `npm start`  
3. Verify the same functionality works in production mode
4. Check that build artifacts are created in `.next/` directory

### Code Quality Validation
- Run `npm run lint` and verify no NEW errors are introduced in `src/` directory
- Legacy file errors are expected and can be ignored
- Address any React hooks warnings in modern components (e.g., missing dependencies in useCallback)

## Code Navigation

### Modern Next.js Application (Primary Development)
- **`src/app/`** - Next.js App Router pages and layouts
  - `page.tsx` - Main galaxy map page
  - `layout.tsx` - Root layout with metadata
  - `globals.css` - Global styles with Tailwind CSS
  - `api/systems/route.ts` - API endpoint for star system data
- **`src/components/`** - React components
  - `GalaxyMap.tsx` - Main 3D visualization component using Three.js
  - `SystemInfo.tsx` - System details panel
  - `ColorSelection.tsx` - Color scheme selector
  - `LoadingSpinner.tsx` - Loading indicator

### Legacy Code (Reference Only)
- **`client/`** - Legacy Angular.js 1.x application
- **`server/`** - Legacy Express.js server with MongoDB
- **`config/`** - Legacy Grunt build configuration
- **`e2e/`** - Legacy Protractor end-to-end tests

### Configuration Files
- **`package.json`** - Modern dependencies and scripts
- **`next.config.ts`** - Next.js configuration
- **`tsconfig.json`** - TypeScript configuration
- **`eslint.config.mjs`** - ESLint configuration
- **`postcss.config.mjs`** - PostCSS configuration for Tailwind

## Common Tasks

### Making Changes to the 3D Visualization
- Modify `src/components/GalaxyMap.tsx` 
- Uses Three.js WebGL for rendering
- ALWAYS test changes by running through the validation scenario
- Watch for React hooks dependencies warnings and fix them

### Adding New API Endpoints
- Create files in `src/app/api/` following Next.js App Router conventions
- Example: `src/app/api/systems/route.ts` provides the star system data

### Styling Changes  
- Use Tailwind CSS classes in React components
- Global styles in `src/app/globals.css`
- ALWAYS verify responsive design works

### Working with System Data
- Star system data is generated in `src/app/api/systems/route.ts`
- Contains 1000 systems with properties: id, name, x, y, z coordinates, population, economy, allegiance, government
- ALWAYS verify API returns expected data format after changes

## Build System Notes

- **Modern Build**: Uses Next.js with Webpack, TypeScript compilation, and Tailwind CSS processing
- **Legacy Build**: Grunt-based system with Bower dependencies (NOT RECOMMENDED for new development)
- **No Tests**: The modern Next.js application doesn't have automated tests yet (legacy has Karma/Protractor tests)
- **Docker**: Legacy Docker setup exists but is not configured for modern Next.js app

## Troubleshooting

### Build Fails
- Ensure Node.js 18.0.0+ is installed
- Clear `.next/` directory and rebuild
- Check for TypeScript errors in `src/` directory

### Development Server Issues  
- Port 3000 conflict: Kill existing processes or use different port
- Clear Next.js cache: Delete `.next/` directory

### Performance Issues
- 3D visualization requires WebGL support
- Large number of systems (1000+) may affect performance on lower-end devices
- Monitor browser console for Three.js warnings

## Important Notes

- **FOCUS ON MODERN CODE**: Only work in `src/` directory unless specifically maintaining legacy code
- **NEVER CANCEL BUILDS**: Builds may appear slow but complete quickly (7 seconds typical)
- **LEGACY LINT ERRORS ARE EXPECTED**: 120 lint problems are normal, mostly from legacy Angular.js files
- **ALWAYS VALIDATE 3D MAP**: Visual testing is critical since this is a 3D visualization application
- **API DEPENDENCY**: The application requires the `/api/systems` endpoint to function

## Time Expectations
- Initial clone and setup: ~1 minute
- First build: ~7 seconds  
- Development server start: ~1.5 seconds
- Lint check: ~5 seconds
- Full validation scenario: ~2 minutes