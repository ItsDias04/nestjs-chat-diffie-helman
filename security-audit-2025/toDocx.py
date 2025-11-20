import pypandoc
import sys
import os

def convert_md_to_docx(input_file, output_file=None):
    if not output_file:
        output_file = os.path.splitext(input_file)[0] + ".docx"

    pypandoc.convert_file(
        input_file,
        "docx",
        format="md",
        outputfile=output_file,
        extra_args=[
            "--standalone",
            "--wrap=none",
            "--syntax-definition=html",
            "--highlight-style=pygments"  # подсветка синтаксиса
        ]
    )

    print(f"Готово: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование: python md_to_docx.py file.md")
        sys.exit(1)

    convert_md_to_docx(sys.argv[1])
