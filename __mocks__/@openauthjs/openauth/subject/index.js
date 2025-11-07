/**
 * Mock for @openauthjs/openauth/subject
 *
 * Provides a mock subject builder for OpenAuth authentication in tests
 * that properly exposes the Zod schemas for validation
 */

module.exports = {
  createSubjects: (schemas) => {
    // Return the schemas directly so they can be used for validation
    // OpenAuth's createSubjects wraps schemas, but for testing we want direct access
    return schemas
  },
}
