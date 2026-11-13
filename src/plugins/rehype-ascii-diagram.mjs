import { visit, SKIP } from 'unist-util-visit';

function getNodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(getNodeText).join('');
  }
  return '';
}

export default function rehypeAsciiDiagram() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'pre' && parent && typeof index === 'number') {
        // Avoid double wrapping if already enclosed in an ascii-diagram container
        const parentClasses = parent.properties?.className;
        if (
          parent.tagName === 'div' &&
          parentClasses &&
          (Array.isArray(parentClasses)
            ? parentClasses.includes('ascii-diagram')
            : String(parentClasses).includes('ascii-diagram'))
        ) {
          return;
        }

        const text = getNodeText(node);
        const hasBoxDrawing = /[┌─│└├┼]/.test(text);
        const hasAsciiTree = /^\s*\+--/m.test(text);

        if (hasBoxDrawing || hasAsciiTree) {
          const wrapper = {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['ascii-diagram', 'not-prose'],
              role: 'img',
              'aria-label': 'Technical diagram (text form)',
              tabindex: '0'
            },
            children: [node]
          };
          parent.children[index] = wrapper;
          return [SKIP, index + 1];
        }
      }
    });
  };
}

