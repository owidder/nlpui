const listenerMap: {[type: string]: any[]} = {}

export const addEventListener = (type: string, listener: any) => {
    if(listenerMap[type] == undefined) {
        listenerMap[type] = []
    }
    listenerMap[type].push(listener);

    document.addEventListener(type, listener)
}

export const removeAllEventListeners = (type: string) => {
    if(listenerMap[type] != undefined) {
        listenerMap[type].forEach(listener => document.removeEventListener(type, listener))
    }
}
