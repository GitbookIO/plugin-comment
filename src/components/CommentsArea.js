const GitBook = require('gitbook-core');
const { React } = GitBook;

const NewThread      = require('./NewThread');
const ThreadsList    = require('./ThreadsList');
const ThreadComments = require('./ThreadComments');

const CommentsArea = React.createClass({
    propTypes: {
        threads:     React.PropTypes.array.isRequired,
        sectionText: React.PropTypes.string.isRequired
    },

    getInitialState() {
        return {
            creatingThread: false,
            readingThread:  null
        };
    },

    // Close New Thread form
    closeForm() {
        this.setState({
            creatingThread: false
        });
    },

    // Open New Thread form
    openForm() {
        this.setState({
            creatingThread: true
        });
    },

    // Close open thread
    hideThread() {
        this.setState({
            readingThread: null
        });
    },

    // Display a specific thread
    showThread(number) {
        this.setState({
            readingThread: number
        });
    },

    render() {
        const { threads, sectionText } = this.props;
        const { creatingThread, readingThread } = this.state;

        const inner = (
            // No existing thread or adding a new thread
            creatingThread || !threads.length ?
            <NewThread sectionText={sectionText} onCloseForm={this.closeForm} withCloseButton={threads.length > 0} /> :

            // Access details about a thread
            Boolean(readingThread) ?
            <ThreadComments thread={threads.find(t => t.number == readingThread)} onNewThread={this.openForm} onHide={this.hideThread} /> :

            // Display list of threads if more than one or details about the only existing thread
            threads.length > 1 ?
            <ThreadsList threads={threads} onNewThread={this.openForm} onOpenThread={this.showThread} /> :
            <ThreadComments thread={threads[0]} onNewThread={this.openForm} />
        );

        return (
            <div className="Comment-CommentsArea">
                {inner}
            </div>
        );
    }
});

module.exports = CommentsArea;
