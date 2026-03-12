# Changelog

## [1.4.0](https://github.com/M4n0x/fodmap-lens/compare/fodmap-lens-v1.3.2...fodmap-lens-v1.4.0) (2026-03-12)


### Features

* enriched FODMAP knowledge base (277 ingredients) ([7f665a0](https://github.com/M4n0x/fodmap-lens/commit/7f665a0c058e3c60901ae568cf745b9f5b9a4fd6))
* enriched FODMAP knowledge base (277 ingredients) ([1598669](https://github.com/M4n0x/fodmap-lens/commit/1598669e8bc8c9991700ca4e3a56005d28579a2d))


### Bug Fixes

* add missing serving fields to test fixtures ([d5c9967](https://github.com/M4n0x/fodmap-lens/commit/d5c9967819b1186d30f0ffd5a538f71eb6ed4941))
* clean up leftover serving fields from test fixtures ([0620da6](https://github.com/M4n0x/fodmap-lens/commit/0620da6b1b648c45a0c0c41f7b1047c1c36ee621))
* remove unused serving fields from FodmapIngredient type ([2546be3](https://github.com/M4n0x/fodmap-lens/commit/2546be37b3e8e796fa78a507a9f21a81814a37e1))

## [1.3.2](https://github.com/M4n0x/fodmap-lens/compare/fodmap-lens-v1.3.1...fodmap-lens-v1.3.2) (2026-03-11)


### Bug Fixes

* remove Monash-attributed data and serving sizes for legal compliance ([f14b067](https://github.com/M4n0x/fodmap-lens/commit/f14b0671bd922632432b71b55520bf58b9793c40))

## [1.3.1](https://github.com/M4n0x/fodmap-lens/compare/fodmap-lens-v1.3.0...fodmap-lens-v1.3.1) (2026-03-10)


### Bug Fixes

* correct OFFResponse type for 404 handling ([efb19bd](https://github.com/M4n0x/fodmap-lens/commit/efb19bd9c7bae57aeff8b9f968fc047da3c94ed6))

## [1.3.0](https://github.com/M4n0x/fodmap-lens/compare/fodmap-lens-v1.2.1...fodmap-lens-v1.3.0) (2026-03-10)


### Features

* add back-to-scanner button on product not found screen ([d0dc9f9](https://github.com/M4n0x/fodmap-lens/commit/d0dc9f95b76830f49b8158969052ee120182a94b))

## [1.2.1](https://github.com/M4n0x/fodmap-lens/compare/fodmap-lens-v1.2.0...fodmap-lens-v1.2.1) (2026-03-10)


### Bug Fixes

* improve language dropdown padding on Android ([ef6df11](https://github.com/M4n0x/fodmap-lens/commit/ef6df11abbf109e2c7f8d8234461a329630e6d44))

## [1.2.0](https://github.com/M4n0x/fodmap-lens/compare/fodmap-lens-v1.1.0...fodmap-lens-v1.2.0) (2026-03-10)


### Features

* add barcode stabilizer with multi-frame consensus ([57e3d1e](https://github.com/M4n0x/fodmap-lens/commit/57e3d1e66c1187ee0667dbff795928842c9b46a2))
* add category overrides, FODMAP breakdown improvements, and history enhancements ([f9fa1f0](https://github.com/M4n0x/fodmap-lens/commit/f9fa1f0482b135308a8319259ef907c6c9373189))
* initial release of Fodmap Lens ([e30fd2b](https://github.com/M4n0x/fodmap-lens/commit/e30fd2be23adbb6864a60fa35479b7923ebce66b))
* integrate barcode stabilizer into useBarcode hook ([fb8cde4](https://github.com/M4n0x/fodmap-lens/commit/fb8cde4be71df63cc7efd400fc71cbab4918a083))


### Bug Fixes

* center screenshots grid on landing page ([cb0fd8a](https://github.com/M4n0x/fodmap-lens/commit/cb0fd8a35d8c1c4035be7522b6ba00ea6fd1d2dd))
* **ci:** also patch settings.gradle for AsyncStorage repo ([d7885c3](https://github.com/M4n0x/fodmap-lens/commit/d7885c36ac08e9b9c166533aec3b1a9f49f0d9e3))
* **ci:** increase Gradle memory to avoid OOM during Kotlin compilation ([fbff50a](https://github.com/M4n0x/fodmap-lens/commit/fbff50a658e8617d334b42f0fd7e376905dab8bc))
* **ci:** insert AsyncStorage Maven repo before jitpack ([88d1378](https://github.com/M4n0x/fodmap-lens/commit/88d13784368e10fd75d49097061f40bfc49747a4))
* **ci:** patch Gradle for AsyncStorage and downgrade to 8.13 ([c87b150](https://github.com/M4n0x/fodmap-lens/commit/c87b150e5158cafc8fdd282d1eca68d1dc90539e))
* **ci:** use sed append for AsyncStorage repo patch ([f2342bb](https://github.com/M4n0x/fodmap-lens/commit/f2342bbfcb44249651f07b8033ed98b2787dfe94))
* extract sub-ingredients from parenthetical OCR text ([05af83f](https://github.com/M4n0x/fodmap-lens/commit/05af83fb162db5bc78927410139c8aef4aa2e293))
* link download buttons directly to latest APK asset ([6959790](https://github.com/M4n0x/fodmap-lens/commit/6959790b71b5736ddb280d6f9b9d73dc921d4235))
* read app version dynamically and sync with releases ([9394030](https://github.com/M4n0x/fodmap-lens/commit/9394030e081564f091990ee3579da3d31914cbe1))
* remove white line at bottom of OG image ([ceed7a5](https://github.com/M4n0x/fodmap-lens/commit/ceed7a5209dbabbe27b0c1f44a64eb8ba37e07b8))
* replace emoji flags with bundled local flag images for offline support ([2cc9eda](https://github.com/M4n0x/fodmap-lens/commit/2cc9eda7241604c40db6c23dd67f100d890eb24a))
* reset to camera view when returning from product details ([0e61e91](https://github.com/M4n0x/fodmap-lens/commit/0e61e91caca27bb4746836da92476723e93e9352))
* resolve duplicate key warning in search FlatList ([0e23318](https://github.com/M4n0x/fodmap-lens/commit/0e23318b822bc4ec878d656f9ac9e1e104fe50c0))
* **scoring:** differentiate products with different FODMAP trigger counts ([14dabe0](https://github.com/M4n0x/fodmap-lens/commit/14dabe0a67e083eba1caeb2e922ff9ea49cf205e))

## [1.1.0](https://github.com/M4n0x/fodmap-lens/compare/fodmap-lens-v1.0.6...fodmap-lens-v1.1.0) (2026-03-10)


### Features

* add barcode stabilizer with multi-frame consensus ([57e3d1e](https://github.com/M4n0x/fodmap-lens/commit/57e3d1e66c1187ee0667dbff795928842c9b46a2))
* add category overrides, FODMAP breakdown improvements, and history enhancements ([f9fa1f0](https://github.com/M4n0x/fodmap-lens/commit/f9fa1f0482b135308a8319259ef907c6c9373189))
* initial release of Fodmap Lens ([e30fd2b](https://github.com/M4n0x/fodmap-lens/commit/e30fd2be23adbb6864a60fa35479b7923ebce66b))
* integrate barcode stabilizer into useBarcode hook ([fb8cde4](https://github.com/M4n0x/fodmap-lens/commit/fb8cde4be71df63cc7efd400fc71cbab4918a083))


### Bug Fixes

* center screenshots grid on landing page ([cb0fd8a](https://github.com/M4n0x/fodmap-lens/commit/cb0fd8a35d8c1c4035be7522b6ba00ea6fd1d2dd))
* **ci:** also patch settings.gradle for AsyncStorage repo ([d7885c3](https://github.com/M4n0x/fodmap-lens/commit/d7885c36ac08e9b9c166533aec3b1a9f49f0d9e3))
* **ci:** increase Gradle memory to avoid OOM during Kotlin compilation ([fbff50a](https://github.com/M4n0x/fodmap-lens/commit/fbff50a658e8617d334b42f0fd7e376905dab8bc))
* **ci:** insert AsyncStorage Maven repo before jitpack ([88d1378](https://github.com/M4n0x/fodmap-lens/commit/88d13784368e10fd75d49097061f40bfc49747a4))
* **ci:** patch Gradle for AsyncStorage and downgrade to 8.13 ([c87b150](https://github.com/M4n0x/fodmap-lens/commit/c87b150e5158cafc8fdd282d1eca68d1dc90539e))
* **ci:** use sed append for AsyncStorage repo patch ([f2342bb](https://github.com/M4n0x/fodmap-lens/commit/f2342bbfcb44249651f07b8033ed98b2787dfe94))
* extract sub-ingredients from parenthetical OCR text ([05af83f](https://github.com/M4n0x/fodmap-lens/commit/05af83fb162db5bc78927410139c8aef4aa2e293))
* link download buttons directly to latest APK asset ([6959790](https://github.com/M4n0x/fodmap-lens/commit/6959790b71b5736ddb280d6f9b9d73dc921d4235))
* read app version dynamically and sync with releases ([9394030](https://github.com/M4n0x/fodmap-lens/commit/9394030e081564f091990ee3579da3d31914cbe1))
* remove white line at bottom of OG image ([ceed7a5](https://github.com/M4n0x/fodmap-lens/commit/ceed7a5209dbabbe27b0c1f44a64eb8ba37e07b8))
* replace emoji flags with bundled local flag images for offline support ([2cc9eda](https://github.com/M4n0x/fodmap-lens/commit/2cc9eda7241604c40db6c23dd67f100d890eb24a))
* reset to camera view when returning from product details ([0e61e91](https://github.com/M4n0x/fodmap-lens/commit/0e61e91caca27bb4746836da92476723e93e9352))
* resolve duplicate key warning in search FlatList ([0e23318](https://github.com/M4n0x/fodmap-lens/commit/0e23318b822bc4ec878d656f9ac9e1e104fe50c0))
* **scoring:** differentiate products with different FODMAP trigger counts ([14dabe0](https://github.com/M4n0x/fodmap-lens/commit/14dabe0a67e083eba1caeb2e922ff9ea49cf205e))

## [1.1.0](https://github.com/M4n0x/fodmap-lens/compare/v1.0.6...v1.1.0) (2026-03-09)


### Features

* add category overrides, FODMAP breakdown improvements, and history enhancements ([f9fa1f0](https://github.com/M4n0x/fodmap-lens/commit/f9fa1f0482b135308a8319259ef907c6c9373189))


### Bug Fixes

* replace emoji flags with bundled local flag images for offline support ([2cc9eda](https://github.com/M4n0x/fodmap-lens/commit/2cc9eda7241604c40db6c23dd67f100d890eb24a))
* resolve duplicate key warning in search FlatList ([0e23318](https://github.com/M4n0x/fodmap-lens/commit/0e23318b822bc4ec878d656f9ac9e1e104fe50c0))

## [1.0.6](https://github.com/M4n0x/fodmap-lens/compare/v1.0.5...v1.0.6) (2026-03-09)


### Bug Fixes

* center screenshots grid on landing page ([cb0fd8a](https://github.com/M4n0x/fodmap-lens/commit/cb0fd8a35d8c1c4035be7522b6ba00ea6fd1d2dd))
* extract sub-ingredients from parenthetical OCR text ([05af83f](https://github.com/M4n0x/fodmap-lens/commit/05af83fb162db5bc78927410139c8aef4aa2e293))
* link download buttons directly to latest APK asset ([6959790](https://github.com/M4n0x/fodmap-lens/commit/6959790b71b5736ddb280d6f9b9d73dc921d4235))
* remove white line at bottom of OG image ([ceed7a5](https://github.com/M4n0x/fodmap-lens/commit/ceed7a5209dbabbe27b0c1f44a64eb8ba37e07b8))
* **scoring:** differentiate products with different FODMAP trigger counts ([14dabe0](https://github.com/M4n0x/fodmap-lens/commit/14dabe0a67e083eba1caeb2e922ff9ea49cf205e))

## [1.0.5](https://github.com/M4n0x/fodmap-lens/compare/v1.0.4...v1.0.5) (2026-03-07)


### Bug Fixes

* **ci:** increase Gradle memory to avoid OOM during Kotlin compilation ([fbff50a](https://github.com/M4n0x/fodmap-lens/commit/fbff50a658e8617d334b42f0fd7e376905dab8bc))

## [1.0.4](https://github.com/M4n0x/fodmap-lens/compare/v1.0.3...v1.0.4) (2026-03-07)


### Bug Fixes

* **ci:** insert AsyncStorage Maven repo before jitpack ([88d1378](https://github.com/M4n0x/fodmap-lens/commit/88d13784368e10fd75d49097061f40bfc49747a4))

## [1.0.3](https://github.com/M4n0x/fodmap-lens/compare/v1.0.2...v1.0.3) (2026-03-07)


### Bug Fixes

* **ci:** also patch settings.gradle for AsyncStorage repo ([d7885c3](https://github.com/M4n0x/fodmap-lens/commit/d7885c36ac08e9b9c166533aec3b1a9f49f0d9e3))

## [1.0.2](https://github.com/M4n0x/fodmap-lens/compare/v1.0.1...v1.0.2) (2026-03-07)


### Bug Fixes

* **ci:** use sed append for AsyncStorage repo patch ([f2342bb](https://github.com/M4n0x/fodmap-lens/commit/f2342bbfcb44249651f07b8033ed98b2787dfe94))

## [1.0.1](https://github.com/M4n0x/fodmap-lens/compare/v1.0.0...v1.0.1) (2026-03-07)


### Bug Fixes

* **ci:** patch Gradle for AsyncStorage and downgrade to 8.13 ([c87b150](https://github.com/M4n0x/fodmap-lens/commit/c87b150e5158cafc8fdd282d1eca68d1dc90539e))

## 1.0.0 (2026-03-07)


### Features

* initial release of Fodmap Lens ([e30fd2b](https://github.com/M4n0x/fodmap-lens/commit/e30fd2be23adbb6864a60fa35479b7923ebce66b))
