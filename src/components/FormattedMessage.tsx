import { Fragment } from 'react';
import { parseMarkdownBlocks, type InlineToken } from '../utils/markdown';

function renderInline(tokens: InlineToken[]) {
  return tokens.map((token, idx) => {
    switch (token.type) {
      case 'bold':
        return (
          <strong key={idx} className="font-semibold text-[#18181B]">
            {token.value}
          </strong>
        );
      case 'code':
        return (
          <code
            key={idx}
            className="font-mono text-[13px] bg-[#F2EFE8] px-1.5 py-0.5 rounded text-[#18181B]"
          >
            {token.value}
          </code>
        );
      case 'link':
        return (
          <a
            key={idx}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#A16207] underline underline-offset-2 hover:text-[#854D0E]"
          >
            {token.label}
          </a>
        );
      case 'text':
      default:
        return <Fragment key={idx}>{token.value}</Fragment>;
    }
  });
}

export function FormattedMessage({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-[#27272A]">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Tag = block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5';
          return (
            <Tag
              key={index}
              className="font-display font-semibold text-base text-[#18181B] pt-1"
            >
              {renderInline(block.tokens)}
            </Tag>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={index} className="list-disc pl-5 space-y-1.5">
              {block.items.map((itemTokens, itemIdx) => (
                <li key={itemIdx} className="pl-0.5">
                  {renderInline(itemTokens)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={index} className="list-decimal pl-5 space-y-1.5">
              {block.items.map((itemTokens, itemIdx) => (
                <li key={itemIdx} className="pl-0.5">
                  {renderInline(itemTokens)}
                </li>
              ))}
            </ol>
          );
        }

        return <p key={index}>{renderInline(block.tokens)}</p>;
      })}
    </div>
  );
}
