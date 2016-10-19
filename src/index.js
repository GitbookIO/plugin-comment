const GitBook = require('gitbook-core');
const CommentSection = require('./components/Comment');
const ThreadsFetcher = require('./components/ThreadsFetcher');

const reduce = require('./reducers');
const actions = require('./actions');

module.exports = GitBook.createPlugin({
    activate: (dispatch, getState, { Components }) => {
        dispatch(Components.registerComponent(CommentSection, { role: 'html:p' }));
        dispatch(Components.registerComponent(ThreadsFetcher, { role: 'page:container' }));
    },
    reduce,
    actions: {
        Comment: actions
    }
});
