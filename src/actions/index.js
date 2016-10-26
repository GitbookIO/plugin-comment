require('whatwg-fetch');
const getApiURL     = require('../utils/getApiURL');
const ACTIONS_TYPES = require('./types');

const COMMENTS_LIMIT = 4;

/**
 * Perform an API request
 * @param  {String} method
 * @param  {String} route
 * @param  {Object} data
 * @param  {String} errorType
 * @param  {Function} dispatch
 * @return {Promise}
 */
function apiRequest(method, route, data, errorType, dispatch) {
    let apiURL;
    let options;
    const headers = {
        'Accept': 'application/json'
    };

    // Create correct URL and fetch options depending on method type
    if (method == 'GET') {
        apiURL = getApiURL(route, data);
        options = Object.assign({}, {
            method,
            headers
        });
    }
    else {
        apiURL = getApiURL(route);
        options = Object.assign({}, {
            method,
            headers: Object.assign({}, headers, {
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(data)
        });
    }

    return fetch(apiURL, options)
    .then((response) => {
        if (response.status >= 200 && response.status < 300) {
            const loggedIn = Boolean(response.headers.get('X-GitBook-Auth'));
            dispatch({
                type: ACTIONS_TYPES.USER_STATUS_UPDATE,
                loggedIn
            });
        }
        else {
            const error = new Error(response.statusText);
            error.response = response;

            alert(`Error with inline comments: ${error.message}`);
            // eslint-disable-next-line no-console
            console.log(error);
            dispatch({
                type: errorType,
                error
            });

            throw error;
        }

        return response;
    })
    .then(response => response.json());
}

/**
 * Fetch threads for a page
 * @param  {String} filename
 * @return {Action}
 */
function fetchThreads(filename) {
    return (dispatch) => {
        dispatch({
            type: ACTIONS_TYPES.THREADS_FETCHING,
            filename
        });

        return apiRequest(
            'GET',
            'discussions',
            {
                state: 'open',
                filename
            },
            ACTIONS_TYPES.THREADS_FETCHING_ERROR,
            dispatch
        )
        .then((result) => {
            dispatch({
                type: ACTIONS_TYPES.THREADS_FETCHED,
                threads: result.list
            });
        });
    };
}

/**
 * Post a thread
 * @param  {String} title
 * @param  {String} body
 * @param  {String} chapterTitle
 * @param  {String} filename
 * @param  {String} section
 * @return {Action}
 */
function postThread(title, body, chapterTitle, filename, section) {
    return (dispatch) => {
        dispatch({
            type: ACTIONS_TYPES.THREAD_POSTING
        });

        return apiRequest(
            'POST',
            'discussions',
            {
                title,
                body,
                context: {
                    filename,
                    chapterTitle,
                    section
                }
            },
            ACTIONS_TYPES.THREAD_POSTING_ERROR,
            dispatch
        )
        .then((result) => {
            dispatch({
                type: ACTIONS_TYPES.THREAD_POSTED,
                thread: result
            });
        });
    };
}

/**
 * Close a thread
 * @param  {Number} number
 * @return {Action}
 */
function closeThread(number) {
    return (dispatch) => {
        dispatch({
            type: ACTIONS_TYPES.THREAD_CLOSING,
            number
        });

        return apiRequest(
            'POST',
            `discussions/${number}`,
            {
                state: 'closed'
            },
            ACTIONS_TYPES.THREAD_CLOSING_ERROR,
            dispatch
        )
        .then(() => {
            dispatch({
                type: ACTIONS_TYPES.THREAD_CLOSED,
                number
            });
        });
    };
}

/**
 * Fetch comments for a thread number
 * @param  {Number} number
 * @return {Action}
 */
function fetchComments(number) {
    return (dispatch) => {
        dispatch({
            type: ACTIONS_TYPES.COMMENTS_FETCHING,
            number
        });

        return apiRequest(
            'GET',
            `discussions/${number}/comments`,
            {
                limit: COMMENTS_LIMIT
            },
            ACTIONS_TYPES.COMMENTS_FETCHING_ERROR,
            dispatch
        )
        .then((result) => {
            dispatch({
                type: ACTIONS_TYPES.COMMENTS_FETCHED,
                comments: result.list,
                number
            });
        });
    };
}

/**
 * Post a comment on an existing thread
 * @param  {Number} number
 * @param  {String} body
 * @return {Action}
 */
function postComment(number, body) {
    return (dispatch) => {
        dispatch({
            type: ACTIONS_TYPES.COMMENT_POSTING,
            number
        });

        return apiRequest(
            'POST',
            `discussions/${number}/comments`,
            {
                body
            },
            ACTIONS_TYPES.COMMENT_POSTING_ERROR,
            dispatch
        )
        .then((comment) => {
            dispatch({
                type: ACTIONS_TYPES.COMMENT_POSTED,
                number,
                comment
            });
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
        type: ACTIONS_TYPES.USER_STATUS_UPDATE,
        loggedIn
    };
}

/**
 * Update currently open comments area id
 * @param  {Number} uniqueId
 * @return {Action}
 */
function openArea(uniqueId) {
    return {
        type: ACTIONS_TYPES.AREA_OPEN,
        uniqueId
    };
}

/**
 * Close comments area
 * @return {Action}
 */
function closeArea() {
    return {
        type: ACTIONS_TYPES.AREA_CLOSE
    };
}

module.exports = {
    fetchThreads,
    postThread,
    closeThread,
    fetchComments,
    postComment,
    updateUserStatus,
    openArea,
    closeArea
};
