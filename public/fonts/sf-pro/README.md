# SF Pro Font Installation

## Overview

This directory should contain the **SF Pro** font family files used in the Figma design system. SF Pro is Apple's proprietary font and requires proper licensing.

## Required Font Files

Place the following `.woff2` font files in this directory:

- `SF-Pro-Text-Regular.woff2` (Weight: 400)
- `SF-Pro-Text-Medium.woff2` (Weight: 500)
- `SF-Pro-Text-Semibold.woff2` (Weight: 590)
- `SF-Pro-Text-Bold.woff2` (Weight: 700)

## How to Obtain SF Pro Fonts

### Option 1: Apple Developer (Recommended)

1. Visit [Apple Developer Fonts](https://developer.apple.com/fonts/)
2. Download the SF Pro font package
3. Extract the `.woff2` files for SF Pro Text (Regular, Medium, Semibold, Bold)
4. Place them in this directory

**Note**: You may need an Apple Developer account (free to create).

### Option 2: Convert from System Fonts (macOS)

If you're on macOS, you already have SF Pro installed as a system font:

1. System fonts are located in `/System/Library/Fonts/`
2. Use a font converter tool to convert `.ttf` or `.otf` to `.woff2`:
   - Online: [CloudConvert](https://cloudconvert.com/ttf-to-woff2)
   - CLI: `fonttools` or `woff2` packages

### Option 3: Use Inter Font (Open Source Alternative)

If you cannot obtain SF Pro, **Inter** is an excellent open-source alternative with similar characteristics:

1. Download from [rsms.me/inter](https://rsms.me/inter/)
2. Use the variable font or individual weights
3. Update the `@font-face` declarations in `src/frontend/index.css` to reference Inter instead

## Font Licensing

**Important**: SF Pro is Apple's proprietary font. Ensure you have proper licensing for your use case:

- ✅ **Allowed**: Personal projects, internal tools, Apple platform apps
- ✅ **Allowed**: Design mockups and prototypes
- ❌ **Restricted**: Public-facing websites (check Apple's licensing terms)
- ❌ **Restricted**: Commercial distribution without proper license

**For production websites**, consider using:
- **Inter** (open-source, similar to SF Pro)
- **System font stack** (fallback is already configured)

## Fallback Configuration

The application is already configured with a comprehensive fallback stack in `design-tokens.css`:

```css
--font-family-primary: 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...
```

If SF Pro files are not found, the app will gracefully fall back to system fonts, which will look native on each platform:
- macOS/iOS: SF Pro (system font)
- Windows: Segoe UI
- Android: Roboto

## Verification

After adding the font files:

1. Start the development server: `npm run dev`
2. Open browser DevTools → Network tab
3. Filter by "Font"
4. Verify the `.woff2` files load successfully (Status 200)
5. Check in Elements → Computed → font-family to see if SF Pro is active

## File Structure

```
public/
└── fonts/
    └── sf-pro/
        ├── README.md (this file)
        ├── SF-Pro-Text-Regular.woff2
        ├── SF-Pro-Text-Medium.woff2
        ├── SF-Pro-Text-Semibold.woff2
        └── SF-Pro-Text-Bold.woff2
```

## References

- [Apple SF Fonts](https://developer.apple.com/fonts/)
- [Inter Font](https://rsms.me/inter/) (Open-source alternative)
- [Web Font Optimization](https://web.dev/font-best-practices/)
- [Font Display Strategy](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
