const {lzData} = require("./lz");

const writeAndWait = (eventEmitter, content) => {
    return new Promise(resolve => {
        setTimeout(() => {
            eventEmitter.emit("write", content);
            resolve();
        })
    }, 1)
}

const writeMaxProgress = async (eventEmitter, maxProgress) => {
    const content = `max-progress:${maxProgress};`;
    eventEmitter.eventsToResend.push(content);
    await writeAndWait(eventEmitter, content);
}

const writeProgressText = async (eventEmitter, progressText) => {
    const content = `progress-text:${progressText};`;
    eventEmitter.eventsToResend.push(content);
    await writeAndWait(eventEmitter, content);
}

const writeProgress = async (eventEmitter, progress) => {
    await writeAndWait(eventEmitter, `progress:${progress};`);
}

const writeJsonz = async (eventEmitter, jsonStr) => {
    const jsonz = await lzData(jsonStr);
    await writeAndWait(eventEmitter, `jsonz:${jsonz};`);
}

module.exports = {writeProgress, writeProgressText, writeMaxProgress, writeJsonz}
