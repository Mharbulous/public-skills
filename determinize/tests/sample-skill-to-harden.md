---
name: csv-data-validator
description: Use when validating CSV files against schema definitions before importing into databases - checks column types, required fields, value ranges, and referential integrity
---

# CSV Data Validator

## Overview

Validate CSV files against predefined schemas before database import. Catches type mismatches, missing required fields, out-of-range values, and broken references before data enters the system.

## Validation Process

### Step 1: Schema Discovery

First, determine which schema applies to the CSV file:

1. Read the CSV header row to get column names
2. Compare column names against all schema files in `reference/schemas/`
3. Score each schema by the percentage of columns that match
4. If best match score > 80%, use that schema
5. If best match score is 50-80%, ask the user to confirm
6. If best match score < 50%, ask the user to provide the correct schema

To read the header row, use Python:
```python
import csv
with open(filepath, 'r') as f:
    reader = csv.reader(f)
    headers = next(reader)
```

To score schemas, iterate through each `.json` file in `reference/schemas/`:
```python
import json
import os

def score_schema(headers, schema_path):
    with open(schema_path) as f:
        schema = json.load(f)
    schema_cols = set(schema['columns'].keys())
    header_set = set(headers)
    if not schema_cols:
        return 0
    return len(schema_cols & header_set) / len(schema_cols) * 100
```

Then select the best match:
```python
best_score = 0
best_schema = None
for fname in os.listdir('reference/schemas/'):
    if fname.endswith('.json'):
        path = os.path.join('reference/schemas/', fname)
        score = score_schema(headers, path)
        if score > best_score:
            best_score = score
            best_schema = path
```

### Step 2: Type Validation

For each column defined in the schema, validate that every value in the CSV matches the expected type.

Schema type definitions:
- `"string"` - Any non-empty text
- `"integer"` - Whole numbers (no decimals)
- `"float"` - Decimal numbers
- `"date"` - ISO 8601 format (YYYY-MM-DD)
- `"email"` - Valid email format (contains @ with domain)
- `"phone"` - Digits, spaces, hyphens, parentheses, plus sign
- `"boolean"` - true/false, yes/no, 1/0 (case-insensitive)

To validate types, iterate through each row and check each cell:

```python
import re
from datetime import datetime

def validate_type(value, expected_type):
    if not value or value.strip() == '':
        return True  # Empty values handled by required check

    value = value.strip()

    if expected_type == 'string':
        return len(value) > 0
    elif expected_type == 'integer':
        try:
            int(value)
            return True
        except ValueError:
            return False
    elif expected_type == 'float':
        try:
            float(value)
            return True
        except ValueError:
            return False
    elif expected_type == 'date':
        try:
            datetime.strptime(value, '%Y-%m-%d')
            return True
        except ValueError:
            return False
    elif expected_type == 'email':
        return bool(re.match(r'^[^@]+@[^@]+\.[^@]+$', value))
    elif expected_type == 'phone':
        return bool(re.match(r'^[\d\s\-\(\)\+]+$', value))
    elif expected_type == 'boolean':
        return value.lower() in ('true', 'false', 'yes', 'no', '1', '0')
    return False
```

Then run validation across all rows:

```python
errors = []
with open(filepath, 'r') as f:
    reader = csv.DictReader(f)
    for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
        for col_name, col_def in schema['columns'].items():
            if col_name in row:
                if not validate_type(row[col_name], col_def['type']):
                    errors.append({
                        'row': row_num,
                        'column': col_name,
                        'value': row[col_name],
                        'expected_type': col_def['type'],
                        'error': f"Type mismatch: expected {col_def['type']}"
                    })
```

### Step 3: Required Field Validation

Check that all required fields have non-empty values:

```python
for row_num, row in enumerate(reader, start=2):
    for col_name, col_def in schema['columns'].items():
        if col_def.get('required', False):
            if col_name not in row or not row[col_name] or row[col_name].strip() == '':
                errors.append({
                    'row': row_num,
                    'column': col_name,
                    'error': f"Required field '{col_name}' is empty"
                })
```

### Step 4: Range Validation

For numeric columns with min/max constraints:

```python
for row_num, row in enumerate(reader, start=2):
    for col_name, col_def in schema['columns'].items():
        if col_name in row and row[col_name].strip():
            value = row[col_name].strip()
            if 'min' in col_def:
                try:
                    num_val = float(value)
                    if num_val < col_def['min']:
                        errors.append({
                            'row': row_num,
                            'column': col_name,
                            'value': value,
                            'error': f"Value {value} below minimum {col_def['min']}"
                        })
                except ValueError:
                    pass
            if 'max' in col_def:
                try:
                    num_val = float(value)
                    if num_val > col_def['max']:
                        errors.append({
                            'row': row_num,
                            'column': col_name,
                            'value': value,
                            'error': f"Value {value} above maximum {col_def['max']}"
                        })
                except ValueError:
                    pass
```

### Step 5: Referential Integrity

If the schema defines foreign key relationships, validate that referenced values exist:

```python
for col_name, col_def in schema['columns'].items():
    if 'references' in col_def:
        ref_file = col_def['references']['file']
        ref_col = col_def['references']['column']

        # Load reference values
        ref_values = set()
        with open(ref_file, 'r') as rf:
            ref_reader = csv.DictReader(rf)
            for ref_row in ref_reader:
                if ref_col in ref_row:
                    ref_values.add(ref_row[ref_col].strip())

        # Check each value
        with open(filepath, 'r') as f:
            reader = csv.DictReader(f)
            for row_num, row in enumerate(reader, start=2):
                if col_name in row and row[col_name].strip():
                    if row[col_name].strip() not in ref_values:
                        errors.append({
                            'row': row_num,
                            'column': col_name,
                            'value': row[col_name],
                            'error': f"Referenced value not found in {ref_file}:{ref_col}"
                        })
```

### Step 6: Generate Report

After all validations, generate a summary report:

1. Count total errors by type (type mismatch, required, range, referential)
2. Count errors per column
3. Show first 10 errors of each type with row numbers
4. Calculate overall pass/fail status: PASS if 0 errors, WARN if < 1% error rate, FAIL otherwise

Format the report as markdown:

```markdown
# Validation Report: {filename}

## Summary
- **Status**: PASS/WARN/FAIL
- **Total Rows**: {count}
- **Total Errors**: {count}
- **Error Rate**: {percentage}%

## Errors by Type
| Type | Count |
|------|-------|
| Type Mismatch | {n} |
| Required Field | {n} |
| Range Violation | {n} |
| Referential Integrity | {n} |

## Error Details
### Type Mismatches (showing first 10)
| Row | Column | Value | Expected |
|-----|--------|-------|----------|
| ... | ... | ... | ... |

[repeat for other error types]
```

## Schema Format

Schemas are JSON files with this structure:

```json
{
  "name": "schema_name",
  "description": "What this schema validates",
  "columns": {
    "column_name": {
      "type": "string|integer|float|date|email|phone|boolean",
      "required": true,
      "min": 0,
      "max": 100,
      "references": {
        "file": "path/to/reference.csv",
        "column": "id"
      }
    }
  }
}
```

## Common Issues

- **Encoding**: Always open CSV files with `encoding='utf-8-sig'` to handle BOM markers
- **Line endings**: Use `newline=''` parameter when opening CSV files
- **Large files**: For files over 100MB, process in chunks of 10000 rows
- **Date formats**: If dates aren't ISO 8601, check for common alternatives (MM/DD/YYYY, DD-MM-YYYY) before flagging as errors
