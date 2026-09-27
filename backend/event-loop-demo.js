const fs = require("fs");

console.log("Synchronous code starts");

fs.readFile(__filename, "utf8", (error, data) => {
    if (error) {
        console.error("File read error:", error);
        return;
    }

    console.log("Asynchronous I/O callback completed");
});

Promise.resolve().then(() => {
    console.log("Promise microtask executed");
});

setTimeout(() => {
    console.log("Timer callback executed");
}, 0);

console.log("Synchronous code ends");