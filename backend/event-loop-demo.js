const fs = require("fs");

console.log("1. Synchronous code starts");

fs.readFile(__filename, "utf8", (error, data) => {
    if (error) {
        console.error("File read error:", error);
        return;
    }

    console.log("4. Asynchronous I/O callback completed");
});

Promise.resolve().then(() => {
    console.log("3. Promise microtask executed");
});

setTimeout(() => {
    console.log("5. Timer callback executed");
}, 0);

console.log("2. Synchronous code ends");