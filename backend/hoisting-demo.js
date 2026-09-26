console.log("=== var hoisting ===");

console.log(varValue); // undefined
var varValue = 10;

console.log("\n=== let / const temporal dead zone ===");

try {
    console.log(letValue);
    let letValue = 20;
} catch (error) {
    console.log("let before declaration:", error.name);
}

try {
    console.log(constValue);
    const constValue = 30;
} catch (error) {
    console.log("const before declaration:", error.name);
}

console.log("\n=== block scope ===");

if (true) {
    let blockValue = "inside block";
    const constantValue = "inside block";

    console.log(blockValue);
    console.log(constantValue);
}

// These would cause ReferenceError if uncommented:
// console.log(blockValue);
// console.log(constantValue);