function load_home() {
     document.getElementById("c-container").innerHTML='<object style="width:inherit; height:100%;" type="text/html" data="001_LC_Home.html" ></object>';
}

function load_tutorial() {
     document.getElementById("c-container").innerHTML='<object style="width:inherit; height:100%;" type="text/html" data="002_LC_Tutorial.html" ></object>';
}

function load_tests() {
     document.getElementById("c-container").innerHTML='<object style="width:inherit; height:100%;" type="text/html" data="003_LC_Tests.html" ></object>';
}
    
function load_calculator() {
     document.getElementById("c-container").innerHTML='<object style="width:inherit; height:100%;" type="text/html" data="004_LC_Calculator.html" ></object>';
}

function quiz(ques) 
{
    var x, text;

    // Get the value of the input field with id="numb"
    x = document.getElementById("test-text").value;
    if(ques=1)
    {
    // If x is Not a Number or less than one or greater than 10
        if (x==="True") 
        { text = "Input not valid"; } 
        else 
        { text = "Input OK"; }
    }
    document.getElementById("answer").innerHTML = text;
}

(function($, window) 
{
    var that = {};
    window.truth = that;

    var SYMBOL = /[a-zA-Z]\w*/;
    var WHITESPACE = /^\s*$/;
    var DEBUG = true;
    var C_AND = '^';
    var C_NAND = '.';
    var C_OR = '|';
    var C_XOR = '!';
    var C_NOR = '+';
    var C_NOT = '~';
    var C_IMP = '>';
    var C_BIC = '#';
    
    function truthCombos(symbols) 
    {
        if (! symbols) 
        { return [{}]; }

        var key;
        // get a key, any key
        $.each(symbols, function(k) 
        {
            key = k;
            return false;
        });
        if (! key) 
        { return [{}]; }
        var tmp = jQuery.extend({}, symbols);
        delete tmp[key];
        var prev = truthCombos(tmp);
        var ret = [];
        $.each(prev, function(i) 
        {
            var cur = jQuery.extend({}, prev[i]);
            cur[key] = true;
            ret.push(cur);
            cur = jQuery.extend({}, prev[i]);
            cur[key] = false;
            ret.push(cur);
        });

        return ret;
    }
    that.truthCombos = truthCombos;


    function handleInput(val) {
        try 
        {
            var tok = tokenize(val);
            var results = parse(tok);
            var ast = results[0];
            var sym = results[1];
            debug('sym', sym);
            displayCombos(val, sym, ast, truthCombos(sym));
        } 
        catch (e) 
        { throw e; }
    }

    function displayCombos(expression, symbols, ast, combos) 
    {
        $('#combo').empty();
        debug(combos);

        var ret = $('<table border="1"/>');

        var header = $('<tr>');
        var symArr = [];
        $.each(symbols, function(sym) 
        {
            header.append($('<th>').text(sym));
            symArr.push(sym);
        });
        header.append($('<th>').text(expression));

        ret.append(header);
        $('#combo').append(ret);

        $.each(combos, function(i) 
        {
            var cur = combos[i];
            var result = evalExpr(ast, cur);
            debug('evaluated', cur, result);
            var comboRow = $('<tr>');
            $.each(symArr, function(j) 
            { comboRow.append($('<td>').text(cur[symArr[j]])); });
            comboRow.append($('<td>').text(result));
            ret.append(comboRow);
        });
    }

    function evalExpr(ast, bindings) 
    {
        function evalSym(index) 
        {
            if ($.isArray(ast[index])) 
            { return evalExpr(ast[index], bindings); }
            return bindings[ast[index]];
        }

        if (! $.isArray(ast)) 
        { return bindings[ast]; }
        switch(ast[0]) 
        {
            case C_NOT:
                return !evalSym(1);
            case C_AND:
                return evalSym(1) && evalSym(2);
            case C_NAND:
                return !evalSym(1) || !evalSym(2);
            case C_OR:
                return evalSym(1) || evalSym(2);
            case C_XOR:
                return (evalSym(1) || evalSym(2)) && (!(evalSym(1) && evalSym(2)));
            case C_NOR:
                return !evalSym(1) && !evalSym(2);
            case C_IMP:
                return !evalSym(1) || evalSym(2);
            case C_BIC:
                return ((evalSym(1) && evalSym(2)) || (!evalSym(1) && !evalSym(2)));
        }
    }
    that.evalExpr = evalExpr;


    function main() 
    {
        $('#expr').keyup(function() 
        {
            debug('keyup');
            var val = $('#expr').val();
            if (this.lastSearch !== val) 
            {
                this.lastSearch = val;
                handleInput($('#expr').val());
            }
        });

        $('#expr').val('');
        $('#expr').keyup();
    }
    that.main = main;

    /**
     * Build an abstract syntax tree out of the given stream of tokens.
     */
    var parse = function() 
    {
        var pos;
        var symbols;
        var tokens;

        function getCurToken() 
        { return tokens[pos]; }

        /**
         * Consume the next token and add it to the symbol table.
         */
        function consumeSymbol() 
        {
            debug('consumeSymbol');
            var symbol = consumeToken();
            symbols[symbol] = true;
            return symbol;
        }

        function consumeToken() 
        {
            var curTok = getCurToken();
            debug('consumeToken', curTok, pos);
            pos++;
            return curTok;
        }

        function expr() 
        {
            debug('expr', tokens, pos);
            if (getCurToken() === C_NOT) 
            { return [consumeToken(), binary_Expr()]; }
            return binary_Expr();
        }

        function binary_Expr() 
        { return xor_Expr(); }


        function or_Expr() 
        {
            var a1 = and_Expr();
            
            switch(getCurToken()) 
            {
                case C_NAND:
                    return [consumeToken(), a1, nand_Expr()];
                case C_OR:
                    return [consumeToken(), a1, or_Expr()];
                case C_NOR:
                    return [consumeToken(), a1, nor_Expr()];
                case C_IMP:
                    return [consumeToken(), a1, imp_Expr()];
                case C_BIC:
                    return [consumeToken(), a1, bic_Expr()];
            }
            return a1;
        }
        
        function xor_Expr() 
        {
            var a1 = or_Expr();
            if (getCurToken() === C_XOR) 
            { return [consumeToken(), a1, xor_Expr()]; }    
            return a1;
        }

        function nor_Expr() 
        {
            var a1 = and_Expr();
            if (getCurToken() === C_NOR) 
            { return [consumeToken(), a1, nor_Expr()]; }
            return a1;
        }

        function and_Expr() 
        {
            var a1 = sub_Expr();
            if (getCurToken() === C_AND) 
            { return [consumeToken(), a1, and_Expr()]; }
            return a1;
        }

        function nand_Expr() 
        {
            var a1 = sub_Expr();
            if (getCurToken() === C_NAND) 
            { return [consumeToken(), a1, nand_Expr()]; }
            return a1;
        }
        
        function imp_Expr() 
        {
            var a1 = sub_Expr();
            if (getCurToken() === C_IMP) 
            { return [consumeToken(), a1, imp_Expr()]; }
            return a1;
        }
        
        function bic_Expr() 
        {
            var a1 = or_Expr();
            if (getCurToken() === C_BIC) 
            { return [consumeToken(), a1, bic_Expr()]; }
            return a1;
        }
        
        function sub_Expr() 
        {
            debug('subExpr', tokens, pos);
            if (getCurToken() === '(') 
            {
                consumeToken('(');
                var ret = expr();
                consumeToken(')');
                return ret;
            }

            if (SYMBOL.test(getCurToken())) 
            { return consumeSymbol(); }
            return expr();
        }
        
        return function(tok) 
        {
            debug('parse', tok);
            if ((! tok) || (! tok.length)) 
            { return []; }
            tokens = tok;
            pos = 0;
            symbols = {};
            var ret = expr();
            if (pos < tokens.length) 
            {
                debug(tokens);
                debug(pos);
                debug(tokens[pos]);
            }
            return [ret, symbols];
        };
    }();
    that.parse = parse;


    function tokenize(str) 
    {
        if ((! str) || WHITESPACE.test(str)) 
        { return []; }
        var ret = str.split(/\b/);
        for (var i = 0; i < ret.length; i++) 
        {
            // Remove whitespace from tokens
            ret[i] = ret[i].replace(/\s/g, '');
            if (! ret[i].length) 
            {
                // Delete empty element
                ret.splice(i, 1);
            } 
            else if (! SYMBOL.test(ret[i])) 
            {
                var arr = [];
                // For consecutive non-symbol characters,
                // split each character into individual tokens
                for (var j = 0; j < ret[i].length; j++) 
                { arr.push(ret[i][j]); }
                // Replace element with all subtokens of
                // current element
                Array.prototype.splice.apply(ret, [i, 1].concat(arr));
            }
        }

        return ret;
    }
    that.tokenize = tokenize;

    function debug() 
    {
        if (DEBUG && window.console && window.console.log) 
        { console.log.apply(console, arguments); }
    }
})(jQuery, window);
