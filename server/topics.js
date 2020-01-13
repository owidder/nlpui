const path = require("path");
const fs = require("fs");

const {createReadlineInterface} = require("./fileUtil");

const topicCompare = (t1, t2) => {
    const absVal1 = Math.abs(t1.value);
    const absVal2 = Math.abs(t2.value);
    if(absVal1 == absVal2) {
        return 0;
    } else if (absVal1 > absVal2) {
        return -1;
    }

    return 1;
}

const _readTopic = (topicPath) => {
    const topic = [];
    return new Promise((resolve, reject) => {
        const readlineInterface = createReadlineInterface(topicPath);
        readlineInterface.on("line", line => {

            const parts = line.split("\t");
            const word = parts[0];
            const value = Number(parts[1]);
            topic.push({word, value});
        }).on("close", () => {
            const filteredTopic = topic.filter(t => !isNaN(t.value));
            filteredTopic.sort(topicCompare);
            resolve(filteredTopic);
        })
    })
}

const topicsPathName = (num_topics) => `_${String(num_topics).padStart(5, "0")}`;

const readTopic = (basePath, num_topics, topic_num) => {
    const topicPath = path.join(basePath, topicsPathName(num_topics), `t${String(topic_num).padStart(5, "0")}.csv`);
    return _readTopic(topicPath);
}

const _readAllTopicsRecursive = async (topicsPath, topic_names, topics, resolve, num_entries) => {
    if(topic_names.length > 0) {
        const currentTopicPath = path.join(topicsPath, topic_names[0]);
        const currentTopic = await _readTopic(currentTopicPath);
        _readAllTopicsRecursive(topicsPath, topic_names.slice(1), [...topics, currentTopic.slice(0, num_entries)], resolve,  num_entries);
    } else {
        resolve(topics);
    }
}

const readAllTopics = (basePath, num_topics, num_entries) => {
    const topicsPath = path.join(basePath, topicsPathName(num_topics));
    return new Promise(resolve => {
        fs.readdir(topicsPath, (err, fileNames) => {
            if(err) reject(err);
            const filteredFileNames = fileNames.filter(name => /^t\d{5}.csv$/.test(name));
            filteredFileNames.sort();
            _readAllTopicsRecursive(topicsPath, filteredFileNames, [], resolve, num_entries);
        });
    })
}

function readTopicNums(basePath) {
    return new Promise((resolve, reject) => {
        fs.readdir(basePath, async (err, subfolderNames) => {
            if(err) reject(err);
            const topicNums = subfolderNames.filter(name => /^_\d{5}$/.test(name)).map(name => Number(name.substr(1)));
            topicNums.sort((a, b) => a - b);
            resolve(topicNums);
        });
    })
}


module.exports = {
    readTopic,
    readTopicNums,
    readAllTopics,
}
