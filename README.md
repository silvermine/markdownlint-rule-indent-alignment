# `ol-indent` - Ordered list indentation

<!-- markdownlint-disable line-length -->
[![NPM Version](https://img.shields.io/npm/v/@silvermine/markdownlint-rule-ol-indent.svg)](https://www.npmjs.com/package/@silvermine/markdownlint-rule-ol-indent)
[![License](https://img.shields.io/github/license/silvermine/markdownlint-rule-ol-indent.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
<!-- markdownlint-enable line-length -->

Tags: `ol`, `bullet`, `il`, `indentation`

Aliases: `ul-indent`

Parameters:

   * `indent`: Spaces for indent (`integer`, default `2`)
   * `start_indent`: Spaces for first level indent (when start_indented is set)
     (`integer`, default `2`)
   * `start_indented`: Whether to indent the first level of the list (`boolean`,
     default `false`)

The `start_indented` parameter allows the first level of lists to be indented by
the configured number of spaces rather than starting at zero.
The `start_indent` parameter allows the first level of lists to be
indented by a different number of spaces than the rest (ignored when
`start_indented` is not set).
It's important to note that most of the time the `indent` setting is not used. The only
time it's considered, is for a child unordered list when one of it's grandparents are an
ordered list. For example:

```markdown
1. In this case...
   1. 'indent' is not considered.

1. Also in this case...
   * 'indent' is not considered.

1. However...
   * in this case...
      * 'indent' is considered.

1. Lastly...
   * in this...
      * case...
         * indent is considered.
```

The reason for this odd behavior is because the md007 rule does not pick up on any
children in ordered lists, even if that child is an unordered list. Therefore, in
these cases we need to mimic the behavior of md007 to some extent to keep consistency.

## What?

A custom [markdownlint](https://github.com/DavidAnson/markdownlint) rule to lint ordered
lists and sub lists. Markdownlint has a default rule which lints unordered lists.
However, that rule only applies to unordered lists without any parent ordered lists.

This rule is triggered when list items are not indented by the configured number of
spaces (default: 2), or when a sub-list is not indented according to it's parent's
li marker width. For example, let's assume that we have set indent to 3 for both
this custom rule and for md007. That would make the following valid:

```markdown
* this is validated...
   * by rule md007

1. this is validated...
   1. by our custom rule.

1. this is...
   * also validated...
      * by our custom rule.
```

Note: this rule does not lint code blocks inside of sub-lists.

## Why?

So that ordered lists and sub-lists are rendered as the user expects.

## Usage

From the terminal:
`markdownlint -r 'src/ol-lint.js' -c .markdownlint.json README.md`

If we want our projects to use this custom rule, we would need to modify the
markdownlint command in package.json so that it includes this rule. In addition, the
following settings can be adjusted:

```json
{
   "ol-indent": {
      "indent": 3, // default: 2
      "start_indent": 3, // default: value of indent
      "start_indented": true, // default: false
   }
}
```

## License

This software is released under the MIT license. See [the license file](LICENSE) for more
details.
