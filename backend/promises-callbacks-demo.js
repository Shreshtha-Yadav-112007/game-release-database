// ==================== CALLBACKS ====================

function callbackGetMetadata(callback) {
    setTimeout(() => callback(null, "Game metadata"), 300);
}

function callbackGetReleases(metadata, callback) {
    setTimeout(() => callback(null, "Release data"), 300);
}

function callbackGenerateSummary(releases, callback) {
    setTimeout(() => callback(null, "AI summary"), 300);
}

function callbackUpdateMetadata(summary, callback) {
    setTimeout(() => callback(null, "MongoDB updated"), 300);
}

callbackGetMetadata((error, metadata) => {
    if (error) return console.error(error);

    callbackGetReleases(metadata, (error, releases) => {
        if (error) return console.error(error);

        callbackGenerateSummary(releases, (error, summary) => {
            if (error) return console.error(error);

            callbackUpdateMetadata(summary, (error) => {
                if (error) return console.error(error);

                console.log("Callback workflow complete");
            });
        });
    });
});


// ==================== PROMISE CHAINING ====================

function promiseGetMetadata() {
    return new Promise((resolve) => {
        setTimeout(() => resolve("Game metadata"), 300);
    });
}

function promiseGetReleases(metadata) {
    return new Promise((resolve) => {
        setTimeout(() => resolve("Release data"), 300);
    });
}

function promiseGenerateSummary(releases, shouldFail = false) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldFail) {
                reject(new Error("Gemini generation failed"));
                return;
            }

            resolve("AI summary");
        }, 300);
    });
}

function promiseUpdateMetadata(summary) {
    return new Promise((resolve) => {
        setTimeout(() => resolve("MongoDB updated"), 300);
    });
}

promiseGetMetadata()
    .then((metadata) => {
        return promiseGetReleases(metadata);
    })
    .then((releases) => {
        return promiseGenerateSummary(releases, false);
    })
    .then((summary) => {
        return promiseUpdateMetadata(summary);
    })
    .then((result) => {
        console.log("Promise workflow complete:", result);
    })
    .catch((error) => {
        console.error("Promise workflow failed:", error.message);
    });