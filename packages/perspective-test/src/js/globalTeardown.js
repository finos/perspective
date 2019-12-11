module.exports = async function() {
    await global.__BROWSER__.close();
};
