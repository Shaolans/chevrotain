/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../src/scan/lexer.ts" />

module chevrotain.examples.json {

    import recog = chevrotain.recognizer
    import tok = chevrotain.tokens
    import lex = chevrotain.lexer
    var NA = lex.Lexer.NA
    var SKIPPED = lex.Lexer.SKIPPED

    // DOCS: all Tokens must be defined as subclass of chevrotain.tokens.Token

    // DOCS: additional hierarchies may be defined for categorization purposes, for example
    //       when implementing Syntax highlighting being able to easily identify all the keywords with a simple
    //       "instanceof?" could be convenient.
    export class Keyword extends tok.Token { static PATTERN = NA }
    export class True extends Keyword { static PATTERN = /true/ }
    export class False extends Keyword { static PATTERN = /false/ }
    export class Null extends Keyword { static PATTERN = /null/ }
    export class LCurly extends tok.Token { static PATTERN = /{/ }
    export class RCurly extends tok.Token { static PATTERN = /}/ }
    export class LSquare extends tok.Token { static PATTERN = /\[/ }
    export class RSquare extends tok.Token { static PATTERN = /]/ }
    export class Comma extends tok.Token { static PATTERN = /,/ }
    export class Colon extends tok.Token { static PATTERN = /:/ }
    export class StringLiteral extends tok.Token { static PATTERN = /"(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/}
    export class NumberLiteral extends tok.Token { static PATTERN = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/ }
    export class WhiteSpace extends tok.Token {
        static PATTERN = / |\t|\n|\r|\r\n/
        static GROUP = SKIPPED
    }

    // DOCS: The lexer should be used as a singleton as using it does not change it's state and the validations
    //       performed by it's constructor only need to be done once.
    export var JsonLexer = new lex.Lexer(
        [Keyword, WhiteSpace, NumberLiteral, StringLiteral, Comma, Colon, LCurly, RCurly, LSquare, RSquare, True, False, Null])


    export class JsonParser extends recog.Parser {

        constructor(input:tok.Token[] = []) {
            // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
            //       it is mandatory to provide this map to be able to perform self analysis
            //       and allow the framework to "understand" the implemented grammar.
            super(input, <any>chevrotain.examples.json)
            // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
            //       The typescript compiler places the constructor body last after initializations in the class's body
            //       which is why place the call here meets the criteria.
            recog.Parser.performSelfAnalysis(this)
        }

        // DOCS: the parsing rules
        public object = this.RULE("object", () => {
            this.CONSUME(LCurly)
            this.OPTION(() => {
                this.SUBRULE(this.objectItem)
                this.MANY(() => {
                    this.CONSUME(Comma)
                    this.SUBRULE2(this.objectItem) // DOCS: the index "2" in SUBRULE2 is needed to identify
                })                                 //       the unique position in the grammar during runtime
            })
            this.CONSUME(RCurly)
        })

        public objectItem = this.RULE("objectItem", () => {
            this.CONSUME(StringLiteral)
            this.CONSUME(Colon)
            this.SUBRULE(this.value)
        })

        public array = this.RULE("array", () => {
            this.CONSUME(LSquare)
            this.OPTION(() => {
                this.SUBRULE(this.value)
                this.MANY(() => {
                    this.CONSUME(Comma)
                    this.SUBRULE2(this.value)
                })
            })
            this.CONSUME(RSquare)
        })

        public value = this.RULE("value", () => {
            this.OR([
                {ALT: () => {this.CONSUME(StringLiteral)}},
                {ALT: () => {this.CONSUME(NumberLiteral)}},
                {ALT: () => {this.SUBRULE(this.object)}},
                {ALT: () => {this.SUBRULE(this.array)}},
                {ALT: () => {this.CONSUME(True)}},
                {ALT: () => {this.CONSUME(False)}},
                {ALT: () => {this.CONSUME(Null)}}
            ], "a value")
        })
    }
}