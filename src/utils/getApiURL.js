const querystring = require('querystring');

/**
 * Get an API full URL given a route and a query
 * @param  {String} route
 * @param  {Object} q
 * @return {String}
 */
function getApiURL(route, q) {
    let query = '';
    if (Boolean(q)) {
        query = `?${querystring.stringify(q)}`;
    }

    return `http://localhost:5000/api/book/jpreynat/the-history-of-computers/${route}${query}`;
}

module.exports = getApiURL;
