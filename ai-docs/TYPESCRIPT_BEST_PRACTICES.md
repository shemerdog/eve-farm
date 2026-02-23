# TypeScript Best Practices Guide

This guide provides a comprehensive overview of best practices for writing clean, maintainable, and scalable TypeScript code.

---

## Table of Contents

- [File and Project Organization](#file-and-project-organization)
- [Naming Conventions](#naming-conventions)
- [Variables and Constants](#variables-and-constants)
- [Functions](#functions)
- [Types and Interfaces](#types-and-interfaces)
- [Enums](#enums)
- [Classes](#classes)
- [General Best Practices](#general-best-practices)
- [Summary of Recommendations](#summary-of-recommendations)

---

## File and Project Organization

- **File Size:** Keep files focused on a single responsibility. Aim for files under 500 lines of code. This makes them easier to read, understand, and maintain.
- **Directory Structure:** Group files by feature or domain. For example, all files related to user management (`userService.ts`, `userController.ts`, `user.types.ts`) should be in a `user` directory.
- **File Names:** Use `kebab-case` (e.g., `user-profile.ts`) for general file names. Use `PascalCase` (e.g., `UserProfile.tsx`) for React component file names. Be consistent within the project.

## Naming Conventions

Consistent naming is crucial for code readability.

- **Variables and Functions:** Use `camelCase`.
  ```typescript
  const userAccount = {};
  function calculateTotal() { /* ... */ }
  ```
- **Classes, Interfaces, and Type Aliases:** Use `PascalCase`.
  ```typescript
  class UserManager { /* ... */ }
  interface UserProfile { /* ... */ }
  type UserId = string;
  ```
- **Constants:** Use `UPPER_CASE` for global or widely used constants.
  ```typescript
  const API_KEY = 'your-secret-key';
  ```
- **Enums:** Use `PascalCase` for the enum name and `PascalCase` for its members.
  ```typescript
  enum UserRole {
    Admin,
    Editor,
    Viewer,
  }
  ```
- **Boolean Variables:** Prefix with `is`, `has`, or `can`.
  ```typescript
  const isLoggedIn = true;
  const hasPermission = false;
  ```
- **Private Members:** Prefix with an underscore (`_`).
  ```typescript
  class Example {
    private _internalValue: number;
  }
  ```

## Variables and Constants

- **`let` vs. `const`:** Prefer `const` by default. Use `let` only for variables that need to be reassigned. This helps prevent accidental reassignments and makes intentions clearer.
- **Immutability:** Strive for immutability. Avoid modifying objects and arrays directly. Use methods that return new instances (e.g., `map`, `filter`, `reduce`, spread syntax).

## Functions

- **Function Length:** Keep functions small and focused. A good rule of thumb is that a function should do one thing and fit on a single screen (typically under 30 lines).
- **Single Responsibility Principle (SRP):** Each function should have a single, well-defined responsibility.
- **Explicit Return Types:** Always explicitly define the return type of a function. This improves clarity and helps the TypeScript compiler catch errors.
  ```typescript
  // Good
  function getUser(id: string): UserProfile {
    // ...
  }
  ```
- **Function Parameters:**
    - Avoid too many parameters. If a function has more than three parameters, consider passing them as a single object.
    - Use parameter destructuring with type annotations for clarity.
    ```typescript
    interface CreateUserOptions {
      username: string;
      email: string;
      isAdmin: boolean;
    }

    function createUser({ username, email, isAdmin }: CreateUserOptions): User {
      // ...
    }
    ```

## Types and Interfaces

- **`interface` vs. `type`:**
  - **Use `interface`** for defining the shape of objects or for classes to implement. Interfaces can be extended.
    ```typescript
    interface Animal {
      name: string;
    }

    interface Dog extends Animal {
      breed: string;
    }
    ```
  - **Use `type`** for defining unions, intersections, tuples, or other complex types.
    ```typescript
    type Status = 'success' | 'error';
    type Point = [number, number];
    ```
- **Avoid `any`:** The `any` type disables type checking. Its use should be an absolute last resort.
- **Use `unknown` over `any`:** When a type is truly unknown, prefer `unknown`. It is a type-safe alternative that forces you to perform type checks before using the variable.
  ```typescript
  let value: unknown;
  // value.toUpperCase(); // Error: Object is of type 'unknown'.

  if (typeof value === 'string') {
    console.log(value.toUpperCase()); // OK
  }
  ```
- **Utility Types:** Leverage built-in utility types like `Partial<T>`, `Readonly<T>`, `Pick<T>`, and `Omit<T>` to create new types from existing ones without boilerplate.
- **Type Inference:** Let TypeScript infer types for simple variables and return types when it's clear and doesn't harm readability.

## Enums

- **Prefer String Enums:** String enums are more readable and provide more meaningful values when debugging, as the string value is visible instead of a numeric index.
  ```typescript
  // Good
  enum Direction {
    Up = 'UP',
    Down = 'DOWN',
  }
  ```
- **Use `const enum` for Performance:** If you need to squeeze out performance, `const enum`s are completely removed during transpilation, and their values are inlined. However, this comes at the cost of some runtime flexibility.

## Classes

- **Access Modifiers:** Use `public`, `private`, and `protected` to control the visibility of class members. Default is `public`.
- **`readonly` Members:** Use the `readonly` modifier for properties that should not be changed after initialization.
- **Composition over Inheritance:** Prefer composition (using other classes/objects) over class inheritance to build complex functionality. It leads to more flexible and decoupled code.

## General Best Practices

- **Linter and Formatter:** Use ESLint with TypeScript support and Prettier to enforce a consistent code style and catch potential errors early.
- **Modularity:** Break down your code into smaller, reusable modules. Use `import` and `export` to manage dependencies between them.
- **Type-Only Imports:** Use `import type` when you are only importing types. This ensures the import has no runtime cost and can be safely erased.
  ```typescript
  import type { UserProfile } from './user.types';
  ```
