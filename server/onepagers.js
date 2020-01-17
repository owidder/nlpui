const fs = require("fs");

const onepagers = {};

const initOnepagers = (onepagersPath) => {
    return new Promise(resolve => {
        fs.readFile(onepagersPath, (err, content) => {
            const rawOnepagers = JSON.parse(content);
            rawOnepagers.forEach(_onepager => {
                const loesung = _onepager["lösung"];
                delete _onepager["lösung"];
                onepagers[_onepager.name] = {..._onepager, loesung};
            })
            resolve(onepagers)
        })
    })
}

const getOnepager = (name) => {
    return onepagers[name]
}

module.exports = {
    initOnepagers,
    getOnepager,
}
