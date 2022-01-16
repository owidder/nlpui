const {lzData} = require("./lz");
const events = require("events");

const namespaceToEventEmitterMapMap = {};

const getEventEmitterMap = (namespace) => {
    let eventEmitterMap = namespaceToEventEmitterMapMap[namespace];
    if(!eventEmitterMap) {
        eventEmitterMap = {};
        namespaceToEventEmitterMapMap[namespace] = eventEmitterMap;
    }

    return eventEmitterMap;
}

const deleteEventEmitterFromMap = (namespace, doc) => {
    const eventEmitterMap = getEventEmitterMap(namespace);
    delete eventEmitterMap[doc];
}

class EventEmitterWithResend extends events.EventEmitter {
    constructor() {
        super();
    }

    eventsToResend = []

    isNew = true
}

const subscribeToEventEmitter = (namespace, res, doc) => {
    const eventEmitterMap = getEventEmitterMap(namespace);
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

const writeAndWait = (eventEmitter, content, res) => {
    return new Promise(resolve => {
        setTimeout(() => {
            if(eventEmitter) {
                eventEmitter.emit("write", content);
            } else {
                res.write(content);
            }
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

const writeJsonz = async (eventEmitter, jsonStr, res) => {
    const jsonz = await lzData(jsonStr);
    await writeAndWait(eventEmitter, `jsonz:${jsonz};`, res);
}

module.exports = {writeProgress, writeProgressText, writeMaxProgress, writeJsonz, subscribeToEventEmitter, deleteEventEmitterFromMap}
