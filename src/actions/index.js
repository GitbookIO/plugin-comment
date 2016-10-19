const ACTIONS_TYPES = require('./types');

/**
 * Update list of threads for the current page
 * @param  {Array<Object>} threads
 * @return {Action}
 */
function updateThreads(threads) {
    return {
        type: ACTIONS_TYPES.UPDATE_THREADS,
        threads
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
    updateThreads,
    updateUserStatus,
    openArea,
    closeArea
};
