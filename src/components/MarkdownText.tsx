'use client';
import React from 'react';

/**
 * Показ ответа нейросети.
 *
 * Модель отвечает разметкой Markdown, и раньше она выводилась как есть —
 * волонтёр видел «**Дата:**» и таблицу из палок вместо оформленного сценария.
 * Свой разбор вместо библиотеки: нужен ровно тот набор, который модель и
 * использует, — заголовки, таблицы, списки и жирный текст.
 */
export default function MarkdownText({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`space-y-3 ${className}`}>{renderBlocks(text || '')}</div>;
}

function renderBlocks(source: string): React.ReactNode[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={`p${blocks.length}`} className="text-sm leading-relaxed text-slate-700">
        {inline(paragraph.join(' '))}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={`l${blocks.length}`}
        className={`ml-5 space-y-1 text-sm leading-relaxed text-slate-700 ${
          list.ordered ? 'list-decimal' : 'list-disc'
        }`}
      >
        {list.items.map((item, i) => <li key={i}>{inline(item)}</li>)}
      </Tag>
    );
    list = null;
  };

  const flushAll = () => { flushParagraph(); flushList(); };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { flushAll(); continue; }

    // Горизонтальная черта.
    if (/^([-*_])\1{2,}$/.test(trimmed.replace(/\s/g, ''))) {
      flushAll();
      blocks.push(<hr key={`h${blocks.length}`} className="border-slate-200" />);
      continue;
    }

    // Заголовок.
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      blocks.push(
        <p
          key={`t${blocks.length}`}
          className={`font-display font-bold text-slate-900 ${
            level <= 2 ? 'mt-1 text-lg' : 'text-base'
          }`}
        >
          {inline(heading[2])}
        </p>
      );
      continue;
    }

    // Таблица: строка с палками, а следующая — разделитель из дефисов.
    if (trimmed.includes('|') && isDivider(lines[i + 1])) {
      flushAll();
      const header = splitRow(trimmed);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].includes('|') && lines[j].trim()) {
        rows.push(splitRow(lines[j].trim()));
        j++;
      }
      blocks.push(<Table key={`tb${blocks.length}`} header={header} rows={rows} />);
      i = j - 1;
      continue;
    }

    // Списки.
    const bullet = trimmed.match(/^[-*•]\s+(.*)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = !!numbered;
      const item = (bullet ? bullet[1] : numbered![1]);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(item);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushAll();
  return blocks;
}

function isDivider(line?: string): boolean {
  if (!line) return false;
  const t = line.trim();
  return t.includes('|') && /^[\s|:-]+$/.test(t) && t.includes('-');
}

function splitRow(line: string): string[] {
  return line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}

/** Таблицы бывают широкими, поэтому прокручиваются внутри себя, а не тянут страницу. */
function Table({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th key={i} className="border-b-2 border-slate-200 px-2 py-2 text-left font-bold text-slate-900">
                {inline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="align-top">
              {header.map((_, c) => (
                <td key={c} className="border-b border-slate-100 px-2 py-2 text-slate-700">
                  {inline(row[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Жирный, курсив и `код` внутри строки. */
function inline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('**') || token.startsWith('__')) {
      parts.push(<strong key={parts.length} className="font-bold text-slate-900">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code key={parts.length} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em]">{token.slice(1, -1)}</code>
      );
    } else {
      parts.push(<em key={parts.length}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
