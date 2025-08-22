# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XotEx is a mobile/web confession-based party game built with Ionic Framework and Angular. Players write anonymous confessions, then vote to guess who wrote each confession. The app supports 4-8 players in offline sessions with progressive difficulty levels.

## Development Commands

### Essential Commands
```bash
# Development server with hot reload
npm start

# Production build
npm run build

# Watch mode for development
npm run watch

# Run tests
npm test

# Lint code
npm run lint
```

### Mobile Development
```bash
# Add platforms
npx cap add ios
npx cap add android

# Sync code to native platforms
npx cap sync

# Open in native IDEs
npx cap open ios
npx cap open android
```

## Architecture Overview

### Core Structure
- **Ionic 8.0 + Angular 20.0** with standalone components
- **Tab-based navigation** (Home, Help, Settings)
- **Centralized state management** via GameService with RxJS
- **localStorage persistence** for offline-first gameplay
- **Lazy-loaded pages** for performance optimization

### Key Directories
```
src/app/
├── models/           # TypeScript interfaces & enums
├── services/         # GameService - core business logic
├── pages/           # Feature pages (setup, game, confessions)
├── components/      # Reusable UI components
└── tabs/           # Main navigation shell
```

### Game State Flow
1. **Setup** → Player registration (4-8 players)
2. **Confessions** → Anonymous confession writing by category
3. **Playing** → Iterative voting rounds with heat levels 1-5
4. **Finished** → Results and statistics

## Critical Implementation Details

### GameService (`/src/app/services/game.ts`)
The central service manages:
- **Session persistence** in localStorage key: `'confession_box_game'`
- **Player management** with validation (2-20 chars, unique names)
- **Heat level progression** (categories unlock based on level 1-5)
- **Voting mechanics** with turn-based progression
- **Round tracking** and statistics calculation

### Game Models (`/src/app/models/game.model.ts`)
Essential enums and interfaces:
- `GameStatus`: SETUP → CONFESSIONS → PLAYING → FINISHED
- `ConfessionCategory`: CHILDHOOD, CRUSH, HABITS, FEARS, RANDOM
- `Player`: name, color, avatar, stats
- `GameSession`: complete game state structure

### Styling System
- **"NEON CLUB" theme** with vibrant color palette
- **Custom CSS properties** in `/src/theme/variables.scss`
- **Multi-font system**: Space Grotesk (headers), Inter (body), Poppins/Nunito (UI)
- **Responsive design** with clamp() typography
- **Dark mode support** with system detection

### Page Components Architecture
- **Standalone components** (Angular's latest pattern)
- **Reactive forms** with real-time validation
- **Error handling** with user-friendly messages
- **State synchronization** via GameService subscription

## Game Mechanics Implementation

### Confession System
- **Category-based writing** with suggestion prompts
- **Anonymous storage** with player ID mapping
- **Progressive unlocking** tied to heat levels

### Voting System
- **Turn-based progression** through player list
- **Anonymous ballot** with duplicate prevention
- **Real-time vote counting** and result calculation
- **Statistics tracking** for accuracy and engagement

### Heat Level Progression
- Automatically increases every 3 completed rounds
- Unlocks new confession categories
- Affects game difficulty and content maturity

## Testing & Quality

### Test Configuration
- **Karma + Jasmine** setup in `karma.conf.js`
- **ESLint** with Angular-specific rules
- **TypeScript strict mode** enabled
- **Component testing** patterns established

### Code Standards
- **Service-based architecture** for business logic
- **Type-safe development** with comprehensive interfaces
- **Reactive patterns** using RxJS throughout
- **Error boundaries** with graceful degradation

## Mobile & PWA Features

### Capacitor Integration
- **Native plugins**: Haptics, StatusBar, Keyboard
- **Cross-platform deployment** ready for iOS/Android
- **PWA manifest** configured for web installation

### Performance Optimizations
- **Lazy loading** for all route modules
- **Bundle splitting** with optimized chunk sizes
- **Asset optimization** with Ionic icon system
- **Offline-first** with localStorage fallbacks

## Key Configuration Files

### Build Configuration
- `angular.json` - Angular CLI build settings
- `capacitor.config.ts` - Native app configuration
- `ionic.config.json` - Ionic CLI settings
- `tsconfig.json` - TypeScript compiler options

### Styling Configuration
- `/src/global.scss` - Global styles and font imports
- `/src/theme/variables.scss` - Color system and design tokens
- Component-specific `.scss` files with scoped styling

## Development Patterns

### State Management Pattern
```typescript
// Service pattern with RxJS
private gameSessionSubject = new BehaviorSubject<GameSession | null>(null);
gameSession$ = this.gameSessionSubject.asObservable();

// Component subscription pattern
this.gameService.gameSession$.subscribe(session => {
  this.currentGame = session;
});
```

### Component Pattern
```typescript
// Standalone component with Ionic
@Component({
  selector: 'app-page-name',
  templateUrl: 'page.html',
  styleUrls: ['page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
```

### Error Handling Pattern
```typescript
// Service error handling with user feedback
try {
  this.validateGameState();
} catch (error) {
  this.showErrorToast('Invalid game state');
  return;
}
```

## Deployment

### Web Deployment
1. `npm run build` creates optimized `/www` output
2. Serve static files from `/www` directory
3. PWA-ready with service worker support

### Mobile Deployment
1. `npx cap sync` copies web assets to native projects
2. Open native IDEs with `npx cap open [platform]`
3. Build and deploy through platform-specific tools

The codebase follows modern Angular patterns with comprehensive TypeScript typing, reactive state management, and mobile-optimized UI/UX design.