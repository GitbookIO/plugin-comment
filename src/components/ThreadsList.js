const GitBook   = require('gitbook-core');
const { React } = GitBook;

const Toolbar = require('./Toolbar');

const Thread = React.createClass({
    propTypes: {
        thread: React.PropTypes.object.isRequired
    },

    render() {
        const { thread } = this.props;
        return (
            <div className="Comment-Thread">
                <div className="Comment-ThreadTitle">
                    {thread.title}
                </div>
                <div className="Comment-ThreadUser">
                    {`#${thread.number} posted by ${thread.user.name}`}
                </div>
            </div>
        );
    }
});

const ThreadsList = React.createClass({
    propTypes: {
        threads:     React.PropTypes.array.isRequired,
        onNewThread: React.PropTypes.func.isRequired
    },

    render() {
        const { threads, onNewThread } = this.props;

        const toolbarActions = [
            {
                text: 'New Thread',
                onClick: onNewThread
            }
        ];

        return (
            <div className="Comment-ThreadsList">
                {threads.map((thread, i) => <Thread key={i} thread={thread} />)}
                <Toolbar actions={toolbarActions} />
            </div>
        );
    }
});

module.exports = ThreadsList;
