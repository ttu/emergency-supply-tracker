#!/usr/bin/env node
/**
 * i18n Translation Validation Script
 *
 * Validates that all translation keys in English (en) have corresponding
 * translations in Finnish (fi) for all namespaces.
 *
 * Usage: npm run validate:i18n
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Namespaces to validate
const NAMESPACES = ['common', 'categories', 'products', 'units'] as const;
const BASE_DIR = join(__dirname, '..', 'public', 'locales');

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

/**
 * Recursively get all keys from a translation object
 */
function getAllKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Check if a key exists in the translation object (supports nested keys)
 */
function hasKey(obj: TranslationObject, keyPath: string): boolean {
  const parts = keyPath.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return false;
    }
    current = (current as TranslationObject)[part];
  }

  return true;
}

/**
 * Load translation file for a language and namespace
 */
function loadTranslations(
  lang: string,
  namespace: string,
): TranslationObject | undefined {
  const filePath = join(BASE_DIR, lang, `${namespace}.json`);

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as TranslationObject;
  } catch (error) {
    console.error(
      `❌ Failed to load ${lang}/${namespace}.json:`,
      error instanceof Error ? error.message : String(error),
    );
    return undefined;
  }
}

/**
 * Validate translations for a namespace
 */
function validateNamespace(namespace: string): {
  isValid: boolean;
  missingKeys: string[];
} {
  const enTranslations = loadTranslations('en', namespace);
  const fiTranslations = loadTranslations('fi', namespace);

  if (!enTranslations) {
    console.error(`❌ English translations not found for ${namespace}`);
    return { isValid: false, missingKeys: [] };
  }

  if (!fiTranslations) {
    console.error(`❌ Finnish translations not found for ${namespace}`);
    return { isValid: false, missingKeys: [] };
  }

  const enKeys = getAllKeys(enTranslations);
  const missingKeys: string[] = [];

  for (const key of enKeys) {
    if (!hasKey(fiTranslations, key)) {
      missingKeys.push(key);
    }
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}

/**
 * Main validation function
 */
function main(): void {
  console.log('🔍 Validating i18n translations...\n');

  let allValid = true;
  const allMissingKeys: Array<{ namespace: string; keys: string[] }> = [];

  for (const namespace of NAMESPACES) {
    console.log(`Checking ${namespace}...`);
    const result = validateNamespace(namespace);

    if (result.isValid) {
      console.log(`  ✅ ${namespace}: All keys present\n`);
    } else {
      console.log(
        `  ❌ ${namespace}: Missing ${result.missingKeys.length} key(s)\n`,
      );
      allValid = false;
      allMissingKeys.push({
        namespace,
        keys: result.missingKeys,
      });
    }
  }

  // Report missing keys
  if (!allValid) {
    console.log('\n📋 Missing Translation Keys:\n');
    for (const { namespace, keys } of allMissingKeys) {
      console.log(`  ${namespace}:`);
      for (const key of keys) {
        console.log(`    - ${key}`);
      }
      console.log();
    }

    console.error(
      '\n❌ Validation failed: Some translation keys are missing in Finnish.\n',
    );
    process.exit(1);
  }

  console.log('✅ All translations are complete!\n');
  process.exit(0);
}

// Run validation
main();
