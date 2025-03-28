import sys
import os

print("Python Interpreter Path:", sys.executable)
print("PYTHONPATH environment variable:", os.environ.get('PYTHONPATH', 'Not set'))
print("PATH environment variable:", os.environ.get('PATH', 'Not set'))