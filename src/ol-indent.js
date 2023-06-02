'use strict';
const { addErrorDetailIf, indentFor, listItemMarkerRe } = require('markdownlint-rule-helpers');

// We need a custom regex instead of the one from markdownlint-rule-helpers because that
// regex didn't separate indentation into group 1.
const orderedItemMarkerRe = /^(\s[*-+])0*(\d+)[.)]/;

/**
 * Given a list item token, calculate the expected indentation for a sub-list.
 * According to the markdown spec, the indentation is marker width + trailing spaces. ie:
 * "1. li" = 3
 * "10. li" = 4
 * "10.  li" = 5
 * "* li" = 2
 * @param {object} token - list item token.
 * @returns {number} list item marker width. indicates indentation for sub lists.
 */
function getSubListIndentation(token) {
   let markerWidth = 0;

   if (token.type !== 'list_item_open') {
      return markerWidth;
   }

   let marker = token.info + token.markup;

   // info is empty for unordered lists, but contains the number chars for ordered lists.
   markerWidth += marker.length;

   if (marker === '*') {
      marker = `[${marker}]`;
   }

   const spacesRegex = new RegExp(`^(?:[^\\n*.\\d\\w]*)(${marker})(\\s*)`);

   const spacesAfterMarker = token.line.match(spacesRegex);

   if (spacesAfterMarker) {
      markerWidth += spacesAfterMarker[2].length;
   }

   return markerWidth;
}

/**
 * Split the inline content of a list item into separate tokens if it contains a sub
 * list. When a sub-list has less indentation than expected, markdown treats it is as
 * part of the parent list item, causing it not to be linted properly.
 * see example: https://spec.commonmark.org/0.30/#example-291
 * @param {object} token - inline token to check for a sub-list.
 * @returns {Array} tokens for the sub-list. Empty if no sub-list is found.
 */
function splitSubListItems(token) {
   return token.children.reduce((children, child) => {
      let unordered;

      if (children.some((item) => { return item.lineNumber === child.lineNumber; }) || token.lineNumber === child.lineNumber) {
         return children;
      }

      if (child.line.match(orderedItemMarkerRe)) {
         unordered = false;
      } else if (child.line.match(listItemMarkerRe)) {
         unordered = true;
      } else {
         // Not a list item, so skip it.
         return children;
      }

      const newToken = {
         ...token,
         line: child.line,
         lineNumber: child.lineNumber,
         unordered: unordered,
      };

      children.push(newToken);
      return children;
   }, []);
}

/**
 * Split ordered/unordered lists into separate arrays along with indentation data.
 * @param {Array} tokens - all parsed tokens from markdownlint.
 * @param {Array} lines - all lines in the document.
 * @param {number} ulIndent - indentation for unordered lists.
 * @returns {Array} ordered/unordered lists with indentation data.
 */
function flattenLists(tokens, lines, ulIndent) {
   const flattenedLists = [];

   const stack = [];

   let current = null;

   for (const token of tokens) {
      if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
         // Save current context and start a new one
         stack.push(current);
         current = {
            unordered: token.type === 'bullet_list_open',
            parentsUnordered: !current || (current.unordered && current.parentsUnordered),
            open: token,
            indent: indentFor(token),
            items: [],
            insert: flattenedLists.length,
            subListIndentation: stack.reduce((accumulator, prevList) => {
               if (prevList && prevList.items) {
                  if (prevList.unordered) {
                     return accumulator + ulIndent;
                  }
                  return accumulator + getSubListIndentation(prevList.items[prevList.items.length - 1]);
               }
               return accumulator;
            }, 0),
         };
      } else if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
         // Finalize current context and restore previous
         flattenedLists.splice(current.insert, 0, current);
         delete current.insert;
         current = stack.pop();
      } else if (token.type === 'list_item_open') {
         current.items.push(token);
      } else if (token.type === 'inline' && token.children) {
         const invalidItems = splitSubListItems(token);

         if (invalidItems.length !== 0) {
            flattenedLists.push({
               items: invalidItems,
               parentsUnordered: !current || (current.unordered && current.parentsUnordered),
               unordered: invalidItems[0].unordered,
               subListIndentation: stack.reduce((accumulator, prevList) => {
                  if (prevList && prevList.items) {
                     if (prevList.unordered) {
                        return accumulator + ulIndent;
                     }
                     return accumulator + getSubListIndentation(prevList.items[prevList.items.length - 1]);
                  }
                  return accumulator;
               }, 0),
            });
         }
      }
   }
   return flattenedLists;
}

module.exports = {
   names: [ 'ol-indent' ],
   description: 'Ordered list indentation',
   information: new URL('https://github.com/silvermine/markdownlint-rule-list-indentation'),
   tags: [ 'ol', 'bullet', 'il', 'indentation' ],

   function: function olIndent(params, onError) {
      const indent = Number(params.config.indent || 2);

      const startIndented = !!params.config.start_indented;

      const startIndent = Number(params.config.start_indent || indent);

      const flattenedLists = flattenLists(params.tokens, params.lines, indent);

      for (const list of flattenedLists) {
         if (list.unordered && list.parentsUnordered) {
            continue;
         }
         for (const item of list.items) {
            let { lineNumber, line } = item,
                expectedIndent = startIndented ? startIndent : 0;

            const actualIndent = indentFor(item);

            let range = null,
                editColumn = 1,
                regexMatch;

            if (list.unordered) {
               regexMatch = listItemMarkerRe;
            } else {
               regexMatch = orderedItemMarkerRe;
            }

            const match = line.match(regexMatch);

            if (match) {
               range = [ 1, match[0].length ];
               editColumn += match[1].length - actualIndent;
            }

            if (item.type === 'list_item_open' || (item.type === 'inline' && list.subListIndentation)) {
               // If this is a subList, we need to adjust the expected indent
               expectedIndent += list.subListIndentation;
            }

            addErrorDetailIf(onError, lineNumber, expectedIndent, actualIndent, null, line, range, {
               editColumn,
               deleteCount: actualIndent,
               insertText: ''.padEnd(expectedIndent),
            });
         }
      }
   },
};
