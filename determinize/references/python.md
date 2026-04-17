# Python Script Reference

## Substitutions

| Element          | Value                                  |
|------------------|----------------------------------------|
| Runtime command  | `python`                               |
| File extension   | `.py`                                  |
| Import syntax    | `import`, `from x import y`            |
| Argument parsing | `argparse` or `sys.argv`               |
| Run instruction  | `Run: python scripts/<name>.py <args>` |

## Template Script

```python
#!/usr/bin/env python3
"""<Brief description of what this script does>."""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="<description>")
    parser.add_argument("input", help="<input description>")
    parser.add_argument("-o", "--output", help="<output description>")
    args = parser.parse_args()

    # Main logic here
    result = process(args.input)
    print(result)


def process(input_path):
    """<Core processing logic>."""
    pass


if __name__ == "__main__":
    main()
```
