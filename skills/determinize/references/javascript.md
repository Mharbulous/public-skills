# JavaScript Script Reference

## Substitutions

| Element          | Value                                    |
|------------------|------------------------------------------|
| Runtime command  | `node`                                   |
| File extension   | `.mjs`                                   |
| Import syntax    | `import x from 'x'`                      |
| Argument parsing | `process.argv.slice(2)`                  |
| Run instruction  | `Run: node scripts/<name>.mjs <args>`    |

`.mjs` extension ensures ES module syntax works without needing a `package.json` with `"type": "module"`.

## Template Script

```javascript
#!/usr/bin/env node
/**
 * <Brief description of what this script does>.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node <script>.mjs <input>');
  process.exit(1);
}

const inputPath = resolve(args[0]);

// Main logic here
const result = process(inputPath);
console.log(result);

function process(filePath) {
  /** <Core processing logic>. */
}
```
