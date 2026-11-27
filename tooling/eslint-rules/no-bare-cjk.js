/**
 * Disallow bare CJK text in application source.
 *
 * Every user-facing string must go through `src/core/i18n` (`t('...')`). This
 * rule catches JSX text nodes, string literals and template elements that
 * contain Han characters so translations cannot silently drift into code.
 *
 * Exemptions (comment based, intended for translation resources only):
 *   - file level: `// i18n-allow-cjk-file`
 *   - line level: `// i18n-allow-cjk` on the same or previous line
 */

const CJK_PATTERN = /[㐀-䶿一-鿿豈-﫿]/;

const FILE_MARKER = 'i18n-allow-cjk-file';
const LINE_MARKER = 'i18n-allow-cjk';

/** @param {import('eslint').SourceCode} sourceCode */
function createExemptionChecker(sourceCode) {
  const comments = sourceCode.getAllComments();
  const fileExempt = comments.some((comment) => comment.value.includes(FILE_MARKER));

  return (node) => {
    if (fileExempt) {
      return true;
    }
    if (!node.loc) {
      return false;
    }
    const line = node.loc.start.line;
    return comments.some(
      (comment) =>
        comment.value.includes(LINE_MARKER) &&
        (comment.loc.end.line === line || comment.loc.end.line === line - 1),
    );
  };
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow bare CJK strings outside the i18n resource files',
    },
    schema: [],
    messages: {
      bareCjk:
        'Bare CJK text is not allowed. Move it to src/core/i18n and use t("key"), or annotate with // i18n-allow-cjk.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const isExempt = createExemptionChecker(sourceCode);

    /** @param {import('estree').Node & { value: string }} node */
    function check(node, value) {
      if (!CJK_PATTERN.test(value) || isExempt(node)) {
        return;
      }
      context.report({ node, messageId: 'bareCjk' });
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          check(node, node.value);
        }
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
      JSXText(node) {
        check(node, node.value);
      },
    };
  },
};
