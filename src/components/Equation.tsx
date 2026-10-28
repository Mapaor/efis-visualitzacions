import katex from 'katex';
import 'katex/dist/katex.min.css';

export function Equation({ math }: { math: string }) {
  const html = katex.renderToString(math, { displayMode: true, throwOnError: false, output: 'htmlAndMathml' });
  return <div className="equation" dangerouslySetInnerHTML={{ __html: html }} />;
}
