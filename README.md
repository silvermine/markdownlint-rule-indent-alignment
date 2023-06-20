# markdownlint-rule-list-indentation

<!-- markdownlint-disable line-length -->
[![NPM Version](https://img.shields.io/npm/v/@silvermine/markdownlint-rule-list-indentation.svg)](https://www.npmjs.com/package/@silvermine/markdownlint-rule-list-indentation)
[![License](https://img.shields.io/github/license/silvermine/markdownlint-rule-list-indentation.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
<!-- markdownlint-enable line-length -->

## What?

This is a custom [markdownlint](https://github.com/DavidAnson/markdownlint) rule to lint
the alignment of list items and blocks (e.g. code blocks). For example:

| Invalid :no_entry:                                                                           | Valid :white_check_mark:                                                               |
|----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| <pre>Lorem ipsum dolor sit amet<br>   consectetur adipiscing elit.</pre>                     | <pre>Lorem ipsum dolor sit amet<br>consectetur adipiscing elit.</pre>                  |
| <pre>\* Lorem ipsum<br> * Dolor sit amet</pre>                                               | <pre>* Lorem ipsum<br>  * Dolor sit amet</pre>                                         |
| <pre>1. Lorem ipsum<br>  * Dolor sit amet</pre>                                              | <pre>1. Lorem ipsum<br>   * Dolor sit amet</pre>                                       |
| <pre>* Lorem ipsum dolor sit amet<br>consectetur adipiscing elit</pre>                       | <pre>* Lorem ipsum dolor sit amet<br>  consectetur adipiscing elit</pre>               |
| <pre>1. Lorem ipsum dolor sit amet<br>     consectetur adipiscing elit</pre>                 | <pre>1. Lorem ipsum dolor sit amet<br>   consectetur adipiscing elit</pre>             |
| <pre>* Lorem:<br><br>    &#96;&#96;&#96;text<br>    hello world<br>    &#96;&#96;&#96;</pre> | <pre>* Lorem:<br><br>  &#96;&#96;&#96;text<br>  hello world<br>  &#96;&#96;&#96;</pre> |
| <pre>> Lorem ipsum dolor sit amet<br> > consectetur adipiscing elit</pre>                    | <pre>> Lorem ipsum dolor sit amet<br>> consectetur adipiscing elit</pre>               |

## Usage

To use this custom markdownlint rule two things needed:

   1. Update your [markdownlint config][markdownlint-config] to include
      `"list-indention": true`
   2. Add this rule to the list of [custom markdownlint rules][custom-rules-config].
      If using [markdownlint-cli](https://github.com/igorshubovych/markdownlint-cli), this
      would look something like:

      ```bash
      markdownlint -r './node_modules/@silvermine/markdownlint-rule-list-indention/src/list-indention.js' -c .markdownlint.json README.md
      ```

## Rule configuration

This rule has the following config options:

   * `ul_indent`: Desired indention of `ul` lists (`number`, default `undefined`)
      * By default, child `ul` items will be aligned with the content. When `ul_indent` is
        set, the rule will replicate the behavior of the [`ul-indent` (MD007)
        rule][md007].
      * Examples:
         * `ul_indent: undefined`

           ```text
           * top-level item
             * sub-item
           ```

         * `ul_indent: 3`

           ```text
           * top-level item
              * sub-item
           ```

[markdownlint-config]: https://github.com/DavidAnson/markdownlint#optionsconfig
[custom-rules-config]: https://github.com/DavidAnson/markdownlint#optionscustomrules
[md007]: https://github.com/DavidAnson/markdownlint/blob/main/doc/md007.md

## License

This software is released under the MIT license. See [the license file](LICENSE) for more
details.
