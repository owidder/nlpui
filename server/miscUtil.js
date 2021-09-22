const randomNumberBetween = (from, toIncluding) => {
    return (from + (Math.floor(Math.random() * (toIncluding - from + 1))))
}

module.exports = {randomNumberBetween}
