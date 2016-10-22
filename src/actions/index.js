require('whatwg-fetch');
const querystring   = require('querystring');
const ACTIONS_TYPES = require('./types');

/**
 * Fetch threads for a page
 */
function fetchThreads(filename) {
    const query = {
        state: 'open',
        filename
    };

    // const apiURL = `${window.location.origin}/gitbook/api/discussions?${querystring.stringify(query)}`;
    const apiURL = `http://localhost:5000/api/book/jpreynat/the-history-of-computers/discussions?${querystring.stringify(query)}`;

    return (dispatch, getState, actions) => {
        dispatch({ type: ACTIONS_TYPES.THREADS_FETCHING, filename });

        return fetch(apiURL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then((response) => {
            if (response.status >= 200 && response.status < 300) {
                const loggedIn = Boolean(response.headers.get('X-GitBook-Auth'));
                dispatch(updateUserStatus(loggedIn));
            }
            else {
                const error = new Error(response.statusText);
                error.response = response;
                throw error;
            }

            return response;
        })
        .then(response => response.json())
        .then(result => dispatch({ type: ACTIONS_TYPES.THREADS_FETCHED, threads: result.list }))
        .catch((err) => {
            alert(`Error with inline comments: ${err.message}`);
            // eslint-disable-next-line no-console
            console.log(err);
            dispatch({ type: ACTIONS_TYPES.THREADS_ERROR, error: err });
        });
    };
}

/**
 * Update user logged in status
 * @param  {Boolean} loggedIn
 * @return {Action}
 */
function updateUserStatus(loggedIn) {
    return {
        type: ACTIONS_TYPES.UPDATE_USER_STATUS,
        loggedIn
    };
}

/**
 * Update currently open comments area id
 * @param  {String} markerId
 * @return {Action}
 */
function openArea(uniqueId) {
    return {
        type: ACTIONS_TYPES.OPEN_AREA,
        uniqueId
    };
}

/**
 * Close comments area
 * @return {Action}
 */
function closeArea() {
    return {
        type: ACTIONS_TYPES.CLOSE_AREA
    };
}

module.exports = {
    fetchThreads,
    updateUserStatus,
    openArea,
    closeArea
};
