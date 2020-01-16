const fs = require("fs");

const onepagers = {};

const initOnepagers = (onepagersPath) => {
    return new Promise(resolve => {
        fs.readFile(onepagersPath, (err, content) => {
            const rawOnepagers = JSON.parse(content);
            rawOnepagers.forEach(_onepager => {
                onepagers[_onepager.name] = _onepager;
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
