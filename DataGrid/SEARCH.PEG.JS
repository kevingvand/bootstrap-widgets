//https://pegjs.org/online

Comparison
  = left:ComparisonGroup tail:(_ ("||" / "&&") _ ComparisonGroup)* {
  
    return tail.reduce(function(result, element) {
    if (element[1] === "||") { return result || element[3]; }
    if (element[1] === "&&") { return result && element[3]; }
    }, left);
 }

ComparisonGroup
  = "(" _ expr:Comparison _ ")" { return expr; }
  / Token

Token
  = [^|&]* { 
  	var comparison = "deasf";
  	return comparison.includes(text().trim()); 
  }

_ "whitespace"
  = [ \t\n\r]*