'use strict';

const { addErrorDetailIf } = require('markdownlint-rule-helpers');

function traverse(tokens, nodeTypes, iterateeFn) {
   tokens.forEach((token) => {
      if (!nodeTypes || nodeTypes.includes(token.type)) {
         iterateeFn(token);
      }

      if (token.children) {
         traverse(token.children, nodeTypes, iterateeFn);
      }
   });
}

function iterate(tokens, nodeTypes, iterateeFn) {
   let skipTo;

   (tokens || []).forEach((token) => {
      if (skipTo && skipTo === token.type) {
         skipTo = undefined;
      }

      const isSkippingTokens = skipTo !== undefined,
            visitRequested = !nodeTypes || nodeTypes.includes(token.type);

      if (!isSkippingTokens && visitRequested) {
         iterateeFn(token, (requestedSkipTo) => {
            skipTo = requestedSkipTo;
         });
      }
   });
}

function findFirstTokenOfType(tokens, nodeTypes) {
   return (tokens || []).find((token) => {
      return nodeTypes.includes(token.type);
   });
}

function getReadableNameOfTokenForError(token) {
   const names = {
      blockQuote: 'blockquotes',
      codeFenced: 'code blocks',
      content: 'paragraphs',
      listOrdered: 'ordered lists',
      listUnordered: 'unordered lists',
   };

   return names[token.type] || token.type;
}

module.exports = {

   names: [ 'indent-alignment' ],
   description: 'Indent alignment of list items, wrapped lines, and blocks',
   information: new URL('https://github.com/silvermine/markdownlint-rule-indent-alignment'),
   tags: [ 'bullet', 'ul', 'il', 'indentation', 'paragraph' ],

   'function': function listIndentation(params, onError) {
      // Ensure top-level blocks and paragraphs are not indented
      iterate(params.parsers.micromark.tokens, [ 'blockQuote', 'codeFenced', 'content' ], (token) => {
         addErrorDetailIf(
            onError,
            token.startLine,
            0,
            token.startColumn - 1,
            `Top-level ${getReadableNameOfTokenForError(token)} should not be indented`,
            undefined,
            [ 1, token.startColumn - 1 ],
            {
               deleteCount: token.startColumn - 1,
            }
         );
      });

      // Ensure all text lines within a paragraph are aligned
      traverse(params.parsers.micromark.tokens, [ 'paragraph' ], (token) => {
         const inlineTextLikeTokens = [
            'autolink',
            'characterEscape',
            'codeText',
            'data',
            'emphasis',
            'link',
            'literalAutolink',
            'strong',
            'htmlText',
         ];

         const firstToken = findFirstTokenOfType(token.children, inlineTextLikeTokens);

         if (!firstToken) {
            return;
         }

         const expectedIndent = firstToken.startColumn - 1; // -1 to make zero indexed

         iterate(token.children, inlineTextLikeTokens, (child, skipTo) => {
            const startColumn = child.startColumn - 1; // -1 to make zero indexed

            addErrorDetailIf(
               onError,
               child.startLine,
               expectedIndent,
               startColumn,
               'Wrapped text should be left-aligned with the preceding content',
               undefined,
               [ 1, Math.max(startColumn, 1) ],
               {
                  deleteCount: startColumn,
                  insertText: ' '.repeat(expectedIndent),
               }
            );
            skipTo('lineEnding');
         });
      });

      // Ensure blocks are aligned
      traverse(params.parsers.micromark.tokens, [ 'blockQuote', 'listOrdered', 'listUnordered' ], (token) => {
         const iterateOverChildTokens = [ 'blockQuote', 'codeFenced', 'content', 'listItemPrefix', 'listOrdered', 'listUnordered' ],
               firstToken = findFirstTokenOfType(token.children, [ 'content' ]);

         if (!firstToken) {
            return;
         }

         let expectedIndent = firstToken.startColumn - 1; // -1 to make zero indexed

         iterate(token.children, iterateOverChildTokens, (child, skipTo) => {
            const startColumn = child.startColumn - 1; // -1 to make zero indexed

            if (child.type === 'listItemPrefix') {
               addErrorDetailIf(
                  onError,
                  child.startLine,
                  token.startColumn - 1,
                  startColumn,
                  'List items should be left-aligned with the preceding list items',
                  undefined,
                  [ 1, Math.max(startColumn, 1) ],
                  {
                     deleteCount: startColumn,
                     insertText: ' '.repeat(token.startColumn - 1),
                  }
               );

               expectedIndent = token.startColumn + child.endColumn - child.startColumn - 1;
               skipTo('lineEnding');
               return;
            }

            // When `ul_indent` is configured, allow sub-items to be indented at a
            // different depth. This is to support behavior found in ul-indent (MD007).
            // See: https://github.com/DavidAnson/markdownlint/blob/main/doc/md007.md
            if (params.config.ul_indent && token.type === 'listUnordered' && [ 'listOrdered', 'listUnordered' ].includes(child.type)) {
               const expectedListIndent = (token.startColumn - 1) + params.config.ul_indent;

               addErrorDetailIf(
                  onError,
                  child.startLine,
                  expectedListIndent,
                  startColumn,
                  `Child ${getReadableNameOfTokenForError(child)} should be indented ${params.config.ul_indent} from the parent list`,
                  undefined,
                  [ 1, startColumn ],
                  {
                     deleteCount: startColumn,
                     insertText: ' '.repeat(expectedListIndent),
                  }
               );
               return;
            }

            addErrorDetailIf(
               onError,
               child.startLine,
               expectedIndent,
               startColumn,
               `Nested ${getReadableNameOfTokenForError(child)} should be left-aligned with the preceding content`,
               undefined,
               [ 1, startColumn ],
               {
                  deleteCount: startColumn,
                  insertText: ' '.repeat(expectedIndent),
               }
            );
         });
      });
   },

};
