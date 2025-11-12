/* eslint-disable no-useless-escape */

import { transliterate as tr } from "transliteration"

/**
 * Generates a random short slug for sharing URLs
 *
 * Creates a URL-safe random string of 8 characters using
 * alphanumeric characters. Used for public share links.
 *
 * @returns Random 8-character alphanumeric slug
 * @example
 * generateSlug() // "a7f3k9m2"
 */
export function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Converts text to a URL-safe slug format
 *
 * Transliterates non-Latin characters, removes accents, converts to lowercase,
 * and replaces spaces with hyphens. Used for generating feed and article slugs.
 *
 * @param text - Text to convert to slug format
 * @returns URL-safe slug string
 * @example
 * slugify("Hello World!") // "hello-world"
 * slugify("Café Münchën") // "cafe-munchen"
 */
export function slugify(text: string) {
  return tr(text)
    .toString() // Cast to string (optional)
    .normalize("NFKD") // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
    .replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
    .toLowerCase() // Convert the string to lowercase letters
    .trim() // Remove whitespace from both sides of a string (optional)
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\_/g, "-") // Replace _ with -
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/\-$/g, "") // Remove trailing -
}

/**
 * Converts text to a valid username format
 *
 * Similar to slugify but removes all hyphens, underscores, and spaces to create
 * a continuous alphanumeric string. Used for generating unique usernames.
 *
 * @param text - Text to convert to username format
 * @returns Alphanumeric username string without special characters
 * @example
 * slugifyUsername("John Doe") // "johndoe"
 * slugifyUsername("user_name-123") // "username123"
 */
export function slugifyUsername(text: string) {
  return tr(text)
    .toString() // Cast to string (optional)
    .normalize("NFKD") // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
    .replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
    .toLowerCase() // Convert the string to lowercase letters
    .trim() // Remove whitespace from both sides of a string (optional)
    .replace(/\s+/g, "") // Replace spaces with non-space-chars
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-/g, "") // Replace - with non-space-chars
    .replace(/\_/g, "") // Replace _ with non-space-chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/\-$/g, "") // Remove trailing -
}

/**
 * Converts text to a file-safe slug format
 *
 * Similar to slugify but preserves dots (.) to maintain file extensions.
 * Used for generating safe filenames while keeping the file extension intact.
 *
 * @param text - Text to convert to file slug format
 * @returns File-safe slug string with dots preserved
 * @example
 * slugifyFile("My Document.pdf") // "my-document.pdf"
 * slugifyFile("Report 2024.xlsx") // "report-2024.xlsx"
 */
export function slugifyFile(text: string) {
  return tr(text)
    .toString() // Cast to string (optional)
    .normalize("NFKD") // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
    .replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
    .toLowerCase() // Convert the string to lowercase letters
    .trim() // Remove whitespace from both sides of a string (optional)
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-.]+/g, "") // Remove all non-word chars except dots
    .replace(/\_/g, "-") // Replace _ with -
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/\-$/g, "") // Remove trailing -
}
