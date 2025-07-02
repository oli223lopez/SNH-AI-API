# SNH AI Tree API

## Overview
A RESTful API for managing a tree data structure, built with TypeScript, Express, and SQLite. The API supports creating tree nodes, retrieving all trees, and fetching individual nodes by ID, with robust error handling and in-memory caching for performance. Designed for the SNH AI takehome to demonstrate API design, data modeling, and testing skills.

### Features
- **Create Node**: `POST /api/tree` creates a node with a label and optional parent ID, enforcing unique labels and valid parent IDs.
- **Get All Trees**: `GET /api/trees` returns all root nodes and their children in a nested structure.
- **Get Node by ID**: `GET /api/tree/:id` retrieves a node by its ID and any children if nested.
- **Error Handling**: Validates inputs (e.g., non-empty labels, positive parent IDs) and handles database errors (e.g., foreign key violations).
- **Caching**: Uses an in-memory `treeCache` to optimize tree traversal and reduce database queries.
- **Testing**: Comprehensive Jest tests cover happy paths, edge cases, and error scenarios.

### Why No Delete/Update
The project focuses on core create and read operations, prioritizing robust error handling, caching, and testing. Delete and update functionality (e.g., `DELETE /api/tree/:id`, `PUT /api/tree/:id`) were excluded to ensure stability and meet deadlines, but could be added with cascading deletes or parent ID updates while maintaining cache consistency.

### Tech Stack
- **TypeScript**: For type safety and maintainability.
- **Express**: For API routing and middleware.
- **SQLite**: For lightweight, in-memory database storage.
- **Jest**: For unit and integration tests.
- **Dependencies**: `express`, `sqlite`, `sqlite3`, `ts-jest`, `supertest`, `@types/*`.

### Project Structure
```bash
SNH-AI-Tree-API/
├── controllers/
│   └── TreeController.ts  # Tree logic, database queries, and in-memory caching
├── routes/
│   └── treeRouter.ts      # Express routes, accepts TreeController via dependency injection
├── db/
│   └── index.ts           # SQLite setup (in-memory for tests, persistent for prod)
├── tests/
│   └── treeRouter.test.ts # Jest tests for routes and error handling
├── index.ts               # Server entry point, initializes database and TreeController
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Jest configuration
```

### Future Improvements

1. Add DELETE /api/tree/:id with cascading deletes to maintain tree integrity.
2. Implement PUT /api/tree/:id for updating labels or parent IDs, updating cache.
3. Add authentication (e.g., JWT) for secure access.
4. Support query parameters for filtering trees (e.g., GET /api/trees?label=root).
5. Add request logging middleware for debugging production issues.

### Setup
1. **Clone the Repository**:
   ```bash
   git clone <your-repo-url>
   cd <project-folder>

2. **Install Dependencies**:
   
    Make sure that your current version of node is set to the latest. If not run:
    ```bash
    nvm install node
    ```
    After your node version is updated, install the node packages by running:
   ```bash
   npm i
   ````
### Running Server
There are two ways to run the server: 
```bash
npm start
--or--
ts-node index.ts
```
After starting server the localhost will be pointed to port 2323

### Development
When using the endpoints it would be useful to have postman or if you prefer to use curl commands there are some examples below:
```bash
curl -X GET http://localhost:2323/api/trees # Get all trees
curl -X GET http://localhost:2323/api/tree/1 # Get node with ID 1
curl -X POST http://localhost:2323/api/tree -H 'Content-Type: application/json' -d '{"label": "root", "parentId": null}' # Create root node
curl -X POST http://localhost:2323/api/tree -H 'Content-Type: application/json' -d '{"label": "child", "parentId": 1}' # Create child node
```

### Testing
Run `npm test -- --verbose` to execute Jest tests, covering:
- `POST /api/tree`: Root/child node creation, invalid inputs, duplicate labels, non-existent parents, malformed JSON, missing Content-Type.
- `GET /api/trees`: Empty and populated tree retrieval.
- `GET /api/tree/:id`: Node retrieval, non-existent IDs, invalid IDs.
- `GET /api`: Welcome message.
- Router behavior: Rejects unsupported HTTP methods (e.g., PUT).
Tests use a fresh in-memory SQLite database and `TreeController` per test, initialized in `beforeEach`.
Production database (`./data.db`) and `TreeController` are initialized in `index.ts`. Global `express.json()` and
error-handling middleware handle JSON parsing errors and missing Content-Type cases, with `treeRouter` checking for undefined `req.body`.

   
