'use strict';

const { expect } = require('chai');

const { markdownlint } = require('markdownlint').promises,
      listIndentation = require('../src/list-indentation');

describe('List Indentation', () => {

   it('properly validates indented lists with ol and ul items', async () => {
      const results = await markdownlint({
         config: { default: false },
         customRules: [ listIndentation ],
         strings: {
            text: ''
               + '  * first ul item\n'
               + '    1. first ol item\n'
               + '      * first ul item\n'
               + '    1. second ol item\n'
               + '  * second ul item\n'
               + '  * third ul item\n'
               + '    1. first ol item\n'
               + '    1. second ol item\n',
         },
      });

      expect(results.text).to.be.eql([]);
   });

});
