const GitBook   = require('gitbook-core');
const { React } = GitBook;

const Toolbar = require('./Toolbar');

const Thread = React.createClass({
    propTypes: {
        thread: React.PropTypes.object.isRequired,
        onOpen: React.PropTypes.func.isRequired
    },

    render() {
        const { thread, onOpen } = this.props;

        return (
            <div className="Comment-Thread" onClick={() => onOpen(thread.number)}>
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
        threads:      React.PropTypes.array.isRequired,
        onNewThread:  React.PropTypes.func.isRequired,
        onOpenThread: React.PropTypes.func.isRequired
    },

    render() {
        const { threads, onNewThread, onOpenThread } = this.props;

        const toolbarActions = [
            {
                text: 'New Thread',
                onClick: onNewThread
            }
        ];

        return (
            <div className="Comment-ThreadsList">
                {threads.map((thread, i) => <Thread key={i} thread={thread} onOpen={onOpenThread} />)}
                <Toolbar actions={toolbarActions} />
            </div>
        );
    }
});

module.exports = ThreadsList;
