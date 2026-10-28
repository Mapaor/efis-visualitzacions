import type { ReactNode } from 'react';

export function Card({ tag, title, children, className = '' }: { tag: string; title: string; children: ReactNode; className?: string }) {
  return <article className={`card ${className}`}>
    <header className="card-heading"><div><span className="tag">{tag}</span><h3>{title}</h3></div></header>
    {children}
  </article>;
}
