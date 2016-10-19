const GitBook = require('gitbook-core');
const { Record, List } = GitBook.Immutable;

const ACTIONS_TYPES = require('../actions/types');

const ThemeApiState = Record({
    // Fetched threads
    threads: List(),
    // Currently open thread
    openArea: String()
});


module.exports = GitBook.createReducer('comment', (state = ThemeApiState(), action) => {
    switch (action.type) {

    case ACTIONS_TYPES.UPDATE_THREADS:
        return state.set('threads', List(action.threads));

    case ACTIONS_TYPES.OPEN_AREA:
        return state.set('openArea', action.uniqueId);

    case ACTIONS_TYPES.CLOSE_AREA:
        return state.set('openArea', '');

    default:
        return state;
    }
});
