export default initialValues => {
    const env = Object.assign({}, initialValues);
    const base = () => {};

    Object.keys(env).forEach(key => {
        base[key] = (...args) => {
            if (!args.length) {
                return env[key];
            }
            env[key] = args[0];
            return base;
        };
    });

    return base;
};
