const {lzData} = require("./lz");

const writeAndWait = (res, content) => {
    console.log(`writeAndWait: ${res} / ${content}`);
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`write: ${content}`);
            res.write(content);
            resolve();
        })
    }, 1)
}

const writeMaxProgress = async (res, maxProgress) => {
    await writeAndWait(res, `max-progress:${maxProgress};`);
}

const writeProgressText = async (res, progressText) => {
    await writeAndWait(res, `progress-text:${progressText};`);
}

const writeProgress = async (res, progress) => {
    await writeAndWait(res, `progress:${progress};`);
}

const writeJsonz = async (res, jsonStr) => {
    const jsonz = await lzData(jsonStr);
    await writeAndWait(res, `jsonz:${jsonz};`);
}

module.exports = {writeProgress, writeProgressText, writeMaxProgress, writeJsonz}
