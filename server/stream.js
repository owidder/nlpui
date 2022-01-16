const {lzData} = require("./lz");
const events = require("events");

const eventEmitterMap = {};

const deleteEventEmitterFromMap = (doc) => {
    delete eventEmitterMap[doc];
}

class EventEmitterWithResend extends events.EventEmitter {
    constructor() {
        super();
    }

    eventsToResend = []

    isNew = true
}

const subscribeToEventEmitter = (res, doc) => {
    let eventEmitter = eventEmitterMap[doc];
    if(!eventEmitter) {
        eventEmitter = new EventEmitterWithResend();
        eventEmitter.isNew = true;
        eventEmitterMap[doc] = eventEmitter;
    }

    eventEmitter.on("write", content => {
        res.write(content);
    })

    if(eventEmitter.eventsToResend.length > 0) {
        eventEmitter.eventsToResend.forEach(event => {
            res.write(event)
        })
    }

    return eventEmitter;
}

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

module.exports = {writeProgress, writeProgressText, writeMaxProgress, writeJsonz, subscribeToEventEmitter, deleteEventEmitterFromMap}
