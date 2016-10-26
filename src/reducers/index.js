const GitBook = require('gitbook-core');
const { Record, List, Map } = GitBook.Immutable;

const ACTIONS_TYPES = require('../actions/types');

const ThemeApiState = Record({
    // Fetched threads
    threads: List(),
    // Fetched comments
    comments: Map(),
    // Currently open thread
    openArea: null,
    // Error status
    error: null,
    // Request status
    loading: Boolean(),
    // Is user logged in
    loggedIn: Boolean()
});


module.exports = GitBook.createReducer('comment', (state = ThemeApiState(), action) => {
    switch (action.type) {

    case ACTIONS_TYPES.THREADS_FETCHING:
    case ACTIONS_TYPES.THREAD_POSTING:
    case ACTIONS_TYPES.THREAD_CLOSING:
    case ACTIONS_TYPES.COMMENTS_FETCHING:
        return state.set('loading', true);

    case ACTIONS_TYPES.THREADS_FETCHED:
        return state.merge({
            loading: false,
            threads: List(action.threads),
            error:   null
        });

    case ACTIONS_TYPES.THREAD_POSTED:
        return state.set('threads', state.get('threads').push(action.thread));

    case ACTIONS_TYPES.THREAD_CLOSED:
        return state.set('threads', state.get('threads').filterNot(thread => thread.number == action.number));

    case ACTIONS_TYPES.COMMENTS_FETCHED:
        return state.set('comments', state.get('comments').set(action.number, List(action.comments)));

    case ACTIONS_TYPES.THREADS_FETCHING_ERROR:
    case ACTIONS_TYPES.THREAD_POSTING_ERROR:
    case ACTIONS_TYPES.THREAD_CLOSING_ERROR:
    case ACTIONS_TYPES.COMMENTS_FETCHING_ERROR:
        return state.set('error', action.error);

    case ACTIONS_TYPES.USER_STATUS_UPDATE:
        return state.set('loggedIn', action.loggedIn);

    case ACTIONS_TYPES.AREA_OPEN:
        return state.set('openArea', action.uniqueId);

    case ACTIONS_TYPES.AREA_CLOSE:
        return state.set('openArea', null);

    default:
        return state;
    }
});
