// Human-readable comprehensive markdown sample used in ChatMessage scenarios
export function buildComprehensiveMarkdown(): string {
  return `
 # Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

Here is some markdown with a list and \`inline code\`. **bold** and _italic_. [link](https://example.com).

- Item A
- Item B
  - Nested 1
  - Nested 2

1. First
2. Second

- [x] done
- [ ] todo

> Blockquote line

| Col A | Col B |
| --- | --- |
| 1 | 2 |

---

Inline math: $a^2 + b^2 = c^2$

\\[\\int_0^1 x^2 dx = 1/3\\]

More inline math: $e^{i\\pi}+1=0$, $\\alpha,\\beta,\\gamma$, $\\vec{x}$, $\\|x\\|_2$.

Block derivatives and fractions:

$$
\\frac{d}{dx} \\left( x^2 \\right) = 2x
$$

Summation/product identities:

$$
 \\sum_{i=1}^n i = \\frac{n(n+1)}{2}, \\quad \\prod_{k=1}^m k = m!
$$

Aligned equations:

$$
 \\begin{aligned}
  a &= b + c \\\\
  &= d
 \\end{aligned}
$$

Matrix and cases:

$$
 \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}
$$

$$
 f(x) = \\begin{cases}
  x^2 & x \\ge 0 \\\\
  -x  & x < 0
 \\end{cases}
$$

\`\`\`ts
export function greet(name: string) {
  const msg = \`Hello, \${name}!\`;
  const arr = [1, 2, 3].map((n) => n * 2);
  console.log(msg, arr);
}

// Generic + union
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
\`\`\`

\`\`\`python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

\`\`\`html
<div class="card">
  <h3>Title</h3>
  <p>Content</p>
</div>
\`\`\`
`;
}
